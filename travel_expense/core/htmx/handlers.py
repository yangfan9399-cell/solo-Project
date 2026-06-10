from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponse
from ..models import Travel, Reimbursement


def travel_detail_partial(request, travel_id):
    """HTMX: 获取差旅详情片段"""
    travel = get_object_or_404(Travel.objects.select_related(
        'applicant', 'department', 'booking', 'reimbursement'
    ).prefetch_related('history_nodes__actor'), id=travel_id)

    html = render_to_string('partials/travel_card.html', {'travel': travel}, request=request)
    return HttpResponse(html)


def receipt_check_partial(request, travel_id):
    """HTMX: 检查票据完整性"""
    travel = get_object_or_404(Travel.objects.select_related('reimbursement'), id=travel_id)

    if not hasattr(travel, 'reimbursement'):
        return HttpResponse('<div class="alert alert-warning">暂无报销单</div>')

    reimbursement = travel.reimbursement
    is_valid, missing_list = reimbursement.validate_receipts()

    context = {
        'reimbursement': reimbursement,
        'is_valid': is_valid,
        'missing_list': missing_list
    }

    html = render_to_string('partials/receipt_checker.html', context, request=request)
    return HttpResponse(html)


def budget_difference_partial(request, travel_id):
    """HTMX: 计算预算差异"""
    travel = get_object_or_404(Travel.objects.select_related('booking'), id=travel_id)

    if hasattr(travel, 'booking') and travel.booking:
        actual_cost = travel.booking.actual_cost
        estimated_budget = travel.estimated_budget
        difference = actual_cost - estimated_budget
        percentage = (difference / estimated_budget * 100) if estimated_budget > 0 else 0

        context = {
            'actual_cost': actual_cost,
            'estimated_budget': estimated_budget,
            'difference': difference,
            'percentage': percentage
        }
    else:
        context = {
            'actual_cost': None,
            'estimated_budget': travel.estimated_budget,
            'difference': None,
            'percentage': None
        }

    html = render_to_string('partials/budget_difference.html', context, request=request)
    return HttpResponse(html)


def history_timeline_partial(request, travel_id):
    """HTMX: 获取历史时间线"""
    travel = get_object_or_404(Travel.objects.prefetch_related('history_nodes__actor'), id=travel_id)

    html = render_to_string('partials/history_timeline.html', {'travel': travel}, request=request)
    return HttpResponse(html)


def status_badge_partial(request, travel_id):
    """HTMX: 获取状态标签"""
    travel = get_object_or_404(Travel, id=travel_id)

    html = render_to_string('partials/status_badge.html', {'travel': travel}, request=request)
    return HttpResponse(html)
