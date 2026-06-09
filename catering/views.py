from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.http import HttpResponse, HttpResponseBadRequest
from django.db.models import Count, Avg, Q, Sum, F, ExpressionWrapper, fields
from django.utils import timezone
from django.utils.dateparse import parse_date
from datetime import timedelta
from .models import (
    MealBatch, Flight, Airline, MealCategory, Allergen,
    TemperatureRecord, BatchHistory, RecallRecord, BatchStatus, AnomalyType, Role
)
from .forms import (
    BatchCreateForm, QCForm, LoadConfirmForm, RecallForm,
    RecallResolveForm, TemperatureRecordForm, BatchFilterForm
)


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
        else:
            messages.error(request, '用户名或密码错误')
    return render(request, 'auth/login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def dashboard(request):
    batches = MealBatch.objects.select_related('flight', 'meal_category', 'flight__airline')
    form = BatchFilterForm(request.GET or None)

    if form.is_valid():
        status = form.cleaned_data.get('status')
        anomaly_type = form.cleaned_data.get('anomaly_type')
        keyword = form.cleaned_data.get('keyword')
        date_from = form.cleaned_data.get('date_from')
        date_to = form.cleaned_data.get('date_to')

        if status:
            batches = batches.filter(status=status)
        if anomaly_type:
            batches = batches.filter(anomaly_type=anomaly_type)
        if keyword:
            batches = batches.filter(
                Q(batch_number__icontains=keyword) |
                Q(flight__flight_number__icontains=keyword)
            )
        if date_from:
            batches = batches.filter(created_at__date__gte=date_from)
        if date_to:
            batches = batches.filter(created_at__date__lte=date_to)

    stats = {
        'total': MealBatch.objects.count(),
        'pending_qc': MealBatch.objects.filter(status=BatchStatus.QC_PENDING).count(),
        'loaded': MealBatch.objects.filter(status=BatchStatus.LOADED).count(),
        'anomaly': MealBatch.objects.exclude(anomaly_type=AnomalyType.NONE).count(),
        'recalls': RecallRecord.objects.filter(is_resolved=False).count(),
    }

    is_htmx = request.headers.get('HX-Request', False)
    template = 'partials/batch_list.html' if is_htmx else 'dashboard.html'

    context = {
        'batches': batches[:50],
        'form': form,
        'stats': stats,
        'BatchStatus': BatchStatus,
        'AnomalyType': AnomalyType,
        'Role': Role,
    }
    return render(request, template, context)


@login_required
def batch_detail(request, pk):
    batch = get_object_or_404(MealBatch.objects.select_related(
        'flight', 'flight__airline', 'meal_category',
        'created_by', 'qc_officer', 'loaded_by'
    ).prefetch_related('allergens', 'temperature_records', 'history', 'recalls'), pk=pk)

    temp_form = TemperatureRecordForm()

    context = {
        'batch': batch,
        'temp_form': temp_form,
        'BatchStatus': BatchStatus,
        'AnomalyType': AnomalyType,
        'Role': Role,
        'can_load': batch.can_load,
    }
    return render(request, 'batch_detail.html', context)


@login_required
def batch_create(request):
    if request.user.role not in [Role.CATERING_CLERK, Role.DUTY_MANAGER]:
        return HttpResponseBadRequest('无权限操作')

    if request.method == 'POST':
        form = BatchCreateForm(request.POST)
        if form.is_valid():
            batch = form.save(commit=False)
            batch.created_by = request.user
            batch.status = BatchStatus.QC_PENDING
            batch.save()
            form.save_m2m()
            batch.add_history('创建批次', request.user, f'批次 {batch.batch_number} 创建完成')
            messages.success(request, '批次创建成功')
            return redirect('batch_detail', pk=batch.pk)
    else:
        form = BatchCreateForm()

    context = {'form': form, 'title': '创建餐食批次'}
    return render(request, 'batch_form.html', context)


@login_required
def batch_qc(request, pk):
    batch = get_object_or_404(MealBatch, pk=pk)
    if request.user.role not in [Role.QC_OFFICER, Role.DUTY_MANAGER]:
        return HttpResponseBadRequest('无权限操作')
    if batch.status not in [BatchStatus.QC_PENDING, BatchStatus.QC_FAILED]:
        return HttpResponseBadRequest('当前状态不可进行品控复核')

    if request.method == 'POST':
        form = QCForm(request.POST)
        if form.is_valid():
            batch.allergen_label_verified = form.cleaned_data['allergen_label_verified']
            batch.allergen_label_missing = form.cleaned_data['allergen_label_missing']
            batch.qc_officer = request.user
            batch.qc_time = timezone.now()

            temp_record = TemperatureRecord.objects.create(
                batch=batch,
                temperature=form.cleaned_data['temperature'],
                recorded_by=request.user,
                location='品控检测'
            )

            if form.cleaned_data['qc_passed'] and not form.cleaned_data['allergen_label_missing']:
                batch.status = BatchStatus.QC_PASSED
                action = '品控通过'
                desc = f'品控复核通过，温度：{form.cleaned_data["temperature"]}℃'
            else:
                batch.status = BatchStatus.QC_FAILED
                if form.cleaned_data['allergen_label_missing']:
                    batch.anomaly_type = AnomalyType.ALLERGEN_MISSING
                action = '品控不通过'
                desc = f'品控不通过，温度：{form.cleaned_data["temperature"]}℃，' + (
                    '过敏源标识缺失' if form.cleaned_data['allergen_label_missing'] else ''
                )

            if form.cleaned_data['remarks']:
                desc += f' 备注：{form.cleaned_data["remarks"]}'

            batch.remarks = form.cleaned_data['remarks'] or batch.remarks
            batch.save()
            batch.add_history(action, request.user, desc)
            messages.success(request, f'品控完成：{action}')

            if request.headers.get('HX-Request'):
                return render(request, 'partials/batch_detail_main.html', {
                    'batch': batch, 'BatchStatus': BatchStatus, 'AnomalyType': AnomalyType,
                    'Role': Role, 'can_load': batch.can_load
                })
            return redirect('batch_detail', pk=batch.pk)
    else:
        form = QCForm(initial={
            'allergen_label_verified': batch.allergen_label_verified,
            'allergen_label_missing': batch.allergen_label_missing,
        })

    context = {
        'form': form, 'batch': batch, 'title': '品控复核',
        'BatchStatus': BatchStatus, 'AnomalyType': AnomalyType,
    }
    return render(request, 'qc_form.html', context)


@login_required
def batch_load(request, pk):
    batch = get_object_or_404(MealBatch, pk=pk)
    if request.user.role not in [Role.CABIN_CREW, Role.DUTY_MANAGER]:
        return HttpResponseBadRequest('无权限操作')
    if not batch.can_load:
        messages.error(request, '该批次不满足装机条件（需品控通过、过敏源标识已复核、无缺失、冷藏未超时）')
        return redirect('batch_detail', pk=batch.pk)

    if request.method == 'POST':
        form = LoadConfirmForm(request.POST)
        if form.is_valid():
            TemperatureRecord.objects.create(
                batch=batch,
                temperature=form.cleaned_data['temperature'],
                recorded_by=request.user,
                location='装机前检测'
            )
            batch.status = BatchStatus.LOADED
            batch.loaded_by = request.user
            batch.load_time = timezone.now()
            if batch.cold_storage_start and not batch.cold_storage_end:
                batch.cold_storage_end = timezone.now()
            batch.save()
            desc = f'装机确认，温度：{form.cleaned_data["temperature"]}℃'
            if form.cleaned_data['remarks']:
                desc += f' 备注：{form.cleaned_data["remarks"]}'
            batch.add_history('装机确认', request.user, desc)
            messages.success(request, '装机确认成功')

            if request.headers.get('HX-Request'):
                return render(request, 'partials/batch_detail_main.html', {
                    'batch': batch, 'BatchStatus': BatchStatus, 'AnomalyType': AnomalyType,
                    'Role': Role, 'can_load': batch.can_load
                })
            return redirect('batch_detail', pk=batch.pk)
    else:
        form = LoadConfirmForm()

    context = {'form': form, 'batch': batch, 'title': '装机确认'}
    return render(request, 'load_form.html', context)


@login_required
def batch_recall(request, pk):
    batch = get_object_or_404(MealBatch, pk=pk)
    if request.user.role != Role.DUTY_MANAGER:
        return HttpResponseBadRequest('仅值班经理可发起召回')
    if batch.status not in [BatchStatus.LOADED, BatchStatus.LOADING, BatchStatus.QC_PASSED]:
        return HttpResponseBadRequest('当前状态不可发起召回')

    if request.method == 'POST':
        form = RecallForm(request.POST)
        if form.is_valid():
            recall = form.save(commit=False)
            recall.batch = batch
            recall.initiated_by = request.user
            recall.save()

            batch.status = BatchStatus.RECALLED
            batch.anomaly_type = form.cleaned_data['anomaly_type']
            batch.save()
            batch.add_history('发起召回', request.user, f'召回原因：{form.cleaned_data["reason"]}')
            messages.success(request, '召回已发起')
            return redirect('batch_detail', pk=batch.pk)
    else:
        form = RecallForm(initial={'anomaly_type': batch.anomaly_type if batch.anomaly_type != AnomalyType.NONE else AnomalyType.OTHER})

    context = {'form': form, 'batch': batch, 'title': '发起召回'}
    return render(request, 'recall_form.html', context)


@login_required
def recall_resolve(request, pk):
    recall = get_object_or_404(RecallRecord, pk=pk)
    if request.user.role != Role.DUTY_MANAGER:
        return HttpResponseBadRequest('仅值班经理可处理召回')
    if recall.is_resolved:
        return HttpResponseBadRequest('该召回已处理完成')

    if request.method == 'POST':
        form = RecallResolveForm(request.POST)
        if form.is_valid():
            recall.resolution = form.cleaned_data['resolution']
            recall.handled_by = request.user
            recall.resolved_at = timezone.now()
            recall.is_resolved = True
            recall.save()

            if form.cleaned_data['return_to_inventory']:
                recall.batch.status = BatchStatus.QC_PENDING
                recall.batch.add_history('退回待重新品控', request.user, form.cleaned_data['resolution'])
            else:
                recall.batch.status = BatchStatus.RETURNED
                recall.batch.add_history('退回报废', request.user, form.cleaned_data['resolution'])
            recall.batch.save()

            messages.success(request, '召回处理完成')
            return redirect('batch_detail', pk=recall.batch.pk)
    else:
        form = RecallResolveForm()

    context = {'form': form, 'recall': recall, 'title': '处理召回'}
    return render(request, 'recall_resolve_form.html', context)


@login_required
def add_temperature(request, pk):
    batch = get_object_or_404(MealBatch, pk=pk)
    if request.method == 'POST':
        form = TemperatureRecordForm(request.POST)
        if form.is_valid():
            temp = form.save(commit=False)
            temp.batch = batch
            temp.recorded_by = request.user
            temp.save()
            batch.add_history('温度记录', request.user, f'温度：{temp.temperature}℃，位置：{temp.location or "未指定"}')

            if request.headers.get('HX-Request'):
                return render(request, 'partials/temperature_records.html', {'batch': batch})
            return redirect('batch_detail', pk=batch.pk)
    return HttpResponseBadRequest('无效请求')


@login_required
def start_cold_storage(request, pk):
    batch = get_object_or_404(MealBatch, pk=pk)
    if request.user.role not in [Role.CATERING_CLERK, Role.DUTY_MANAGER]:
        return HttpResponseBadRequest('无权限操作')
    if batch.cold_storage_start:
        return HttpResponseBadRequest('已在冷藏中')

    batch.cold_storage_start = timezone.now()
    batch.status = BatchStatus.IN_COLD_STORAGE
    batch.save()
    batch.add_history('入库冷藏', request.user, '开始冷藏')
    messages.success(request, '已开始冷藏')
    return redirect('batch_detail', pk=batch.pk)


@login_required
def end_cold_storage(request, pk):
    batch = get_object_or_404(MealBatch, pk=pk)
    if request.user.role not in [Role.CATERING_CLERK, Role.QC_OFFICER, Role.DUTY_MANAGER]:
        return HttpResponseBadRequest('无权限操作')
    if not batch.cold_storage_start or batch.cold_storage_end:
        return HttpResponseBadRequest('当前未在冷藏中或已结束')

    batch.cold_storage_end = timezone.now()
    batch.status = BatchStatus.QC_PENDING
    batch.save()

    duration = batch.cold_storage_end - batch.cold_storage_start
    hours = duration.total_seconds() / 3600
    if hours > 12:
        batch.anomaly_type = AnomalyType.COLD_STORAGE_TIMEOUT

    desc = f'冷藏结束，时长：{hours:.1f}小时'
    if hours > 12:
        desc += '（冷藏超时）'
    batch.add_history('出库', request.user, desc)
    messages.success(request, '冷藏结束')
    return redirect('batch_detail', pk=batch.pk)


@login_required
def review_page(request):
    if request.user.role != Role.DUTY_MANAGER:
        return HttpResponseBadRequest('仅值班经理可查看复盘页')

    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')

    qs = MealBatch.objects.all()
    recall_qs = RecallRecord.objects.filter(is_resolved=True)

    if date_from:
        d = parse_date(date_from)
        if d:
            qs = qs.filter(created_at__date__gte=d)
            recall_qs = recall_qs.filter(initiated_at__date__gte=d)
    if date_to:
        d = parse_date(date_to)
        if d:
            qs = qs.filter(created_at__date__lte=d)
            recall_qs = recall_qs.filter(initiated_at__date__lte=d)

    by_airline = qs.values(
        airline_code=F('flight__airline__code'),
        airline_name=F('flight__airline__name')
    ).annotate(
        total=Count('id'),
        anomaly_count=Count('id', filter=~Q(anomaly_type=AnomalyType.NONE)),
        loaded=Count('id', filter=Q(status=BatchStatus.LOADED)),
    ).order_by('-total')

    by_category = qs.values(
        category_name=F('meal_category__name')
    ).annotate(
        total=Count('id'),
        anomaly_count=Count('id', filter=~Q(anomaly_type=AnomalyType.NONE)),
    ).order_by('-total')

    by_anomaly = qs.exclude(anomaly_type=AnomalyType.NONE).values(
        'anomaly_type'
    ).annotate(
        count=Count('id'),
    ).order_by('-count')

    anomaly_list = list(by_anomaly)
    for item in anomaly_list:
        item['anomaly_type_display'] = dict(AnomalyType.choices).get(item['anomaly_type'], item['anomaly_type'])

    recall_stats = recall_qs.aggregate(
        avg_duration=Avg(F('resolved_at') - F('initiated_at')),
        total_recalls=Count('id'),
    )

    by_anomaly_recall = recall_qs.values('anomaly_type').annotate(
        count=Count('id'),
        avg_duration=Avg(F('resolved_at') - F('initiated_at')),
    ).order_by('-count')

    recall_by_anomaly = list(by_anomaly_recall)
    for item in recall_by_anomaly:
        item['anomaly_type_display'] = dict(AnomalyType.choices).get(item['anomaly_type'], item['anomaly_type'])
        avg = item['avg_duration']
        if avg:
            item['avg_hours'] = round(avg.total_seconds() / 3600, 2)
        else:
            item['avg_hours'] = 0

    total_anomaly = qs.exclude(anomaly_type=AnomalyType.NONE).count()
    total = qs.count()
    anomaly_rate = (total_anomaly / total * 100) if total > 0 else 0

    avg_handle_hours = 0
    if recall_stats['avg_duration']:
        avg_handle_hours = round(recall_stats['avg_duration'].total_seconds() / 3600, 2)

    context = {
        'by_airline': by_airline,
        'by_category': by_category,
        'by_anomaly': anomaly_list,
        'recall_by_anomaly': recall_by_anomaly,
        'total_batches': total,
        'total_anomaly': total_anomaly,
        'anomaly_rate': round(anomaly_rate, 2),
        'total_recalls': recall_stats['total_recalls'] or 0,
        'avg_handle_hours': avg_handle_hours,
        'date_from': date_from or '',
        'date_to': date_to or '',
        'AnomalyType': AnomalyType,
    }
    return render(request, 'review.html', context)
