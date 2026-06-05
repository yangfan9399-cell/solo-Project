from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.db.models import Count, Q, Sum, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import WorkOrder, LightPole, WorkOrderHistory, Evidence, User, EnergyReading
from .forms import (
    WorkOrderCreateForm, WorkOrderInspectForm, WorkOrderReviewForm,
    EvidenceUploadForm, AssignInspectorForm, AssignReviewerForm,
    ReturnOrderForm, WorkOrderFilterForm, DateRangeForm
)


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            return render(request, 'login.html', {'error': '用户名或密码错误'})
    
    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def dashboard(request):
    total_orders = WorkOrder.objects.count()
    pending_orders = WorkOrder.objects.filter(status='pending').count()
    in_progress_orders = WorkOrder.objects.filter(status__in=['assigned', 'in_progress', 'inspected']).count()
    archived_orders = WorkOrder.objects.filter(status='archived').count()
    energy_anomalies = WorkOrder.objects.filter(fault_type='energy_spike', status__in=['pending', 'assigned', 'in_progress', 'inspected', 'reviewing']).count()
    location_errors = WorkOrder.objects.filter(is_location_error=True).exclude(status='archived').count()
    
    recent_orders = WorkOrder.objects.select_related('light_pole', 'inspector', 'reviewer')[:10]
    
    context = {
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'in_progress_orders': in_progress_orders,
        'archived_orders': archived_orders,
        'energy_anomalies': energy_anomalies,
        'location_errors': location_errors,
        'recent_orders': recent_orders,
    }
    return render(request, 'dashboard.html', context)


@login_required
def work_order_list(request):
    form = WorkOrderFilterForm(request.GET or None)
    orders = WorkOrder.objects.select_related('light_pole', 'inspector', 'reviewer').all()
    
    if form.is_valid():
        status = form.cleaned_data.get('status')
        fault_type = form.cleaned_data.get('fault_type')
        area = form.cleaned_data.get('area')
        keyword = form.cleaned_data.get('keyword')
        
        if status:
            orders = orders.filter(status=status)
        if fault_type:
            orders = orders.filter(fault_type=fault_type)
        if area:
            orders = orders.filter(light_pole__area=area)
        if keyword:
            orders = orders.filter(
                Q(order_number__icontains=keyword) |
                Q(title__icontains=keyword) |
                Q(light_pole__pole_number__icontains=keyword)
            )
    
    if request.user.role == 'inspector':
        orders = orders.filter(inspector=request.user)
    elif request.user.role == 'reviewer':
        orders = orders.filter(reviewer=request.user)
    
    if request.headers.get('HX-Request'):
        return render(request, 'partials/order_list.html', {'orders': orders})
    
    context = {
        'orders': orders,
        'filter_form': form,
    }
    return render(request, 'order_list.html', context)


@login_required
def work_order_create(request):
    if request.method == 'POST':
        form = WorkOrderCreateForm(request.POST)
        if form.is_valid():
            order = form.save(commit=False)
            order.reporter = request.user
            order.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='create',
                operator=request.user,
                comment='创建工单',
                new_status=order.status
            )
            
            if request.headers.get('HX-Request'):
                return HttpResponse(headers={'HX-Redirect': f'/orders/{order.id}/'})
            return redirect('work_order_detail', pk=order.id)
    else:
        form = WorkOrderCreateForm()
    
    context = {'form': form}
    if request.headers.get('HX-Request'):
        return render(request, 'partials/order_form.html', context)
    return render(request, 'order_create.html', context)


