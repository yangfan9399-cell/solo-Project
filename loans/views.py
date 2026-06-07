from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST
from decimal import Decimal

from .models import (
    Exhibit, Borrower, LoanApplication, TransportRecord,
    InsurancePolicy, EnvironmentData, ReturnInspection,
    StatusHistory
)
from .forms import (
    LoanApplicationForm, TransportRecordForm, InsurancePolicyForm,
    InsuranceReviewForm, EnvironmentDataForm, ReturnInspectionForm,
    ExhibitForm, BorrowerForm
)


def _add_status_history(loan, from_status, to_status, user, reason=''):
    StatusHistory.objects.create(
        loan=loan,
        from_status=from_status,
        to_status=to_status,
        changed_by=user,
        change_reason=reason
    )


def _generate_loan_number():
    today = timezone.now().strftime('%Y%m%d')
    count = LoanApplication.objects.filter(
        loan_number__startswith=f'JL{today}'
    ).count() + 1
    return f'JL{today}{count:04d}'


@login_required
def dashboard(request):
    total_loans = LoanApplication.objects.count()
    active_loans = LoanApplication.objects.filter(
        status__in=['in_transit', 'on_display', 'out_of_storage', 'arrived', 'returning']
    ).count()
    pending_insurance = LoanApplication.objects.filter(
        status__in=['insurance_pending', 'transport_registered']
    ).count()
    pending_inspection = LoanApplication.objects.filter(
        status__in=['returned', 'inspection_pending']
    ).count()

    recent_loans = LoanApplication.objects.all()[:10]
    has_anomaly_loans = LoanApplication.objects.filter(
        environment_data__is_anomaly=True
    ).distinct().count()

    stats_by_level = LoanApplication.objects.values(
        'exhibit__level'
    ).annotate(
        count=Count('id')
    ).order_by('-count')

    level_names = dict(Exhibit.LEVEL_CHOICES)
    level_stats = []
    for item in stats_by_level:
        level_stats.append({
            'level': level_names.get(item['exhibit__level'], item['exhibit__level']),
            'count': item['count']
        })

    context = {
        'total_loans': total_loans,
        'active_loans': active_loans,
        'pending_insurance': pending_insurance,
        'pending_inspection': pending_inspection,
        'recent_loans': recent_loans,
        'has_anomaly_loans': has_anomaly_loans,
        'level_stats': level_stats,
    }
    return render(request, 'loans/dashboard.html', context)


@login_required
def loan_list(request):
    status_filter = request.GET.get('status', '')
    search = request.GET.get('search', '')
    level_filter = request.GET.get('level', '')

    loans = LoanApplication.objects.all()

    if status_filter:
        loans = loans.filter(status=status_filter)
    if level_filter:
        loans = loans.filter(exhibit__level=level_filter)
    if search:
        loans = loans.filter(
            Q(loan_number__icontains=search) |
            Q(exhibit__name__icontains=search) |
            Q(borrower__name__icontains=search)
        )

    context = {
        'loans': loans,
        'status_filter': status_filter,
        'search': search,
        'level_filter': level_filter,
        'status_choices': LoanApplication.STATUS_CHOICES,
        'level_choices': Exhibit.LEVEL_CHOICES,
    }
    return render(request, 'loans/loan_list.html', context)


@login_required
def loan_detail(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)
    transport_records = loan.transport_records.all()
    insurance_policies = loan.insurance_policies.all()
    environment_data = loan.environment_data.all()
    status_history = loan.status_history.all().order_by('changed_at')

    total_insurance = loan.get_total_insurance_amount()
    insurance_sufficient = loan.is_insurance_sufficient()

    context = {
        'loan': loan,
        'transport_records': transport_records,
        'insurance_policies': insurance_policies,
        'environment_data': environment_data,
        'status_history': status_history,
        'total_insurance': total_insurance,
        'insurance_sufficient': insurance_sufficient,
        'insurance_gap': loan.exhibit.estimated_value - total_insurance,
    }
    return render(request, 'loans/loan_detail.html', context)


@login_required
def loan_create(request):
    if not request.user.profile.is_collection_clerk():
        messages.error(request, '您没有权限创建出借申请')
        return redirect('loans:loan_list')

    if request.method == 'POST':
        form = LoanApplicationForm(request.POST)
        if form.is_valid():
            loan = form.save(commit=False)
            loan.loan_number = _generate_loan_number()
            loan.save()
            _add_status_history(loan, '', 'draft', request.user, '创建出借申请')
            messages.success(request, '出借申请创建成功')
            return redirect('loans:loan_detail', pk=loan.pk)
    else:
        form = LoanApplicationForm()

    context = {'form': form}
    return render(request, 'loans/loan_form.html', context)


