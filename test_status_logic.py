import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'meal_tracker.settings')
import django
django.setup()

from catering.models import MealBatch, BatchStatus, TemperatureRecord
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

print('=== 测试1: 退回待重新品控的批次 ===')
batch_qc = MealBatch.objects.get(batch_number='BATCH-MU2345-007')
print(f'批次: {batch_qc.batch_number}')
print(f'  当前状态: {batch_qc.get_status_display()}')
print(f'  is_returned_for_qc: {batch_qc.is_returned_for_qc}')
last_action = batch_qc._last_status_action
print(f'  最后状态动作: {last_action.action if last_action else None}')

user = User.objects.get(username='qc1')
batch_qc.add_history('温度记录', user, '温度：4.5℃，位置：品控抽检')

batch_qc = MealBatch.objects.get(batch_number='BATCH-MU2345-007')
print(f'  [添加温度记录后] is_returned_for_qc: {batch_qc.is_returned_for_qc}')
last_action = batch_qc._last_status_action
print(f'  [添加温度记录后] 最后状态动作: {last_action.action if last_action else None}')

print()
print('=== 测试2: 退回报废的批次 ===')
batch_scrap = MealBatch.objects.get(batch_number='BATCH-CZ3456-008')
print(f'批次: {batch_scrap.batch_number}')
print(f'  当前状态: {batch_scrap.get_status_display()}')
print(f'  is_scrapped: {batch_scrap.is_scrapped}')
last_action = batch_scrap._last_status_action
print(f'  最后状态动作: {last_action.action if last_action else None}')

batch_scrap.add_history('备注', user, '追加测试备注')
batch_scrap = MealBatch.objects.get(batch_number='BATCH-CZ3456-008')
print(f'  [添加备注后] is_scrapped: {batch_scrap.is_scrapped}')
last_action = batch_scrap._last_status_action
print(f'  [添加备注后] 最后状态动作: {last_action.action if last_action else None}')

print()
print('=== 测试3: 普通待品控批次 ===')
batch_normal = MealBatch.objects.get(batch_number='BATCH-CA1234-005')
print(f'批次: {batch_normal.batch_number}')
print(f'  当前状态: {batch_normal.get_status_display()}')
print(f'  is_returned_for_qc: {batch_normal.is_returned_for_qc}')
last_action = batch_normal._last_status_action
print(f'  最后状态动作: {last_action.action if last_action else None}')

print()
print('=== 测试4: 普通已退回批次（非召回报废） ===')
print('（当前业务中无此场景，但确保逻辑正确）')
