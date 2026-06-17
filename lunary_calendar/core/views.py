"""
视图函数定义
"""
from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
from .models import CalculationRecord, CalculationBatch, RecordVersion, AbnormalData
from .calendar import calculate_calendar


def index(request):
    records = CalculationRecord.objects.all()
    
    query = request.GET.get('q')
    status = request.GET.get('status')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if query:
        records = records.filter(Q(title__icontains=query) | Q(location_name__icontains=query))
    
    if status:
        records = records.filter(status=status)
    
    if start_date:
        records = records.filter(target_date__gte=start_date)
    
    if end_date:
        records = records.filter(target_date__lte=end_date)
    
    abnormal_count = AbnormalData.objects.filter(resolved=False).count()
    
    context = {
        'records': records,
        'abnormal_count': abnormal_count,
        'status_choices': CalculationRecord.STATUS_CHOICES,
        'query': query or '',
        'status_filter': status or '',
        'start_date': start_date or '',
        'end_date': end_date or '',
    }
    
    return render(request, 'core/index.html', context)


def record_detail(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    return render(request, 'core/record_detail.html', {'record': record})


def record_new(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        target_date = request.POST.get('target_date')
        time_hour = int(request.POST.get('time_hour', 12))
        time_minute = int(request.POST.get('time_minute', 0))
        latitude = float(request.POST.get('latitude', 39.9042))
        longitude = float(request.POST.get('longitude', 116.4074))
        timezone_offset = int(request.POST.get('timezone', 8))
        location_name = request.POST.get('location_name', '')
        
        record = CalculationRecord(
            title=title,
            description=description,
            target_date=target_date,
            time_hour=time_hour,
            time_minute=time_minute,
            latitude=latitude,
            longitude=longitude,
            timezone_offset=timezone_offset,
            location_name=location_name,
        )
        record.save()
        
        return redirect('record_detail', pk=record.pk)
    
    return render(request, 'core/record_edit.html', {'record': None})


def record_edit(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    
    if request.method == 'POST':
        changes = []
        
        if record.title != request.POST.get('title'):
            changes.append(f'标题: {record.title} -> {request.POST.get("title")}')
            record.title = request.POST.get('title')
        
        if record.description != request.POST.get('description'):
            changes.append('描述已修改')
            record.description = request.POST.get('description')
        
        if record.target_date != request.POST.get('target_date'):
            changes.append(f'目标日期: {record.target_date} -> {request.POST.get("target_date")}')
            record.target_date = request.POST.get('target_date')
        
        if record.time_hour != int(request.POST.get('time_hour', 12)):
            changes.append(f'时间(时): {record.time_hour} -> {request.POST.get("time_hour")}')
            record.time_hour = int(request.POST.get('time_hour', 12))
        
        if record.time_minute != int(request.POST.get('time_minute', 0)):
            changes.append(f'时间(分): {record.time_minute} -> {request.POST.get("time_minute")}')
            record.time_minute = int(request.POST.get('time_minute', 0))
        
        if float(record.latitude) != float(request.POST.get('latitude', 39.9042)):
            changes.append(f'纬度: {record.latitude} -> {request.POST.get("latitude")}')
            record.latitude = float(request.POST.get('latitude', 39.9042))
        
        if float(record.longitude) != float(request.POST.get('longitude', 116.4074)):
            changes.append(f'经度: {record.longitude} -> {request.POST.get("longitude")}')
            record.longitude = float(request.POST.get('longitude', 116.4074))
        
        if record.timezone_offset != int(request.POST.get('timezone', 8)):
            changes.append(f'时区: {record.timezone_offset} -> {request.POST.get("timezone")}')
            record.timezone_offset = int(request.POST.get('timezone', 8))
        
        if record.location_name != request.POST.get('location_name', ''):
            changes.append(f'地点名称: {record.location_name} -> {request.POST.get("location_name")}')
            record.location_name = request.POST.get('location_name', '')
        
        if changes:
            next_version = record.versions.count() + 1
            RecordVersion.objects.create(
                record=record,
                version_number=next_version,
                changes='; '.join(changes),
                target_date=record.target_date,
                time_hour=record.time_hour,
                time_minute=record.time_minute,
                latitude=record.latitude,
                longitude=record.longitude,
                timezone_offset=record.timezone_offset,
                lunar_year=record.lunar_year,
                lunar_month=record.lunar_month,
                lunar_day=record.lunar_day,
                year_gan_zhi=record.year_gan_zhi,
                month_gan_zhi=record.month_gan_zhi,
                day_gan_zhi=record.day_gan_zhi,
                moon_phase=record.moon_phase,
            )
        
        record.save()
        
        return redirect('record_detail', pk=record.pk)
    
    return render(request, 'core/record_edit.html', {'record': record})


def record_delete(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    record.delete()
    return redirect('index')


def record_history(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    versions = record.versions.all()
    return render(request, 'core/record_history.html', {'record': record, 'versions': versions})


def record_export(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    
    content = f"""极简农历历法推算工具 - 推算报告

标题: {record.title}
描述: {record.description or '无'}
创建时间: {record.created_at.strftime('%Y-%m-%d %H:%M:%S')}
更新时间: {record.updated_at.strftime('%Y-%m-%d %H:%M:%S')}
状态: {dict(CalculationRecord.STATUS_CHOICES).get(record.status, record.status)}

--- 输入参数 ---
目标日期: {record.target_date}
时间: {record.time_hour:02d}:{record.time_minute:02d}
地点: {record.location_name or '未指定'}
纬度: {record.latitude}
经度: {record.longitude}
时区: UTC+{record.timezone_offset}

--- 推算结果 ---
农历: {record.lunar_year or '-'}年{record.lunar_month_name or '-'}
{'闰' if record.is_leap_month else ''}{record.lunar_day_name or '-'}

干支:
  年: {record.year_gan_zhi or '-'}
  月: {record.month_gan_zhi or '-'}
  日: {record.day_gan_zhi or '-'}

月相: {record.moon_phase or '-'} ({record.moon_phase_type or '-'})

节气: {', '.join([t['name'] for t in (record.solar_terms or [])]) or '无'}

--- 推算步骤 ---
"""
    if record.calculation_steps:
        for step in record.calculation_steps:
            content += f"{step['step']}. {step['name']}: {step['value']}\n"
            content += f"   {step['description']}\n\n"
    
    content += f"""
--- 异常信息 ---
{record.error_message or '无'}
"""
    
    response = HttpResponse(content, content_type='text/plain; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="推算报告_{record.title}_{record.target_date}.txt"'
    return response


def batch_detail(request, pk):
    batch = get_object_or_404(CalculationBatch, pk=pk)
    records = batch.records.all()
    
    if request.method == 'POST' and 'calculate' in request.POST:
        batch.status = 'calculating'
        batch.total_records = 0
        batch.success_count = 0
        batch.error_count = 0
        batch.save()
        
        current_date = batch.start_date
        while current_date <= batch.end_date:
            title = f'{current_date.strftime("%Y年%m月%d日")}推算'
            
            record, created = CalculationRecord.objects.get_or_create(
                title=title,
                target_date=current_date,
                defaults={
                    'time_hour': 12,
                    'time_minute': 0,
                    'latitude': batch.latitude,
                    'longitude': batch.longitude,
                    'timezone_offset': batch.timezone_offset,
                    'location_name': batch.name,
                    'batch': batch,
                }
            )
            
            if not created:
                record.batch = batch
                record.save()
            
            batch.total_records += 1
            
            try:
                dt = datetime(current_date.year, current_date.month, current_date.day, 
                             record.time_hour, record.time_minute)
                result = calculate_calendar(dt, float(record.latitude), 
                                           float(record.longitude), record.timezone_offset)
                
                record.lunar_year = result['lunar']['year']
                record.lunar_month = result['lunar']['month']
                record.lunar_day = result['lunar']['day']
                record.lunar_month_name = result['lunar']['month_name']
                record.lunar_day_name = result['lunar']['day_name']
                record.is_leap_month = result['lunar']['is_leap']
                record.year_gan_zhi = result['gan_zhi']['year']
                record.month_gan_zhi = result['gan_zhi']['month']
                record.day_gan_zhi = result['gan_zhi']['day']
                record.moon_phase = result['moon_phase']
                record.moon_phase_type = result['moon_phase_type']
                record.solar_terms = result['solar_terms']
                record.calculation_steps = result['calculation_steps']
                record.status = 'calculated'
                record.error_message = ''
                record.calculated_at = timezone.now()
                batch.success_count += 1
            except Exception as e:
                record.status = 'abnormal'
                record.error_message = str(e)
                batch.error_count += 1
                
                AbnormalData.objects.create(
                    record=record,
                    batch=batch,
                    type='calculation_error',
                    message=str(e),
                    details={'date': str(current_date)},
                )
            
            record.save()
            current_date += timedelta(days=1)
        
        batch.status = 'completed'
        batch.completed_at = timezone.now()
        batch.save()
        
        return redirect('batch_detail', pk=batch.pk)
    
    return render(request, 'core/batch_detail.html', {'batch': batch, 'records': records})


def batch_new(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        description = request.POST.get('description')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        latitude = float(request.POST.get('latitude', 39.9042))
        longitude = float(request.POST.get('longitude', 116.4074))
        timezone_offset = int(request.POST.get('timezone', 8))
        
        batch = CalculationBatch(
            name=name,
            description=description,
            start_date=start_date,
            end_date=end_date,
            latitude=latitude,
            longitude=longitude,
            timezone_offset=timezone_offset,
        )
        batch.save()
        
        return redirect('batch_detail', pk=batch.pk)
    
    return render(request, 'core/batch_edit.html', {'batch': None})


def export_summary(request):
    records = CalculationRecord.objects.all()
    
    query = request.GET.get('q')
    status = request.GET.get('status')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if query:
        records = records.filter(Q(title__icontains=query) | Q(location_name__icontains=query))
    if status:
        records = records.filter(status=status)
    if start_date:
        records = records.filter(target_date__gte=start_date)
    if end_date:
        records = records.filter(target_date__lte=end_date)
    
    content = f"""极简农历历法推算工具 - 导出摘要

导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
记录总数: {records.count()}

--- 记录列表 ---

"""
    for i, record in enumerate(records, 1):
        content += f"{i}. {record.title}\n"
        content += f"   日期: {record.target_date}\n"
        content += f"   地点: {record.location_name or '未指定'}\n"
        content += f"   农历: {record.lunar_year or '-'}年{record.lunar_month_name or '-'}"\
                   f"{'闰' if record.is_leap_month else ''}{record.lunar_day_name or '-'} - "\
                   f"{record.year_gan_zhi or '-'}年{record.month_gan_zhi or '-'}月{record.day_gan_zhi or '-'}日\n"
        content += f"   月相: {record.moon_phase or '-'} ({record.moon_phase_type or '-'})\n"
        content += f"   状态: {dict(CalculationRecord.STATUS_CHOICES).get(record.status, record.status)}\n"
        content += f"   创建: {record.created_at.strftime('%Y-%m-%d')}\n"
        content += "\n"
    
    content += f"""--- 统计信息 ---
草稿: {records.filter(status='draft').count()}
已推算: {records.filter(status='calculated').count()}
已验证: {records.filter(status='verified').count()}
异常: {records.filter(status='abnormal').count()}
"""
    
    response = HttpResponse(content, content_type='text/plain; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="推算摘要_{datetime.now().strftime("%Y%m%d")}.txt"'
    return response


def calculate_record(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    
    try:
        dt = datetime(record.target_date.year, record.target_date.month, record.target_date.day, 
                     record.time_hour, record.time_minute)
        result = calculate_calendar(dt, float(record.latitude), float(record.longitude), record.timezone_offset)
        
        record.lunar_year = result['lunar']['year']
        record.lunar_month = result['lunar']['month']
        record.lunar_day = result['lunar']['day']
        record.lunar_month_name = result['lunar']['month_name']
        record.lunar_day_name = result['lunar']['day_name']
        record.is_leap_month = result['lunar']['is_leap']
        record.year_gan_zhi = result['gan_zhi']['year']
        record.month_gan_zhi = result['gan_zhi']['month']
        record.day_gan_zhi = result['gan_zhi']['day']
        record.moon_phase = result['moon_phase']
        record.moon_phase_type = result['moon_phase_type']
        record.solar_terms = result['solar_terms']
        record.calculation_steps = result['calculation_steps']
        record.status = 'calculated'
        record.error_message = ''
        record.calculated_at = timezone.now()
        
        record.save()
        
    except Exception as e:
        record.status = 'abnormal'
        record.error_message = str(e)
        record.save()
        
        AbnormalData.objects.create(
            record=record,
            type='calculation_error',
            message=str(e),
            details={'date': str(record.target_date)},
        )
    
    return redirect('record_detail', pk=record.pk)


def verify_record(request, pk):
    record = get_object_or_404(CalculationRecord, pk=pk)
    record.status = 'verified'
    record.save()
    return redirect('record_detail', pk=record.pk)


def resolve_abnormal(request, pk):
    abnormal = get_object_or_404(AbnormalData, pk=pk)
    abnormal.resolved = True
    abnormal.resolved_at = timezone.now()
    abnormal.resolution_note = request.POST.get('resolution_note', '')
    abnormal.save()
    
    if abnormal.record:
        abnormal.record.status = 'verified'
        abnormal.record.save()
    
    return redirect('index')
