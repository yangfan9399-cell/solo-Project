from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import AccessRecoveryRecord, ProcessingNode, EvidenceAttachment, FieldChangeLog, AnomalyBlockRecord
from .forms import (
    RecordProcessForm, EvidenceUploadForm, RecordFilterForm,
    ReviewRejectForm, ReopenForm, DashboardFilterForm
)
from .services import WorkflowService
from accounts.models import User


@login_required
def dashboard(request):
    filter_form = DashboardFilterForm(request.GET or None)
    filters = {}

    if filter_form.is_valid():
        period = filter_form.cleaned_data.get('period')
        today = timezone.now().date()

        if period == 'today':
            filters['start_date'] = today
            filters['end_date'] = today
        elif period == 'week':
            filters['start_date'] = today - timedelta(days=today.weekday())
            filters['end_date'] = filters['start_date'] + timedelta(days=6)
        elif period == 'month':
            filters['start_date'] = today.replace(day=1)
            if filters['start_date'].month == 12:
                filters['end_date'] = filters['start_date'].replace(year=filters['start_date'].year + 1, month=1, day=1) - timedelta(days=1)
            else:
                filters['end_date'] = filters['start_date'].replace(month=filters['start_date'].month + 1, day=1) - timedelta(days=1)
        elif period == 'quarter':
            quarter = (today.month - 1) // 3
            filters['start_date'] = today.replace(month=quarter * 3 + 1, day=1)
            if quarter == 3:
                filters['end_date'] = filters['start_date'].replace(year=filters['start_date'].year + 1, month=1, day=1) - timedelta(days=1)
            else:
                filters['end_date'] = filters['start_date'].replace(month=quarter * 3 + 4, day=1) - timedelta(days=1)
        elif period == 'year':
            filters['start_date'] = today.replace(month=1, day=1)
            filters['end_date'] = today.replace(month=12, day=31)

        if filter_form.cleaned_data.get('start_date'):
            filters['start_date'] = filter_form.cleaned_data['start_date']
        if filter_form.cleaned_data.get('end_date'):
            filters['end_date'] = filter_form.cleaned_data['end_date']
        if filter_form.cleaned_data.get('sample_type'):
            filters['sample_type'] = filter_form.cleaned_data['sample_type']
        if filter_form.cleaned_data.get('status'):
            filters['status'] = filter_form.cleaned_data['status']

    stats = WorkflowService.get_dashboard_stats(filters)

    recent_records = AccessRecoveryRecord.objects.all()[:10]
    recent_summaries = [WorkflowService.get_record_summary(r) for r in recent_records]

    context = {
        'stats': stats,
        'filter_form': filter_form,
        'recent_records': recent_summaries,
        'filters': json.dumps(filters),
    }

    if request.htmx:
        return render(request, 'access_control/partials/dashboard_stats.html', context)

    return render(request, 'access_control/dashboard.html', context)


@login_required
def record_list(request):
    filter_form = RecordFilterForm(request.GET or None)
    queryset = AccessRecoveryRecord.objects.all().select_related('current_owner', 'accepted_by', 'processed_by')

    if filter_form.is_valid():
        status = filter_form.cleaned_data.get('status')
        sample_type = filter_form.cleaned_data.get('sample_type')
        source = filter_form.cleaned_data.get('source')
        risk_level = filter_form.cleaned_data.get('risk_level')
        keyword = filter_form.cleaned_data.get('keyword')
        start_date = filter_form.cleaned_data.get('start_date')
        end_date = filter_form.cleaned_data.get('end_date')
        only_overdue = filter_form.cleaned_data.get('only_overdue')
        only_blocked = filter_form.cleaned_data.get('only_blocked')

        if status:
            queryset = queryset.filter(status=status)
        if sample_type:
            queryset = queryset.filter(sample_type=sample_type)
        if source:
            queryset = queryset.filter(source=source)
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)
        if keyword:
            queryset = queryset.filter(
                Q(record_no__icontains=keyword) |
                Q(title__icontains=keyword) |
                Q(applicant_name__icontains=keyword) |
                Q(lab_name__icontains=keyword)
            )
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        if only_overdue:
            queryset = queryset.filter(deadline__lt=timezone.now(), is_archived=False)
        if only_blocked:
            queryset = queryset.filter(is_blocked=True)

    if request.user.is_field_staff:
        queryset = queryset.filter(Q(current_owner=request.user) | Q(status=AccessRecoveryRecord.Status.REJECTED, processed_by=request.user))
    elif request.user.is_reviewer:
        pass

    records = queryset.order_by('-created_at')
    summaries = [WorkflowService.get_record_summary(r) for r in records]

    context = {
        'records': summaries,
        'filter_form': filter_form,
        'total_count': records.count(),
    }

    if request.htmx:
        return render(request, 'access_control/partials/record_list.html', context)

    return render(request, 'access_control/record_list.html', context)


