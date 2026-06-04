from django.shortcuts import render, get_object_or_404, redirect, reverse
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Count, Case, When, Value, CharField, F
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Appointment, AppointmentStatus, ReportStatus,
    RescheduleRecord, ReportClaimRecord, AbnormalRecord,
    OperationLog, Patient, ExaminationType
)


def get_record_category_display(appointment):
    if appointment.report_status == ReportStatus.STALLED:
        return 'report_stalled'
    if appointment.is_rescheduled():
        return 'patient_rescheduled'
    if appointment.status == AppointmentStatus.COMPLETED:
        return 'on_time'
    return 'identity_mismatch' if appointment.abnormal_records.filter(abnormal_type='identity_mismatch').exists() else 'other'


@login_required
def workstation(request):
    category_filter = request.GET.get('category', 'all')
    status_filter = request.GET.get('status', 'all')
    search_query = request.GET.get('search', '')
    
    appointments = Appointment.objects.select_related('patient', 'examination_type').all()
    
    if search_query:
        appointments = appointments.filter(
            Q(appointment_no__icontains=search_query) |
            Q(patient__name__icontains=search_query) |
            Q(patient__id_card__icontains=search_query)
        )
    
    if category_filter == 'on_time':
        appointments = appointments.filter(
            status=AppointmentStatus.COMPLETED
        ).exclude(current_appointment_time__gt=F('original_appointment_time'))
    elif category_filter == 'patient_rescheduled':
        appointments = appointments.filter(
            reschedules__isnull=False
        ).distinct()
    elif category_filter == 'report_stalled':
        appointments = appointments.filter(report_status=ReportStatus.STALLED)
    elif category_filter == 'identity_mismatch':
        appointments = appointments.filter(
            abnormal_records__abnormal_type='identity_mismatch'
        ).distinct()
    
    if status_filter != 'all':
        appointments = appointments.filter(status=status_filter)
    
    stats = Appointment.objects.aggregate(
        total=Count('id'),
        on_time=Count(Case(When(status=AppointmentStatus.COMPLETED, then=1))),
        rescheduled=Count(Case(When(reschedules__isnull=False, then=1), distinct=True)),
        stalled=Count(Case(When(report_status=ReportStatus.STALLED, then=1))),
        identity_mismatch=Count(Case(When(abnormal_records__abnormal_type='identity_mismatch', then=1), distinct=True)),
        ready_for_claim=Count(Case(When(report_status=ReportStatus.READY, then=1))),
        pending_review=Count(Case(When(claims__review_status='pending', then=1), distinct=True)),
    )
    
    context = {
        'appointments': appointments[:50],
        'stats': stats,
        'category_filter': category_filter,
        'status_filter': status_filter,
        'search_query': search_query,
        'AppointmentStatus': AppointmentStatus,
        'ReportStatus': ReportStatus,
        'active_tab': 'list',
    }
    
    return render(request, 'workstation/workstation.html', context)


@login_required
def appointment_detail(request, appointment_id):
    appointment = get_object_or_404(Appointment.objects.select_related('patient', 'examination_type', 'created_by'), id=appointment_id)
    reschedules = appointment.reschedules.select_related('operator').all()
    claims = appointment.claims.select_related('operator', 'reviewer').all()
    abnormal_records = appointment.abnormal_records.select_related('handler').all()
    logs = appointment.logs.select_related('operator').all()
    
    source = request.GET.get('source', 'list')
    source_label = {
        'notification': '通知中心',
        'list': '预约列表',
        'review': '异常复盘',
    }.get(source, '预约列表')
    
    back_url = {
        'notification': reverse('workstation:notification_list'),
        'list': reverse('workstation:workstation'),
        'review': reverse('workstation:review_list'),
    }.get(source, reverse('workstation:workstation'))
    
    context = {
        'appointment': appointment,
        'reschedules': reschedules,
        'claims': claims,
        'abnormal_records': abnormal_records,
        'logs': logs,
        'AppointmentStatus': AppointmentStatus,
        'ReportStatus': ReportStatus,
        'source': source,
        'source_label': source_label,
        'back_url': back_url,
    }
    
    return render(request, 'workstation/appointment_detail.html', context)


