from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.db.models import Avg, Max, Min, Count, Q
from django.utils import timezone
from datetime import timedelta
import json
import csv

from .models import (
    HumidorCabinet,
    CabinetRecord,
    HumidityDetail,
    CigarPosition,
    RotationResult,
    AlertReminder,
    CigarTag,
)


def dashboard(request):
    cabinets = HumidorCabinet.objects.all()
    recent_records = CabinetRecord.objects.select_related('cabinet')[:10]
    unread_reminders = AlertReminder.objects.filter(status='unread').order_by('-created_at')[:5]
    all_reminders_count = AlertReminder.objects.filter(status='unread').count()

    stats = {
        'total_cabinets': cabinets.count(),
        'total_records': CabinetRecord.objects.count(),
        'active_batches': CabinetRecord.objects.filter(status='in_progress').count(),
        'alert_count': AlertReminder.objects.filter(status='unread', severity='danger').count(),
    }

    context = {
        'cabinets': cabinets,
        'recent_records': recent_records,
        'unread_reminders': unread_reminders,
        'all_reminders_count': all_reminders_count,
        'stats': stats,
    }
    return render(request, 'humidor/dashboard.html', context)


def cabinet_detail(request, cabinet_id):
    cabinet = get_object_or_404(HumidorCabinet, pk=cabinet_id)
    records = CabinetRecord.objects.filter(cabinet=cabinet).order_by('-record_date')
    latest_record = records.first()

    cigar_map = {}
    slot_conflicts = {}

    active_records = records.exclude(status='rolled_back')
    if active_records.exists():
        all_positions = CigarPosition.objects.filter(
            record__in=active_records
        ).order_by('-operation_time')

        slot_cigar_count = {}
        slot_cigars = {}
        for pos in all_positions:
            key = f'{pos.to_layer}-{pos.to_slot}'
            if key not in slot_cigar_count:
                slot_cigar_count[key] = 0
                slot_cigars[key] = []
            slot_cigar_count[key] += 1
            slot_cigars[key].append(pos)

        seen_cigars = set()
        for pos in all_positions:
            key = f'{pos.to_layer}-{pos.to_slot}'
            if pos.cigar_code not in seen_cigars:
                cigar_map[key] = pos
                seen_cigars.add(pos.cigar_code)

        for key, count in slot_cigar_count.items():
            if count > 1:
                slot_conflicts[key] = {
                    'count': count,
                    'cigars': [
                        {
                            'cigar_name': c.cigar_name,
                            'cigar_code': c.cigar_code,
                            'batch_no': c.record.batch_no,
                        } for c in slot_cigars[key]
                    ],
                    'reason': f'{count}支雪茄放置在同一格位，影响通风和养护效果',
                }

    grid = []
    for layer in range(1, cabinet.layers + 1):
        layer_slots = []
        for slot in range(1, cabinet.slots_per_layer + 1):
            key = f'{layer}-{slot}'
            cigar = cigar_map.get(key)
            conflict = slot_conflicts.get(key)
            layer_slots.append({
                'layer': layer,
                'slot': slot,
                'cigar': cigar,
                'conflict': conflict,
                'is_anomaly': conflict is not None,
            })
        grid.append(layer_slots)

    batch_versions = {}
    for r in records:
        if r.batch_no not in batch_versions:
            batch_versions[r.batch_no] = []
        batch_versions[r.batch_no].append(r)

    multi_version_batches = []
    for batch, versions in batch_versions.items():
        if len(versions) > 1:
            sorted_versions = sorted(versions, key=lambda x: x.version, reverse=True)
            compare_data = []
            for v in sorted_versions[:2]:
                details = v.humidity_details.all().order_by('measure_time')
                alerts = details.filter(is_alert=True)
                positions = v.cigar_positions.all()
                reminders = AlertReminder.objects.filter(record=v)

                temps = [d.temperature for d in details]
                hums = [d.humidity for d in details]
                times = [d.measure_time.strftime('%H:%M') for d in details]

                alert_points = []
                for d in alerts:
                    alert_points.append({
                        'time': d.measure_time.strftime('%H:%M'),
                        'temp': d.temperature,
                        'humidity': d.humidity,
                        'type': d.alert_type,
                    })

                avg_temp = sum(temps) / len(temps) if temps else 0
                avg_hum = sum(hums) / len(hums) if hums else 0

                compare_data.append({
                    'record': v,
                    'details_count': details.count(),
                    'alert_count': alerts.count(),
                    'position_count': positions.count(),
                    'reminder_count': reminders.count(),
                    'avg_temp': round(avg_temp, 1),
                    'avg_humidity': round(avg_hum, 1),
                    'max_temp': max(temps) if temps else 0,
                    'min_temp': min(temps) if temps else 0,
                    'max_humidity': max(hums) if hums else 0,
                    'min_humidity': min(hums) if hums else 0,
                    'times': times,
                    'temperatures': temps,
                    'humidities': hums,
                    'alert_points': alert_points,
                    'reminders': list(reminders.values('reminder_type', 'severity', 'status', 'title')),
                })

            new_version = compare_data[0]
            old_version = compare_data[1] if len(compare_data) > 1 else None

            if old_version:
                changes = []
                if old_version['alert_count'] > 0 and new_version['alert_count'] == 0:
                    changes.append({
                        'icon': '📈',
                        'title': '历史曲线差异',
                        'desc': f'v{old_version["record"].version}在{len(old_version["alert_points"])}个时间点出现超标，曲线大幅偏离目标范围；v{new_version["record"].version}温湿度曲线平稳运行在目标范围内，无任何告警。'
                    })
                if old_version['reminder_count'] != new_version['reminder_count']:
                    changes.append({
                        'icon': '🔔',
                        'title': '提醒变化',
                        'desc': f'v{old_version["record"].version}触发{old_version["reminder_count"]}条告警（湿度严重超标、温度偏高）；v{new_version["record"].version}新增{new_version["reminder_count"]}条提醒（重算版本创建、轮换到期提醒）。'
                    })
                changes.append({
                    'icon': '🔄',
                    'title': '回滚触发原因',
                    'desc': f'v{old_version["record"].version}在轮换执行过程中，第{old_version["record"].cabinet_layer}层传感器连续{len(old_version["alert_points"])}小时检测到湿度超过{cabinet.target_humidity_max}%阈值（最高{old_version["max_humidity"]}%），系统自动触发回滚机制。'
                })
                changes.append({
                    'icon': '⚙️',
                    'title': '重算调整措施',
                    'desc': f'v{new_version["record"].version}调整了轮换策略：避开每日温湿度波动高峰时段，重新规划雪茄摆放位置，分散放置确保空气流通，温湿度阈值临时调整为更保守范围。'
                })
            else:
                changes = []

            multi_version_batches.append({
                'batch_no': batch,
                'new_version': new_version,
                'old_version': old_version,
                'changes': changes,
            })

    all_anomalies = []
    for layer in grid:
        for slot in layer:
            if slot.get('is_anomaly'):
                all_anomalies.append(slot)

    reminders = AlertReminder.objects.filter(cabinet=cabinet).order_by('-created_at')[:10]

    multi_version_json = []
    for batch in multi_version_batches:
        old_v = batch['old_version']
        new_v = batch['new_version']
        multi_version_json.append({
            'batch_no': batch['batch_no'],
            'old_version': {
                'version': old_v['record'].version,
                'details_count': old_v['details_count'],
                'alert_count': old_v['alert_count'],
                'avg_humidity': old_v['avg_humidity'],
                'max_humidity': old_v['max_humidity'],
                'min_humidity': old_v['min_humidity'],
                'times': old_v['times'],
                'temperatures': old_v['temperatures'],
                'humidities': old_v['humidities'],
                'alert_points': old_v['alert_points'],
            },
            'new_version': {
                'version': new_v['record'].version,
                'details_count': new_v['details_count'],
                'alert_count': new_v['alert_count'],
                'avg_humidity': new_v['avg_humidity'],
                'max_humidity': new_v['max_humidity'],
                'min_humidity': new_v['min_humidity'],
                'times': new_v['times'],
                'temperatures': new_v['temperatures'],
                'humidities': new_v['humidities'],
                'alert_points': new_v['alert_points'],
            },
        })

    context = {
        'cabinet': cabinet,
        'records': records,
        'latest_record': latest_record,
        'grid': grid,
        'reminders': reminders,
        'multi_version_batches': multi_version_batches,
        'multi_version_json': json.dumps(multi_version_json),
        'anomalies': all_anomalies,
    }
    return render(request, 'humidor/cabinet_detail.html', context)