@login_required
def record_detail(request, pk):
    record = get_object_or_404(AccessRecoveryRecord.objects.prefetch_related(
        'nodes__operator', 'evidences', 'change_logs__changed_by', 'anomaly_blocks'
    ), pk=pk)

    summary = WorkflowService.get_record_summary(record)
    nodes = record.nodes.all().order_by('sequence', 'created_at')
    evidences = record.evidences.filter(is_valid=True)
    change_logs = record.change_logs.all()
    anomalies = record.anomaly_blocks.all()

    diff_display = []
    if record.snapshot_before and record.snapshot_after:
        for key in WorkflowService.KEY_FIELD_LABELS.keys():
            old_val = record.snapshot_before.get(key, '')
            new_val = record.snapshot_after.get(key, '')
            if str(old_val) != str(new_val):
                diff_display.append({
                    'label': WorkflowService.KEY_FIELD_LABELS.get(key, key),
                    'old': old_val,
                    'new': new_val,
                    'field': key
                })

    process_form = RecordProcessForm(record=record, user=request.user)
    evidence_form = EvidenceUploadForm()
    reject_form = ReviewRejectForm()
    reopen_form = ReopenForm()

    can_edit = record.can_edit(request.user)
    can_archive = record.can_archive(request.user)
    can_submit_review = (record.status == AccessRecoveryRecord.Status.PROCESSING and
                        request.user.is_field_staff and
                        not record.is_archived)
    can_reopen = (record.is_archived and
                  (request.user.is_reviewer or request.user.is_admin or request.user.is_superuser))

    context = {
        'record': record,
        'summary': summary,
        'nodes': nodes,
        'evidences': evidences,
        'change_logs': change_logs,
        'anomalies': anomalies,
        'diff_display': diff_display,
        'process_form': process_form,
        'evidence_form': evidence_form,
        'reject_form': reject_form,
        'reopen_form': reopen_form,
        'can_edit': can_edit,
        'can_archive': can_archive,
        'can_submit_review': can_submit_review,
        'can_reopen': can_reopen,
    }

    if request.htmx:
        return render(request, 'access_control/partials/record_detail_content.html', context)

    return render(request, 'access_control/record_detail.html', context)


@login_required
def processing_desk(request):
    my_pending_records = []
    my_processing_records = []
    my_rejected_records = []

    if request.user.is_field_staff:
        my_pending_records = AccessRecoveryRecord.objects.filter(
            status=AccessRecoveryRecord.Status.PENDING_ACCEPT
        ).order_by('-created_at')
        my_processing_records = AccessRecoveryRecord.objects.filter(
            Q(current_owner=request.user),
            status__in=[AccessRecoveryRecord.Status.ACCEPTED,
                       AccessRecoveryRecord.Status.PROCESSING]
        ).order_by('-created_at')
        my_rejected_records = AccessRecoveryRecord.objects.filter(
            Q(processed_by=request.user),
            status=AccessRecoveryRecord.Status.REJECTED
        ).order_by('-created_at')
    elif request.user.is_reviewer:
        my_processing_records = AccessRecoveryRecord.objects.filter(
            status__in=[AccessRecoveryRecord.Status.PROCESSING, AccessRecoveryRecord.Status.REVIEWING]
        ).order_by('-created_at')

    my_pending_summaries = [WorkflowService.get_record_summary(r) for r in my_pending_records]
    my_processing_summaries = [WorkflowService.get_record_summary(r) for r in my_processing_records]
    my_rejected_summaries = []
    for r in my_rejected_records:
        summary = WorkflowService.get_record_summary(r)
        reject_node = r.nodes.filter(node_type='review_reject').order_by('-created_at').first()
        if reject_node:
            summary['latest_reject_reason'] = reject_node.description
        my_rejected_summaries.append(summary)

    record_id = request.GET.get('record_id')
    if request.htmx and record_id:
        return record_detail(request, int(record_id))

    context = {
        'my_pending_records': my_pending_summaries,
        'my_processing_records': my_processing_summaries,
        'my_rejected_records': my_rejected_summaries,
    }

    return render(request, 'access_control/processing_desk.html', context)


