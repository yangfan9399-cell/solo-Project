from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    Procurement, ProcurementStatus, ExceptionReason, Role,
    ResearchProject, ProjectBudget, College, Supplier,
    Acceptance, Invoice, HistoryNode, add_history_node, User
)
from .forms import ProcurementForm, AcceptanceForm, InvoiceForm


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('dashboard')
        messages.error(request, '用户名或密码错误')
    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def dashboard(request):
    user = request.user
    total_count = Procurement.objects.count()
    pending_count = Procurement.objects.filter(
        status__in=[ProcurementStatus.SUBMITTED, ProcurementStatus.BUDGET_FROZEN, ProcurementStatus.FINANCE_REVIEW]
    ).count()
    exception_count = Procurement.objects.exclude(exception_reason=ExceptionReason.NONE).count()
    reimbursed_count = Procurement.objects.filter(status=ProcurementStatus.REIMBURSED).count()

    avg_duration = None
    reimbursed = Procurement.objects.filter(
        status=ProcurementStatus.REIMBURSED,
        submitted_at__isnull=False,
        reimbursed_at__isnull=False
    )
    if reimbursed.exists():
        durations = [(p.reimbursed_at - p.submitted_at).days for p in reimbursed]
        if durations:
            avg_duration = round(sum(durations) / len(durations), 1)

    my_procurements = Procurement.objects.all()[:5]
    if user.role == Role.RESEARCHER:
        my_procurements = Procurement.objects.filter(applicant=user)[:5]
    elif user.role == Role.COLLEGE_ADMIN:
        if user.college:
            my_procurements = Procurement.objects.filter(
                project__college=user.college,
                status__in=[ProcurementStatus.SUBMITTED, ProcurementStatus.BUDGET_FROZEN]
            )[:5]
    elif user.role == Role.ASSET_STAFF:
        my_procurements = Procurement.objects.filter(
            status=ProcurementStatus.BUDGET_FROZEN
        )[:5]
    elif user.role == Role.FINANCE_STAFF:
        my_procurements = Procurement.objects.filter(
            status=ProcurementStatus.FINANCE_REVIEW
        )[:5]

    context = {
        'total_count': total_count,
        'pending_count': pending_count,
        'exception_count': exception_count,
        'reimbursed_count': reimbursed_count,
        'avg_duration': avg_duration,
        'my_procurements': my_procurements,
    }
    return render(request, 'dashboard.html', context)


@login_required
def procurement_list(request):
    status = request.GET.get('status', '')
    exception = request.GET.get('exception', '')
    college_id = request.GET.get('college', '')
    search = request.GET.get('search', '')

    procurements = Procurement.objects.all()

    if status:
        procurements = procurements.filter(status=status)
    if exception:
        procurements = procurements.filter(exception_reason=exception)
    if college_id:
        procurements = procurements.filter(project__college_id=college_id)
    if search:
        procurements = procurements.filter(
            Q(title__icontains=search) |
            Q(procurement_no__icontains=search) |
            Q(project__name__icontains=search)
        )

    if request.user.role == Role.RESEARCHER:
        procurements = procurements.filter(applicant=request.user)
    elif request.user.role == Role.COLLEGE_ADMIN and request.user.college:
        procurements = procurements.filter(project__college=request.user.college)

    colleges = College.objects.all()

    if request.headers.get('HX-Request'):
        return render(request, 'partials/procurement_list.html', {
            'procurements': procurements,
            'colleges': colleges,
        })

    context = {
        'procurements': procurements,
        'colleges': colleges,
        'status_choices': ProcurementStatus.choices,
        'exception_choices': ExceptionReason.choices,
        'selected_status': status,
        'selected_exception': exception,
        'selected_college': college_id,
        'search': search,
    }
    return render(request, 'procurement_list.html', context)


@login_required
def procurement_detail(request, pk):
    procurement = get_object_or_404(Procurement, pk=pk)
    history_nodes = procurement.history_nodes.order_by('created_at')
    context = {
        'procurement': procurement,
        'history_nodes': history_nodes,
    }
    return render(request, 'procurement_detail.html', context)


