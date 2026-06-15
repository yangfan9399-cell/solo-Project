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
    if latest_record:
        positions = CigarPosition.objects.filter(record=latest_record).order_by('-operation_time')
        seen_cigars = set()
        for pos in positions:
            key = f'{pos.to_layer}-{pos.to_slot}'
            if pos.cigar_code not in seen_cigars:
                cigar_map[key] = pos
                seen_cigars.add(pos.cigar_code)

    grid = []
    for layer in range(1, cabinet.layers + 1):
        layer_slots = []
        for slot in range(1, cabinet.slots_per_layer + 1):
            key = f'{layer}-{slot}'
            cigar = cigar_map.get(key)
            layer_slots.append({
                'layer': layer,
                'slot': slot,
                'cigar': cigar,
            })
        grid.append(layer_slots)

    reminders = AlertReminder.objects.filter(cabinet=cabinet).order_by('-created_at')[:10]

    context = {
        'cabinet': cabinet,
        'records': records,
        'latest_record': latest_record,
        'grid': grid,
        'reminders': reminders,
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

    context = {
        'record': record,
        'humidity_details': humidity_details,
        'positions': positions,
        'rotation_result': rotation_result,
        'reminders': reminders,
        'humidity_stats': humidity_stats,
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
