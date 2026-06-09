from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models import Count, Sum, Avg, F, Q
from django.db.models.functions import TruncDate, ExtractHour
from django.http import HttpResponseForbidden, JsonResponse
from datetime import timedelta

from .models import (
    District, Vehicle, Route, Station, RouteAssignment,
    CheckIn, VehicleFault, Complaint, ReviewRecord, RouteEvent
)
from accounts.models import Role


def _get_user_role(user):
    if hasattr(user, 'profile'):
        return user.profile.role
    return None


def _is_dispatcher(user):
    return _get_user_role(user) == Role.DISPATCHER


def _is_driver(user):
    return _get_user_role(user) == Role.DRIVER


def _is_inspector(user):
    return _get_user_role(user) == Role.INSPECTOR


def _is_supervisor(user):
    return _get_user_role(user) == Role.SUPERVISOR


def _add_event(assignment, event_type, description, user):
    RouteEvent.objects.create(
        assignment=assignment,
        event_type=event_type,
        description=description,
        created_by=user
    )


@login_required
def dashboard(request):
    today = timezone.localdate()
    role = _get_user_role(request.user)

    today_assignments_qs = RouteAssignment.objects.filter(assigned_date=today)

    if role == Role.DRIVER:
        today_assignments_qs = today_assignments_qs.filter(driver=request.user)
    elif role == Role.INSPECTOR:
        pass
    elif role == Role.DISPATCHER:
        pass
    elif role == Role.SUPERVISOR:
        pass

    pending_count = today_assignments_qs.filter(status=RouteAssignment.Status.PENDING).count()
    in_progress_count = today_assignments_qs.filter(status=RouteAssignment.Status.IN_PROGRESS).count()
    completed_count = today_assignments_qs.filter(status=RouteAssignment.Status.COMPLETED).count()
    suspended_count = today_assignments_qs.filter(status=RouteAssignment.Status.SUSPENDED).count()

    pending_complaints = Complaint.objects.filter(status=Complaint.Status.PENDING).count()
    open_faults = VehicleFault.objects.filter(status__in=[
        VehicleFault.Status.REPORTED,
        VehicleFault.Status.BEING_REPAIRED
    ]).count()

    today_assignments = []
    for a in today_assignments_qs[:10]:
        total = a.total_stations()
        checked = a.checked_in_stations()
        progress = round(checked / total * 100, 1) if total > 0 else 0
        today_assignments.append({
            'obj': a,
            'progress': progress,
        })

    context = {
        'today': today,
        'role': role,
        'today_assignments': today_assignments,
        'pending_count': pending_count,
        'in_progress_count': in_progress_count,
        'completed_count': completed_count,
        'suspended_count': suspended_count,
        'pending_complaints': pending_complaints,
        'open_faults': open_faults,
        'is_dispatcher': _is_dispatcher(request.user),
        'is_driver': _is_driver(request.user),
        'is_inspector': _is_inspector(request.user),
        'is_supervisor': _is_supervisor(request.user),
    }
    return render(request, 'operations/dashboard.html', context)