@login_required
@require_http_methods(["GET", "POST"])
def reschedule_appointment(request, appointment_id):
    appointment = get_object_or_404(Appointment, id=appointment_id)
    
    if request.method == 'POST':
        old_time = appointment.current_appointment_time
        new_time_str = request.POST.get('new_time')
        reason = request.POST.get('reason')
        reason_detail = request.POST.get('reason_detail', '')
        evidence = request.POST.get('evidence', '')
        
        try:
            new_time = datetime.fromisoformat(new_time_str)
        except (ValueError, TypeError):
            return JsonResponse({'success': False, 'error': '无效的时间格式'}, status=400)
        
        RescheduleRecord.objects.create(
            appointment=appointment,
            old_time=old_time,
            new_time=new_time,
            reason=reason,
            reason_detail=reason_detail,
            operator=request.user,
            evidence=evidence
        )
        
        appointment.current_appointment_time = new_time
        appointment.status = AppointmentStatus.RESCHEDULED
        appointment.save()
        
        OperationLog.objects.create(
            appointment=appointment,
            operation_type='reschedule',
            operator=request.user,
            details=f'改期: {old_time} -> {new_time}, 原因: {reason}',
            evidence=evidence
        )
        
        if request.headers.get('HX-Request'):
            return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
        
        return redirect('appointment_detail', appointment_id=appointment.id)
    
    context = {
        'appointment': appointment,
    }
    
    return render(request, 'workstation/partials/reschedule_form.html', context)


@login_required
@require_http_methods(["GET", "POST"])
def claim_report(request, appointment_id):
    appointment = get_object_or_404(Appointment, id=appointment_id)
    
    if request.method == 'POST':
        claim_type = request.POST.get('claim_type')
        claimant_name = request.POST.get('claimant_name')
        claimant_id_card = request.POST.get('claimant_id_card')
        claimant_phone = request.POST.get('claimant_phone')
        evidence = request.POST.get('evidence', '')
        
        is_match = verify_identity(appointment.patient, claimant_name, claimant_id_card, claim_type)
        
        claim_record = ReportClaimRecord.objects.create(
            appointment=appointment,
            claim_type=claim_type,
            claimant_name=claimant_name,
            claimant_id_card=claimant_id_card,
            claimant_phone=claimant_phone,
            verification_result='match' if is_match else 'mismatch',
            is_blocked=not is_match,
            operator=request.user,
            evidence=evidence,
            claimed_at=timezone.now() if is_match else None
        )
        
        if is_match:
            appointment.report_status = ReportStatus.CLAIMED
            appointment.save()
            
            OperationLog.objects.create(
                appointment=appointment,
                operation_type='claim',
                operator=request.user,
                details=f'报告领取成功，领取人: {claimant_name}',
                evidence=evidence
            )
        else:
            claim_record.verification_notes = '身份信息不匹配，已阻断领取'
            claim_record.correction_path = generate_correction_path(appointment.patient)
            claim_record.save()
            
            AbnormalRecord.objects.create(
                appointment=appointment,
                abnormal_type='identity_mismatch',
                description=f'报告领取时身份验证失败：领取人{claimant_name}与患者信息不匹配',
                status='open'
            )
            
            OperationLog.objects.create(
                appointment=appointment,
                operation_type='abnormal',
                operator=request.user,
                details=f'身份验证失败，领取被阻断，领取人: {claimant_name}',
                evidence=evidence
            )
        
        if request.headers.get('HX-Request'):
            return render(request, 'workstation/partials/claim_result.html', {
                'appointment': appointment,
                'claim_record': claim_record,
                'is_match': is_match,
            })
        
        return redirect('appointment_detail', appointment_id=appointment.id)
    
    context = {
        'appointment': appointment,
    }
    
    return render(request, 'workstation/partials/claim_form.html', context)


def verify_identity(patient, claimant_name, claimant_id_card, claim_type):
    if claim_type == 'self':
        return (patient.name == claimant_name and 
                patient.id_card == claimant_id_card)
    else:
        return bool(claimant_name and claimant_id_card)