@login_required
def procurement_create(request):
    if request.method == 'POST':
        form = ProcurementForm(request.POST, user=request.user)
        if form.is_valid():
            with transaction.atomic():
                procurement = form.save(commit=False)
                procurement.applicant = request.user
                import uuid
                procurement.procurement_no = f'CG{timezone.now().strftime("%Y%m%d")}{uuid.uuid4().hex[:6].upper()}'
                procurement.save()
                add_history_node(procurement, ProcurementStatus.DRAFT, request.user, '创建采购申请')
                messages.success(request, '采购申请创建成功')
                return redirect('procurement_detail', pk=procurement.pk)
    else:
        form = ProcurementForm(user=request.user)
    return render(request, 'procurement_form.html', {'form': form, 'title': '新建采购申请'})


@login_required
def procurement_submit(request, pk):
    procurement = get_object_or_404(Procurement, pk=pk)
    if procurement.status != ProcurementStatus.DRAFT:
        messages.error(request, '当前状态不可提交')
        return redirect('procurement_detail', pk=pk)

    try:
        budget = ProjectBudget.objects.get(project=procurement.project, subject=procurement.budget_subject)
    except ProjectBudget.DoesNotExist:
        messages.error(request, '该课题下无对应预算科目')
        return redirect('procurement_detail', pk=pk)

    if budget.available_amount < procurement.amount:
        procurement.exception_reason = ExceptionReason.BUDGET_INSUFFICIENT
        procurement.exception_note = f'预算不足：需要 {procurement.amount} 元，可用 {budget.available_amount} 元'
        procurement.save()
        add_history_node(procurement, procurement.status, request.user, '提交失败-预算不足', procurement.exception_note)
        messages.error(request, f'预算不足！可用预算：{budget.available_amount} 元，申请金额：{procurement.amount} 元')
        return redirect('procurement_detail', pk=pk)

    with transaction.atomic():
        procurement.status = ProcurementStatus.SUBMITTED
        procurement.submitted_at = timezone.now()
        procurement.exception_reason = ExceptionReason.NONE
        procurement.exception_note = ''
        procurement.save()
        add_history_node(procurement, ProcurementStatus.SUBMITTED, request.user, '提交采购申请', '提交至学院管理员审核冻结预算')
        messages.success(request, '采购申请已提交，等待学院管理员审核冻结预算')

    if request.headers.get('HX-Request'):
        return render(request, 'partials/procurement_status_badge.html', {'procurement': procurement})
    return redirect('procurement_detail', pk=pk)


@login_required
def budget_freeze(request, pk):
    if request.user.role not in [Role.COLLEGE_ADMIN, Role.FINANCE_STAFF]:
        messages.error(request, '无权限执行此操作')
        return redirect('procurement_detail', pk=pk)

    procurement = get_object_or_404(Procurement, pk=pk)
    if procurement.status != ProcurementStatus.SUBMITTED:
        messages.error(request, '当前状态不可冻结预算')
        return redirect('procurement_detail', pk=pk)

    try:
        budget = ProjectBudget.objects.get(project=procurement.project, subject=procurement.budget_subject)
    except ProjectBudget.DoesNotExist:
        messages.error(request, '该课题下无对应预算科目')
        return redirect('procurement_detail', pk=pk)

    if budget.available_amount < procurement.amount:
        messages.error(request, f'预算不足！可用预算：{budget.available_amount} 元，申请金额：{procurement.amount} 元')
        return redirect('procurement_detail', pk=pk)

    with transaction.atomic():
        budget.frozen_amount += procurement.amount
        budget.save()

        procurement.status = ProcurementStatus.BUDGET_FROZEN
        procurement.budget_frozen_at = timezone.now()
        procurement.save()
        add_history_node(procurement, ProcurementStatus.BUDGET_FROZEN, request.user, '冻结预算', f'冻结{procurement.budget_subject.name}预算 {procurement.amount} 元')
        messages.success(request, '预算已冻结')

    if request.headers.get('HX-Request'):
        return render(request, 'partials/procurement_status_badge.html', {'procurement': procurement})
    return redirect('procurement_detail', pk=pk)