@login_required
@require_POST
def loan_submit(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_collection_clerk():
        messages.error(request, '您没有权限提交出借申请')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.can_submit():
        messages.error(request, '当前状态不能提交')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'submitted'
    loan.submitted_by = request.user
    loan.submitted_at = timezone.now()
    loan.save()
    _add_status_history(loan, old_status, 'submitted', request.user, '馆藏经办人提交')
    messages.success(request, '出借申请已提交')

    if request.headers.get('HX-Request'):
        return render(request, 'loans/partials/loan_status_badge.html', {'loan': loan})

    return redirect('loans:loan_detail', pk=pk)


@login_required
def transport_register(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_transport_coordinator():
        messages.error(request, '您没有权限登记运输信息')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.can_register_transport():
        messages.error(request, '当前状态不能登记运输信息')
        return redirect('loans:loan_detail', pk=pk)

    if request.method == 'POST':
        form = TransportRecordForm(request.POST)
        if form.is_valid():
            transport = form.save(commit=False)
            transport.loan = loan
            transport.registered_by = request.user
            transport.save()

            old_status = loan.status
            loan.status = 'transport_registered'
            loan.save()
            _add_status_history(loan, old_status, 'transport_registered', request.user, '运输信息已登记')

            messages.success(request, '运输信息登记成功')
            return redirect('loans:loan_detail', pk=pk)
    else:
        form = TransportRecordForm()

    context = {'form': form, 'loan': loan}
    return render(request, 'loans/transport_form.html', context)


@login_required
def insurance_add(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_insurance_reviewer():
        messages.error(request, '您没有权限添加保险单')
        return redirect('loans:loan_detail', pk=pk)

    if request.method == 'POST':
        form = InsurancePolicyForm(request.POST)
        if form.is_valid():
            policy = form.save(commit=False)
            policy.loan = loan
            policy.status = 'pending'
            policy.save()

            old_status = loan.status
            if loan.status == 'transport_registered':
                loan.status = 'insurance_pending'
                loan.save()
                _add_status_history(loan, old_status, 'insurance_pending', request.user, '已添加保险单，待复核')

            messages.success(request, '保险单添加成功')
            return redirect('loans:loan_detail', pk=pk)
    else:
        form = InsurancePolicyForm()

    context = {'form': form, 'loan': loan}
    return render(request, 'loans/insurance_form.html', context)


@login_required
def insurance_review(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_insurance_reviewer():
        messages.error(request, '您没有权限复核保险')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.can_approve_insurance():
        messages.error(request, '当前状态不能复核保险')
        return redirect('loans:loan_detail', pk=pk)

    total_insurance = loan.get_total_insurance_amount()
    is_sufficient = loan.is_insurance_sufficient()

    if request.method == 'POST':
        form = InsuranceReviewForm(request.POST)
        action = request.POST.get('action', '')
        if action == 'approve':
            if not is_sufficient:
                messages.error(request, '保险额度不足，不能通过复核！')
                return redirect('loans:loan_detail', pk=pk)

            old_status = loan.status
            loan.status = 'insurance_approved'
            loan.save()

            for policy in loan.insurance_policies.filter(status='pending'):
                policy.status = 'approved'
                policy.reviewed_by = request.user
                policy.reviewed_at = timezone.now()
                if form.is_valid():
                    policy.review_notes = form.cleaned_data.get('review_notes', '')
                policy.save()

            _add_status_history(loan, old_status, 'insurance_approved', request.user, '保险复核通过')
            messages.success(request, '保险复核通过')
        elif action == 'reject':
            old_status = loan.status
            loan.status = 'insurance_rejected'
            loan.save()

            for policy in loan.insurance_policies.filter(status='pending'):
                policy.status = 'rejected'
                policy.reviewed_by = request.user
                policy.reviewed_at = timezone.now()
                if form.is_valid():
                    policy.review_notes = form.cleaned_data.get('review_notes', '')
                policy.save()

            _add_status_history(loan, old_status, 'insurance_rejected', request.user, '保险复核未通过')
            messages.warning(request, '保险复核未通过')

        return redirect('loans:loan_detail', pk=pk)
    else:
        form = InsuranceReviewForm()

    context = {
        'form': form,
        'loan': loan,
        'total_insurance': total_insurance,
        'is_sufficient': is_sufficient,
        'insurance_gap': loan.exhibit.estimated_value - total_insurance,
    }
    return render(request, 'loans/insurance_review.html', context)


@login_required
@require_POST
def loan_release(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_collection_clerk():
        messages.error(request, '您没有权限执行出库操作')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.can_release():
        messages.error(request, '当前状态不能出库')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.is_insurance_sufficient():
        messages.error(request, '保险额度不足，禁止出库！')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'out_of_storage'
    loan.actual_start_date = timezone.now().date()
    loan.save()

    loan.exhibit.status = 'in_transport'
    loan.exhibit.save()

    _add_status_history(loan, old_status, 'out_of_storage', request.user, '展品已出库')
    messages.success(request, '展品已出库')

    return redirect('loans:loan_detail', pk=pk)


@login_required
def environment_add(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if request.method == 'POST':
        form = EnvironmentDataForm(request.POST)
        if form.is_valid():
            env_data = form.save(commit=False)
            env_data.loan = loan
            env_data.recorded_by = request.user
            env_data.check_anomaly(loan.exhibit)
            env_data.save()

            if env_data.is_anomaly:
                messages.warning(request, f'环境数据已记录，检测到异常：{env_data.anomaly_type}')
            else:
                messages.success(request, '环境数据记录成功')

            if request.headers.get('HX-Request'):
                return render(request, 'loans/partials/environment_item.html', {'env': env_data})

            return redirect('loans:loan_detail', pk=pk)
    else:
        form = EnvironmentDataForm()

    context = {'form': form, 'loan': loan}
    return render(request, 'loans/environment_form.html', context)


@login_required
def return_inspection(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_conservator():
        messages.error(request, '您没有权限进行归还鉴定')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.can_inspect_return():
        messages.error(request, '当前状态不能进行归还鉴定')
        return redirect('loans:loan_detail', pk=pk)

    existing = hasattr(loan, 'return_inspection')

    if request.method == 'POST':
        if existing:
            form = ReturnInspectionForm(request.POST, instance=loan.return_inspection)
        else:
            form = ReturnInspectionForm(request.POST)

        if form.is_valid():
            inspection = form.save(commit=False)
            if not existing:
                inspection.loan = loan
            inspection.conservator = request.user
            inspection.inspection_date = timezone.now().date()
            inspection.save()

            old_status = loan.status
            loan.status = 'inspection_done'
            loan.save()
            _add_status_history(loan, old_status, 'inspection_done', request.user, '归还鉴定完成')

            messages.success(request, '归还鉴定完成')
            return redirect('loans:loan_detail', pk=pk)
    else:
        if existing:
            form = ReturnInspectionForm(instance=loan.return_inspection)
        else:
            form = ReturnInspectionForm()

    context = {'form': form, 'loan': loan, 'existing': existing}
    return render(request, 'loans/return_inspection_form.html', context)


@login_required
@require_POST
def loan_mark_arrived(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_transport_coordinator():
        messages.error(request, '您没有权限执行此操作')
        return redirect('loans:loan_detail', pk=pk)

    if loan.status not in ['out_of_storage', 'in_transit']:
        messages.error(request, '当前状态不能标记到达')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'arrived'
    loan.save()

    loan.exhibit.status = 'on_loan'
    loan.exhibit.save()

    transport = loan.transport_records.first()
    if transport and not transport.actual_arrival:
        transport.actual_arrival = timezone.now()
        transport.save()

    _add_status_history(loan, old_status, 'arrived', request.user, '展品已到达')
    messages.success(request, '已标记展品到达')

    return redirect('loans:loan_detail', pk=pk)


@login_required
@require_POST
def loan_start_display(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_collection_clerk():
        messages.error(request, '您没有权限执行此操作')
        return redirect('loans:loan_detail', pk=pk)

    if not loan.can_start_display():
        messages.error(request, '当前状态不能开始展出')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'on_display'
    loan.save()

    _add_status_history(loan, old_status, 'on_display', request.user, '展品开始展出')
    messages.success(request, '已开始展出')

    return redirect('loans:loan_detail', pk=pk)


@login_required
@require_POST
def loan_start_return(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_collection_clerk():
        messages.error(request, '您没有权限执行此操作')
        return redirect('loans:loan_detail', pk=pk)

    if loan.status != 'on_display':
        messages.error(request, '当前状态不能开始归还')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'returning'
    loan.save()

    loan.exhibit.status = 'in_transport'
    loan.exhibit.save()

    _add_status_history(loan, old_status, 'returning', request.user, '开始归还')
    messages.success(request, '已开始归还流程')

    return redirect('loans:loan_detail', pk=pk)


@login_required
@require_POST
def loan_mark_returned(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_transport_coordinator():
        messages.error(request, '您没有权限执行此操作')
        return redirect('loans:loan_detail', pk=pk)

    if loan.status != 'returning':
        messages.error(request, '当前状态不能标记归还')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'inspection_pending'
    loan.actual_end_date = timezone.now().date()
    loan.save()

    _add_status_history(loan, old_status, 'inspection_pending', request.user, '展品已归还，待鉴定')
    messages.success(request, '已标记归还，等待鉴定')

    return redirect('loans:loan_detail', pk=pk)


@login_required
@require_POST
def loan_complete(request, pk):
    loan = get_object_or_404(LoanApplication, pk=pk)

    if not request.user.profile.is_collection_clerk():
        messages.error(request, '您没有权限执行此操作')
        return redirect('loans:loan_detail', pk=pk)

    if loan.status != 'inspection_done':
        messages.error(request, '当前状态不能完成')
        return redirect('loans:loan_detail', pk=pk)

    old_status = loan.status
    loan.status = 'completed'
    loan.save()

    loan.exhibit.status = 'in_storage'
    loan.exhibit.save()

    _add_status_history(loan, old_status, 'completed', request.user, '出借流程完成')
    messages.success(request, '出借流程已完成')

    return redirect('loans:loan_detail', pk=pk)


@login_required
def exhibit_list(request):
    exhibits = Exhibit.objects.all()
    context = {'exhibits': exhibits}
    return render(request, 'loans/exhibit_list.html', context)


@login_required
def borrower_list(request):
    borrowers = Borrower.objects.all()
    context = {'borrowers': borrowers}
    return render(request, 'loans/borrower_list.html', context)


@login_required
def statistics(request):
    total_loans = LoanApplication.objects.count()
    completed_loans = LoanApplication.objects.filter(status='completed').count()
    anomaly_count = EnvironmentData.objects.filter(is_anomaly=True).count()
    damage_count = ReturnInspection.objects.filter(
        condition__in=['minor_damage', 'major_damage']
    ).count()

    stats_by_level = LoanApplication.objects.values(
        'exhibit__level'
    ).annotate(
        count=Count('id'),
        anomaly_count=Count('environment_data', filter=Q(environment_data__is_anomaly=True))
    ).order_by('-count')

    level_names = dict(Exhibit.LEVEL_CHOICES)
    level_stats = []
    for item in stats_by_level:
        level_stats.append({
            'level': level_names.get(item['exhibit__level'], item['exhibit__level']),
            'count': item['count'],
            'anomaly_count': item['anomaly_count']
        })

    stats_by_borrower = LoanApplication.objects.values(
        'borrower__name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:10]

    borrower_stats = []
    for item in stats_by_borrower:
        borrower_stats.append({
            'name': item['borrower__name'],
            'count': item['count']
        })

    anomaly_records = EnvironmentData.objects.filter(is_anomaly=True)
    anomaly_counts = {}
    for record in anomaly_records:
        types = record.anomaly_type.split('、')
        for t in types:
            t = t.strip()
            if t:
                anomaly_counts[t] = anomaly_counts.get(t, 0) + 1

    anomaly_list = []
    for atype, count in sorted(anomaly_counts.items(), key=lambda x: -x[1]):
        anomaly_list.append({
            'type': atype,
            'count': count
        })

    anomaly_total = sum(item['count'] for item in anomaly_list)

    completed_loans_with_dates = LoanApplication.objects.filter(
        status='completed',
        actual_start_date__isnull=False,
        actual_end_date__isnull=False
    )

    period_stats = {
        'within_7': 0,
        'within_30': 0,
        'within_90': 0,
        'over_90': 0,
    }

    for loan in completed_loans_with_dates:
        days = (loan.actual_end_date - loan.actual_start_date).days
        if days <= 7:
            period_stats['within_7'] += 1
        elif days <= 30:
            period_stats['within_30'] += 1
        elif days <= 90:
            period_stats['within_90'] += 1
        else:
            period_stats['over_90'] += 1

    context = {
        'total_loans': total_loans,
        'completed_loans': completed_loans,
        'anomaly_count': anomaly_count,
        'damage_count': damage_count,
        'level_stats': level_stats,
        'borrower_stats': borrower_stats,
        'anomaly_stats': anomaly_list,
        'anomaly_total': anomaly_total,
        'period_stats': period_stats,
    }
    return render(request, 'loans/statistics.html', context)
