from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.db.models.functions import Extract
from batches.models import Batch
from observations.models import ObservationRecord
from django.utils import timezone


@login_required
def reports_dashboard(request):
    if not request.user.can_approve_release():
        return render(request, 'reports/no_permission.html')
    
    batches = Batch.objects.all()
    
    by_country = batches.values('origin_country').annotate(
        batch_count=Count('id'),
        abnormal_count=Count('id', filter=Q(status__in=['reviewing', 'returned']))
    ).order_by('-batch_count')
    
    for item in by_country:
        if item['batch_count'] > 0:
            item['abnormal_rate'] = round((item['abnormal_count'] / item['batch_count']) * 100, 2)
        else:
            item['abnormal_rate'] = 0
    
    by_animal_type = batches.values('animal_type').annotate(
        batch_count=Count('id'),
        released_count=Count('id', filter=Q(status='released'))
    ).order_by('-batch_count')
    
    abnormal_observations = ObservationRecord.objects.filter(is_abnormal=True)
    by_abnormal_reason = abnormal_observations.values('abnormal_symptoms').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    for batch in batches:
        batch.quarantine_days = batch.get_quarantine_days()
    
    days_ranges = {
        '0-7天': 0,
        '8-14天': 0,
        '15-30天': 0,
        '30天以上': 0,
    }
    
    for batch in batches:
        days = batch.quarantine_days
        if days <= 7:
            days_ranges['0-7天'] += 1
        elif days <= 14:
            days_ranges['8-14天'] += 1
        elif days <= 30:
            days_ranges['15-30天'] += 1
        else:
            days_ranges['30天以上'] += 1
    
    by_quarantine_days = [
        {'days_range': k, 'batch_count': v}
        for k, v in days_ranges.items()
    ]
    
    status_summary = batches.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    total_batches = batches.count()
    released_batches = batches.filter(status='released').count()
    abnormal_batches = batches.filter(status__in=['reviewing', 'returned']).count()
    
    context = {
        'by_country': by_country,
        'by_animal_type': by_animal_type,
        'by_abnormal_reason': by_abnormal_reason,
        'by_quarantine_days': by_quarantine_days,
        'status_summary': status_summary,
        'total_batches': total_batches,
        'released_batches': released_batches,
        'abnormal_batches': abnormal_batches,
    }
    return render(request, 'reports/dashboard.html', context)