@login_required
def acceptance_create(request, pk):
    if request.user.role != Role.ASSET_STAFF:
        messages.error(request, '无权限执行此操作')
        return redirect('procurement_detail', pk=pk)

    procurement = get_object_or_404(Procurement, pk=pk)
    if procurement.status != ProcurementStatus.BUDGET_FROZEN:
        messages.error(request, '当前状态不可验收')
        return redirect('procurement_detail', pk=pk)

    if hasattr(procurement, 'acceptance'):
        return redirect('acceptance_detail', pk=procurement.acceptance.pk)

    if request.method == 'POST':
        form = AcceptanceForm(request.POST)
        if form.is_valid():
            with transaction.atomic():
                acceptance = form.save(commit=False)
                acceptance.procurement = procurement
                acceptance.asset_staff = request.user
                acceptance.save()

                if acceptance.passed:
                    procurement.status = ProcurementStatus.ACCEPTED
                    procurement.accepted_at = timezone.now()
                    procurement.save()
                    add_history_node(procurement, ProcurementStatus.ACCEPTED, request.user, '设备验收通过')
                    messages.success(request, '设备验收通过')
                else:
                    procurement.exception_reason = ExceptionReason.PARAMETER_MISMATCH
                    procurement.exception_note = acceptance.remarks or '设备参数不符合要求'
                    procurement.status = ProcurementStatus.REJECTED
                    procurement.save()

                    budget = ProjectBudget.objects.get(project=procurement.project, subject=procurement.budget_subject)
                    budget.frozen_amount -= procurement.amount
                    budget.save()

                    add_history_node(procurement, ProcurementStatus.REJECTED, request.user, '设备验收未通过', acceptance.remarks)
                    messages.warning(request, '设备验收未通过，预算已解冻')

                return redirect('procurement_detail', pk=pk)
    else:
        form = AcceptanceForm()

    context = {
        'form': form,
        'procurement': procurement,
        'title': '设备验收',
    }
    return render(request, 'acceptance_form.html', context)


@login_required
def invoice_create(request, pk):
    if request.user.role != Role.RESEARCHER:
        messages.error(request, '无权限执行此操作')
        return redirect('procurement_detail', pk=pk)

    procurement = get_object_or_404(Procurement, pk=pk)
    if procurement.status != ProcurementStatus.ACCEPTED:
        messages.error(request, '当前状态不可提交发票')
        return redirect('procurement_detail', pk=pk)

    if hasattr(procurement, 'invoice'):
        return redirect('invoice_detail', pk=procurement.invoice.pk)

    if request.method == 'POST':
        form = InvoiceForm(request.POST)
        if form.is_valid():
            with transaction.atomic():
                invoice = form.save(commit=False)
                invoice.procurement = procurement
                invoice.save()

                procurement.status = ProcurementStatus.FINANCE_REVIEW
                procurement.save()
                add_history_node(procurement, ProcurementStatus.FINANCE_REVIEW, request.user, '提交发票，进入财务复核')
                messages.success(request, '发票已提交，等待财务复核')

                return redirect('procurement_detail', pk=pk)
    else:
        form = InvoiceForm()

    context = {
        'form': form,
        'procurement': procurement,
        'title': '提交发票',
    }
    return render(request, 'invoice_form.html', context)


@login_required
def invoice_verify(request, pk):
    if request.user.role != Role.FINANCE_STAFF:
        messages.error(request, '无权限执行此操作')
        return redirect('procurement_detail', pk=pk)

    procurement = get_object_or_404(Procurement, pk=pk)
    if procurement.status != ProcurementStatus.FINANCE_REVIEW or not hasattr(procurement, 'invoice'):
        messages.error(request, '当前状态不可复核')
        return redirect('procurement_detail', pk=pk)

    passed = request.POST.get('passed') == 'true'
    note = request.POST.get('note', '')
    correct_title = request.POST.get('correct_title', '')

    with transaction.atomic():
        invoice = procurement.invoice
        invoice.finance_staff = request.user
        invoice.verification_note = note

        if passed:
            invoice.verified = True
            invoice.save()

            budget = ProjectBudget.objects.get(project=procurement.project, subject=procurement.budget_subject)
            budget.frozen_amount -= procurement.amount
            budget.used_amount += procurement.amount
            budget.save()

            procurement.status = ProcurementStatus.REIMBURSED
            procurement.reimbursed_at = timezone.now()
            procurement.save()
            add_history_node(procurement, ProcurementStatus.REIMBURSED, request.user, '财务复核通过，经费已核销')
            messages.success(request, '财务复核通过，经费已核销')
        else:
            invoice.verified = False
            invoice.save()
            procurement.exception_reason = ExceptionReason.INVOICE_TITLE_ERROR
            procurement.exception_note = f'发票抬头错误。{note}'
            if correct_title:
                procurement.exception_note += f'正确抬头应为：{correct_title}'
            procurement.save()
            add_history_node(procurement, procurement.status, request.user, '财务复核未通过-发票抬头错误', procurement.exception_note)
            messages.warning(request, '财务复核未通过，发票抬头有误')

    if request.headers.get('HX-Request'):
        return render(request, 'partials/procurement_status_badge.html', {'procurement': procurement})
    return redirect('procurement_detail', pk=pk)


