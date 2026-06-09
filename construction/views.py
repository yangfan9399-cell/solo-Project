from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.http import HttpResponse
from django.template.loader import render_to_string

from .models import (
    ConstructionPlan, BillboardLocation, Worker, WeatherRecord,
    AuditNode, DelayRecord, PlanWorker, Qualification, User
)
from .forms import (
    LoginForm, ConstructionPlanForm, DelayApplyForm,
    AuditForm, PlanWorkerForm
)


def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('construction:dashboard')
    else:
        form = LoginForm()
    return render(request, 'registration/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('construction:login')


@login_required
def dashboard(request):
    user = request.user
    my_plans = ConstructionPlan.objects.all()

    if user.role == 'constructor':
        my_plans = my_plans.filter(constructor_team=user)
    elif user.role == 'project_manager':
        my_plans = my_plans.filter(project_manager=user)
    elif user.role == 'safety_officer':
        my_plans = my_plans.filter(safety_officer=user)

    pending_count = my_plans.filter(status__in=['submitted', 'pm_reviewing', 'pm_approved', 'safety_reviewing']).count()
    in_progress_count = my_plans.filter(status__in=['ready', 'in_progress']).count()
    completed_count = my_plans.filter(status='accepted').count()
    rework_count = my_plans.filter(rework_count__gt=0).count()

    recent_plans = my_plans[:10]

    context = {
        'my_plans': my_plans,
        'pending_count': pending_count,
        'in_progress_count': in_progress_count,
        'completed_count': completed_count,
        'rework_count': rework_count,
        'recent_plans': recent_plans,
    }
    return render(request, 'construction/dashboard.html', context)


@login_required
def plan_list(request):
    status = request.GET.get('status', '')
    plans = ConstructionPlan.objects.all()

    if request.user.role == 'constructor':
        plans = plans.filter(constructor_team=request.user)
    elif request.user.role == 'project_manager':
        plans = plans.filter(project_manager=request.user)
    elif request.user.role == 'safety_officer':
        plans = plans.filter(safety_officer=request.user)

    if status:
        plans = plans.filter(status=status)

    if request.htmx:
        return render(request, 'construction/partials/plan_list.html', {'plans': plans})

    return render(request, 'construction/plan_list.html', {'plans': plans, 'current_status': status})


@login_required
def plan_create(request):
    if request.user.role != 'constructor':
        messages.error(request, '只有施工队可以创建施工计划')
        return redirect('construction:plan_list')

    if request.method == 'POST':
        form = ConstructionPlanForm(request.POST)
        if form.is_valid():
            plan = form.save(commit=False)
            plan.constructor_team = request.user
            plan.plan_no = f'JH{timezone.now().strftime("%Y%m%d%H%M%S")}'
            plan.status = 'draft'
            plan.save()
            messages.success(request, '施工计划创建成功')
            return redirect('construction:plan_detail', pk=plan.pk)
    else:
        form = ConstructionPlanForm()

    return render(request, 'construction/plan_form.html', {'form': form, 'mode': 'create'})


@login_required
def plan_edit(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user != plan.constructor_team and request.user.role not in ['admin']:
        messages.error(request, '无权限编辑此计划')
        return redirect('construction:plan_list')

    if plan.status not in ['draft', 'pm_rejected', 'safety_rejected', 'acceptance_rejected']:
        messages.error(request, '当前状态不允许编辑')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        form = ConstructionPlanForm(request.POST, instance=plan)
        if form.is_valid():
            form.save()
            messages.success(request, '施工计划已更新')
            return redirect('construction:plan_detail', pk=pk)
    else:
        form = ConstructionPlanForm(instance=plan)

    return render(request, 'construction/plan_form.html', {'form': form, 'plan': plan, 'mode': 'edit'})


@login_required
def plan_detail(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)
    plan_workers = PlanWorker.objects.filter(plan=plan).select_related('worker')
    audit_nodes = AuditNode.objects.filter(plan=plan).order_by('created_at')
    delay_records = DelayRecord.objects.filter(plan=plan).order_by('-created_at')
    current_weather = plan.current_weather
    safety_risks = plan.get_safety_risks()

    can_start, start_reason = plan.can_start_work(request.user)

    context = {
        'plan': plan,
        'plan_workers': plan_workers,
        'audit_nodes': audit_nodes,
        'delay_records': delay_records,
        'current_weather': current_weather,
        'safety_risks': safety_risks,
        'can_start': can_start,
        'start_reason': start_reason,
    }

    if request.htmx:
        return render(request, 'construction/partials/plan_detail_content.html', context)

    return render(request, 'construction/plan_detail.html', context)


@login_required
def plan_submit(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if not plan.can_submit(request.user):
        messages.error(request, '无权提交此计划')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        plan.status = 'submitted'
        plan.submit_time = timezone.now()
        plan.save()

        AuditNode.objects.create(
            plan=plan,
            node_type='submit',
            operator=request.user,
            status='completed',
            comment='提交施工计划'
        )

        messages.success(request, '计划已提交，等待项目经理审核')
        return redirect('construction:plan_detail', pk=pk)

    return render(request, 'construction/partials/confirm_submit.html', {'plan': plan})


@login_required
def plan_delete(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user != plan.constructor_team or plan.status != 'draft':
        messages.error(request, '无权删除此计划')
        return redirect('construction:plan_list')

    if request.method == 'POST':
        plan.delete()
        messages.success(request, '计划已删除')
        return redirect('construction:plan_list')

    return render(request, 'construction/partials/confirm_delete.html', {'plan': plan})


@login_required
def pm_review(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user.role != 'project_manager':
        messages.error(request, '只有项目经理可以审核')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        form = AuditForm(request.POST)
        action = request.POST.get('action', '')

        if form.is_valid():
            if action == 'approve':
                plan.status = 'pm_approved'
                plan.project_manager = request.user
                plan.save()

                AuditNode.objects.create(
                    plan=plan,
                    node_type='pm_review',
                    operator=request.user,
                    status='approved',
                    comment=form.cleaned_data['comment'] or '材料审核通过'
                )
                messages.success(request, '审核通过，已流转至安全员')
            elif action == 'reject':
                plan.status = 'pm_rejected'
                if plan.rework_count > 0:
                    pass
                plan.save()

                AuditNode.objects.create(
                    plan=plan,
                    node_type='pm_review',
                    operator=request.user,
                    status='rejected',
                    comment=form.cleaned_data['comment'] or '材料审核不通过'
                )
                messages.warning(request, '已退回施工队')

            return redirect('construction:plan_detail', pk=pk)
    else:
        form = AuditForm()

    return render(request, 'construction/partials/pm_review_form.html', {'form': form, 'plan': plan})


@login_required
def safety_review(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user.role != 'safety_officer':
        messages.error(request, '只有安全员可以审核')
        return redirect('construction:plan_detail', pk=pk)

    current_weather = plan.current_weather
    plan_workers = PlanWorker.objects.filter(plan=plan).select_related('worker')
    has_high_altitude_worker = any(pw.worker.has_valid_high_altitude_cert for pw in plan_workers)
    safety_risks = plan.get_safety_risks()

    if request.method == 'POST':
        form = AuditForm(request.POST)
        action = request.POST.get('action', '')

        if form.is_valid():
            if action == 'approve':
                if safety_risks:
                    risk_msg = '；'.join(safety_risks)
                    messages.error(request, f'存在安全风险，无法通过审核：{risk_msg}')
                    return redirect('construction:plan_detail', pk=pk)

                plan.status = 'safety_approved'
                plan.safety_officer = request.user
                plan.save()

                AuditNode.objects.create(
                    plan=plan,
                    node_type='safety_review',
                    operator=request.user,
                    status='approved',
                    comment=form.cleaned_data['comment'] or '安全审核通过'
                )
                messages.success(request, '安全审核通过，可以开工')
            elif action == 'reject':
                plan.status = 'safety_rejected'
                plan.save()

                AuditNode.objects.create(
                    plan=plan,
                    node_type='safety_review',
                    operator=request.user,
                    status='rejected',
                    comment=form.cleaned_data['comment'] or '安全审核不通过'
                )
                messages.warning(request, '安全审核不通过，已退回')

            return redirect('construction:plan_detail', pk=pk)
    else:
        form = AuditForm()

    context = {
        'form': form,
        'plan': plan,
        'current_weather': current_weather,
        'has_high_altitude_worker': has_high_altitude_worker,
        'plan_workers': plan_workers,
        'safety_risks': safety_risks,
    }
    return render(request, 'construction/partials/safety_review_form.html', context)


@login_required
def start_work(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    can_start, start_reason = plan.can_start_work(request.user)

    if request.method == 'POST':
        if not can_start:
            messages.error(request, start_reason)
            return redirect('construction:plan_detail', pk=pk)

        plan.status = 'in_progress'
        plan.actual_start_date = timezone.now().date()
        plan.save()

        AuditNode.objects.create(
            plan=plan,
            node_type='start_work',
            operator=request.user,
            status='completed',
            comment='确认开工'
        )
        messages.success(request, '已确认开工')
        return redirect('construction:plan_detail', pk=pk)

    return render(request, 'construction/partials/confirm_start.html', {
        'plan': plan,
        'can_start': can_start,
        'start_reason': start_reason,
    })


@login_required
def complete_work(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user.role != 'constructor' or request.user != plan.constructor_team:
        messages.error(request, '无权限操作')
        return redirect('construction:plan_detail', pk=pk)

    if plan.status != 'in_progress':
        messages.error(request, '当前状态不可完工')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        plan.status = 'completed'
        plan.actual_end_date = timezone.now().date()
        plan.save()

        AuditNode.objects.create(
            plan=plan,
            node_type='complete',
            operator=request.user,
            status='completed',
            comment='施工完成，申请验收'
        )
        messages.success(request, '已提交完工申请，等待验收')
        return redirect('construction:plan_detail', pk=pk)

    return render(request, 'construction/partials/confirm_complete.html', {'plan': plan})


@login_required
def acceptance(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user.role != 'acceptor':
        messages.error(request, '只有验收人可以验收')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        form = AuditForm(request.POST)
        action = request.POST.get('action', '')

        if form.is_valid():
            if action == 'accept':
                plan.status = 'accepted'
                plan.accept_time = timezone.now()
                plan.save()

                AuditNode.objects.create(
                    plan=plan,
                    node_type='acceptance',
                    operator=request.user,
                    status='approved',
                    comment=form.cleaned_data['comment'] or '验收通过，已归档'
                )
                messages.success(request, '验收通过，已归档')
            elif action == 'reject':
                plan.status = 'acceptance_rejected'
                plan.rework_count = plan.rework_count + 1
                plan.save()

                AuditNode.objects.create(
                    plan=plan,
                    node_type='acceptance',
                    operator=request.user,
                    status='rejected',
                    comment=form.cleaned_data['comment'] or '验收不通过，需返工'
                )

                AuditNode.objects.create(
                    plan=plan,
                    node_type='rework',
                    operator=request.user,
                    status='completed',
                    comment=f'第{plan.rework_count}次返工'
                )
                messages.warning(request, '验收不通过，需返工')

            return redirect('construction:plan_detail', pk=pk)
    else:
        form = AuditForm()

    return render(request, 'construction/partials/acceptance_form.html', {'form': form, 'plan': plan})


@login_required
def delay_apply(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user.role != 'constructor' or request.user != plan.constructor_team:
        messages.error(request, '只有施工队可以申请延期')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        form = DelayApplyForm(request.POST)
        if form.is_valid():
            delay = form.save(commit=False)
            delay.plan = plan
            delay.applicant = request.user
            delay.original_date = plan.planned_end_date
            from datetime import timedelta
            delay.new_date = plan.planned_end_date + timedelta(days=form.cleaned_data['delay_days'])
            delay.save()

            AuditNode.objects.create(
                plan=plan,
                node_type='delay',
                operator=request.user,
                status='pending',
                comment=f'申请延期{delay.delay_days}天，原因：{delay.get_delay_type_display()}'
            )

            plan.has_delay = True
            plan.save()

            messages.success(request, '延期申请已提交')
            return redirect('construction:plan_detail', pk=pk)
    else:
        form = DelayApplyForm()

    return render(request, 'construction/partials/delay_form.html', {'form': form, 'plan': plan})


@login_required
def delay_approve(request, pk, delay_id):
    plan = get_object_or_404(ConstructionPlan, pk=pk)
    delay = get_object_or_404(DelayRecord, pk=delay_id, plan=plan)

    if request.user.role not in ['project_manager', 'safety_officer']:
        messages.error(request, '无权限审批')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        delay.approved = True
        delay.approver = request.user
        delay.approved_at = timezone.now()
        delay.save()

        from datetime import timedelta
        plan.planned_end_date = plan.planned_end_date + timedelta(days=delay.delay_days)
        plan.save()

        node = plan.nodes.filter(node_type='delay', status='pending').first()
        if node:
            node.status = 'approved'
            node.comment += ' - 已批准'
            node.save()

        messages.success(request, '延期已批准')
        return redirect('construction:plan_detail', pk=pk)

    return render(request, 'construction/partials/confirm_delay_approve.html', {'plan': plan, 'delay': delay})


@login_required
def delay_reject(request, pk, delay_id):
    plan = get_object_or_404(ConstructionPlan, pk=pk)
    delay = get_object_or_404(DelayRecord, pk=delay_id, plan=plan)

    if request.user.role not in ['project_manager', 'safety_officer']:
        messages.error(request, '无权限审批')
        return redirect('construction:plan_detail', pk=pk)

    if request.method == 'POST':
        delay.approved = False
        delay.approver = request.user
        delay.approved_at = timezone.now()
        delay.save()

        node = plan.nodes.filter(node_type='delay', status='pending').first()
        if node:
            node.status = 'rejected'
            node.comment += ' - 已驳回'
            node.save()

        messages.warning(request, '延期已驳回')
        return redirect('construction:plan_detail', pk=pk)

    return render(request, 'construction/partials/confirm_delay_reject.html', {'plan': plan, 'delay': delay})


@login_required
def manage_workers(request, pk):
    plan = get_object_or_404(ConstructionPlan, pk=pk)

    if request.user.role != 'constructor' or request.user != plan.constructor_team:
        messages.error(request, '无权限管理')
        return redirect('construction:plan_detail', pk=pk)

    if plan.status not in ['draft', 'pm_rejected', 'safety_rejected']:
        messages.error(request, '当前状态不可修改施工人员')
        return redirect('construction:plan_detail', pk=pk)

    current_workers = PlanWorker.objects.filter(plan=plan).values_list('worker_id', flat=True)

    if request.method == 'POST':
        selected_worker_ids = request.POST.getlist('workers')

        PlanWorker.objects.filter(plan=plan).exclude(worker_id__in=selected_worker_ids).delete()

        for wid in selected_worker_ids:
            PlanWorker.objects.get_or_create(
                plan=plan,
                worker_id=wid,
                defaults={'role': '施工员'}
            )

        messages.success(request, '施工人员已更新')
        return redirect('construction:plan_detail', pk=pk)

    workers = Worker.objects.filter(is_active=True)
    return render(request, 'construction/partials/manage_workers.html', {
        'plan': plan,
        'workers': workers,
        'current_workers': list(current_workers),
    })


@login_required
def location_list(request):
    locations = BillboardLocation.objects.filter(is_active=True)
    return render(request, 'construction/location_list.html', {'locations': locations})


@login_required
def worker_list(request):
    workers = Worker.objects.filter(is_active=True).prefetch_related('qualification_set')
    return render(request, 'construction/worker_list.html', {'workers': workers})


@login_required
def weather_list(request):
    city = request.GET.get('city', '')
    weathers = WeatherRecord.objects.all().order_by('-record_date')

    if city:
        weathers = weathers.filter(location__city=city)

    cities = BillboardLocation.objects.values_list('city', flat=True).distinct()

    return render(request, 'construction/weather_list.html', {
        'weathers': weathers[:30],
        'cities': cities,
        'current_city': city,
    })


@login_required
def board(request):
    plans = ConstructionPlan.objects.all()

    by_city = plans.values('location__city').annotate(
        total=Count('id'),
        completed=Count('id', filter=Q(status='accepted')),
        delayed=Count('id', filter=Q(has_delay=True)),
    ).order_by('-total')

    by_type = plans.values('location__location_type').annotate(
        total=Count('id'),
        completed=Count('id', filter=Q(status='accepted')),
    ).order_by('-total')

    by_delay_reason = DelayRecord.objects.filter(approved=True).values('delay_type').annotate(
        count=Count('id'),
        total_days=Sum('delay_days'),
    ).order_by('-count')

    by_rework = plans.filter(rework_count__gt=0).values('rework_count').annotate(
        count=Count('id')
    ).order_by('rework_count')

    status_summary = plans.values('status').annotate(count=Count('id')).order_by('status')

    wind_warning_count = WeatherRecord.objects.filter(has_wind_warning=True).count()
    total_locations = BillboardLocation.objects.filter(is_active=True).count()
    total_plans = plans.count()
    accepted_plans = plans.filter(status='accepted').count()

    context = {
        'by_city': by_city,
        'by_type': by_type,
        'by_delay_reason': by_delay_reason,
        'by_rework': by_rework,
        'status_summary': status_summary,
        'wind_warning_count': wind_warning_count,
        'total_locations': total_locations,
        'total_plans': total_plans,
        'accepted_plans': accepted_plans,
    }

    return render(request, 'construction/board.html', context)
