from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.utils import timezone
from django.db.models import Count, Q
from .models import (
    Elevator,
    FaultTicket,
    MaintenancePlan,
    ActionLog,
    Part,
    MaintenanceCompany,
)


def index(request):
    return redirect('ticket_list')


@login_required
def dashboard(request):
    ticket_stats = FaultTicket.objects.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status__in=['reported', 'confirmed', 'dispatched'])),
        in_progress=Count('id', filter=Q(status__in=['parts_waiting', 'in_repair', 'repaired'])),
        completed=Count('id', filter=Q(status__in=['reviewing', 'returned', 'archived']))
    )
    
    elevator_stats = Elevator.objects.aggregate(
        total=Count('id'),
        running=Count('id', filter=Q(status='running')),
        stopped=Count('id', filter=Q(status__in=['stopped', 'maintenance', 'fault']))
    )
    
    recent_tickets = FaultTicket.objects.all()[:5]
    upcoming_plans = MaintenancePlan.objects.filter(status='pending')[:5]
    
    context = {
        'ticket_stats': ticket_stats,
        'elevator_stats': elevator_stats,
        'recent_tickets': recent_tickets,
        'upcoming_plans': upcoming_plans,
    }
    return render(request, 'maintenance/dashboard.html', context)


@login_required
def ticket_list(request):
    status_filter = request.GET.get('status', '')
    search = request.GET.get('search', '')
    
    tickets = FaultTicket.objects.all().select_related('elevator', 'current_responsible')
    
    if status_filter:
        tickets = tickets.filter(status=status_filter)
    
    if search:
        tickets = tickets.filter(
            Q(elevator__elevator_number__icontains=search) |
            Q(fault_description__icontains=search)
        )
    
    context = {
        'tickets': tickets,
        'status_filter': status_filter,
        'status_choices': FaultTicket.STATUS_CHOICES,
        'search': search,
    }
    return render(request, 'maintenance/ticket_list.html', context)


@login_required
def ticket_detail(request, pk):
    ticket = get_object_or_404(
        FaultTicket.objects.select_related(
            'elevator', 'stop_confirmation_by', 'assigned_to',
            'reviewed_by', 'current_responsible', 'previous_ticket'
        ).prefetch_related('action_logs', 'parts_needed'),
        pk=pk
    )
    
    context = {
        'ticket': ticket,
        'status_colors': get_status_colors(),
    }
    return render(request, 'maintenance/ticket_detail.html', context)