@login_required
def kanban(request):
    by_college = Procurement.objects.values(
        'project__college__name'
    ).annotate(
        count=Count('id'),
        total_amount=Sum('amount')
    ).order_by('-count')

    by_project = Procurement.objects.values(
        'project__project_no', 'project__name'
    ).annotate(
        count=Count('id'),
        total_amount=Sum('amount')
    ).order_by('-count')[:10]

    by_exception = Procurement.objects.exclude(
        exception_reason=ExceptionReason.NONE
    ).values(
        'exception_reason'
    ).annotate(
        count=Count('id')
    ).order_by('-count')

    reimbursed_procurements = Procurement.objects.filter(
        status=ProcurementStatus.REIMBURSED,
        submitted_at__isnull=False,
        reimbursed_at__isnull=False
    )
    duration_data = []
    if reimbursed_procurements.exists():
        duration_ranges = [
            ('0-3天', 0, 3),
            ('4-7天', 4, 7),
            ('8-15天', 8, 15),
            ('16-30天', 16, 30),
            ('30天以上', 31, 9999),
        ]
        for label, min_d, max_d in duration_ranges:
            count = sum(
                1 for p in reimbursed_procurements
                if min_d <= (p.reimbursed_at - p.submitted_at).days <= max_d
            )
            duration_data.append({'label': label, 'count': count})

    status_dict = {s[0]: s[1] for s in ProcurementStatus.choices}
    status_raw = Procurement.objects.values('status').annotate(
        count=Count('id')
    )
    status_data = []
    for stat in status_raw:
        status_data.append({
            'label': status_dict.get(stat['status'], stat['status']),
            'count': stat['count'],
            'value': stat['status'],
        })
    status_data.sort(key=lambda x: -x['count'])
    max_status_count = max((item['count'] for item in status_data), default=1)

    exception_dict = {e[0]: e[1] for e in ExceptionReason.choices}
    exception_data = []
    for exc in by_exception:
        exception_data.append({
            'label': exception_dict.get(exc['exception_reason'], exc['exception_reason']),
            'count': exc['count'],
            'value': exc['exception_reason'],
        })
    max_exception_count = max((item['count'] for item in exception_data), default=1)

    avg_duration = None
    if reimbursed_procurements.exists():
        durations = [(p.reimbursed_at - p.submitted_at).days for p in reimbursed_procurements]
        avg_duration = round(sum(durations) / len(durations), 1)

    context = {
        'by_college': by_college,
        'by_project': by_project,
        'by_exception': by_exception,
        'exception_data': exception_data,
        'max_exception_count': max_exception_count,
        'duration_data': duration_data,
        'status_data': status_data,
        'max_status_count': max_status_count,
        'avg_duration': avg_duration,
        'total_procurement': Procurement.objects.count(),
        'total_amount': Procurement.objects.aggregate(total=Sum('amount'))['total'] or 0,
    }
    return render(request, 'kanban.html', context)


@login_required
def supplier_list(request):
    suppliers = Supplier.objects.all()
    search = request.GET.get('search', '')
    if search:
        suppliers = suppliers.filter(
            Q(name__icontains=search) | Q(tax_no__icontains=search)
        )
    return render(request, 'supplier_list.html', {'suppliers': suppliers, 'search': search})


@login_required
def project_list(request):
    projects = ResearchProject.objects.all()
    if request.user.role == Role.RESEARCHER:
        projects = projects.filter(principal=request.user)
    elif request.user.role == Role.COLLEGE_ADMIN and request.user.college:
        projects = projects.filter(college=request.user.college)
    return render(request, 'project_list.html', {'projects': projects})
