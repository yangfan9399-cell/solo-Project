from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from .models import (
    DailyInspection, CablewayEquipment, ApprovalNode,
    EvidenceAttachment, BusinessRecord, User, InspectionMetric
)
from .forms import (
    EvidenceUploadForm, BusinessRecordForm,
    ProcessActionForm, ReviewActionForm
)


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('inspection:dashboard')
        else:
            return render(request, 'login.html', {'error': '用户名或密码错误'})
    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('inspection:login')


@login_required
def dashboard(request):
    return render(request, 'dashboard.html')


@login_required
def inspection_list(request):
    status = request.GET.get('status', '')
    abnormal_type = request.GET.get('abnormal_type', '')
    source = request.GET.get('source', '')
    keyword = request.GET.get('keyword', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')

    inspections = DailyInspection.objects.select_related(
        'equipment', 'inspector', 'current_handler'
    ).prefetch_related('metrics', 'nodes')

    if status:
        inspections = inspections.filter(status=status)
    if abnormal_type:
        inspections = inspections.filter(abnormal_type=abnormal_type)
    if source:
        inspections = inspections.filter(source=source)
    if keyword:
        inspections = inspections.filter(
            Q(inspection_no__icontains=keyword) |
            Q(equipment__name__icontains=keyword) |
            Q(summary__icontains=keyword)
        )
    if date_from:
        inspections = inspections.filter(inspection_date__gte=date_from)
    if date_to:
        inspections = inspections.filter(inspection_date__lte=date_to)

    context = {
        'inspections': inspections[:50],
        'status': status,
        'abnormal_type': abnormal_type,
        'source': source,
        'keyword': keyword,
        'date_from': date_from,
        'date_to': date_to,
        'status_choices': DailyInspection.STATUS_CHOICES,
        'abnormal_type_choices': DailyInspection.ABNORMAL_TYPE_CHOICES,
        'source_choices': DailyInspection.SOURCE_CHOICES,
    }
    return render(request, 'inspection_list.html', context)


@login_required
def inspection_detail(request, pk):
    inspection = get_object_or_404(
        DailyInspection.objects.select_related(
            'equipment', 'inspector', 'current_handler'
        ).prefetch_related(
            'metrics', 'nodes__operator', 'evidences', 'business_records'
        ),
        pk=pk
    )
    nodes = inspection.nodes.order_by('created_at')
    metrics = inspection.metrics.all()
    evidences = inspection.evidences.all()
    business_records = inspection.business_records.all()

    context = {
        'inspection': inspection,
        'nodes': nodes,
        'metrics': metrics,
        'evidences': evidences,
        'business_records': business_records,
        'latest_node': nodes.last() if nodes else None,
    }
    return render(request, 'inspection_detail.html', context)


@login_required
def inspection_handle(request, pk):
    inspection = get_object_or_404(DailyInspection, pk=pk)

    if request.method == 'POST':
        return _handle_action(request, inspection)

    nodes = inspection.nodes.order_by('created_at')
    metrics = inspection.metrics.all()
    evidences = inspection.evidences.all()
    business_records = inspection.business_records.all()

    evidence_form = EvidenceUploadForm()
    record_form = BusinessRecordForm()

    is_field_staff = request.user.role == 'field'
    is_supervisor = request.user.role == 'supervisor'

    role_actions = ROLE_ACTION_MATRIX.get(request.user.role, set())
    if inspection.is_archived:
        allowed_actions = role_actions & {'reopen'}
    else:
        status_actions = STATUS_ACTION_MAP.get(inspection.status, set())
        allowed_actions = role_actions & status_actions

    context = {
        'inspection': inspection,
        'nodes': nodes,
        'metrics': metrics,
        'evidences': evidences,
        'business_records': business_records,
        'evidence_form': evidence_form,
        'record_form': record_form,
        'is_field_staff': is_field_staff,
        'is_supervisor': is_supervisor,
        'is_readonly': inspection.is_readonly,
        'allowed_actions': allowed_actions,
    }
    return render(request, 'inspection_handle.html', context)


ROLE_ACTION_MATRIX = {
    'field': {'process', 'submit_review'},
    'supervisor': {'accept', 'approve', 'reject', 'return', 'archive', 'reopen'},
    'admin': {'accept', 'approve', 'reject', 'return', 'archive', 'reopen'},
}

STATUS_ACTION_MAP = {
    'pending': {'accept'},
    'processing': {'process', 'submit_review'},
    'reviewing': {'approve', 'reject', 'return'},
    'approved': {'archive'},
    'rejected': {'archive'},
    'returned': {'process', 'submit_review'},
    'timeout': {'accept', 'process', 'submit_review', 'approve', 'reject', 'return'},
    'archived': {'reopen'},
}


def _validate_action(user, inspection, action):
    if inspection.is_archived and action != 'reopen':
        return False, '记录已归档，仅支持重新处理操作'
    if action not in ROLE_ACTION_MATRIX.get(user.role, set()):
        return False, f'角色 {user.get_role_display()} 无权执行 {action} 操作'
    allowed = STATUS_ACTION_MAP.get(inspection.status, set())
    if action not in allowed:
        return False, f'当前状态 {inspection.get_status_display()} 不允许执行 {action} 操作'
    return True, ''


def _handle_action(request, inspection):
    action = request.POST.get('action', '')
    remarks = request.POST.get('remarks', '')
    basis = request.POST.get('basis', '')

    valid, msg = _validate_action(request.user, inspection, action)
    if not valid:
        if request.headers.get('HX-Request'):
            return JsonResponse({'success': False, 'message': msg}, status=403)
        return JsonResponse({'success': False, 'message': msg}, status=403)

    previous_status = inspection.status
    operator = request.user

    status_map = {
        'accept': 'processing',
        'process': 'processing',
        'submit_review': 'reviewing',
        'approve': 'approved',
        'reject': 'rejected',
        'return': 'returned',
        'archive': 'archived',
        'reopen': 'processing',
        'timeout': 'timeout',
    }

    next_status = status_map.get(action, previous_status)

    snapshot = _build_snapshot(inspection)
    is_key_change = _check_key_change(inspection, request.POST)
    key_change_desc = ''

    if action == 'reject':
        inspection.abnormal_type = request.POST.get('abnormal_type', inspection.abnormal_type)
        if inspection.abnormal_type == 'normal':
            inspection.abnormal_type = 'metric_exceed'
        inspection.block_reason = request.POST.get('block_reason', inspection.block_reason)
        inspection.remediation_path = request.POST.get('remediation_path', inspection.remediation_path)
        key_change_desc = f'异常阻断: {inspection.block_reason[:50]}'

    if action == 'approve':
        inspection.conclusion = request.POST.get('conclusion', inspection.conclusion)
        actual_loss_str = request.POST.get('actual_loss', '')
        if actual_loss_str:
            try:
                inspection.actual_loss = Decimal(actual_loss_str)
            except (InvalidOperation, ValueError):
                pass
        inspection.responsible_party = request.POST.get('responsible_party', inspection.responsible_party)

    if action == 'archive':
        inspection.is_archived = True
        inspection.archived_at = timezone.now()

    if action == 'reopen':
        inspection.is_archived = False
        inspection.archived_at = None
        inspection.status = 'processing'

    if is_key_change:
        key_change_desc = _build_key_change_desc(inspection, request.POST)

    inspection.status = next_status
    inspection.current_handler = _get_next_handler(action, request.user, inspection)
    inspection.updated_at = timezone.now()

    if action == 'submit_review' and not inspection.submitted_at:
        inspection.submitted_at = timezone.now()
    if action in ('approve', 'reject') and not inspection.reviewed_at:
        inspection.reviewed_at = timezone.now()

    inspection.save()

    node = ApprovalNode.objects.create(
        inspection=inspection,
        action=action,
        operator=operator,
        previous_status=previous_status,
        next_status=next_status,
        remarks=remarks,
        basis=basis,
        snapshot=snapshot,
        is_key_change=is_key_change,
        key_change_desc=key_change_desc,
        action_time=timezone.now(),
    )

    if request.headers.get('HX-Request'):
        role_actions = ROLE_ACTION_MATRIX.get(request.user.role, set())
        if inspection.is_archived:
            allowed = role_actions & {'reopen'}
        else:
            status_actions = STATUS_ACTION_MAP.get(inspection.status, set())
            allowed = role_actions & status_actions
        context = {
            'inspection': inspection,
            'nodes': inspection.nodes.order_by('created_at'),
            'metrics': inspection.metrics.all(),
            'evidences': inspection.evidences.all(),
            'business_records': inspection.business_records.all(),
            'latest_node': node,
            'is_field_staff': request.user.role == 'field',
            'is_supervisor': request.user.role == 'supervisor',
            'is_readonly': inspection.is_readonly,
            'allowed_actions': allowed,
        }
        return render(request, 'partials/inspection_handle_content.html', context)

    return redirect('inspection:detail', pk=inspection.pk)


def _build_snapshot(inspection):
    metrics_data = list(inspection.metrics.values(
        'metric_name', 'standard_value', 'measured_value', 'is_abnormal', 'abnormal_desc'
    ))
    return {
        'status': inspection.status,
        'summary': inspection.summary,
        'conclusion': inspection.conclusion,
        'block_reason': inspection.block_reason,
        'remediation_path': inspection.remediation_path,
        'estimated_loss': str(inspection.estimated_loss),
        'actual_loss': str(inspection.actual_loss) if inspection.actual_loss else None,
        'responsible_party': inspection.responsible_party,
        'metrics_count': len(metrics_data),
        'abnormal_metrics_count': sum(1 for m in metrics_data if m['is_abnormal']),
        'metrics': metrics_data,
    }


def _check_key_change(inspection, post_data):
    if post_data.get('actual_loss') and str(inspection.actual_loss or '') != post_data.get('actual_loss', ''):
        return True
    if post_data.get('responsible_party') and inspection.responsible_party != post_data.get('responsible_party', ''):
        return True
    if post_data.get('conclusion') and inspection.conclusion != post_data.get('conclusion', ''):
        return True
    return False


def _build_key_change_desc(inspection, post_data):
    changes = []
    if post_data.get('actual_loss') and str(inspection.actual_loss or '') != post_data.get('actual_loss', ''):
        changes.append(f'金额变更: {inspection.actual_loss} → {post_data["actual_loss"]}')
    if post_data.get('responsible_party') and inspection.responsible_party != post_data.get('responsible_party', ''):
        changes.append(f'责任对象变更: {inspection.responsible_party} → {post_data["responsible_party"]}')
    return '; '.join(changes)


def _get_next_handler(action, current_user, inspection):
    if action in ('submit_review',):
        supervisors = User.objects.filter(role='supervisor', is_active=True)
        return supervisors.first() if supervisors.exists() else current_user
    if action == 'return':
        return inspection.inspector
    if action in ('approve', 'reject', 'archive'):
        return None
    return current_user


@login_required
def review_board(request):
    return render(request, 'review_board.html')


@login_required
def api_stats(request):
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    total = DailyInspection.objects.count()
    status_stats = DailyInspection.objects.values('status').annotate(count=Count('id'))
    abnormal_stats = DailyInspection.objects.filter(
        abnormal_type__in=['metric_exceed', 'evidence_missing', 'approval_timeout']
    ).values('abnormal_type').annotate(count=Count('id'))

    status_map = dict(DailyInspection.STATUS_CHOICES)
    abnormal_map = dict(DailyInspection.ABNORMAL_TYPE_CHOICES)

    status_data = [
        {'status': s['status'], 'label': status_map.get(s['status'], s['status']), 'count': s['count']}
        for s in status_stats
    ]

    abnormal_data = [
        {'type': a['abnormal_type'], 'label': abnormal_map.get(a['abnormal_type'], a['abnormal_type']), 'count': a['count']}
        for a in abnormal_stats
    ]

    loss_stats = DailyInspection.objects.aggregate(
        total_estimated=Sum('estimated_loss'),
        total_actual=Sum('actual_loss'),
    )

    monthly_data = []
    for i in range(30):
        day = now - timedelta(days=29 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        day_count = DailyInspection.objects.filter(
            created_at__gte=day_start, created_at__lte=day_end
        ).count()
        abnormal_count = DailyInspection.objects.filter(
            created_at__gte=day_start, created_at__lte=day_end,
            abnormal_type__in=['metric_exceed', 'evidence_missing', 'approval_timeout']
        ).count()
        monthly_data.append({
            'date': day.strftime('%m-%d'),
            'total': day_count,
            'abnormal': abnormal_count,
        })

    equipment_stats = DailyInspection.objects.values(
        'equipment__equipment_no', 'equipment__name'
    ).annotate(
        total=Count('id'),
        abnormal=Count('id', filter=Q(abnormal_type__in=['metric_exceed', 'evidence_missing', 'approval_timeout']))
    ).order_by('-abnormal')[:10]

    return JsonResponse({
        'total': total,
        'status_data': status_data,
        'abnormal_data': abnormal_data,
        'loss_stats': {
            'total_estimated': str(loss_stats['total_estimated'] or 0),
            'total_actual': str(loss_stats['total_actual'] or 0),
        },
        'monthly_data': monthly_data,
        'equipment_stats': list(equipment_stats),
    })


@login_required
def api_record_metrics(request, pk):
    inspection = get_object_or_404(DailyInspection, pk=pk)
    metrics = inspection.metrics.all()
    data = [
        {
            'id': m.id,
            'metric_name': m.metric_name,
            'category': m.get_category_display(),
            'standard_value': m.standard_value,
            'measured_value': m.measured_value,
            'unit': m.unit,
            'is_abnormal': m.is_abnormal,
            'abnormal_desc': m.abnormal_desc,
        }
        for m in metrics
    ]
    return JsonResponse({'metrics': data})


@login_required
def api_record_timeline(request, pk):
    inspection = get_object_or_404(DailyInspection, pk=pk)
    nodes = inspection.nodes.select_related('operator').order_by('created_at')
    data = [
        {
            'id': n.id,
            'node_no': n.node_no,
            'action': n.action,
            'action_label': n.get_action_display(),
            'action_time': n.action_time.strftime('%Y-%m-%d %H:%M:%S'),
            'operator': n.operator.username,
            'operator_role': n.operator.get_role_display(),
            'previous_status': n.previous_status,
            'next_status': n.next_status,
            'remarks': n.remarks,
            'basis': n.basis,
            'is_key_change': n.is_key_change,
            'key_change_desc': n.key_change_desc,
        }
        for n in nodes
    ]
    return JsonResponse({'nodes': data})


@login_required
def api_record_action(request, pk):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持POST请求'}, status=405)

    inspection = get_object_or_404(DailyInspection, pk=pk)
    return _handle_action(request, inspection)


@login_required
def api_upload_evidence(request, pk):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持POST请求'}, status=405)

    if request.user.role != 'field':
        return JsonResponse({'success': False, 'message': '仅现场人员可上传证据附件，主管复核人负责审批决策'}, status=403)

    inspection = get_object_or_404(DailyInspection, pk=pk)
    if inspection.is_readonly:
        return JsonResponse({'success': False, 'message': '记录已归档，无法上传证据'}, status=400)

    form = EvidenceUploadForm(request.POST, request.FILES)
    if form.is_valid():
        evidence = form.save(commit=False)
        evidence.inspection = inspection
        evidence.uploaded_by = request.user

        latest_node = inspection.nodes.order_by('-created_at').first()
        if latest_node and latest_node.action in ('process', 'return'):
            evidence.node = latest_node

        evidence.save()

        if request.headers.get('HX-Request'):
            return render(request, 'partials/evidence_list.html', {'evidences': inspection.evidences.all()})

        return JsonResponse({'success': True, 'evidence_id': evidence.id})

    return JsonResponse({'success': False, 'errors': form.errors}, status=400)


@login_required
def api_add_business_record(request, pk):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': '仅支持POST请求'}, status=405)

    if request.user.role != 'field':
        return JsonResponse({'success': False, 'message': '仅现场人员可添加业务记录，主管复核人负责审批决策'}, status=403)

    inspection = get_object_or_404(DailyInspection, pk=pk)
    if inspection.is_readonly:
        return JsonResponse({'success': False, 'message': '记录已归档，无法添加记录'}, status=400)

    form = BusinessRecordForm(request.POST)
    if form.is_valid():
        record = form.save(commit=False)
        record.inspection = inspection
        record.recorded_by = request.user

        latest_node = inspection.nodes.order_by('-created_at').first()
        if latest_node:
            record.node = latest_node

        record.save()

        if request.headers.get('HX-Request'):
            return render(request, 'partials/business_record_list.html', {'business_records': inspection.business_records.all()})

        return JsonResponse({'success': True, 'record_id': record.id})

    return JsonResponse({'success': False, 'errors': form.errors}, status=400)
