from .models import CoreSample, CuttingTask, AnomalyRecord, Cutter, BatchVersion
from django.utils import timezone
from datetime import timedelta, date, time
from django.db.models import Q, Sum


def detect_all_anomalies():
    """增量检测异常：已存在且仍满足条件的保留未解决；已不存在的标记为自动解决；新出现的创建。"""
    unresolved_before = set(AnomalyRecord.objects.filter(resolved=False).values_list(
        'anomaly_type', 'core_sample_id', 'cutting_task_id', 'cutter_id'
    ))

    new_keys = set()
    detected = []
    for func in [_detect_length_mismatch, _detect_high_loss, _detect_low_remaining,
                 _detect_over_scheduled, _detect_capacity_exceeded, _detect_data_incomplete]:
        result = func()
        detected.extend(result)
        for a in result:
            key = (a.anomaly_type, a.core_sample_id, a.cutting_task_id, a.cutter_id)
            new_keys.add(key)

    stale_keys = unresolved_before - new_keys
    if stale_keys:
        q_objects = Q()
        for atype, cid, tid, mid in stale_keys:
            q = Q(anomaly_type=atype, resolved=False)
            if cid is not None:
                q &= Q(core_sample_id=cid)
            else:
                q &= Q(core_sample__isnull=True)
            if tid is not None:
                q &= Q(cutting_task_id=tid)
            else:
                q &= Q(cutting_task__isnull=True)
            if mid is not None:
                q &= Q(cutter_id=mid)
            else:
                q &= Q(cutter__isnull=True)
            q_objects |= q
        if str(q_objects):
            AnomalyRecord.objects.filter(q_objects).update(
                resolved=True,
                resolved_at=timezone.now(),
                resolution='(异常条件已消除，自动标记解决)'
            )

    return detected


def _upsert_anomaly(anomaly_type, severity, description,
                    core_sample=None, cutting_task=None, cutter=None):
    """
    增量化异常：
    - 不存在 → 创建（未解决）
    - 存在但已解决 → 重新打开为未解决（更新描述）
    - 存在且未解决 → 更新描述（如果变化）
    返回 (anomaly, is_new_or_reopened)
    """
    lookup = {
        'anomaly_type': anomaly_type,
        'core_sample': core_sample,
        'cutting_task': cutting_task,
        'cutter': cutter,
    }

    try:
        anomaly = AnomalyRecord.objects.get(**lookup)
        changed = False
        if anomaly.resolved:
            anomaly.resolved = False
            anomaly.resolved_at = None
            anomaly.resolution = ''
            changed = True
        if anomaly.severity != severity:
            anomaly.severity = severity
            changed = True
        if anomaly.description != description:
            anomaly.description = description
            changed = True
        if changed:
            anomaly.save()
        return anomaly, changed
    except AnomalyRecord.DoesNotExist:
        anomaly = AnomalyRecord.objects.create(
            **lookup,
            severity=severity,
            description=description,
            resolved=False,
        )
        return anomaly, True


def _detect_length_mismatch():
    anomalies = []
    tasks = CuttingTask.objects.filter(
        status='completed',
        actual_cut_length__isnull=False
    ).exclude(actual_cut_length=0)
    for task in tasks:
        diff = abs(task.planned_cut_length - task.actual_cut_length)
        if task.planned_cut_length > 0 and (diff / task.planned_cut_length) > 0.1:
            desc = (f'任务 {task.task_no} 实际切割长度({task.actual_cut_length}m) '
                    f'与计划({task.planned_cut_length}m)偏差超过10%')
            anomaly, is_new = _upsert_anomaly(
                'length_mismatch', 'warning', desc,
                core_sample=task.core_sample,
                cutting_task=task,
            )
            if is_new or not anomaly.resolved:
                anomalies.append(anomaly)
    return anomalies


def _detect_high_loss():
    anomalies = []
    tasks = CuttingTask.objects.filter(
        status='completed',
        actual_cut_length__isnull=False
    ).exclude(actual_cut_length=0)
    for task in tasks:
        expected = task.expected_loss
        if task.loss_length > expected * 2:
            desc = (f'任务 {task.task_no} 损耗({task.loss_length}m) '
                    f'超出预期({expected:.4f}m)的2倍，损耗率{task.loss_rate}%')
            anomaly, is_new = _upsert_anomaly(
                'high_loss', 'warning', desc,
                core_sample=task.core_sample,
                cutting_task=task,
            )
            if is_new or not anomaly.resolved:
                anomalies.append(anomaly)
    return anomalies