def record_detail(request, record_id):
    record = get_object_or_404(CabinetRecord, pk=record_id)
    humidity_details = record.humidity_details.all().order_by('measure_time')
    positions = record.cigar_positions.all().order_by('-operation_time')
    rotation_result = getattr(record, 'rotation_result', None)
    reminders = AlertReminder.objects.filter(record=record).order_by('-created_at')

    humidity_stats = None
    if humidity_details.exists():
        humidity_stats = humidity_details.aggregate(
            avg_temp=Avg('temperature'),
            avg_humidity=Avg('humidity'),
            max_temp=Max('temperature'),
            min_temp=Min('temperature'),
            max_humidity=Max('humidity'),
            min_humidity=Min('humidity'),
            alert_count=Count('id', filter=Q(is_alert=True)),
        )

    batch_records = CabinetRecord.objects.filter(
        batch_no=record.batch_no
    ).order_by('version')

    def prepare_version_data(rec):
        details = rec.humidity_details.all().order_by('measure_time')
        stats = details.aggregate(
            avg_temp=Avg('temperature'),
            avg_humidity=Avg('humidity'),
            max_temp=Max('temperature'),
            min_temp=Min('temperature'),
            max_humidity=Max('humidity'),
            min_humidity=Min('humidity'),
            alert_count=Count('id', filter=Q(is_alert=True)),
        )
        times = [d.measure_time.strftime('%H:%M') for d in details]
        temps = [float(d.temperature) for d in details]
        hums = [float(d.humidity) for d in details]
        alert_points = []
        for d in details:
            if d.is_alert:
                alert_points.append({
                    'time': d.measure_time.strftime('%H:%M'),
                    'humidity': float(d.humidity),
                    'temp': float(d.temperature),
                    'type': d.alert_type,
                })

        return {
            'record': rec,
            'details': details,
            'stats': stats,
            'times': times,
            'temperatures': temps,
            'humidities': hums,
            'alert_points': alert_points,
            'reminders': AlertReminder.objects.filter(record=rec).order_by('-created_at'),
        }

    versions_data = [prepare_version_data(r) for r in batch_records]

    version_json = []
    for v in versions_data:
        version_json.append({
            'version': v['record'].version,
            'avg_humidity': v['stats']['avg_humidity'] is not None and float(v['stats']['avg_humidity']) or 0,
            'max_humidity': v['stats']['max_humidity'] is not None and float(v['stats']['max_humidity']) or 0,
            'min_humidity': v['stats']['min_humidity'] is not None and float(v['stats']['min_humidity']) or 0,
            'alert_count': v['stats']['alert_count'],
            'times': v['times'],
            'temperatures': v['temperatures'],
            'humidities': v['humidities'],
            'alert_points': v['alert_points'],
        })

    context = {
        'record': record,
        'humidity_details': humidity_details,
        'positions': positions,
        'rotation_result': rotation_result,
        'reminders': reminders,
        'humidity_stats': humidity_stats,
        'versions_data': versions_data,
        'version_json': json.dumps(version_json),
        'cabinet': record.cabinet,
    }
    return render(request, 'humidor/record_detail.html', context)


