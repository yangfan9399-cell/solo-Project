from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Sum, Q, Avg, F, Case, When, Value
from django.db.models.functions import Coalesce
from django.core.paginator import Paginator
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta
from .models import MeterReading, AnomalyType, District, HistoryLog, FieldNote, FeeAdjustment, User
from .forms import FieldNoteForm, FeeAdjustmentForm, AssignForm


def log_history(reading, operator, new_status, new_owner=None, remark=''):
    HistoryLog.objects.create(
        reading=reading,
        operator=operator,
        old_status=reading.status,
        new_status=new_status,
        old_owner=reading.current_owner,
        new_owner=new_owner,
        remark=remark
    )
    reading.status = new_status
    if new_owner is not None:
        reading.current_owner = new_owner
    reading.save()


@login_required
def queue_list(request):
    anomaly_types = AnomalyType.objects.all()
    districts = District.objects.all()
    statuses = MeterReading.STATUS_CHOICES

    anomaly_filter = request.GET.get('anomaly_type', '')
    district_filter = request.GET.get('district', '')
    status_filter = request.GET.get('status', '')
    search_query = request.GET.get('search', '')

    readings = MeterReading.objects.select_related(
        'customer', 'customer__district', 'anomaly_type', 'current_owner', 'assigned_reader'
    ).all()

    if anomaly_filter:
        readings = readings.filter(anomaly_type_id=anomaly_filter)
    if district_filter:
        readings = readings.filter(customer__district_id=district_filter)
    if status_filter:
        readings = readings.filter(status=status_filter)
    if search_query:
        readings = readings.filter(
            Q(customer__customer_no__icontains=search_query) |
            Q(customer__name__icontains=search_query) |
            Q(customer__meter_no__icontains=search_query)
        )

    if request.user.role == 'reader':
        readings = readings.filter(Q(assigned_reader=request.user) | Q(current_owner=request.user) | Q(status='pending'))
    elif request.user.role == 'reviewer':
        readings = readings.filter(Q(status__in=['pending', 'reviewing', 'reading']) | Q(current_owner=request.user))

    paginator = Paginator(readings, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    stats = {
        'total': readings.count(),
        'pending': readings.filter(status='pending').count(),
        'reading': readings.filter(status='reading').count(),
        'reviewing': readings.filter(status='reviewing').count(),
        'adjusted': readings.filter(status='adjusted').count(),
        'returned': readings.filter(status='returned').count(),
        'archived': readings.filter(status='archived').count(),
    }

    context = {
        'page_obj': page_obj,
        'anomaly_types': anomaly_types,
        'districts': districts,
        'statuses': statuses,
        'stats': stats,
        'filters': {
            'anomaly_type': anomaly_filter,
            'district': district_filter,
            'status': status_filter,
            'search': search_query,
        }
    }

    if request.headers.get('HX-Request') and request.path.endswith('/load-more/'):
        return render(request, 'partials/queue_rows.html', context)

    return render(request, 'queue_list.html', context)


@login_required
def queue_load_more(request):
    return queue_list(request)


@login_required
def reading_detail(request, pk):
    reading = get_object_or_404(
        MeterReading.objects.select_related(
            'customer', 'customer__district', 'anomaly_type', 'current_owner', 'assigned_reader'
        ).prefetch_related(
            'field_notes', 'adjustments', 'history_logs'
        ),
        pk=pk
    )

    field_note_form = FieldNoteForm()
    adjustment_form = FeeAdjustmentForm()
    assign_form = AssignForm()

    can_claim = request.user.role == 'reader' and reading.status in ['pending', 'returned']
    can_add_note = request.user.role == 'reader' and reading.status == 'reading' and reading.current_owner == request.user
    can_submit = request.user.role == 'reader' and reading.status == 'reading' and reading.current_owner == request.user
    can_review = request.user.role == 'reviewer' and reading.status == 'reviewing'
    is_blocked = reading.anomaly_type and reading.anomaly_type.block_adjustment
    check_fields = reading.anomaly_type.check_fields.split(',') if reading.anomaly_type and reading.anomaly_type.check_fields else []

    status_steps = [
        {'status': 'pending', 'label': '待处理'},
        {'status': 'reading', 'label': '抄表员处理中'},
        {'status': 'reviewing', 'label': '复核员处理中'},
        {'status': 'adjusted', 'label': '已调整'},
        {'status': 'archived', 'label': '已归档'},
    ]

    current_step_index = None
    for i, step in enumerate(status_steps):
        if step['status'] == reading.status:
            current_step_index = i
            break

    context = {
        'reading': reading,
        'field_note_form': field_note_form,
        'adjustment_form': adjustment_form,
        'assign_form': assign_form,
        'can_claim': can_claim,
        'can_add_note': can_add_note,
        'can_submit': can_submit,
        'can_review': can_review,
        'is_blocked': is_blocked,
        'check_fields': check_fields,
        'fee_diff': (reading.adjusted_fee or reading.original_fee) - reading.original_fee,
        'status_steps': status_steps,
        'current_step_index': current_step_index,
    }
    return render(request, 'reading_detail.html', context)


@login_required
def assign_reading(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)

    if request.user.role != 'reader':
        messages.error(request, '只有抄表员可以认领任务')
        return redirect('meter_review:reading_detail', pk=pk)

    if reading.status not in ['pending', 'returned']:
        messages.error(request, '该记录状态不允许认领')
        return redirect('meter_review:reading_detail', pk=pk)

    if request.method == 'POST':
        form = AssignForm(request.POST)
        if form.is_valid():
            remark = form.cleaned_data.get('remark', '')
            log_history(
                reading=reading,
                operator=request.user,
                new_status='reading',
                new_owner=request.user,
                remark=f'抄表员认领任务。{remark}'
            )
            reading.assigned_reader = request.user
            if reading.status == 'returned':
                reading.rework_count += 1
            reading.save()
            messages.success(request, '任务认领成功')
            if request.headers.get('HX-Request'):
                return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
            return redirect('meter_review:reading_detail', pk=pk)
    else:
        form = AssignForm()

    return render(request, 'partials/assign_form.html', {'form': form, 'reading': reading})


@login_required
def add_field_note(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)

    if request.user.role != 'reader' or reading.status != 'reading' or reading.current_owner != request.user:
        messages.error(request, '没有权限添加现场说明')
        return redirect('meter_review:reading_detail', pk=pk)

    if request.method == 'POST':
        form = FieldNoteForm(request.POST, request.FILES)
        if form.is_valid():
            field_note = form.save(commit=False)
            field_note.reading = reading
            field_note.reader = request.user
            field_note.save()
            messages.success(request, '现场说明已添加')
            if request.headers.get('HX-Request'):
                return render(request, 'partials/field_notes.html', {'reading': reading})
            return redirect('meter_review:reading_detail', pk=pk)
    else:
        form = FieldNoteForm()

    return render(request, 'partials/field_note_form.html', {'form': form, 'reading': reading})


@login_required
def submit_for_review(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)

    if request.user.role != 'reader' or reading.status != 'reading' or reading.current_owner != request.user:
        messages.error(request, '没有权限提交复核')
        return redirect('meter_review:reading_detail', pk=pk)

    if not reading.field_notes.exists():
        messages.error(request, '请先添加现场说明')
        return redirect('meter_review:reading_detail', pk=pk)

    if request.method == 'POST':
        adjustment_basis = request.POST.get('adjustment_basis', '')
        if adjustment_basis:
            reading.adjustment_basis = adjustment_basis
            reading.save()

        log_history(
            reading=reading,
            operator=request.user,
            new_status='reviewing',
            new_owner=None,
            remark='抄表员提交复核，等待复核员处理'
        )
        messages.success(request, '已提交复核')
        if request.headers.get('HX-Request'):
            return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
        return redirect('meter_review:reading_detail', pk=pk)

    return render(request, 'partials/submit_form.html', {'reading': reading})


@login_required
def adjust_fee(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)

    if request.user.role != 'reviewer' or reading.status != 'reviewing':
        messages.error(request, '没有权限调整费用')
        return redirect('meter_review:reading_detail', pk=pk)

    if reading.anomaly_type and reading.anomaly_type.block_adjustment:
        messages.error(request, f'异常类型"{reading.anomaly_type.name}"不允许直接调整费用，请先核对相关信息')
        return redirect('meter_review:reading_detail', pk=pk)

    if request.method == 'POST':
        form = FeeAdjustmentForm(request.POST)
        if form.is_valid():
            new_reading = form.cleaned_data['new_reading']
            adjustment_reason = form.cleaned_data['adjustment_reason']

            adjusted_usage = max(new_reading - reading.last_reading, Decimal('0'))
            adjusted_fee = adjusted_usage * reading.customer.water_price

            FeeAdjustment.objects.create(
                reading=reading,
                reviewer=request.user,
                action='adjust',
                old_reading=reading.current_reading,
                new_reading=new_reading,
                old_fee=reading.original_fee,
                new_fee=adjusted_fee,
                adjustment_reason=adjustment_reason
            )

            reading.adjusted_reading = new_reading
            reading.adjusted_usage = adjusted_usage
            reading.adjusted_fee = adjusted_fee
            reading.save()

            log_history(
                reading=reading,
                operator=request.user,
                new_status='adjusted',
                new_owner=request.user,
                remark=f'费用调整完成。原读数:{reading.current_reading}，新读数:{new_reading}，原费用:{reading.original_fee}，新费用:{adjusted_fee}。原因:{adjustment_reason}'
            )
            messages.success(request, '费用调整成功')
            if request.headers.get('HX-Request'):
                return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
            return redirect('meter_review:reading_detail', pk=pk)
    else:
        form = FeeAdjustmentForm(initial={'new_reading': reading.current_reading})

    return render(request, 'partials/adjust_form.html', {'form': form, 'reading': reading})


@login_required
def return_reading(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)

    if request.user.role != 'reviewer' or reading.status != 'reviewing':
        messages.error(request, '没有权限退回记录')
        return redirect('meter_review:reading_detail', pk=pk)

    if request.method == 'POST':
        return_reason = request.POST.get('return_reason', '')
        FeeAdjustment.objects.create(
            reading=reading,
            reviewer=request.user,
            action='return',
            old_fee=reading.original_fee,
            new_fee=reading.adjusted_fee or reading.original_fee,
            adjustment_reason=f'退回。{return_reason}'
        )
        log_history(
            reading=reading,
            operator=request.user,
            new_status='returned',
            new_owner=reading.assigned_reader,
            remark=f'复核员退回。原因:{return_reason}'
        )
        messages.success(request, '已退回抄表员')
        if request.headers.get('HX-Request'):
            return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
        return redirect('meter_review:reading_detail', pk=pk)

    return render(request, 'partials/return_form.html', {'reading': reading})


@login_required
def archive_reading(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)

    if request.user.role != 'reviewer':
        messages.error(request, '只有复核员可以归档')
        return redirect('meter_review:reading_detail', pk=pk)

    if reading.status != 'reviewing':
        messages.error(request, '只有复核中的记录可以归档')
        return redirect('meter_review:reading_detail', pk=pk)

    if request.method == 'POST':
        archive_reason = request.POST.get('archive_reason', '')
        FeeAdjustment.objects.create(
            reading=reading,
            reviewer=request.user,
            action='archive',
            old_fee=reading.original_fee,
            new_fee=reading.adjusted_fee or reading.original_fee,
            adjustment_reason=f'归档。{archive_reason}'
        )
        log_history(
            reading=reading,
            operator=request.user,
            new_status='archived',
            new_owner=request.user,
            remark=f'记录归档。{archive_reason}'
        )
        messages.success(request, '记录已归档')
        if request.headers.get('HX-Request'):
            return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
        return redirect('meter_review:reading_detail', pk=pk)

    return render(request, 'partials/archive_form.html', {'reading': reading})


@login_required
def review_dashboard(request):
    if request.user.role not in ['reviewer', 'admin']:
        messages.error(request, '只有复核员和管理员可以查看复盘页面')
        return redirect('meter_review:queue_list')

    date_from = request.GET.get('date_from', (timezone.now() - timedelta(days=30)).strftime('%Y-%m-%d'))
    date_to = request.GET.get('date_to', timezone.now().strftime('%Y-%m-%d'))

    date_from_dt = datetime.strptime(date_from, '%Y-%m-%d').date()
    date_to_dt = datetime.strptime(date_to, '%Y-%m-%d').date()

    readings = MeterReading.objects.filter(
        created_at__date__gte=date_from_dt,
        created_at__date__lte=date_to_dt
    ).select_related('customer', 'customer__district', 'anomaly_type')

    adjustment_diff = Coalesce(
        Sum(Case(
            When(adjusted_fee__isnull=False, then=F('adjusted_fee') - F('original_fee')),
            default=Value(Decimal('0')),
            output_field=models.DecimalField()
        )),
        Decimal('0')
    )

    by_anomaly = readings.filter(anomaly_type__isnull=False).values(
        'anomaly_type__code', 'anomaly_type__name'
    ).annotate(
        count=Count('id'),
        total_adjustment=adjustment_diff,
        avg_rework=Coalesce(Avg('rework_count'), Decimal('0'))
    ).order_by('-count')

    by_district = readings.values(
        'customer__district__code', 'customer__district__name'
    ).annotate(
        count=Count('id'),
        anomaly_count=Count('anomaly_type'),
        total_adjustment=adjustment_diff,
        avg_rework=Coalesce(Avg('rework_count'), Decimal('0'))
    ).order_by('-count')

    by_amount_range = [
        {'range': '0-50元', 'count': readings.filter(Q(adjusted_fee__lte=50) | Q(adjusted_fee__isnull=True, original_fee__lte=50)).count()},
        {'range': '50-200元', 'count': readings.filter(Q(adjusted_fee__gt=50, adjusted_fee__lte=200) | Q(adjusted_fee__isnull=True, original_fee__gt=50, original_fee__lte=200)).count()},
        {'range': '200-500元', 'count': readings.filter(Q(adjusted_fee__gt=200, adjusted_fee__lte=500) | Q(adjusted_fee__isnull=True, original_fee__gt=200, original_fee__lte=500)).count()},
        {'range': '500元以上', 'count': readings.filter(Q(adjusted_fee__gt=500) | Q(adjusted_fee__isnull=True, original_fee__gt=500)).count()},
    ]

    by_rework = [
        {'rework': '0次', 'count': readings.filter(rework_count=0).count()},
        {'rework': '1次', 'count': readings.filter(rework_count=1).count()},
        {'rework': '2次', 'count': readings.filter(rework_count=2).count()},
        {'rework': '3次及以上', 'count': readings.filter(rework_count__gte=3).count()},
    ]

    agg = readings.aggregate(
        total_adjustment=Coalesce(
            Sum(Case(
                When(adjusted_fee__isnull=False, then=F('adjusted_fee') - F('original_fee')),
                default=Value(Decimal('0')),
                output_field=models.DecimalField()
            )),
            Decimal('0')
        ),
        avg_rework=Coalesce(Avg('rework_count'), Decimal('0'))
    )

    total_stats = {
        'total': readings.count(),
        'anomaly_count': readings.filter(anomaly_type__isnull=False).count(),
        'adjusted_count': readings.filter(status='adjusted').count(),
        'archived_count': readings.filter(status='archived').count(),
        'returned_count': readings.filter(status='returned').count(),
        'total_adjustment': agg['total_adjustment'],
        'avg_rework': agg['avg_rework'],
    }

    context = {
        'by_anomaly': by_anomaly,
        'by_district': by_district,
        'by_amount_range': by_amount_range,
        'by_rework': by_rework,
        'total_stats': total_stats,
        'date_from': date_from,
        'date_to': date_to,
    }

    return render(request, 'review_dashboard.html', context)


@login_required
def get_reading_status(request, pk):
    reading = get_object_or_404(MeterReading, pk=pk)
    return JsonResponse({
        'status': reading.status,
        'status_display': reading.get_status_display(),
        'current_owner': str(reading.current_owner) if reading.current_owner else None,
        'updated_at': reading.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
    })