@login_required
def review_page(request):
    if not request.user.is_reviewer and not request.user.is_admin and not request.user.is_superuser:
        messages.error(request, '您没有权限访问复核页面')
        return redirect('record_list')

    pending_review_records = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.REVIEWING
    ).order_by('-created_at')

    approved_records = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.ARCHIVED,
        reviewed_by=request.user
    ).order_by('-reviewed_at')[:20]

    rejected_records = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.REJECTED
    ).order_by('-updated_at')[:20]

    pending_summaries = []
    for r in pending_review_records:
        summary = WorkflowService.get_record_summary(r)
        submit_node = r.nodes.filter(node_type='submit_review').order_by('-created_at').first()
        if submit_node:
            summary['submitted_at'] = submit_node.created_at
        if r.processed_by:
            summary['processed_by_name'] = r.processed_by.get_full_name()
        pending_summaries.append(summary)

    approved_summaries = []
    for r in approved_records:
        summary = WorkflowService.get_record_summary(r)
        summary['reviewed_at'] = r.reviewed_at
        approved_summaries.append(summary)

    rejected_summaries = []
    for r in rejected_records:
        summary = WorkflowService.get_record_summary(r)
        reject_node = r.nodes.filter(node_type='review_reject').order_by('-created_at').first()
        if reject_node:
            summary['rejected_at'] = reject_node.created_at
            summary['latest_reject_reason'] = reject_node.description
        rejected_summaries.append(summary)

    record_id = request.GET.get('record_id')
    if request.htmx and record_id:
        return record_detail(request, int(record_id))

    context = {
        'pending_review_records': pending_summaries,
        'approved_records': approved_summaries,
        'rejected_records': rejected_summaries,
    }

    return render(request, 'access_control/review_page.html', context)