def _detect_low_remaining():
    anomalies = []
    samples = CoreSample.objects.filter(
        status__in=['pending', 'in_progress', 'on_hold']
    )
    for sample in samples:
        if sample.total_length > 0 and sample.remaining_length / sample.total_length < 0.1:
            desc = f'岩心 {sample.sample_no} 剩余长度不足10%，剩余 {sample.remaining_length}m'
            anomaly, is_new = _upsert_anomaly(
                'low_remaining', 'info', desc,
                core_sample=sample,
            )
            if is_new or not anomaly.resolved:
                anomalies.append(anomaly)
    return anomalies


def _detect_over_scheduled():
    anomalies = []
    today = date.today()
    cutters = Cutter.objects.filter(status__in=['available', 'busy'])
    for cutter in cutters:
        tasks = CuttingTask.objects.filter(
            cutter=cutter,
            scheduled_date=today,
            status__in=['scheduled', 'in_progress']
        ).order_by('scheduled_start_time')
        for i in range(len(tasks) - 1):
            curr = tasks[i]
            nxt = tasks[i + 1]
            if curr.scheduled_end_time and nxt.scheduled_start_time:
                curr_end = timedelta(hours=curr.scheduled_end_time.hour,
                                     minutes=curr.scheduled_end_time.minute)
                next_start = timedelta(hours=nxt.scheduled_start_time.hour,
                                       minutes=nxt.scheduled_start_time.minute)
                if curr_end > next_start:
                    desc = (f'切割机 {cutter.cutter_no} 在 {today} '
                            f'存在排程冲突：{curr.task_no} 与 {nxt.task_no} 时间重叠')
                    anomaly, is_new = _upsert_anomaly(
                        'over_scheduled', 'critical', desc,
                        cutting_task=nxt,
                        cutter=cutter,
                    )
                    if is_new or not anomaly.resolved:
                        anomalies.append(anomaly)
    return anomalies


def _detect_capacity_exceeded():
    anomalies = []
    today = date.today()
    cutters = Cutter.objects.filter(status__in=['available', 'busy'])
    for cutter in cutters:
        tasks = CuttingTask.objects.filter(
            cutter=cutter,
            scheduled_date=today,
            status__in=['scheduled', 'in_progress', 'completed']
        )
        total_length = tasks.aggregate(total=Sum('planned_cut_length'))['total'] or 0
        if total_length > cutter.daily_capacity:
            desc = (f'切割机 {cutter.cutter_no} 在 {today} 排程总长度 '
                    f'({total_length:.2f}m) 超过日产能({cutter.daily_capacity}m)')
            anomaly, is_new = _upsert_anomaly(
                'capacity_exceeded', 'warning', desc,
                cutter=cutter,
            )
            if is_new or not anomaly.resolved:
                anomalies.append(anomaly)
    return anomalies


def _detect_data_incomplete():
    anomalies = []
    samples = CoreSample.objects.filter(
        Q(lithology='') | Q(formation='') | Q(collected_date__isnull=True)
    ).exclude(status='archived')
    for sample in samples:
        missing = []
        if not sample.lithology:
            missing.append('岩性')
        if not sample.formation:
            missing.append('地层')
        if not sample.collected_date:
            missing.append('采集日期')
        desc = f'岩心 {sample.sample_no} 缺少信息：{", ".join(missing)}'
        anomaly, is_new = _upsert_anomaly(
            'data_incomplete', 'info', desc,
            core_sample=sample,
        )
        if is_new or not anomaly.resolved:
            anomalies.append(anomaly)
    return anomalies


DAY_START_HOUR = 6
DAY_END_HOUR = 22
DAY_SPAN_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60


def _time_to_minutes_from_daystart(t):
    if t is None:
        return None
    return t.hour * 60 + t.minute - DAY_START_HOUR * 60