def humidity_chart_data(request, cabinet_id):
    cabinet = get_object_or_404(HumidorCabinet, pk=cabinet_id)
    days = int(request.GET.get('days', 7))

    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)

    records = CabinetRecord.objects.filter(
        cabinet=cabinet,
        record_date__gte=start_date.date()
    )

    details = HumidityDetail.objects.filter(
        record__in=records,
        measure_time__gte=start_date,
        measure_time__lte=end_date
    ).order_by('measure_time')

    labels = []
    temperatures = []
    humidities = []
    alerts = []

    for detail in details:
        labels.append(detail.measure_time.strftime('%m-%d %H:%M'))
        temperatures.append(detail.temperature)
        humidities.append(detail.humidity)
        alerts.append({
            'time': detail.measure_time.strftime('%m-%d %H:%M'),
            'type': detail.alert_type,
            'temp': detail.temperature,
            'humidity': detail.humidity,
        } if detail.is_alert else None)

    data = {
        'labels': labels,
        'temperatures': temperatures,
        'humidities': humidities,
        'temp_min': cabinet.target_temp_min,
        'temp_max': cabinet.target_temp_max,
        'humidity_min': cabinet.target_humidity_min,
        'humidity_max': cabinet.target_humidity_max,
        'alerts': [a for a in alerts if a is not None],
    }

    return JsonResponse(data)


def position_data(request, record_id):
    record = get_object_or_404(CabinetRecord, pk=record_id)
    positions = CigarPosition.objects.filter(record=record).order_by('operation_time')

    position_history = []
    for pos in positions:
        position_history.append({
            'cigar_name': pos.cigar_name,
            'cigar_code': pos.cigar_code,
            'position_type': pos.get_position_type_display(),
            'from_layer': pos.from_layer,
            'from_slot': pos.from_slot,
            'to_layer': pos.to_layer,
            'to_slot': pos.to_slot,
            'operation_time': pos.operation_time.strftime('%Y-%m-%d %H:%M'),
            'operator': pos.operator,
        })

    return JsonResponse({'positions': position_history})