@login_required
def analytics_page(request):
    filter_form = DashboardFilterForm(request.GET or None)
    filters = {}

    if filter_form.is_valid():
        period = filter_form.cleaned_data.get('period')
        today = timezone.now().date()

        if period == 'today':
            filters['start_date'] = today
            filters['end_date'] = today
        elif period == 'week':
            filters['start_date'] = today - timedelta(days=today.weekday())
            filters['end_date'] = filters['start_date'] + timedelta(days=6)
        elif period == 'month':
            filters['start_date'] = today.replace(day=1)
            if filters['start_date'].month == 12:
                filters['end_date'] = filters['start_date'].replace(year=filters['start_date'].year + 1, month=1, day=1) - timedelta(days=1)
            else:
                filters['end_date'] = filters['start_date'].replace(month=filters['start_date'].month + 1, day=1) - timedelta(days=1)
        elif period == 'quarter':
            quarter = (today.month - 1) // 3
            filters['start_date'] = today.replace(month=quarter * 3 + 1, day=1)
            if quarter == 3:
                filters['end_date'] = filters['start_date'].replace(year=filters['start_date'].year + 1, month=1, day=1) - timedelta(days=1)
            else:
                filters['end_date'] = filters['start_date'].replace(month=quarter * 3 + 4, day=1) - timedelta(days=1)
        elif period == 'year':
            filters['start_date'] = today.replace(month=1, day=1)
            filters['end_date'] = today.replace(month=12, day=31)

        if filter_form.cleaned_data.get('start_date'):
            filters['start_date'] = filter_form.cleaned_data['start_date']
        if filter_form.cleaned_data.get('end_date'):
            filters['end_date'] = filter_form.cleaned_data['end_date']
        if filter_form.cleaned_data.get('sample_type'):
            filters['sample_type'] = filter_form.cleaned_data['sample_type']
        if filter_form.cleaned_data.get('risk_level'):
            filters['risk_level'] = filter_form.cleaned_data['risk_level']

    base_stats = WorkflowService.get_dashboard_stats(filters)

    queryset = AccessRecoveryRecord.objects.all()
    if 'start_date' in filters and filters['start_date']:
        queryset = queryset.filter(created_at__date__gte=filters['start_date'])
    if 'end_date' in filters and filters['end_date']:
        queryset = queryset.filter(created_at__date__lte=filters['end_date'])
    if 'sample_type' in filters and filters['sample_type']:
        queryset = queryset.filter(sample_type=filters['sample_type'])
    if 'risk_level' in filters and filters['risk_level']:
        queryset = queryset.filter(risk_level=filters['risk_level'])

    total = queryset.count()

    status_colors = {
        'pending_accept': '#ffc107',
        'accepted': '#0dcaf0',
        'processing': '#0d6efd',
        'reviewing': '#6c757d',
        'rejected': '#dc3545',
        'archived': '#198754',
    }

    status_labels = dict(AccessRecoveryRecord.Status.choices)
    status_chart_data = {
        'labels': [status_labels.get(k, k) for k in base_stats['by_status'].keys()],
        'datasets': [{
            'data': [v['count'] for v in base_stats['by_status'].values()],
            'backgroundColor': [status_colors.get(k, '#6c757d') for k in base_stats['by_status'].keys()],
        }]
    }

    sample_type_colors = {
        'normal_release': '#198754',
        'over_limit': '#ffc107',
        'evidence_missing': '#fd7e14',
        'timeout': '#dc3545',
    }

    sample_type_labels = dict(AccessRecoveryRecord.SampleType.choices)
    sample_type_chart_data = {
        'labels': [sample_type_labels.get(k, k) for k in base_stats['by_sample_type'].keys()],
        'datasets': [{
            'label': '记录数',
            'data': [v['count'] for v in base_stats['by_sample_type'].values()],
            'backgroundColor': [sample_type_colors.get(k, '#6c757d') for k in base_stats['by_sample_type'].keys()],
        }]
    }

    risk_colors = {
        'low': '#198754',
        'medium': '#ffc107',
        'high': '#fd7e14',
        'critical': '#dc3545',
    }

    risk_labels = {'low': '低风险', 'medium': '中风险', 'high': '高风险', 'critical': '极高风险'}
    risk_chart_data = {
        'labels': [risk_labels.get(k, k) for k in base_stats['by_risk_level'].keys()],
        'datasets': [{
            'data': [v['count'] for v in base_stats['by_risk_level'].values()],
            'backgroundColor': [risk_colors.get(k, '#6c757d') for k in base_stats['by_risk_level'].keys()],
        }]
    }

    today = timezone.now().date()
    trend_days = 30
    trend_labels = []
    trend_total = []
    trend_archived = []
    for i in range(trend_days):
        day = today - timedelta(days=trend_days - 1 - i)
        trend_labels.append(day.strftime('%m-%d'))
        day_query = queryset.filter(created_at__date=day)
        trend_total.append(day_query.count())
        trend_archived.append(day_query.filter(is_archived=True).count())

    trend_chart_data = {
        'labels': trend_labels,
        'datasets': [
            {
                'label': '新增记录',
                'data': trend_total,
                'borderColor': '#0d6efd',
                'backgroundColor': 'rgba(13, 110, 253, 0.1)',
                'fill': True,
            },
            {
                'label': '已归档',
                'data': trend_archived,
                'borderColor': '#198754',
                'backgroundColor': 'rgba(25, 135, 84, 0.1)',
                'fill': True,
            }
        ]
    }

    processor_stats = []
    users = User.objects.filter(
        Q(processed_records__in=queryset) | Q(accepted_records__in=queryset)
    ).distinct()
    for user in users:
        user_records = queryset.filter(
            Q(processed_by=user) | Q(accepted_by=user)
        ).distinct()
        archived = user_records.filter(is_archived=True, accepted_at__isnull=False, archived_at__isnull=False)
        avg_days = 0
        if archived.exists():
            total_days = sum((r.archived_at - r.accepted_at).days for r in archived)
            avg_days = round(total_days / archived.count(), 1)
        processor_stats.append({
            'id': user.id,
            'name': user.get_full_name(),
            'role': user.get_role_display(),
            'count': user_records.count(),
            'avg_days': avg_days,
        })
    processor_stats.sort(key=lambda x: x['count'], reverse=True)

    lab_stats = []
    lab_data = queryset.values('lab_code', 'lab_name').annotate(
        count=Count('id'),
        anomaly_count=Count('id', filter=Q(has_anomaly=True))
    ).order_by('-count')
    for lab in lab_data:
        lab_stats.append({
            'code': lab['lab_code'],
            'name': lab['lab_name'],
            'count': lab['count'],
            'anomaly_count': lab['anomaly_count'],
            'percentage': (lab['count'] / total * 100) if total > 0 else 0,
        })

    anomaly_type_stats = {}
    anomaly_configs = {
        'over_limit': {'display': '指标超限', 'description': '授权人数或金额超过阈值'},
        'evidence_missing': {'display': '证据缺失', 'description': '缺少必要的现场证据'},
        'timeout': {'display': '审批超时', 'description': '超过处理截止时间'},
    }
    for anomaly_type, config in anomaly_configs.items():
        anomaly_count = queryset.filter(sample_type=anomaly_type).count()
        anomaly_type_stats[anomaly_type] = {
            'display': config['display'],
            'description': config['description'],
            'count': anomaly_count,
            'percentage': (anomaly_count / total * 100) if total > 0 else 0,
        }

    role_efficiency = []
    for role in ['field_staff', 'reviewer']:
        role_users = User.objects.filter(role=role)
        role_records = queryset.filter(
            Q(processed_by__in=role_users) | Q(reviewed_by__in=role_users)
        ).distinct()
        archived = role_records.filter(is_archived=True, accepted_at__isnull=False, archived_at__isnull=False)
        avg_days = 0
        if archived.exists():
            total_days = sum((r.archived_at - r.accepted_at).days for r in archived)
            avg_days = round(total_days / archived.count(), 1)
        role_efficiency.append({
            'role': '现场人员' if role == 'field_staff' else '主管复核人',
            'count': role_records.count(),
            'avg_days': avg_days,
        })

    efficiency_chart_data = {
        'labels': [r['role'] for r in role_efficiency],
        'datasets': [
            {
                'label': '处理数',
                'data': [r['count'] for r in role_efficiency],
                'backgroundColor': '#0d6efd',
            },
            {
                'label': '平均天数',
                'data': [r['avg_days'] for r in role_efficiency],
                'backgroundColor': '#fd7e14',
            }
        ]
    }

    sample_type_efficiency = []
    for st_key, st_label in AccessRecoveryRecord.SampleType.choices:
        st_records = queryset.filter(sample_type=st_key, is_archived=True, accepted_at__isnull=False, archived_at__isnull=False)
        avg_days = 0
        if st_records.exists():
            total_days = sum((r.archived_at - r.accepted_at).days for r in st_records)
            avg_days = round(total_days / st_records.count(), 1)
        sample_type_efficiency.append({
            'type': st_label,
            'count': st_records.count(),
            'avg_days': avg_days,
        })

    stats = {
        'total': total,
        'archived_count': base_stats['by_status'].get('archived', {}).get('count', 0),
        'overdue_count': base_stats['overdue_count'],
        'blocked_count': base_stats['blocked_count'],
        'avg_processing_days': base_stats['avg_processing_days'],
        'by_status': base_stats['by_status'],
        'by_sample_type': base_stats['by_sample_type'],
        'by_risk_level': base_stats['by_risk_level'],
        'by_processor': processor_stats[:10],
        'by_lab': lab_stats[:10],
        'by_anomaly_type': anomaly_type_stats,
        'status_chart_data': json.dumps(status_chart_data),
        'sample_type_chart_data': json.dumps(sample_type_chart_data),
        'risk_chart_data': json.dumps(risk_chart_data),
        'trend_chart_data': json.dumps(trend_chart_data),
        'efficiency_chart_data': json.dumps(efficiency_chart_data),
    }

    if request.htmx and 'drilldown' in request.GET:
        drill_type = request.GET.get('drill_type')
        drill_value = request.GET.get('drill_value')

        drill_query = queryset
        drill_type_display = drill_type
        drill_value_display = drill_value

        drill_type_map = {
            'status': ('状态', dict(AccessRecoveryRecord.Status.choices)),
            'sample_type': ('样本类型', dict(AccessRecoveryRecord.SampleType.choices)),
            'risk_level': ('风险等级', {'low': '低风险', 'medium': '中风险', 'high': '高风险', 'critical': '极高风险'}),
            'overdue': ('是否逾期', {'1': '已逾期'}),
            'blocked': ('是否阻断', {'1': '已阻断'}),
            'anomaly_type': ('异常类型', {'over_limit': '指标超限', 'evidence_missing': '证据缺失', 'timeout': '审批超时'}),
            'processor': ('处理人', {}),
            'lab_code': ('实验室', {}),
            'all': ('全部记录', {}),
        }

        if drill_type in drill_type_map:
            drill_type_display = drill_type_map[drill_type][0]
            value_map = drill_type_map[drill_type][1]
            drill_value_display = value_map.get(drill_value, drill_value)

        if drill_type == 'status':
            drill_query = queryset.filter(status=drill_value)
        elif drill_type == 'sample_type':
            drill_query = queryset.filter(sample_type=drill_value)
        elif drill_type == 'risk_level':
            drill_query = queryset.filter(risk_level=drill_value)
        elif drill_type == 'overdue' and drill_value == '1':
            drill_query = queryset.filter(is_archived=False, deadline__lt=timezone.now())
        elif drill_type == 'blocked' and drill_value == '1':
            drill_query = queryset.filter(is_blocked=True)
        elif drill_type == 'anomaly_type':
            drill_query = queryset.filter(sample_type=drill_value)
        elif drill_type == 'processor':
            drill_query = queryset.filter(
                Q(processed_by_id=drill_value) | Q(accepted_by_id=drill_value)
            )
            try:
                user = User.objects.get(pk=drill_value)
                drill_value_display = user.get_full_name()
            except User.DoesNotExist:
                pass
        elif drill_type == 'lab_code':
            drill_query = queryset.filter(lab_code=drill_value)
            lab = drill_query.first()
            if lab:
                drill_value_display = lab.lab_name
        elif drill_type == 'all':
            drill_value_display = '全部记录'

        drill_summaries = [WorkflowService.get_record_summary(r) for r in drill_query]
        return render(request, 'access_control/partials/drilldown_results.html', {
            'drill_records': drill_summaries,
            'drill_type_display': drill_type_display,
            'drill_value_display': drill_value_display,
        })

    context = {
        'stats': stats,
        'filter_form': filter_form,
        'filters': json.dumps(filters),
    }

    return render(request, 'access_control/analytics_page.html', context)