def _calc_task_position(task, cutter):
    """
    返回 (left_pct, width_pct)，基于 DAY_START_HOUR~DAY_END_HOUR 的 0~100 百分比。
    left 按 scheduled_start_time 计算；
    width 只按 planned_cut_length / cutter.daily_capacity 占工作时长比例换算，不使用 scheduled_end_time。
    """
    wstart = _time_to_minutes_from_daystart(cutter.work_start_time)
    wend = _time_to_minutes_from_daystart(cutter.work_end_time)
    work_span = max(wend - wstart, 60) if (wstart is not None and wend is not None) else 600

    start_min = _time_to_minutes_from_daystart(task.scheduled_start_time)
    if start_min is None:
        start_min = wstart if wstart is not None else 120

    left_pct = max(0.0, min(98.0, start_min / DAY_SPAN_MINUTES * 100.0))

    cap = cutter.daily_capacity if cutter.daily_capacity > 0 else 1.0
    ratio = min(max(task.planned_cut_length / cap, 0), 1.0)
    duration_minutes = ratio * work_span
    width_pct = max(4.0, min(100.0 - left_pct, duration_minutes / DAY_SPAN_MINUTES * 100.0))
    return round(left_pct, 2), round(width_pct, 2)


def get_daily_schedule(target_date=None):
    if target_date is None:
        target_date = date.today()
    cutters = Cutter.objects.filter(status__in=['available', 'busy', 'maintenance'])
    schedule = []
    for cutter in cutters:
        tasks = CuttingTask.objects.filter(
            cutter=cutter,
            scheduled_date=target_date
        ).select_related('core_sample', 'purpose').order_by('scheduled_start_time')
        task_list = []
        for task in tasks:
            left_pct, width_pct = _calc_task_position(task, cutter)
            task.pos_left_pct = left_pct
            task.pos_width_pct = width_pct
            task_list.append(task)
        schedule.append({
            'cutter': cutter,
            'tasks': task_list,
        })
    return schedule


def generate_summary_data(start_date=None, end_date=None):
    from django.db.models import Count
    data = {
        'total_samples': CoreSample.objects.count(),
        'pending_samples': CoreSample.objects.filter(status='pending').count(),
        'in_progress_samples': CoreSample.objects.filter(status='in_progress').count(),
        'completed_samples': CoreSample.objects.filter(status='completed').count(),
        'total_tasks': CuttingTask.objects.count(),
        'pending_tasks': CuttingTask.objects.filter(status='pending').count(),
        'scheduled_tasks': CuttingTask.objects.filter(status='scheduled').count(),
        'completed_tasks': CuttingTask.objects.filter(status='completed').count(),
        'total_cut_length': CuttingTask.objects.filter(status='completed').aggregate(
            total=Sum('actual_cut_length')
        )['total'] or 0,
        'total_loss': CuttingTask.objects.filter(status='completed').aggregate(
            total=Sum('loss_length')
        )['total'] or 0,
        'open_anomalies': AnomalyRecord.objects.filter(resolved=False).count(),
        'batches': BatchVersion.objects.count(),
        'cutters': Cutter.objects.count(),
        'available_cutters': Cutter.objects.filter(status='available').count(),
    }

    purpose_stats = CuttingTask.objects.values('purpose__name').annotate(
        count=Count('id'),
        total_length=Sum('planned_cut_length')
    ).order_by('-count')
    data['purpose_stats'] = list(purpose_stats)

    priority_stats = CoreSample.objects.values('priority').annotate(
        count=Count('id')
    ).order_by('-count')
    data['priority_stats'] = list(priority_stats)

    return data


def create_batch_version(batch_no, batch_type='daily', description='', created_by=''):
    import datetime
    today = date.today()
    version_count = BatchVersion.objects.filter(batch_no=batch_no).count()
    version_no = f'{batch_no}-v{version_count + 1:02d}'

    batch = BatchVersion.objects.create(
        version_no=version_no,
        batch_no=batch_no,
        batch_type=batch_type,
        description=description,
        created_by=created_by,
        is_current=True,
    )

    BatchVersion.objects.exclude(pk=batch.pk).update(is_current=False)

    tasks = CuttingTask.objects.filter(
        scheduled_date=today,
        status__in=['scheduled', 'in_progress', 'pending']
    )
    for task in tasks:
        task.batch_version = batch
        task.save()

    batch.save_snapshot(tasks)
    return batch
