import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_scheduler.settings')
django.setup()

from core.models import AnomalyRecord, CoreSample, Cutter, CuttingTask, CuttingPurpose
from core.services import detect_all_anomalies, _calc_task_position, _upsert_anomaly
from datetime import date, time, timedelta
from django.utils import timezone

print("=" * 70)
print("验证一：异常重新打开（已解决但条件仍存在 → 重新未解决）")
print("=" * 70)

sample = CoreSample.objects.filter(status='pending').first()
old_lith = sample.lithology
sample.lithology = ''
sample.save()
print(f'已清空岩心 {sample.sample_no} 的岩性，制造 data_incomplete 异常')

detect_all_anomalies()
anomaly = AnomalyRecord.objects.filter(
    anomaly_type='data_incomplete',
    core_sample=sample
).first()
assert anomaly is not None, '应该检测到异常'
assert not anomaly.resolved, '异常应该是未解决状态'
print(f'✓ 第1次检测后: 异常ID={anomaly.id}, 未解决={not anomaly.resolved}')

anomaly.resolved = True
anomaly.resolution = '测试人工标记解决'
anomaly.resolved_at = timezone.now()
anomaly.save()
print('人工将该异常标记为已解决...')

detect_all_anomalies()
anomaly.refresh_from_db()
assert not anomaly.resolved, '条件仍存在时应该自动重新打开'
assert anomaly.resolution == '', '重新打开时应该清空解决方案'
print(f'✓ 第2次检测后: 异常重新打开，未解决={not anomaly.resolved}')

sample.lithology = old_lith
sample.save()
print(f'恢复岩心 {sample.sample_no} 的岩性，消除异常条件')

detect_all_anomalies()
anomaly.refresh_from_db()
assert anomaly.resolved, '条件消除后应该自动标记解决'
print(f'✓ 第3次检测后: 条件消除，异常自动解决')

print("\n" + "=" * 70)
print("验证二：排程条宽度只按 计划长度/日产能 计算")
print("=" * 70)

cutter = Cutter.objects.filter(status='available').first()
print(f'切割机: {cutter.cutter_no}')
print(f'  日产能: {cutter.daily_capacity}m')
print(f'  工作时段: {cutter.work_start_time} - {cutter.work_end_time}')

work_span_min = (cutter.work_end_time.hour * 60 + cutter.work_end_time.minute) - \
                (cutter.work_start_time.hour * 60 + cutter.work_start_time.minute)
day_span_min = 16 * 60  # 06:00 ~ 22:00

for label, length, has_end in [
    ('50%日产能（有结束时间）', cutter.daily_capacity * 0.5, True),
    ('50%日产能（无结束时间）', cutter.daily_capacity * 0.5, False),
    ('10%日产能', cutter.daily_capacity * 0.1, False),
    ('100%日产能', cutter.daily_capacity * 1.0, False),
]:
    task = CuttingTask(
        scheduled_start_time=time(9, 0),
        scheduled_end_time=time(15, 0) if has_end else None,  # 6小时假象
        planned_cut_length=length,
    )
    left, width = _calc_task_position(task, cutter)

    expected_width_pct = (length / cutter.daily_capacity) * (work_span_min / day_span_min) * 100

    print(f'\n场景: {label}')
    print(f'  planned_cut_length = {length:.3f}m')
    if has_end:
        print(f'  scheduled_end_time = 15:00 (6小时，只是干扰项)')
    print(f'  width 实际 = {width}%')
    print(f'  width 预期 ≈ {expected_width_pct:.2f}%')
    assert abs(width - expected_width_pct) < 0.5, f'宽度应该按日产能比例，实际{width}% ≈预期{expected_width_pct:.2f}%'
    print('✓ 宽度与日产能比例一致，忽略 scheduled_end_time')

print("\n" + "=" * 70)
print("验证三：CUT-002 排程重叠异常正确出现在未解决列表")
print("=" * 70)

cutter2 = Cutter.objects.get(cutter_no='CUT-002')
today = date.today()
print(f'切割机: {cutter2.cutter_no} ({cutter2.get_status_display()})')

tasks_today = CuttingTask.objects.filter(
    cutter=cutter2,
    scheduled_date=today,
    status__in=['scheduled', 'in_progress']
).order_by('scheduled_start_time')
print(f'今日排程任务数: {tasks_today.count()}')

detect_all_anomalies()

over_anomalies = AnomalyRecord.objects.filter(
    anomaly_type='over_scheduled',
    cutter=cutter2,
    resolved=False,
)
if over_anomalies.exists():
    print(f'✓ 检测到 {over_anomalies.count()} 条未解决的排程重叠异常:')
    for a in over_anomalies:
        print(f'   [{a.get_severity_display()}] {a.description[:60]}')
else:
    print('? 今日暂无排程重叠（可能样例数据没有重叠情况）')

    print('  手动构造两条重叠任务验证...')
    t1 = CuttingTask.objects.create(
        task_no=f'TEST-OVERLAP-001',
        core_sample=sample,
        cutter=cutter2,
        purpose=CuttingPurpose.objects.first(),
        status='scheduled',
        planned_cut_length=0.3,
        slice_count=5,
        scheduled_date=today,
        scheduled_start_time=time(10, 0),
        scheduled_end_time=time(12, 0),
    )
    t2 = CuttingTask.objects.create(
        task_no=f'TEST-OVERLAP-002',
        core_sample=sample,
        cutter=cutter2,
        purpose=CuttingPurpose.objects.first(),
        status='scheduled',
        planned_cut_length=0.2,
        slice_count=3,
        scheduled_date=today,
        scheduled_start_time=time(11, 0),
        scheduled_end_time=time(13, 0),
    )
    print('  已创建 10:00-12:00 和 11:00-13:00 两条重叠任务')

    detect_all_anomalies()

    over_anomalies = AnomalyRecord.objects.filter(
        anomaly_type='over_scheduled',
        cutter=cutter2,
        resolved=False,
    )
    assert over_anomalies.exists(), '应该检测到重叠异常'
    print(f'✓ 成功检测到 {over_anomalies.count()} 条排程重叠异常')

    a = over_anomalies.first()
    a.resolved = True
    a.resolution = '人工标记解决（测试重新打开）'
    a.save()
    print('  人工标记该异常为已解决...')

    detect_all_anomalies()
    a.refresh_from_db()
    assert not a.resolved, '条件仍存在，应该重新打开'
    print('✓ 已解决的重叠异常在条件仍存在时被正确重新打开')

    t1.delete()
    t2.delete()

print("\n✅ 所有验证通过！")