@login_required
def assignment_list(request):
    status = request.GET.get('status', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    district_id = request.GET.get('district', '')

    assignments = RouteAssignment.objects.all()

    if status:
        assignments = assignments.filter(status=status)
    if date_from:
        assignments = assignments.filter(assigned_date__gte=date_from)
    if date_to:
        assignments = assignments.filter(assigned_date__lte=date_to)
    if district_id:
        assignments = assignments.filter(route__district_id=district_id)

    districts = District.objects.all()

    assignment_list = []
    for a in assignments[:50]:
        total = a.total_stations()
        checked = a.checked_in_stations()
        progress = round(checked / total * 100, 1) if total > 0 else 0
        assignment_list.append({
            'obj': a,
            'progress': progress,
        })

    context = {
        'assignments': assignment_list,
        'districts': districts,
        'status_choices': RouteAssignment.Status.choices,
        'filter_status': status,
        'filter_date_from': date_from,
        'filter_date_to': date_to,
        'filter_district': district_id,
        'is_dispatcher': _is_dispatcher(request.user),
        'is_driver': _is_driver(request.user),
        'is_inspector': _is_inspector(request.user),
        'is_supervisor': _is_supervisor(request.user),
    }
    return render(request, 'operations/assignment_list.html', context)


@login_required
def assignment_detail(request, pk):
    assignment = get_object_or_404(RouteAssignment, pk=pk)
    check_ins = assignment.check_ins.select_related('station').order_by('check_in_time')
    events = assignment.events.select_related('created_by').order_by('-created_at')
    faults = assignment.faults.all()
    complaints = assignment.complaints.all()
    reviews = assignment.reviews.all()

    checkin_map = {c.station_id: c for c in check_ins}
    stations = assignment.route.stations.order_by('order')
    station_checkins = []
    for station in stations:
        station_checkins.append({
            'station': station,
            'checkin': checkin_map.get(station.id),
        })

    checked_station_ids = check_ins.values_list('station_id', flat=True)
    missed_stations = assignment.route.stations.exclude(id__in=checked_station_ids)

    context = {
        'assignment': assignment,
        'check_ins': check_ins,
        'station_checkins': station_checkins,
        'events': events,
        'faults': faults,
        'complaints': complaints,
        'reviews': reviews,
        'missed_stations': missed_stations,
        'is_driver': _is_driver(request.user),
        'is_dispatcher': _is_dispatcher(request.user),
        'is_inspector': _is_inspector(request.user),
        'is_supervisor': _is_supervisor(request.user),
    }
    return render(request, 'operations/assignment_detail.html', context)


@login_required
def assignment_create(request):
    if not _is_dispatcher(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限访问')

    if request.method == 'POST':
        route_id = request.POST.get('route')
        vehicle_id = request.POST.get('vehicle')
        driver_id = request.POST.get('driver')
        assigned_date = request.POST.get('assigned_date')
        scheduled_start_time = request.POST.get('scheduled_start_time')
        notes = request.POST.get('notes', '')

        route = get_object_or_404(Route, pk=route_id)
        vehicle = get_object_or_404(Vehicle, pk=vehicle_id)
        from django.contrib.auth.models import User
        driver = get_object_or_404(User, pk=driver_id)

        assignment = RouteAssignment.objects.create(
            route=route,
            vehicle=vehicle,
            driver=driver,
            dispatcher=request.user,
            assigned_date=assigned_date or timezone.localdate(),
            scheduled_start_time=scheduled_start_time or None,
            notes=notes
        )

        _add_event(
            assignment,
            RouteEvent.Type.ASSIGNED,
            f'调度员 {request.user.profile.real_name or request.user.username} 分派任务',
            request.user
        )

        messages.success(request, '任务创建成功')
        return redirect('operations:assignment_detail', pk=assignment.pk)

    routes = Route.objects.filter(is_active=True)
    vehicles = Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE)
    from django.contrib.auth.models import User
    drivers = User.objects.filter(profile__role=Role.DRIVER)

    context = {
        'routes': routes,
        'vehicles': vehicles,
        'drivers': drivers,
        'today': timezone.localdate(),
    }
    return render(request, 'operations/assignment_form.html', context)


@login_required
def assignment_start(request, pk):
    assignment = get_object_or_404(RouteAssignment, pk=pk)

    if not (_is_driver(request.user) and assignment.driver == request.user) \
            and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if assignment.status != RouteAssignment.Status.PENDING:
        messages.error(request, '只有待出发状态的任务可以开始')
        return redirect('operations:assignment_detail', pk=pk)

    assignment.status = RouteAssignment.Status.IN_PROGRESS
    assignment.actual_start_time = timezone.now()
    assignment.save()

    assignment.vehicle.status = Vehicle.Status.IN_SERVICE
    assignment.vehicle.save()

    _add_event(
        assignment,
        RouteEvent.Type.STARTED,
        f'司机 {request.user.profile.real_name or request.user.username} 开始作业',
        request.user
    )

    messages.success(request, '任务已开始')
    return redirect('operations:assignment_detail', pk=pk)


@login_required
def assignment_complete(request, pk):
    assignment = get_object_or_404(RouteAssignment, pk=pk)

    if not (_is_driver(request.user) and assignment.driver == request.user) \
            and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if assignment.status != RouteAssignment.Status.IN_PROGRESS:
        messages.error(request, '只有进行中的任务可以完成')
        return redirect('operations:assignment_detail', pk=pk)

    assignment.status = RouteAssignment.Status.COMPLETED
    assignment.actual_end_time = timezone.now()
    assignment.save()

    assignment.vehicle.status = Vehicle.Status.AVAILABLE
    assignment.vehicle.save()

    _add_event(
        assignment,
        RouteEvent.Type.COMPLETED,
        f'司机 {request.user.profile.real_name or request.user.username} 完成作业',
        request.user
    )

    messages.success(request, '任务已完成')
    return redirect('operations:assignment_detail', pk=pk)


@login_required
def assignment_suspend(request, pk):
    assignment = get_object_or_404(RouteAssignment, pk=pk)

    if not _is_dispatcher(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if assignment.status != RouteAssignment.Status.IN_PROGRESS:
        messages.error(request, '只有进行中的任务可以暂停')
        return redirect('operations:assignment_detail', pk=pk)

    assignment.status = RouteAssignment.Status.SUSPENDED
    assignment.save()

    _add_event(
        assignment,
        RouteEvent.Type.SUSPENDED,
        f'调度员 {request.user.profile.real_name or request.user.username} 暂停任务',
        request.user
    )

    messages.success(request, '任务已暂停')
    return redirect('operations:assignment_detail', pk=pk)


@login_required
def assignment_resume(request, pk):
    assignment = get_object_or_404(RouteAssignment, pk=pk)

    if not _is_dispatcher(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if assignment.status != RouteAssignment.Status.SUSPENDED:
        messages.error(request, '只有已暂停的任务可以恢复')
        return redirect('operations:assignment_detail', pk=pk)

    open_faults = assignment.faults.filter(
        status__in=[VehicleFault.Status.REPORTED, VehicleFault.Status.BEING_REPAIRED]
    ).exists()
    if open_faults:
        messages.error(request, '该任务存在未解决的车辆故障，请先改派车辆或解决故障后再恢复任务')
        return redirect('operations:assignment_detail', pk=pk)

    if assignment.vehicle.status == Vehicle.Status.FAULTY:
        messages.error(request, '当前车辆处于故障状态，请先改派车辆或维修车辆')
        return redirect('operations:assignment_detail', pk=pk)

    assignment.status = RouteAssignment.Status.IN_PROGRESS
    assignment.save()

    _add_event(
        assignment,
        RouteEvent.Type.RESUMED,
        f'调度员 {request.user.profile.real_name or request.user.username} 恢复任务',
        request.user
    )

    messages.success(request, '任务已恢复')
    return redirect('operations:assignment_detail', pk=pk)


@login_required
def assignment_reassign(request, pk):
    assignment = get_object_or_404(RouteAssignment, pk=pk)

    if not _is_dispatcher(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        vehicle_id = request.POST.get('vehicle')
        driver_id = request.POST.get('driver')
        reason = request.POST.get('reason', '')

        old_vehicle = assignment.vehicle
        old_vehicle.status = Vehicle.Status.AVAILABLE
        old_vehicle.save()

        from django.contrib.auth.models import User
        new_vehicle = get_object_or_404(Vehicle, pk=vehicle_id)
        new_driver = get_object_or_404(User, pk=driver_id)

        new_vehicle.status = Vehicle.Status.IN_SERVICE
        new_vehicle.save()

        assignment.vehicle = new_vehicle
        assignment.driver = new_driver
        assignment.save()

        _add_event(
            assignment,
            RouteEvent.Type.REASSIGNED,
            f'改派车辆：{new_vehicle.plate_number}，司机：{new_driver.profile.real_name or new_driver.username}。原因：{reason}',
            request.user
        )

        messages.success(request, '车辆改派成功')
        return redirect('operations:assignment_detail', pk=pk)

    vehicles = Vehicle.objects.filter(
        status=Vehicle.Status.AVAILABLE,
        district=assignment.route.district
    )
    from django.contrib.auth.models import User
    drivers = User.objects.filter(profile__role=Role.DRIVER)

    context = {
        'assignment': assignment,
        'vehicles': vehicles,
        'drivers': drivers,
    }
    return render(request, 'operations/assignment_reassign.html', context)


@login_required
def checkin_create(request, assignment_pk, station_pk):
    assignment = get_object_or_404(RouteAssignment, pk=assignment_pk)
    station = get_object_or_404(Station, pk=station_pk)

    if not (_is_driver(request.user) and assignment.driver == request.user) \
            and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if assignment.status != RouteAssignment.Status.IN_PROGRESS:
        messages.error(request, '只有进行中的任务可以签到')
        return redirect('operations:assignment_detail', pk=assignment_pk)

    if CheckIn.objects.filter(assignment=assignment, station=station).exists():
        messages.error(request, '该站点已签到')
        return redirect('operations:assignment_detail', pk=assignment_pk)

    if request.method == 'POST':
        status = request.POST.get('status', CheckIn.Status.NORMAL)
        waste_weight = request.POST.get('waste_weight')
        notes = request.POST.get('notes', '')
        photo_url = request.POST.get('photo_url', '')

        checkin = CheckIn.objects.create(
            assignment=assignment,
            station=station,
            driver=request.user,
            status=status,
            waste_weight=float(waste_weight) if waste_weight else None,
            notes=notes,
            photo_url=photo_url
        )

        _add_event(
            assignment,
            RouteEvent.Type.CHECK_IN,
            f'站点签到：{station.name}，状态：{checkin.get_status_display()}',
            request.user
        )

        if request.headers.get('HX-Request'):
            return render(request, 'operations/partials/checkin_item.html', {
                'checkin': checkin,
                'assignment': assignment,
                'is_driver': _is_driver(request.user),
            })

        messages.success(request, '签到成功')
        return redirect('operations:assignment_detail', pk=assignment_pk)

    if request.headers.get('HX-Request'):
        return render(request, 'operations/partials/checkin_form.html', {
            'assignment': assignment,
            'station': station,
            'status_choices': CheckIn.Status.choices,
        })

    context = {
        'assignment': assignment,
        'station': station,
        'status_choices': CheckIn.Status.choices,
    }
    return render(request, 'operations/checkin_form.html', context)


@login_required
def checkin_cancel(request, assignment_pk, station_pk):
    assignment = get_object_or_404(RouteAssignment, pk=assignment_pk)
    station = get_object_or_404(Station, pk=station_pk)

    if not (_is_driver(request.user) and assignment.driver == request.user) \
            and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.headers.get('HX-Request'):
        return render(request, 'operations/partials/checkin_item.html', {
            'station': station,
            'assignment': assignment,
            'is_driver': _is_driver(request.user),
            'user': request.user,
        })

    return redirect('operations:assignment_detail', pk=assignment_pk)


@login_required
def checkin_detail(request, pk):
    checkin = get_object_or_404(CheckIn, pk=pk)
    context = {
        'checkin': checkin,
        'assignment': checkin.assignment,
    }
    return render(request, 'operations/checkin_detail.html', context)


@login_required
def fault_list(request):
    status = request.GET.get('status', '')
    faults = VehicleFault.objects.all()
    if status:
        faults = faults.filter(status=status)

    context = {
        'faults': faults[:50],
        'status_choices': VehicleFault.Status.choices,
        'filter_status': status,
    }
    return render(request, 'operations/fault_list.html', context)


@login_required
def fault_detail(request, pk):
    fault = get_object_or_404(VehicleFault, pk=pk)
    context = {
        'fault': fault,
        'is_inspector': _is_inspector(request.user),
        'is_dispatcher': _is_dispatcher(request.user),
    }
    return render(request, 'operations/fault_detail.html', context)


@login_required
def fault_create_for_assignment(request, assignment_pk):
    assignment = get_object_or_404(RouteAssignment, pk=assignment_pk)

    if not (_is_driver(request.user) and assignment.driver == request.user) \
            and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        fault_type = request.POST.get('fault_type')
        severity = request.POST.get('severity', VehicleFault.Severity.MODERATE)
        description = request.POST.get('description', '')

        fault = VehicleFault.objects.create(
            vehicle=assignment.vehicle,
            assignment=assignment,
            reporter=request.user,
            fault_type=fault_type,
            severity=severity,
            description=description
        )

        assignment.vehicle.status = Vehicle.Status.FAULTY
        assignment.vehicle.save()

        assignment.status = RouteAssignment.Status.SUSPENDED
        assignment.save()

        _add_event(
            assignment,
            RouteEvent.Type.FAULT_REPORTED,
            f'车辆故障：{fault_type}，严重程度：{fault.get_severity_display()}。任务已暂停，请调度员改派或等待维修。',
            request.user
        )

        messages.success(request, '故障已上报，任务已暂停')
        return redirect('operations:fault_detail', pk=fault.pk)

    context = {
        'assignment': assignment,
        'severity_choices': VehicleFault.Severity.choices,
    }
    return render(request, 'operations/fault_form.html', context)


@login_required
def fault_resolve(request, pk):
    fault = get_object_or_404(VehicleFault, pk=pk)

    if not _is_dispatcher(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        resolution_notes = request.POST.get('resolution_notes', '')

        fault.status = VehicleFault.Status.RESOLVED
        fault.resolved_at = timezone.now()
        fault.resolution_notes = resolution_notes
        fault.save()

        if fault.vehicle.status == Vehicle.Status.FAULTY:
            fault.vehicle.status = Vehicle.Status.AVAILABLE
            fault.vehicle.save()

        messages.success(request, '故障已解决')
        return redirect('operations:fault_detail', pk=pk)

    context = {'fault': fault}
    return render(request, 'operations/fault_resolve.html', context)


@login_required
def complaint_list(request):
    status = request.GET.get('status', '')
    complaints = Complaint.objects.all()
    if status:
        complaints = complaints.filter(status=status)

    context = {
        'complaints': complaints[:50],
        'status_choices': Complaint.Status.choices,
        'filter_status': status,
    }
    return render(request, 'operations/complaint_list.html', context)


@login_required
def complaint_detail(request, pk):
    complaint = get_object_or_404(Complaint, pk=pk)
    context = {
        'complaint': complaint,
        'is_inspector': _is_inspector(request.user),
        'is_supervisor': _is_supervisor(request.user),
    }
    return render(request, 'operations/complaint_detail.html', context)


@login_required
def complaint_create(request, assignment_pk):
    assignment = get_object_or_404(RouteAssignment, pk=assignment_pk)

    if request.method == 'POST':
        station_id = request.POST.get('station')
        complainant = request.POST.get('complainant')
        complainant_phone = request.POST.get('complainant_phone')
        complaint_type = request.POST.get('complaint_type', Complaint.Type.OVERFLOW)
        description = request.POST.get('description', '')
        photo_evidence = request.POST.get('photo_evidence', '')

        station = get_object_or_404(Station, pk=station_id)

        complaint = Complaint.objects.create(
            station=station,
            assignment=assignment,
            complainant=complainant,
            complainant_phone=complainant_phone,
            complaint_type=complaint_type,
            description=description,
            photo_evidence=photo_evidence
        )

        _add_event(
            assignment,
            RouteEvent.Type.COMPLAINT_RECEIVED,
            f'收到投诉：{complaint.get_complaint_type_display()}，站点：{station.name}',
            request.user
        )

        messages.success(request, '投诉已提交')
        return redirect('operations:complaint_detail', pk=complaint.pk)

    stations = assignment.route.stations.all()
    context = {
        'assignment': assignment,
        'stations': stations,
        'type_choices': Complaint.Type.choices,
    }
    return render(request, 'operations/complaint_form.html', context)


@login_required
def complaint_confirm(request, pk):
    complaint = get_object_or_404(Complaint, pk=pk)

    if not _is_inspector(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        confirmed = request.POST.get('confirmed') == 'yes'
        confirmed_notes = request.POST.get('confirmed_notes', '')

        complaint.inspector = request.user
        complaint.confirmed_at = timezone.now()
        complaint.confirmed_notes = confirmed_notes

        if confirmed:
            complaint.status = Complaint.Status.CONFIRMED
            event_desc = f'巡检员确认投诉属实：{confirmed_notes}'
        else:
            complaint.status = Complaint.Status.CLOSED
            event_desc = f'巡检员核实投诉不属实：{confirmed_notes}'

        complaint.save()

        if complaint.assignment:
            _add_event(
                complaint.assignment,
                RouteEvent.Type.COMPLAINT_CONFIRMED,
                event_desc,
                request.user
            )

        messages.success(request, '投诉已处理')
        return redirect('operations:complaint_detail', pk=pk)

    context = {'complaint': complaint}
    return render(request, 'operations/complaint_confirm.html', context)


@login_required
def complaint_resolve(request, pk):
    complaint = get_object_or_404(Complaint, pk=pk)

    if not _is_inspector(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        resolution_notes = request.POST.get('resolution_notes', '')

        complaint.status = Complaint.Status.RESOLVED
        complaint.resolved_at = timezone.now()
        complaint.resolution_notes = resolution_notes
        complaint.save()

        messages.success(request, '投诉已解决')
        return redirect('operations:complaint_detail', pk=pk)

    context = {'complaint': complaint}
    return render(request, 'operations/complaint_resolve.html', context)


@login_required
def review_list(request):
    result = request.GET.get('result', '')
    reviews = ReviewRecord.objects.all()
    if result:
        reviews = reviews.filter(review_result=result)

    context = {
        'reviews': reviews[:50],
        'result_choices': ReviewRecord.Result.choices,
        'filter_result': result,
    }
    return render(request, 'operations/review_list.html', context)


@login_required
def review_detail(request, pk):
    review = get_object_or_404(ReviewRecord, pk=pk)
    context = {
        'review': review,
        'is_supervisor': _is_supervisor(request.user),
    }
    return render(request, 'operations/review_detail.html', context)


@login_required
def review_create(request, assignment_pk):
    assignment = get_object_or_404(RouteAssignment, pk=assignment_pk)

    if not _is_supervisor(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        review_result = request.POST.get('review_result', ReviewRecord.Result.PASS)
        review_notes = request.POST.get('review_notes', '')
        has_deadline = request.POST.get('has_deadline') == 'yes'
        rectification_deadline = request.POST.get('rectification_deadline')

        review = ReviewRecord.objects.create(
            assignment=assignment,
            reviewer=request.user,
            review_result=review_result,
            review_notes=review_notes,
            rectification_deadline=rectification_deadline if has_deadline and rectification_deadline else None
        )

        _add_event(
            assignment,
            RouteEvent.Type.REVIEW,
            f'主管复核结果：{review.get_review_result_display()}，意见：{review_notes}',
            request.user
        )

        messages.success(request, '复核记录已创建')
        return redirect('operations:review_detail', pk=review.pk)

    context = {
        'assignment': assignment,
        'result_choices': ReviewRecord.Result.choices,
    }
    return render(request, 'operations/review_form.html', context)


@login_required
def review_rectify(request, pk):
    review = get_object_or_404(ReviewRecord, pk=pk)

    if not _is_supervisor(request.user) and not request.user.is_staff:
        return HttpResponseForbidden('无权限操作')

    if request.method == 'POST':
        rectification_notes = request.POST.get('rectification_notes', '')

        review.review_result = ReviewRecord.Result.RECTIFIED
        review.rectification_completed_at = timezone.now()
        review.rectification_notes = rectification_notes
        review.save()

        messages.success(request, '整改已完成')
        return redirect('operations:review_detail', pk=pk)

    context = {'review': review}
    return render(request, 'operations/review_rectify.html', context)


@login_required
def analytics(request):
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    district_id = request.GET.get('district', '')

    assignments = RouteAssignment.objects.all()
    if date_from:
        assignments = assignments.filter(assigned_date__gte=date_from)
    if date_to:
        assignments = assignments.filter(assigned_date__lte=date_to)
    if district_id:
        assignments = assignments.filter(route__district_id=district_id)

    check_ins = CheckIn.objects.filter(assignment__in=assignments) if assignments.exists() else CheckIn.objects.none()
    missed_checkins = check_ins.filter(status=CheckIn.Status.MISSED)
    complaints = Complaint.objects.filter(assignment__in=assignments) if assignments.exists() else Complaint.objects.none()
    reviews = ReviewRecord.objects.filter(assignment__in=assignments) if assignments.exists() else ReviewRecord.objects.none()
    faults = VehicleFault.objects.filter(assignment__in=assignments) if assignments.exists() else VehicleFault.objects.none()

    district_stats = []
    districts = District.objects.all()
    if district_id:
        districts = districts.filter(id=district_id)

    for district in districts:
        dist_assignments = assignments.filter(route__district=district)
        dist_checkins = check_ins.filter(assignment__route__district=district)
        dist_missed = missed_checkins.filter(assignment__route__district=district)
        dist_complaints = complaints.filter(assignment__route__district=district)
        dist_reviews = reviews.filter(
            assignment__route__district=district,
            review_result=ReviewRecord.Result.RECTIFIED,
            rectification_completed_at__isnull=False
        )

        total = dist_assignments.count()
        completed = dist_assignments.filter(status=RouteAssignment.Status.COMPLETED).count()
        completion_rate = round(completed / total * 100, 1) if total > 0 else 0

        rectification_hours_list = []
        for r in dist_reviews:
            if r.rectification_completed_at and r.reviewed_at:
                delta = r.rectification_completed_at - r.reviewed_at
                rectification_hours_list.append(delta.total_seconds() / 3600)
        avg_rect_hours = round(sum(rectification_hours_list) / len(rectification_hours_list), 2) if rectification_hours_list else 0

        district_stats.append({
            'name': district.name,
            'code': district.code,
            'total_assignments': total,
            'completed_assignments': completed,
            'completion_rate': completion_rate,
            'missed_count': dist_missed.count(),
            'complaint_count': dist_complaints.count(),
            'avg_rectification_hours': avg_rect_hours,
        })

    vehicle_stats = []
    vehicles = Vehicle.objects.all()
    for vehicle in vehicles:
        veh_assignments = assignments.filter(vehicle=vehicle)
        veh_checkins = check_ins.filter(assignment__vehicle=vehicle)
        veh_missed = missed_checkins.filter(assignment__vehicle=vehicle)
        veh_faults = faults.filter(vehicle=vehicle)

        total = veh_assignments.count()
        if total == 0 and not district_id:
            continue

        completed = veh_assignments.filter(status=RouteAssignment.Status.COMPLETED).count()
        completion_rate = round(completed / total * 100, 1) if total > 0 else 0

        vehicle_stats.append({
            'plate_number': vehicle.plate_number,
            'vehicle_type': vehicle.vehicle_type,
            'district': vehicle.district.name if vehicle.district else '-',
            'total_assignments': total,
            'completed_assignments': completed,
            'completion_rate': completion_rate,
            'missed_count': veh_missed.count(),
            'fault_count': veh_faults.count(),
        })

    vehicle_stats.sort(key=lambda x: x['total_assignments'], reverse=True)

    missed_by_station = Station.objects.filter(
        check_ins__in=missed_checkins
    ).annotate(
        missed_count=Count('check_ins')
    ).select_related('route', 'route__district').order_by('-missed_count')[:10]

    rectification_reviews = reviews.filter(
        review_result=ReviewRecord.Result.RECTIFIED,
        rectification_completed_at__isnull=False
    )
    rectification_hours_all = []
    for r in rectification_reviews:
        if r.rectification_completed_at and r.reviewed_at:
            delta = r.rectification_completed_at - r.reviewed_at
            rectification_hours_all.append(delta.total_seconds() / 3600)
    avg_rectification_hours = round(sum(rectification_hours_all) / len(rectification_hours_all), 2) if rectification_hours_all else 0

    total_assignments = assignments.count()
    completed_count = assignments.filter(status=RouteAssignment.Status.COMPLETED).count()
    total_complaints = complaints.count()
    total_missed = missed_checkins.count()
    total_faults = faults.count()

    context = {
        'districts': District.objects.all(),
        'district_stats': district_stats,
        'vehicle_stats': vehicle_stats,
        'missed_by_station': missed_by_station,
        'avg_rectification_hours': avg_rectification_hours,
        'total_assignments': total_assignments,
        'completed_count': completed_count,
        'total_complaints': total_complaints,
        'total_missed': total_missed,
        'total_faults': total_faults,
        'filter_date_from': date_from,
        'filter_date_to': date_to,
        'filter_district': district_id,
    }
    return render(request, 'operations/analytics.html', context)


@login_required
def route_list(request):
    routes = Route.objects.filter(is_active=True)
    context = {'routes': routes}
    return render(request, 'operations/route_list.html', context)


@login_required
def route_detail(request, pk):
    route = get_object_or_404(Route, pk=pk)
    stations = route.stations.order_by('order')
    recent_assignments = route.assignments.order_by('-assigned_date')[:10]

    context = {
        'route': route,
        'stations': stations,
        'recent_assignments': recent_assignments,
    }
    return render(request, 'operations/route_detail.html', context)


@login_required
def vehicle_list(request):
    status = request.GET.get('status', '')
    vehicles = Vehicle.objects.all()
    if status:
        vehicles = vehicles.filter(status=status)

    context = {
        'vehicles': vehicles,
        'status_choices': Vehicle.Status.choices,
        'filter_status': status,
    }
    return render(request, 'operations/vehicle_list.html', context)


@login_required
def vehicle_detail(request, pk):
    vehicle = get_object_or_404(Vehicle, pk=pk)
    recent_assignments = vehicle.assignments.order_by('-assigned_date')[:10]
    recent_faults = vehicle.faults.order_by('-reported_at')[:5]

    context = {
        'vehicle': vehicle,
        'recent_assignments': recent_assignments,
        'recent_faults': recent_faults,
    }
    return render(request, 'operations/vehicle_detail.html', context)


@login_required
def station_list(request):
    stations = Station.objects.all().order_by('route__code', 'order')
    context = {'stations': stations[:100]}
    return render(request, 'operations/station_list.html', context)


@login_required
def station_detail(request, pk):
    station = get_object_or_404(Station, pk=pk)
    recent_checkins = station.check_ins.order_by('-check_in_time')[:10]
    recent_complaints = station.complaints.order_by('-reported_at')[:5]

    context = {
        'station': station,
        'recent_checkins': recent_checkins,
        'recent_complaints': recent_complaints,
    }
    return render(request, 'operations/station_detail.html', context)