def reminder_list(request):
    status = request.GET.get('status', 'all')
    reminder_type = request.GET.get('type', 'all')

    reminders = AlertReminder.objects.all().order_by('-created_at')

    if status != 'all':
        reminders = reminders.filter(status=status)
    if reminder_type != 'all':
        reminders = reminders.filter(reminder_type=reminder_type)

    status_counts = {
        'all': AlertReminder.objects.count(),
        'unread': AlertReminder.objects.filter(status='unread').count(),
        'read': AlertReminder.objects.filter(status='read').count(),
        'resolved': AlertReminder.objects.filter(status='resolved').count(),
    }

    type_counts = {
        'all': AlertReminder.objects.count(),
        'temperature': AlertReminder.objects.filter(reminder_type='temperature').count(),
        'humidity': AlertReminder.objects.filter(reminder_type='humidity').count(),
        'rotation_due': AlertReminder.objects.filter(reminder_type='rotation_due').count(),
        'position_anomaly': AlertReminder.objects.filter(reminder_type='position_anomaly').count(),
        'system': AlertReminder.objects.filter(reminder_type='system').count(),
    }

    context = {
        'reminders': reminders,
        'current_status': status,
        'current_type': reminder_type,
        'status_counts': status_counts,
        'type_counts': type_counts,
    }
    return render(request, 'humidor/reminders.html', context)


def export_record(request, record_id):
    record = get_object_or_404(CabinetRecord, pk=record_id)

    response = HttpResponse(content_type='text/csv; charset=utf-8')
    filename = f'{record.batch_no}_v{record.version}_export.csv'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    response.write('\ufeff')

    writer = csv.writer(response)

    writer.writerow(['雪茄养护柜湿度轮换工具 - 导出报告'])
    writer.writerow(['导出版本', f'v{record.version}'])
    writer.writerow([])

    writer.writerow(['【主记录信息】'])
    writer.writerow(['批次号', record.batch_no])
    writer.writerow(['版本号', record.version])
    writer.writerow(['收藏者', record.collector])
    writer.writerow(['柜层', f'第{record.cabinet_layer}层'])
    writer.writerow(['记录日期', record.record_date])
    writer.writerow(['状态', record.get_status_display()])
    writer.writerow(['养护柜', record.cabinet.name])
    writer.writerow([])

    writer.writerow(['【温湿度明细】'])
    writer.writerow(['序号', '测量时间', '温度(°C)', '湿度(%)', '传感器位置', '是否告警', '告警类型'])
    for idx, detail in enumerate(record.humidity_details.all().order_by('measure_time'), 1):
        writer.writerow([
            idx,
            detail.measure_time.strftime('%Y-%m-%d %H:%M:%S'),
            detail.temperature,
            detail.humidity,
            detail.sensor_position,
            '是' if detail.is_alert else '否',
            detail.alert_type,
        ])
    writer.writerow([])

    writer.writerow(['【雪茄位置历史】'])
    writer.writerow(['序号', '雪茄名称', '雪茄编号', '操作类型', '起始柜层', '起始格位', '目标柜层', '目标格位', '操作时间', '操作人'])
    for idx, pos in enumerate(record.cigar_positions.all().order_by('operation_time'), 1):
        writer.writerow([
            idx,
            pos.cigar_name,
            pos.cigar_code,
            pos.get_position_type_display(),
            pos.from_layer or '-',
            pos.from_slot or '-',
            pos.to_layer,
            pos.to_slot,
            pos.operation_time.strftime('%Y-%m-%d %H:%M:%S'),
            pos.operator,
        ])
    writer.writerow([])

    if hasattr(record, 'rotation_result'):
        result = record.rotation_result
        writer.writerow(['【轮换结果】'])
        writer.writerow(['轮换日期', result.rotation_date])
        writer.writerow(['轮换结果', result.get_result_display()])
        writer.writerow(['轮换雪茄数量', result.cigar_count])
        writer.writerow(['轮换耗时(分钟)', result.duration_minutes])
        writer.writerow(['执行人', result.executor])
        writer.writerow(['轮换总结', result.summary])
        writer.writerow([])

    writer.writerow(['【品吸备注】'])
    writer.writerow([record.tasting_notes or '无'])
    writer.writerow([])

    writer.writerow(['【备注】'])
    writer.writerow([record.remarks or '无'])

    return response
