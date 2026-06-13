import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cableway_inspection.settings')
django.setup()

from inspection.models import DailyInspection, User, CablewayEquipment, ApprovalNode
from django.db.models import Count

print('=== 用户数量 ===')
print(User.objects.count())

print('\n=== 设备数量 ===')
print(CablewayEquipment.objects.count())

print('\n=== 日检记录数量 ===')
print(DailyInspection.objects.count())

print('\n=== 各状态记录数 ===')
status_map = dict(DailyInspection.STATUS_CHOICES)
for s in DailyInspection.objects.values('status').annotate(c=Count('id')):
    print(f'  {status_map.get(s["status"], s["status"])}: {s["c"]}')

print('\n=== 各异常类型记录数 ===')
abnormal_map = dict(DailyInspection.ABNORMAL_TYPE_CHOICES)
for a in DailyInspection.objects.values('abnormal_type').annotate(c=Count('id')):
    print(f'  {abnormal_map.get(a["abnormal_type"], a["abnormal_type"])}: {a["c"]}')

print('\n=== 记录详情 ===')
for r in DailyInspection.objects.all():
    print(f'\n  单号: {r.inspection_no}')
    print(f'  设备: {r.equipment.name}')
    print(f'  状态: {r.get_status_display()}')
    print(f'  异常类型: {r.get_abnormal_type_display()}')
    print(f'  指标数: {r.metrics.count()}')
    print(f'  异常指标数: {r.metrics.filter(is_abnormal=True).count()}')
    print(f'  节点数: {r.nodes.count()}')
    print(f'  是否只读: {r.is_readonly}')
    print(f'  证据数: {r.evidences.count()}')
    print(f'  业务记录数: {r.business_records.count()}')

print('\n=== 审批节点示例 (指标超限记录) ===')
r = DailyInspection.objects.filter(abnormal_type='metric_exceed').first()
if r:
    for n in r.nodes.all():
        print(f'  {n.node_no}: {n.get_action_display()} - {n.operator.username} - {n.action_time}')
        if n.is_key_change:
            print(f'    关键变更: {n.key_change_desc}')

print('\n=== 验证完成！')