def generate_correction_path(patient):
    return f"""
    1. 请患者本人携带有效身份证件原件到门诊服务台办理身份核验
    2. 如委托他人领取，请提供：
       - 患者本人身份证原件
       - 受托人身份证原件
       - 患者签署的授权委托书
    3. 联系电话：400-XXX-XXXX
    4. 工作时间：周一至周五 8:00-17:30
    """


@login_required
@require_http_methods(["GET", "POST"])
def review_claim(request, claim_id):
    claim_record = get_object_or_404(ReportClaimRecord, id=claim_id)
    
    if request.method == 'POST':
        action = request.POST.get('action')
        review_notes = request.POST.get('review_notes', '')
        evidence = request.POST.get('evidence', '')
        
        if action == 'approve':
            claim_record.review_status = 'approved'
            claim_record.appointment.report_status = ReportStatus.VERIFIED
            claim_record.appointment.save()
        elif action == 'reject':
            claim_record.review_status = 'rejected'
            claim_record.appointment.report_status = ReportStatus.RETURNED
            claim_record.appointment.save()
        
        claim_record.reviewer = request.user
        claim_record.review_notes = review_notes
        claim_record.save()
        
        OperationLog.objects.create(
            appointment=claim_record.appointment,
            operation_type='review',
            operator=request.user,
            details=f"复核{claim_record.get_review_status_display()}: {review_notes}",
            evidence=evidence
        )
        
        if request.headers.get('HX-Request'):
            return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
        
        return redirect('appointment_detail', appointment_id=claim_record.appointment.id)
    
    context = {
        'claim_record': claim_record,
    }
    
    return render(request, 'workstation/partials/review_form.html', context)


@login_required
@require_http_methods(["GET", "POST"])
def handle_abnormal(request, abnormal_id):
    abnormal_record = get_object_or_404(AbnormalRecord, id=abnormal_id)
    
    if request.method == 'POST':
        status = request.POST.get('status')
        solution = request.POST.get('solution', '')
        review_summary = request.POST.get('review_summary', '')
        preventive_measures = request.POST.get('preventive_measures', '')
        
        abnormal_record.status = status
        abnormal_record.solution = solution
        abnormal_record.review_summary = review_summary
        abnormal_record.preventive_measures = preventive_measures
        abnormal_record.handler = request.user
        
        if status == 'resolved':
            abnormal_record.resolved_at = timezone.now()
        
        abnormal_record.save()
        
        OperationLog.objects.create(
            appointment=abnormal_record.appointment,
            operation_type='abnormal',
            operator=request.user,
            details=f"异常处理状态更新为{abnormal_record.get_status_display()}: {solution}",
            evidence=review_summary
        )
        
        if request.headers.get('HX-Request'):
            return HttpResponse(status=204, headers={'HX-Refresh': 'true'})
        
        return redirect('appointment_detail', appointment_id=abnormal_record.appointment.id)
    
    context = {
        'abnormal_record': abnormal_record,
    }
    
    return render(request, 'workstation/partials/abnormal_form.html', context)


@login_required
def appointment_list_partial(request):
    category_filter = request.GET.get('category', 'all')
    status_filter = request.GET.get('status', 'all')
    search_query = request.GET.get('search', '')
    
    appointments = Appointment.objects.select_related('patient', 'examination_type').all()
    
    if search_query:
        appointments = appointments.filter(
            Q(appointment_no__icontains=search_query) |
            Q(patient__name__icontains=search_query) |
            Q(patient__id_card__icontains=search_query)
        )
    
    if category_filter == 'on_time':
        appointments = appointments.filter(status=AppointmentStatus.COMPLETED)
    elif category_filter == 'patient_rescheduled':
        appointments = appointments.filter(reschedules__isnull=False).distinct()
    elif category_filter == 'report_stalled':
        appointments = appointments.filter(report_status=ReportStatus.STALLED)
    elif category_filter == 'identity_mismatch':
        appointments = appointments.filter(abnormal_records__abnormal_type='identity_mismatch').distinct()
    
    if status_filter != 'all':
        appointments = appointments.filter(status=status_filter)
    
    context = {
        'appointments': appointments[:50],
        'AppointmentStatus': AppointmentStatus,
        'ReportStatus': ReportStatus,
    }
    
    return render(request, 'workstation/partials/appointment_list.html', context)


