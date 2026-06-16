from .models import CoreSample, CuttingTask, AnomalyRecord, Cutter, BatchVersion
from django.utils import timezone
from datetime import timedelta, date, time
from django.db.models import Q, Sum


def detect_all_anomalies():
    AnomalyRecord.objects.filter(resolved=False).update(resolved=True, resolved_at=timezone.now())

    detected = []
    detected.extend(_detect_length_mismatch())
    detected.extend(_detect_high_loss())
    detected.extend(_detect_low_remaining())
    detected.extend(_detect_over_scheduled())
    detected.extend(_detect_capacity_exceeded())
    detected.extend(_detect_data_incomplete())

    return detected


def _detect_length_mismatch():
    anomalies = []
    tasks = CuttingTask.objects.filter(
        status='completed',
        actual_cut_length__isnull=False
    ).exclude(actual_cut_length=0)
    for task in tasks:
        diff = abs(task.planned_cut_length - task.actual_cut_length)
        if task.planned_cut_length > 0 and (diff / task.planned_cut_length) > 0.1:
            anomaly, created = AnomalyRecord.objects.get_or_create(
                anomaly_type='length_mismatch',
                cutting_task=task,
                core_sample=task.core_sample,
                defaults={
                    'severity': 'warning',
                    'description': f'任务 {task.task_no} 实际切割长度({task.actual_cut_length}m) '
                                   f'与计划({task.planned_cut_length}m)偏差超过10%',
                    'resolved': False,
                }
            )
            if created:
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
            anomaly, created = AnomalyRecord.objects.get_or_create(
                anomaly_type='high_loss',
                cutting_task=task,
                core_sample=task.core_sample,
                defaults={
                    'severity': 'warning',
                    'description': f'任务 {task.task_no} 损耗({task.loss_length}m) '
                                   f'超出预期({expected:.4f}m)的2倍，损耗率{task.loss_rate}%',
                    'resolved': False,
                }
            )
            if created:
                anomalies.append(anomaly)
    return anomalies


def _detect_low_remaining():
    anomalies = []
    samples = CoreSample.objects.filter(
        status__in=['pending', 'in_progress', 'on_hold']
    )
    for sample in samples:
        if sample.total_length > 0 and sample.remaining_length / sample.total_length < 0.1:
            anomaly, created = AnomalyRecord.objects.get_or_create(
                anomaly_type='low_remaining',
                core_sample=sample,
                defaults={
                    'severity': 'info',
                    'description': f'岩心 {sample.sample_no} 剩余长度不足10%，剩余 {sample.remaining_length}m',
                    'resolved': False,
                }
            )
            if created:
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
                    anomaly, created = AnomalyRecord.objects.get_or_create(
                        anomaly_type='over_scheduled',
                        cutting_task=nxt,
                        cutter=cutter,
                        defaults={
                            'severity': 'critical',
                            'description': f'切割机 {cutter.cutter_no} 在 {today} '
                                           f'存在排程冲突：{curr.task_no} 与 {nxt.task_no} 时间重叠',
                            'resolved': False,
                        }
                    )
                    if created:
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
            anomaly, created = AnomalyRecord.objects.get_or_create(
                anomaly_type='capacity_exceeded',
                cutter=cutter,
                defaults={
                    'severity': 'warning',
                    'description': f'切割机 {cutter.cutter_no} 在 {today} 排程总长度 '
                                   f'({total_length:.2f}m) 超过日产能({cutter.daily_capacity}m)',
                    'resolved': False,
                }
            )
            if created:
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
        anomaly, created = AnomalyRecord.objects.get_or_create(
            anomaly_type='data_incomplete',
            core_sample=sample,
            defaults={
                'severity': 'info',
                'description': f'岩心 {sample.sample_no} 缺少信息：{", ".join(missing)}',
                'resolved': False,
            }
        )
        if created:
            anomalies.append(anomaly)
    return anomalies


def get_daily_schedule(target_date=None):
    if target_date is None:
        target_date = date.today()
    cutters = Cutter.objects.filter(status__in=['available', 'busy', 'maintenance'])
    schedule = []
    for cutter in cutters:
        tasks = CuttingTask.objects.filter(
            cutter=cutter,
            scheduled_date=target_date
        ).order_by('scheduled_start_time')
        schedule.append({
            'cutter': cutter,
            'tasks': list(tasks),
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