@login_required
def work_order_detail(request, pk):
    order = get_object_or_404(WorkOrder.objects.select_related('light_pole', 'reporter', 'inspector', 'reviewer', 'energy_reading'), pk=pk)
    history = order.history.select_related('operator').all()
    evidences = order.evidences.select_related('uploaded_by').all()
    energy_readings = order.light_pole.energy_readings.all()[:7] if order.light_pole else []
    
    assign_inspector_form = AssignInspectorForm()
    assign_reviewer_form = AssignReviewerForm()
    inspect_form = WorkOrderInspectForm(instance=order)
    review_form = WorkOrderReviewForm(instance=order)
    return_form = ReturnOrderForm()
    evidence_form = EvidenceUploadForm()
    
    context = {
        'order': order,
        'history': history,
        'evidences': evidences,
        'energy_readings': energy_readings,
        'assign_inspector_form': assign_inspector_form,
        'assign_reviewer_form': assign_reviewer_form,
        'inspect_form': inspect_form,
        'review_form': review_form,
        'return_form': return_form,
        'evidence_form': evidence_form,
    }
    return render(request, 'order_detail.html', context)


@login_required
def work_order_assign_inspector(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if request.method == 'POST':
        form = AssignInspectorForm(request.POST)
        if form.is_valid():
            old_status = order.status
            order.inspector = form.cleaned_data['inspector']
            order.status = 'assigned'
            order.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='assign',
                operator=request.user,
                comment=f'指派巡检员: {order.inspector}',
                old_status=old_status,
                new_status=order.status
            )
            
            if request.headers.get('HX-Request'):
                return redirect('work_order_detail_partial', pk=pk)
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_start(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if order.status == 'assigned' and order.inspector == request.user:
        old_status = order.status
        order.status = 'in_progress'
        order.save()
        
        WorkOrderHistory.objects.create(
            work_order=order,
            action='start',
            operator=request.user,
            comment='开始处理工单',
            old_status=old_status,
            new_status=order.status
        )
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_complete_inspection(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if request.method == 'POST':
        form = WorkOrderInspectForm(request.POST, instance=order)
        if form.is_valid():
            old_status = order.status
            order.status = 'inspected'
            order.inspected_at = timezone.now()
            form.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='complete_inspection',
                operator=request.user,
                comment='完成巡检，提交复核',
                old_status=old_status,
                new_status=order.status
            )
            
            return redirect('work_order_detail', pk=pk)
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_assign_reviewer(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if request.method == 'POST':
        form = AssignReviewerForm(request.POST)
        if form.is_valid():
            old_status = order.status
            order.reviewer = form.cleaned_data['reviewer']
            order.status = 'reviewing'
            order.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='submit_review',
                operator=request.user,
                comment=f'指派复核人: {order.reviewer}',
                old_status=old_status,
                new_status=order.status
            )
            
            return redirect('work_order_detail', pk=pk)
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_return(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if request.method == 'POST':
        form = ReturnOrderForm(request.POST)
        if form.is_valid():
            old_status = order.status
            order.status = 'returned'
            order.rework_count += 1
            order.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='return',
                operator=request.user,
                comment=f'退回返工: {form.cleaned_data["reason"]}',
                old_status=old_status,
                new_status=order.status
            )
            
            return redirect('work_order_detail', pk=pk)
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_review_confirm(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if request.method == 'POST':
        form = WorkOrderReviewForm(request.POST, instance=order)
        if form.is_valid():
            old_status = order.status
            form.save()
            order.reviewed_at = timezone.now()
            order.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='review_confirm',
                operator=request.user,
                comment='复核确认完成，异常原因已记录',
                old_status=old_status,
                new_status=order.status
            )
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_archive(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if not order.can_archive():
        return JsonResponse({'success': False, 'message': '存在位置编号错误，无法归档！请先核对坐标或重新绑定设备。'}, status=400)
    
    old_status = order.status
    order.status = 'archived'
    order.archived_at = timezone.now()
    order.save()
    
    WorkOrderHistory.objects.create(
        work_order=order,
        action='archive',
        operator=request.user,
        comment='工单已归档',
        old_status=old_status,
        new_status=order.status
    )
    
    return redirect('work_order_detail', pk=pk)


@login_required
def work_order_detail_partial(request, pk):
    order = get_object_or_404(WorkOrder.objects.select_related('light_pole', 'inspector', 'reviewer'), pk=pk)
    return render(request, 'partials/order_detail_header.html', {'order': order})


@login_required
def evidence_upload(request, pk):
    order = get_object_or_404(WorkOrder, pk=pk)
    
    if request.method == 'POST':
        form = EvidenceUploadForm(request.POST, request.FILES)
        if form.is_valid():
            evidence = form.save(commit=False)
            evidence.work_order = order
            evidence.uploaded_by = request.user
            evidence.save()
            
            WorkOrderHistory.objects.create(
                work_order=order,
                action='add_evidence',
                operator=request.user,
                comment=f'上传证据: {evidence.get_evidence_type_display()}'
            )
    
    return redirect('work_order_detail', pk=pk)


@login_required
def review_page(request):
    form = DateRangeForm(request.GET or None)
    start_date = timezone.now().date() - timedelta(days=30)
    end_date = timezone.now().date()
    
    if form.is_valid():
        if form.cleaned_data.get('start_date'):
            start_date = form.cleaned_data['start_date']
        if form.cleaned_data.get('end_date'):
            end_date = form.cleaned_data['end_date']
    
    orders = WorkOrder.objects.filter(created_at__date__range=[start_date, end_date])
    
    total_orders = orders.count()
    
    by_area = orders.values('light_pole__area').annotate(
        count=Count('id'),
        archived=Count('id', filter=Q(status='archived')),
        total_reworks=Sum('rework_count')
    ).order_by('-count')
    
    for item in by_area:
        item['completion_rate'] = round((item['archived'] / item['count'] * 100), 1) if item['count'] > 0 else 0
        if item['total_reworks'] is None:
            item['total_reworks'] = 0
    
    by_fault_type = orders.values('fault_type').annotate(
        count=Count('id'),
        archived=Count('id', filter=Q(status='archived'))
    ).order_by('-count')
    
    for item in by_fault_type:
        item['completion_rate'] = round((item['archived'] / item['count'] * 100), 1) if item['count'] > 0 else 0
    
    energy_anomalies = orders.filter(fault_type='energy_spike').aggregate(
        total=Count('id'),
        resolved=Count('id', filter=Q(status='archived')),
        avg_energy_diff=Avg(F('actual_energy') - F('expected_energy'), filter=Q(actual_energy__isnull=False, expected_energy__isnull=False))
    )
    
    if energy_anomalies['total'] and energy_anomalies['total'] > 0:
        energy_anomalies['resolution_rate'] = round((energy_anomalies['resolved'] / energy_anomalies['total'] * 100), 1)
    else:
        energy_anomalies['resolution_rate'] = 0
    
    rework_stats = orders.filter(rework_count__gt=0).aggregate(
        total_rework_orders=Count('id'),
        total_reworks=Sum('rework_count')
    )
    
    if rework_stats['total_reworks'] is None:
        rework_stats['total_reworks'] = 0
    
    rework_by_inspector = orders.filter(rework_count__gt=0).values(
        'inspector__username', 'inspector__first_name', 'inspector__last_name'
    ).annotate(
        order_count=Count('id'),
        total_reworks=Sum('rework_count')
    ).order_by('-total_reworks')
    
    context = {
        'form': form,
        'start_date': start_date,
        'end_date': end_date,
        'total_orders': total_orders,
        'by_area': by_area,
        'by_fault_type': by_fault_type,
        'energy_anomalies': energy_anomalies,
        'rework_stats': rework_stats,
        'rework_by_inspector': rework_by_inspector,
    }
    return render(request, 'review.html', context)


@login_required
def light_pole_list(request):
    poles = LightPole.objects.all()
    area = request.GET.get('area')
    if area:
        poles = poles.filter(area=area)
    
    areas = LightPole.objects.values_list('area', flat=True).distinct()
    
    context = {
        'poles': poles,
        'areas': areas,
        'selected_area': area,
    }
    return render(request, 'light_pole_list.html', context)


@login_required
def light_pole_detail(request, pk):
    pole = get_object_or_404(LightPole, pk=pk)
    orders = pole.work_orders.all()[:10]
    energy_readings = pole.energy_readings.all()[:30]
    
    context = {
        'pole': pole,
        'orders': orders,
        'energy_readings': energy_readings,
    }
    return render(request, 'light_pole_detail.html', context)