@login_required
def api_accept_record(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        remarks = request.POST.get('remarks', '')
        record, node = WorkflowService.accept_record(pk, request.user, remarks)
        messages.success(request, f'已成功受理记录：{record.record_no}')

        if request.htmx:
            return record_detail(request, pk)
        return redirect('record_detail', pk=pk)
    except ValueError as e:
        messages.error(request, str(e))
        return redirect('record_detail', pk=pk)


@login_required
def api_process_record(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    record = get_object_or_404(AccessRecoveryRecord, pk=pk)
    form = RecordProcessForm(request.POST, record=record, user=request.user)

    if form.is_valid():
        try:
            record, node = WorkflowService.process_record(
                pk, request.user,
                business_note=form.cleaned_data.get('business_note', ''),
                site_description=form.cleaned_data.get('site_description', ''),
                recovered_date=form.cleaned_data.get('recovered_date'),
                conclusion=form.cleaned_data.get('conclusion', ''),
                recovery_basis=form.cleaned_data.get('recovery_basis', ''),
                remedial_path=form.cleaned_data.get('remedial_path', '')
            )
            messages.success(request, '处理记录已保存')

            if request.htmx:
                return record_detail(request, pk)
            return redirect('record_detail', pk=pk)
        except ValueError as e:
            messages.error(request, str(e))
    else:
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(request, f'{field}: {error}')

    return redirect('record_detail', pk=pk)


@login_required
def api_submit_review(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        remarks = request.POST.get('remarks', '')
        record, node = WorkflowService.submit_for_review(pk, request.user, remarks)
        messages.success(request, f'已提交复核：{record.record_no}')

        if request.htmx:
            return record_detail(request, pk)
        return redirect('record_detail', pk=pk)
    except ValueError as e:
        messages.error(request, str(e))
        return redirect('record_detail', pk=pk)


@login_required
def api_review_approve(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        remarks = request.POST.get('remarks', '')
        record, node = WorkflowService.review_approve(pk, request.user, remarks)
        messages.success(request, f'复核通过并已归档：{record.record_no}')

        if request.htmx:
            return record_detail(request, pk)
        return redirect('record_detail', pk=pk)
    except ValueError as e:
        messages.error(request, str(e))
        return redirect('record_detail', pk=pk)


@login_required
def api_review_reject(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    form = ReviewRejectForm(request.POST)
    if form.is_valid():
        try:
            record, node = WorkflowService.review_reject(
                pk, request.user,
                reject_reason=form.cleaned_data['reject_reason'],
                remedial_path=form.cleaned_data.get('remedial_path', '')
            )
            messages.success(request, f'已退回补证：{record.record_no}')

            if request.htmx:
                return record_detail(request, pk)
            return redirect('record_detail', pk=pk)
        except ValueError as e:
            messages.error(request, str(e))
    else:
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(request, f'{field}: {error}')

    return redirect('record_detail', pk=pk)


@login_required
def api_archive_record(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        remarks = request.POST.get('remarks', '')
        record, node = WorkflowService.archive_record(pk, request.user, remarks)
        messages.success(request, f'已归档：{record.record_no}')

        if request.htmx:
            return record_detail(request, pk)
        return redirect('record_detail', pk=pk)
    except ValueError as e:
        messages.error(request, str(e))
        return redirect('record_detail', pk=pk)


@login_required
def api_reopen_record(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    form = ReopenForm(request.POST)
    if form.is_valid():
        try:
            record, node = WorkflowService.reopen_record(
                pk, request.user,
                reason=form.cleaned_data['reason']
            )
            messages.success(request, f'已重新处理：{record.record_no}')

            if request.htmx:
                return record_detail(request, pk)
            return redirect('record_detail', pk=pk)
        except ValueError as e:
            messages.error(request, str(e))
    else:
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(request, f'{field}: {error}')

    return redirect('record_detail', pk=pk)


@login_required
def api_upload_evidence(request, pk):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    record = get_object_or_404(AccessRecoveryRecord, pk=pk)

    if record.is_archived:
        messages.error(request, '已归档记录不能上传证据')
        return redirect('record_detail', pk=pk)

    if not (request.user.is_field_staff or request.user.is_reviewer or request.user.is_admin):
        messages.error(request, '您没有权限上传证据')
        return redirect('record_detail', pk=pk)

    form = EvidenceUploadForm(request.POST, request.FILES)
    if form.is_valid():
        evidence = form.save(commit=False)
        evidence.record = record
        evidence.uploaded_by = request.user
        evidence.file_name = request.FILES['file'].name
        evidence.file_size = request.FILES['file'].size
        evidence.save()

        ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.SUPPLEMENT,
            node_title='补充证据材料',
            description=f'{request.user.get_full_name()} 上传了证据：{evidence.title}',
            operator=request.user,
            previous_status=record.status,
            new_status=record.status,
        )

        messages.success(request, f'证据上传成功：{evidence.title}')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                messages.error(request, f'{field}: {error}')

    if request.htmx:
        return render(request, 'access_control/partials/evidence_list.html', {
            'evidences': record.evidences.filter(is_valid=True),
            'record': record
        })

    return redirect('record_detail', pk=pk)


@login_required
def api_record_summary(request, pk):
    record = get_object_or_404(AccessRecoveryRecord, pk=pk)
    summary = WorkflowService.get_record_summary(record)
    return JsonResponse(summary)


@login_required
def api_dashboard_stats(request):
    filters = json.loads(request.GET.get('filters', '{}'))
    stats = WorkflowService.get_dashboard_stats(filters)
    return JsonResponse(stats)
