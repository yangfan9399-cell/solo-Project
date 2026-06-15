import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cigar_humidor.settings')
django.setup()

from humidor.models import *

print('=== 数据统计 ===')
print(f'养护柜: {HumidorCabinet.objects.count()} 个')
print(f'主记录: {CabinetRecord.objects.count()} 条')
print(f'温湿度明细: {HumidityDetail.objects.count()} 条')
print(f'位置历史: {CigarPosition.objects.count()} 条')
print(f'轮换结果: {RotationResult.objects.count()} 条')
print(f'告警提醒: {AlertReminder.objects.count()} 条')
print(f'标签: {CigarTag.objects.count()} 个')

print()
print('=== 三个种子样本 ===')
for r in CabinetRecord.objects.order_by('batch_no', '-version'):
    has_result = hasattr(r, 'rotation_result')
    alert_count = r.humidity_details.filter(is_alert=True).count()
    pos_count = r.cigar_positions.count()
    tag_names = ', '.join([t.name for t in r.tags.all()])
    print(f'  [{r.get_status_display()}] {r.batch_no} v{r.version}')
    print(f'    收藏者: {r.collector}, 柜层: {r.cabinet_layer}')
    print(f'    温湿度: {r.humidity_details.count()}条, 告警: {alert_count}次')
    print(f'    位置历史: {pos_count}条, 轮换结果: {"有" if has_result else "无"}')
    print(f'    标签: {tag_names}')
    print()

print('=== 告警提醒分布 ===')
for severity, label in [('danger', '危险'), ('warning', '警告'), ('info', '提示')]:
    count = AlertReminder.objects.filter(severity=severity).count()
    print(f'  {label}: {count} 条')
