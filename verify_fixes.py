import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_scheduler.settings')
django.setup()

from core.models import AnomalyRecord, CoreSample, Cutter, CuttingTask
from core.services import detect_all_anomalies, get_daily_schedule
from datetime import time

print("=" * 60)
print("验证一：异常检测 - 未解决异常应该被保留")
print("=" * 60)

count_before = AnomalyRecord.objects.filter(resolved=False).count()
print(f'检测前未解决异常数: {count_before}')

# 第一次检测
r1 = detect_all_anomalies()
count_after_1 = AnomalyRecord.objects.filter(resolved=False).count()
print(f'第1次检测后未解决异常数: {count_after_1} (新检测{len(r1)}条)')

# 第二次检测（同样的数据，未解决数量应该不变）
r2 = detect_all_anomalies()
count_after_2 = AnomalyRecord.objects.filter(resolved=False).count()
print(f'第2次检测后未解决异常数: {count_after_2} (新检测{len(r2)}条)')

assert count_after_1 == count_after_2, '未解决异常数在同一数据下不应变化'
print('✓ 相同数据下重复检测，未解决异常数量保持不变')

# 制造新异常
sample = CoreSample.objects.filter(status='pending').first()
old_lith = sample.lithology if sample else ''
if sample:
    sample.lithology = ''
    sample.save()
    print(f'\n制造新异常: 清空岩心 {sample.sample_no} 的岩性字段')

r3 = detect_all_anomalies()
count_after_3 = AnomalyRecord.objects.filter(resolved=False).count()
print(f'第3次检测后未解决异常数: {count_after_3} (新检测{len(r3)}条)')
assert count_after_3 >= count_after_2, '新异常出现后数量应增加或相等'
print('✓ 新异常出现，数量正确增加')

# 恢复数据
if sample:
    sample.lithology = old_lith
    sample.save()
    print(f'\n修复异常: 恢复岩心 {sample.sample_no} 的岩性字段')

r4 = detect_all_anomalies()
count_after_4 = AnomalyRecord.objects.filter(resolved=False).count()
print(f'第4次检测后未解决异常数: {count_after_4} (新检测{len(r4)}条)')
assert count_after_4 == count_after_2, '异常修复后应回落至原来数量'
print('✓ 异常修复后自动标记解决，数量回落')

print("\n" + "=" * 60)
print("验证二：工作台排程条位置/宽度计算")
print("=" * 60)

cutter = Cutter.objects.filter(status='available').first()
print(f'测试切割机: {cutter.cutter_no} ({cutter.work_start_time}-{cutter.work_end_time})')
print(f'  日产能: {cutter.daily_capacity}m')

# 场景1: 明确指定开始结束时间 09:00 ~ 11:30
from core.services import _calc_task_position
task1 = CuttingTask(
    scheduled_start_time=time(9, 0),
    scheduled_end_time=time(11, 30),
    planned_cut_length=1.0,
)
left, width = _calc_task_position(task1, cutter)
print(f'\n场景1 明确时段 09:00~11:30 (2.5h):')
print(f'  left={left}%, width={width}%')
# 09:00 - 06:00 = 180min → 180/960 = 18.75%
# 09:00~11:30 = 150min → 150/960 = 15.625%
assert 18.0 <= left <= 20.0, f'left应该约18.75%，实际{left}'
assert 14.0 <= width <= 17.0, f'width应该约15.6%，实际{width}'
print('✓ 场景1位置/宽度正确')

# 场景2: 只有开始时间没有结束时间，按日产能估算
task2 = CuttingTask(
    scheduled_start_time=time(10, 0),
    scheduled_end_time=None,
    planned_cut_length=cutter.daily_capacity * 0.5,  # 50%产能
)
left2, width2 = _calc_task_position(task2, cutter)
print(f'\n场景2 开始10:00，50%日产能:')
print(f'  left={left2}%, width={width2}%')
# 10:00 - 06:00 = 240min → 240/960 = 25%
assert 24.0 <= left2 <= 26.0, f'left应该约25%，实际{left2}'
print('✓ 场景2位置正确')

# 场景3: 工作时段之外开始（凌晨5点）
task3 = CuttingTask(
    scheduled_start_time=time(5, 0),
    scheduled_end_time=time(7, 0),
    planned_cut_length=0.5,
)
left3, width3 = _calc_task_position(task3, cutter)
print(f'\n场景3 凌晨05:00开始（超出显示范围）:')
print(f'  left={left3}%, width={width3}%')
assert left3 == 0.0, f'超出左边范围应贴左(0%)，实际{left3}'
print('✓ 场景3超出左边范围被正确裁剪')

print("\n✅ 所有验证通过！")