@login_required
def confirm_stop(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        old_status = ticket.status
        
        ticket.status = 'confirmed'
        ticket.stop_confirmation_by = request.user
        ticket.stop_confirmation_time = timezone.now()
        ticket.current_responsible = None
        ticket.save()
        
        ActionLog.objects.create(
            ticket=ticket,
            action_type='confirm_stop',
            description='物业经办人已确认停梯，电梯已停止运行',
            performed_by=request.user,
            from_status=old_status,
            to_status='confirmed'
        )
        
        if request.htmx:
            return render(request, 'maintenance/partials/ticket_status_badge.html', {'ticket': ticket})
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def dispatch_ticket(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        old_status = ticket.status
        assigned_to_id = request.POST.get('assigned_to')
        
        from django.contrib.auth.models import User
        assigned_to = get_object_or_404(User, pk=assigned_to_id)
        
        elevator_company = ticket.elevator.maintenance_company
        user_company = None
        if hasattr(assigned_to, 'userprofile'):
            user_company = assigned_to.userprofile.company
        
        company_mismatch = elevator_company and user_company and elevator_company != user_company
        
        ticket.status = 'dispatched'
        ticket.assigned_to = assigned_to
        ticket.assigned_time = timezone.now()
        ticket.current_responsible = assigned_to
        ticket.company_mismatch = company_mismatch
        if company_mismatch:
            ticket.mismatch_note = f"电梯维保单位为{ticket.elevator.maintenance_company.name}，派单给了{user_company.name}的维保人员"
        ticket.save()
        
        ActionLog.objects.create(
            ticket=ticket,
            action_type='dispatch',
            description=f'已派单给{assigned_to.get_full_name()}处理',
            performed_by=request.user,
            from_status=old_status,
            to_status='dispatched'
        )
        
        if request.htmx:
            return _render_ticket_detail_partial(request, ticket)
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def mark_parts_waiting(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        old_status = ticket.status
        note = request.POST.get('note', '')
        
        ticket.status = 'parts_waiting'
        ticket.save()
        
        ActionLog.objects.create(
            ticket=ticket,
            action_type='parts_wait',
            description=f'等待配件：{note}' if note else '配件待到货，暂停维修',
            performed_by=request.user,
            from_status=old_status,
            to_status='parts_waiting'
        )
        
        if request.htmx:
            return _render_ticket_detail_partial(request, ticket)
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def start_repair(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        old_status = ticket.status
        
        ticket.status = 'in_repair'
        ticket.repair_start_time = timezone.now()
        ticket.save()
        
        ActionLog.objects.create(
            ticket=ticket,
            action_type='start_repair',
            description='维保人员已到达现场，开始维修',
            performed_by=request.user,
            from_status=old_status,
            to_status='in_repair'
        )
        
        if request.htmx:
            return _render_ticket_detail_partial(request, ticket)
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def complete_repair(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        old_status = ticket.status
        
        repair_description = request.POST.get('repair_description', '')
        repair_parts_used = request.POST.get('repair_parts_used', '')
        
        ticket.status = 'repaired'
        ticket.repair_end_time = timezone.now()
        ticket.repair_description = repair_description
        ticket.repair_parts_used = repair_parts_used
        
        from django.contrib.auth.models import User
        reviewer = User.objects.filter(userprofile__role='property_reviewer').first()
        ticket.current_responsible = reviewer
        ticket.save()
        
        ActionLog.objects.create(
            ticket=ticket,
            action_type='complete_repair',
            description='维修完成，提交物业复核',
            performed_by=request.user,
            from_status=old_status,
            to_status='repaired'
        )
        
        if request.htmx:
            return _render_ticket_detail_partial(request, ticket)
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def review_ticket(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        action = request.POST.get('action')
        comment = request.POST.get('comment', '')
        old_status = ticket.status
        
        if action == 'pass':
            if ticket.is_repeat_fault and not ticket.can_archive():
                return JsonResponse({
                    'success': False,
                    'error': '重复故障工单必须关联上次维修记录并说明差异后才能归档'
                }, status=400)
            
            ticket.status = 'reviewing'
            ticket.reviewed_by = request.user
            ticket.review_time = timezone.now()
            ticket.review_comment = comment
            ticket.elevator.status = 'running'
            ticket.elevator.save()
            
            ActionLog.objects.create(
                ticket=ticket,
                action_type='review_pass',
                description=f'复核通过：{comment}' if comment else '复核通过，电梯恢复运行',
                performed_by=request.user,
                from_status=old_status,
                to_status='reviewing'
            )
            
            ticket.status = 'archived'
            ticket.archived_at = timezone.now()
            ticket.current_responsible = None
            ticket.save()
            
            ActionLog.objects.create(
                ticket=ticket,
                action_type='archive',
                description='工单已归档',
                performed_by=request.user,
                from_status='reviewing',
                to_status='archived'
            )
            
        elif action == 'return':
            ticket.status = 'returned'
            ticket.reviewed_by = request.user
            ticket.review_time = timezone.now()
            ticket.review_comment = comment
            ticket.current_responsible = ticket.assigned_to
            ticket.save()
            
            ActionLog.objects.create(
                ticket=ticket,
                action_type='review_return',
                description=f'复核退回：{comment}' if comment else '复核退回，需要重新处理',
                performed_by=request.user,
                from_status=old_status,
                to_status='returned'
            )
        
        if request.htmx:
            return _render_ticket_detail_partial(request, ticket)
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def add_note(request, pk):
    if request.method == 'POST':
        ticket = get_object_or_404(FaultTicket, pk=pk)
        note = request.POST.get('note', '')
        
        if note:
            ActionLog.objects.create(
                ticket=ticket,
                action_type='note',
                description=note,
                performed_by=request.user
            )
        
        if request.htmx:
            return render(request, 'maintenance/partials/action_logs.html', {'ticket': ticket})
        return redirect('ticket_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def elevator_list(request):
    elevators = Elevator.objects.all().select_related('maintenance_company')
    context = {'elevators': elevators}
    return render(request, 'maintenance/elevator_list.html', context)


@login_required
def elevator_detail(request, pk):
    elevator = get_object_or_404(Elevator, pk=pk)
    tickets = FaultTicket.objects.filter(elevator=elevator)[:10]
    plans = MaintenancePlan.objects.filter(elevator=elevator)[:5]
    context = {
        'elevator': elevator,
        'tickets': tickets,
        'plans': plans,
    }
    return render(request, 'maintenance/elevator_detail.html', context)


@login_required
def plan_list(request):
    plans = MaintenancePlan.objects.all().select_related('elevator', 'assigned_to', 'current_responsible')
    context = {'plans': plans}
    return render(request, 'maintenance/plan_list.html', context)


@login_required
def plan_detail(request, pk):
    plan = get_object_or_404(
        MaintenancePlan.objects.select_related(
            'elevator', 'assigned_to', 'created_by',
            'current_responsible', 'reviewed_by'
        ).prefetch_related('action_logs', 'maintenancerecord_set'),
        pk=pk
    )
    records = plan.maintenancerecord_set.all().order_by('-created_at')
    context = {
        'plan': plan,
        'records': records,
        'status_colors': get_plan_status_colors(),
    }
    return render(request, 'maintenance/plan_detail.html', context)


@login_required
def start_plan(request, pk):
    if request.method == 'POST':
        plan = get_object_or_404(MaintenancePlan, pk=pk)
        old_status = plan.status
        
        plan.status = 'in_progress'
        plan.current_responsible = plan.assigned_to
        plan.save()
        
        ActionLog.objects.create(
            plan=plan,
            action_type='plan_start',
            description='维保人员已开始执行按期维保',
            performed_by=request.user,
            from_status=old_status,
            to_status='in_progress'
        )
        
        if request.htmx:
            return _render_plan_detail_partial(request, plan)
        return redirect('maintenance:plan_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def submit_plan_record(request, pk):
    if request.method == 'POST':
        plan = get_object_or_404(MaintenancePlan, pk=pk)
        old_status = plan.status
        
        check_items = {
            'traction_system': request.POST.get('traction_system', ''),
            'guide_system': request.POST.get('guide_system', ''),
            'door_system': request.POST.get('door_system', ''),
            'safety_device': request.POST.get('safety_device', ''),
            'electrical_system': request.POST.get('electrical_system', ''),
            'car_system': request.POST.get('car_system', ''),
        }
        abnormal_items = request.POST.get('abnormal_items', '')
        handling_result = request.POST.get('handling_result', '')
        parts_replaced = request.POST.get('parts_replaced', '')
        
        from django.contrib.auth.models import User
        reviewer = User.objects.filter(userprofile__role='property_reviewer').first()
        
        MaintenanceRecord.objects.create(
            plan=plan,
            elevator=plan.elevator,
            check_items=check_items,
            abnormal_items=abnormal_items,
            handling_result=handling_result,
            parts_replaced=parts_replaced,
            maintenance_staff=request.user
        )
        
        plan.status = 'submitted'
        plan.submitted_at = timezone.now()
        plan.current_responsible = reviewer
        plan.save()
        
        ActionLog.objects.create(
            plan=plan,
            action_type='plan_submit',
            description='维保记录已提交，等待物业复核',
            performed_by=request.user,
            from_status=old_status,
            to_status='submitted'
        )
        
        if request.htmx:
            return _render_plan_detail_partial(request, plan)
        return redirect('maintenance:plan_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def review_plan(request, pk):
    if request.method == 'POST':
        plan = get_object_or_404(MaintenancePlan, pk=pk)
        old_status = plan.status
        action = request.POST.get('action')
        comment = request.POST.get('comment', '')
        
        if action == 'pass':
            plan.status = 'approved'
            plan.reviewed_by = request.user
            plan.reviewed_at = timezone.now()
            plan.review_comment = comment
            plan.elevator.last_maintenance_date = timezone.now().date()
            plan.elevator.save()
            
            ActionLog.objects.create(
                plan=plan,
                action_type='plan_review_pass',
                description=f'复核通过：{comment}' if comment else '复核通过，电梯恢复正常运行',
                performed_by=request.user,
                from_status=old_status,
                to_status='approved'
            )
            
            plan.status = 'completed'
            plan.completed_at = timezone.now()
            plan.archived_at = timezone.now()
            plan.current_responsible = None
            plan.save()
            
            ActionLog.objects.create(
                plan=plan,
                action_type='plan_complete',
                description='维保计划已完成归档',
                performed_by=request.user,
                from_status='approved',
                to_status='completed'
            )
            
        elif action == 'return':
            plan.status = 'returned'
            plan.reviewed_by = request.user
            plan.reviewed_at = timezone.now()
            plan.review_comment = comment
            plan.current_responsible = plan.assigned_to
            plan.save()
            
            ActionLog.objects.create(
                plan=plan,
                action_type='plan_review_return',
                description=f'复核退回：{comment}' if comment else '复核退回，请重新填写维保记录',
                performed_by=request.user,
                from_status=old_status,
                to_status='returned'
            )
        
        if request.htmx:
            return _render_plan_detail_partial(request, plan)
        return redirect('maintenance:plan_detail', pk=pk)
    return HttpResponse(status=405)


@login_required
def add_plan_note(request, pk):
    if request.method == 'POST':
        plan = get_object_or_404(MaintenancePlan, pk=pk)
        note = request.POST.get('note', '')
        
        if note:
            ActionLog.objects.create(
                plan=plan,
                action_type='note',
                description=note,
                performed_by=request.user
            )
        
        if request.htmx:
            return render(request, 'maintenance/partials/plan_action_logs.html', {'plan': plan})
        return redirect('maintenance:plan_detail', pk=pk)
    return HttpResponse(status=405)


def _render_plan_detail_partial(request, plan):
    records = plan.maintenancerecord_set.all().order_by('-created_at')
    return render(request, 'maintenance/partials/plan_detail_content.html', {
        'plan': plan,
        'records': records,
        'status_colors': get_plan_status_colors(),
        'request': request,
    })


def get_plan_status_colors():
    return {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'submitted': 'bg-orange-100 text-orange-800',
        'reviewing': 'bg-teal-100 text-teal-800',
        'approved': 'bg-green-100 text-green-800',
        'returned': 'bg-red-100 text-red-800',
        'completed': 'bg-gray-100 text-gray-800',
        'cancelled': 'bg-gray-200 text-gray-600',
    }


def _render_ticket_detail_partial(request, ticket):
    return render(request, 'maintenance/partials/ticket_detail_content.html', {
        'ticket': ticket,
        'status_colors': get_status_colors(),
        'request': request,
    })


def get_status_colors():
    return {
        'reported': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-orange-100 text-orange-800',
        'dispatched': 'bg-blue-100 text-blue-800',
        'parts_waiting': 'bg-purple-100 text-purple-800',
        'in_repair': 'bg-indigo-100 text-indigo-800',
        'repaired': 'bg-green-100 text-green-800',
        'reviewing': 'bg-teal-100 text-teal-800',
        'returned': 'bg-red-100 text-red-800',
        'archived': 'bg-gray-100 text-gray-800',
    }