@login_required
def notification_list(request):
    search_query = request.GET.get('search', '')
    
    notifications = Appointment.objects.select_related('patient', 'examination_type').filter(
        Q(report_status=ReportStatus.READY) |
        Q(report_status=ReportStatus.STALLED) |
        Q(abnormal_records__status__in=['open', 'in_progress']) |
        Q(claims__review_status='pending')
    ).distinct()
    
    if search_query:
        notifications = notifications.filter(
            Q(appointment_no__icontains=search_query) |
            Q(patient__name__icontains=search_query) |
            Q(patient__id_card__icontains=search_query)
        )
    
    stats = {
        'ready_for_claim': notifications.filter(report_status=ReportStatus.READY).count(),
        'stalled': notifications.filter(report_status=ReportStatus.STALLED).count(),
        'pending_review': notifications.filter(claims__review_status='pending').count(),
        'abnormal_pending': notifications.filter(abnormal_records__status__in=['open', 'in_progress']).distinct().count(),
    }
    
    context = {
        'appointments': notifications[:50],
        'stats': stats,
        'search_query': search_query,
        'AppointmentStatus': AppointmentStatus,
        'ReportStatus': ReportStatus,
        'active_tab': 'notifications',
    }
    
    return render(request, 'workstation/notification_list.html', context)


@login_required
def review_list(request):
    search_query = request.GET.get('search', '')
    abnormal_filter = request.GET.get('type', 'all')
    
    review_appointments = Appointment.objects.select_related('patient', 'examination_type').filter(
        abnormal_records__isnull=False
    ).distinct()
    
    if search_query:
        review_appointments = review_appointments.filter(
            Q(appointment_no__icontains=search_query) |
            Q(patient__name__icontains=search_query) |
            Q(patient__id_card__icontains=search_query)
        )
    
    if abnormal_filter == 'identity_mismatch':
        review_appointments = review_appointments.filter(abnormal_records__abnormal_type='identity_mismatch').distinct()
    elif abnormal_filter == 'report_stalled':
        review_appointments = review_appointments.filter(report_status=ReportStatus.STALLED).distinct()
    elif abnormal_filter == 'reschedule_abnormal':
        review_appointments = review_appointments.filter(abnormal_records__abnormal_type='reschedule_abnormal').distinct()
    
    abnormal_records = AbnormalRecord.objects.select_related('appointment', 'appointment__patient', 'handler').all()
    if abnormal_filter != 'all':
        abnormal_records = abnormal_records.filter(abnormal_type=abnormal_filter)
    if search_query:
        abnormal_records = abnormal_records.filter(
            Q(appointment__appointment_no__icontains=search_query) |
            Q(appointment__patient__name__icontains=search_query)
        )
    
    stats = {
        'total': review_appointments.count(),
        'identity_mismatch': review_appointments.filter(abnormal_records__abnormal_type='identity_mismatch').distinct().count(),
        'report_stalled': review_appointments.filter(report_status=ReportStatus.STALLED).distinct().count(),
        'reschedule_abnormal': review_appointments.filter(abnormal_records__abnormal_type='reschedule_abnormal').distinct().count(),
        'open': abnormal_records.filter(status='open').count(),
        'in_progress': abnormal_records.filter(status='in_progress').count(),
        'resolved': abnormal_records.filter(status='resolved').count(),
    }
    
    context = {
        'abnormal_records': abnormal_records[:50],
        'stats': stats,
        'search_query': search_query,
        'abnormal_filter': abnormal_filter,
        'AppointmentStatus': AppointmentStatus,
        'ReportStatus': ReportStatus,
        'active_tab': 'review',
    }
    
    return render(request, 'workstation/review_list.html', context)
