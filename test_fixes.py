#!/usr/bin/env python
"""测试脚本：验证柜位图逻辑和版本对比功能"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cigar_humidor.settings')
sys.path.insert(0, '/Users/yangfan/Desktop/trae-solo-generated-projects/q-295')
django.setup()

from django.test import Client
from django.test.utils import setup_test_environment
from humidor.models import HumidorCabinet, CabinetRecord

setup_test_environment()
client = Client()

print("=" * 60)
print("测试1：柜位图异常标记逻辑 (CAB-B-002 柜, id=2)")
print("=" * 60)

try:
    response = client.get('/cabinet/2/')
    print(f"HTTP 状态码: {response.status_code}")
    
    if hasattr(response, 'context'):
        ctx = response.context
        grid = ctx.get('grid', [])
        
        print(f"\n柜位网格: {len(grid)} 层")
        anomaly_count = 0
        normal_occupied = 0
        
        for layer_idx, layer in enumerate(grid):
            print(f"\n第 {layer_idx + 1} 层:")
            for slot_idx, slot in enumerate(layer):
                status = []
                if slot.get('cigar'):
                    status.append('占用')
                    if not slot.get('is_anomaly'):
                        normal_occupied += 1
                if slot.get('is_anomaly'):
                    anomaly_count += 1
                    status.append(f'异常({slot.get("conflict", {}).get("count", 0)}x)')
                    conflict_cigars = slot.get('conflict', {}).get('cigars', [])
                    print(f"  格{slot_idx + 1}: {', '.join(status)}")
                    print(f"    冲突原因: {slot.get('conflict', {}).get('reason', '未知')}")
                    print(f"    涉及雪茄: {[c.get('name', c.cigar_name) if hasattr(c, 'cigar_name') else c.get('name') for c in conflict_cigars]}")
                elif status:
                    print(f"  格{slot_idx + 1}: {', '.join(status)}")
        
        print(f"\n统计:")
        print(f"  正常占用格位: {normal_occupied}")
        print(f"  异常格位: {anomaly_count}")
        
        if anomaly_count > 0:
            print("  ✅ 异常格位检测正确")
        else:
            print("  ⚠️  没有检测到异常格位（BATCH-2024-002 应该有异常）")
            
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("测试2：批次版本对比数据")
print("=" * 60)

try:
    response = client.get('/cabinet/1/')
    ctx = response.context
    
    multi_version = ctx.get('multi_version_batches', [])
    multi_version_json = ctx.get('multi_version_json', '[]')
    
    print(f"多版本批次数量: {len(multi_version)}")
    
    for batch in multi_version:
        print(f"\n批次: {batch['batch_no']}")
        old_v = batch['old_version']
        new_v = batch['new_version']
        print(f"  v{old_v['record'].version} (回滚前):")
        print(f"    记录数: {old_v['details_count']}, 告警数: {old_v['alert_count']}")
        print(f"    平均湿度: {old_v['avg_humidity']:.1f}%")
        print(f"    湿度范围: {old_v['min_humidity']:.1f}% - {old_v['max_humidity']:.1f}%")
        print(f"    曲线点数: {len(old_v['humidities'])}")
        print(f"    告警点数: {len(old_v['alert_points'])}")
        
        print(f"  v{new_v['record'].version} (重算后):")
        print(f"    记录数: {new_v['details_count']}, 告警数: {new_v['alert_count']}")
        print(f"    平均湿度: {new_v['avg_humidity']:.1f}%")
        print(f"    湿度范围: {new_v['min_humidity']:.1f}% - {new_v['max_humidity']:.1f}%")
        print(f"    曲线点数: {len(new_v['humidities'])}")
        print(f"    告警点数: {len(new_v['alert_points'])}")
        
        print(f"  变化原因分析: {len(batch['changes'])} 项")
        for change in batch['changes']:
            print(f"    {change['icon']} {change['title']}: {change['desc'][:50]}...")
    
    import json
    parsed = json.loads(multi_version_json)
    print(f"\nJSON 序列化验证:")
    print(f"  批次数量: {len(parsed)}")
    if parsed:
        print(f"  v1 湿度数据点数: {len(parsed[0]['old_version']['humidities'])}")
        print(f"  v2 湿度数据点数: {len(parsed[0]['new_version']['humidities'])}")
        print(f"  ✅ JSON 序列化成功")
        
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("测试3：记录详情页版本对比")
print("=" * 60)

try:
    record = CabinetRecord.objects.filter(batch_no='BATCH-2024-003').first()
    if record:
        response2 = client.get(f'/record/{record.id}/')
        print(f"HTTP 状态码: {response2.status_code}")
        
        ctx2 = response2.context
        versions = ctx2.get('versions_data', [])
        version_json = ctx2.get('version_json', '[]')
        
        print(f"同一批次版本数量: {len(versions)}")
        for v in versions:
            print(f"  v{v['record'].version}: 告警{v['stats']['alert_count']}次, 平均湿度{v['stats']['avg_humidity']:.1f}%")
        
        import json
        parsed2 = json.loads(version_json)
        print(f"  JSON 序列化: ✅ 成功, {len(parsed2)} 个版本")
            
except Exception as e:
    print(f"❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("测试完成")
print("=" * 60)
