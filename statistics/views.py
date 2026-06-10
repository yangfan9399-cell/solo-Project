from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.db.models.functions import ExtractMonth, ExtractYear
from collections import defaultdict
from core.models import Elder
from assessments.models import Assessment, NursingLevel


@login_required
def statistics_dashboard(request):
    floor_stats = get_floor_statistics()
    level_stats = get_level_statistics()
    objection_stats = get_objection_statistics()
    period_stats = get_period_statistics()
    
    context = {
        'floor_stats': floor_stats,
        'level_stats': level_stats,
        'objection_stats': objection_stats,
        'period_stats': period_stats,
    }
    return render(request, 'statistics/dashboard.html', context)


@login_required
def statistics_by_floor(request):
    floor_stats = get_floor_statistics()
    context = {
        'floor_stats': floor_stats,
    }
    return render(request, 'statistics/by_floor.html', context)


@login_required
def statistics_by_level(request):
    level_stats = get_level_statistics()
    context = {
        'level_stats': level_stats,
    }
    return render(request, 'statistics/by_level.html', context)


@login_required
def statistics_by_objection(request):
    objection_stats = get_objection_statistics()
    context = {
        'objection_stats': objection_stats,
    }
    return render(request, 'statistics/by_objection.html', context)


@login_required
def statistics_by_period(request):
    period_stats = get_period_statistics()
    context = {
        'period_stats': period_stats,
    }
    return render(request, 'statistics/by_period.html', context)


def get_floor_statistics():
    elders = Elder.objects.all()
    floor_counts = elders.values('floor').annotate(count=Count('id')).order_by('floor')
    
    floor_level_counts = defaultdict(lambda: defaultdict(int))
    for elder in elders.select_related('current_nursing_level'):
        if elder.current_nursing_level:
            floor_level_counts[elder.floor][elder.current_nursing_level.name] += 1
        else:
            floor_level_counts[elder.floor]['未定级'] += 1
    
    result = []
    for fc in floor_counts:
        floor = fc['floor']
        result.append({
            'floor': floor,
            'total': fc['count'],
            'by_level': dict(floor_level_counts[floor]),
        })
    
    return result


def get_level_statistics():
    elders = Elder.objects.all()
    level_counts = elders.values('current_nursing_level__name').annotate(
        count=Count('id')
    ).order_by('current_nursing_level__level')
    
    result = []
    for lc in level_counts:
        level_name = lc['current_nursing_level__name'] or '未定级'
        result.append({
            'level': level_name,
            'count': lc['count'],
        })
    
    approved_assessments = Assessment.objects.filter(status='approved')
    level_changes = approved_assessments.values('nursing_level__name').annotate(
        count=Count('id')
    ).order_by('nursing_level__level')
    
    change_result = []
    for lc in level_changes:
        change_result.append({
            'level': lc['nursing_level__name'],
            'count': lc['count'],
        })
    
    return {
        'current_distribution': result,
        'level_changes': change_result,
    }


def get_objection_statistics():
    assessments = Assessment.objects.filter(status__in=['approved', 'rejected', 'pending_director'])
    
    agreed_count = assessments.filter(family_agreed=True).count()
    objected_count = assessments.filter(family_agreed=False).count()
    no_family_confirm = assessments.filter(family_agreed=None).count()
    
    objection_reasons = assessments.filter(
        family_agreed=False,
        objection_reason__isnull=False
    ).exclude(objection_reason='').values('objection_reason').annotate(
        count=Count('id')
    ).order_by('-count')
    
    reasons_list = []
    for or_ in objection_reasons:
        reasons_list.append({
            'reason': or_['objection_reason'],
            'count': or_['count'],
        })
    
    return {
        'agreed': agreed_count,
        'objected': objected_count,
        'pending': no_family_confirm,
        'reasons': reasons_list,
    }


def get_period_statistics():
    approved_assessments = Assessment.objects.filter(status='approved')
    
    assessments_with_period = approved_assessments.annotate(
        year=ExtractYear('effective_at'),
        month=ExtractMonth('effective_at')
    )
    
    period_counts = assessments_with_period.values('year', 'month').annotate(
        count=Count('id')
    ).order_by('-year', '-month')
    
    result = []
    for pc in period_counts:
        if pc['year'] and pc['month']:
            result.append({
                'period': f"{pc['year']}年{pc['month']}月",
                'count': pc['count'],
            })
    
    upgrade_counts = assessments_with_period.filter(
        previous_nursing_level__level__lt=models.F('nursing_level__level')
    ).values('year', 'month').annotate(count=Count('id'))
    
    downgrade_counts = assessments_with_period.filter(
        previous_nursing_level__level__gt=models.F('nursing_level__level')
    ).values('year', 'month').annotate(count=Count('id'))
    
    unchanged_counts = assessments_with_period.filter(
        previous_nursing_level__level=models.F('nursing_level__level')
    ).values('year', 'month').annotate(count=Count('id'))
    
    upgrade_dict = {f"{uc['year']}-{uc['month']}": uc['count'] for uc in upgrade_counts if uc['year'] and uc['month']}
    downgrade_dict = {f"{dc['year']}-{dc['month']}": dc['count'] for dc in downgrade_counts if dc['year'] and dc['month']}
    unchanged_dict = {f"{uc['year']}-{uc['month']}": uc['count'] for uc in unchanged_counts if uc['year'] and uc['month']}
    
    detailed_result = []
    for pc in period_counts:
        if pc['year'] and pc['month']:
            key = f"{pc['year']}-{pc['month']}"
            detailed_result.append({
                'period': f"{pc['year']}年{pc['month']}月",
                'total': pc['count'],
                'upgrade': upgrade_dict.get(key, 0),
                'downgrade': downgrade_dict.get(key, 0),
                'unchanged': unchanged_dict.get(key, 0),
            })
    
    return {
        'summary': result,
        'detailed': detailed_result,
    }