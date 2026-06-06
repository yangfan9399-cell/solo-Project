from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.utils import timezone
from .models import DamageAssessment, Decision
from circulation.models import CirculationLog


@login_required
@user_passes_test(lambda u: u.is_conservator)
def assessment_list(request):
    status = request.GET.get('status', 'all')
    
    if status == 'pending':
        assessments = DamageAssessment.objects.filter(needs_supervisor_review=True, decision__isnull=True)
    elif status == 'decided':
        assessments = DamageAssessment.objects.filter(decision__isnull=False)
    else:
        assessments = DamageAssessment.objects.all()
    
    assessments = assessments.select_related(
        'circulation', 'circulation__book', 'circulation__reservation__user', 'conservator'
    ).order_by('-assessed_at')
    
    pending_returns = CirculationLog.objects.filter(
        return_time__isnull=False,
        damage_assessment__isnull=True
    ).select_related('book', 'reservation__user')
    
    context = {
        'assessments': assessments,
        'pending_returns': pending_returns,
        'current_status': status,
        'page_title': '损伤鉴定',
    }
    return render(request, 'conservation/assessment_list.html', context)


@login_required
@user_passes_test(lambda u: u.is_conservator)
def damage_assessment(request, log_id):
    log = get_object_or_404(CirculationLog, pk=log_id)
    
    if hasattr(log, 'damage_assessment'):
        messages.info(request, '该流通记录已有鉴定记录。')
        return redirect('conservation:assessment_detail', pk=log.damage_assessment.pk)
    
    if request.method == 'POST':
        damage_level = request.POST.get('damage_level', 'minor')
        damage_type = request.POST.get('damage_type', 'other')
        damage_description = request.POST.get('damage_description', '')
        damage_location = request.POST.get('damage_location', '')
        previous_damage = request.POST.get('previous_damage') == 'on'
        repair_suggestion = request.POST.get('repair_suggestion', '')
        estimated_cost = request.POST.get('estimated_cost', None)
        assessment_notes = request.POST.get('assessment_notes', '')
        
        assessment = DamageAssessment(
            circulation=log,
            conservator=request.user,
            damage_level=damage_level,
            damage_type=damage_type,
            damage_description=damage_description,
            damage_location=damage_location,
            previous_damage=previous_damage,
            repair_suggestion=repair_suggestion,
            assessment_notes=assessment_notes,
        )
        
        if estimated_cost:
            assessment.estimated_cost = estimated_cost
        
        assessment.save()
        
        messages.success(request, '损伤鉴定已完成，请等待主管决策。')
        return redirect('conservation:assessment_detail', pk=assessment.pk)
    
    context = {
        'log': log,
        'page_title': '损伤鉴定',
    }
    return render(request, 'conservation/assessment_form.html', context)


@login_required
def assessment_detail(request, pk):
    assessment = get_object_or_404(DamageAssessment.objects.select_related(
        'circulation', 'circulation__book', 'circulation__reservation__user',
        'conservator', 'decision', 'decision__supervisor'
    ), pk=pk)
    
    can_make_decision = request.user.is_supervisor and assessment.needs_supervisor_review and not hasattr(assessment, 'decision')
    
    context = {
        'assessment': assessment,
        'can_make_decision': can_make_decision,
        'page_title': '鉴定详情',
    }
    return render(request, 'conservation/assessment_detail.html', context)


@login_required
@user_passes_test(lambda u: u.is_supervisor)
def decision_list(request):
    decisions = Decision.objects.all().select_related(
        'assessment', 'assessment__circulation__book', 'supervisor'
    ).order_by('-decided_at')
    
    pending = DamageAssessment.objects.filter(
        needs_supervisor_review=True,
        decision__isnull=True
    ).select_related('circulation__book', 'circulation__reservation__user')
    
    context = {
        'decisions': decisions,
        'pending_assessments': pending,
        'page_title': '归库决策',
    }
    return render(request, 'conservation/decision_list.html', context)


@login_required
@user_passes_test(lambda u: u.is_supervisor)
def final_decision(request, assessment_id):
    assessment = get_object_or_404(DamageAssessment, pk=assessment_id)
    
    if hasattr(assessment, 'decision'):
        messages.info(request, '该鉴定已有决策记录。')
        return redirect('conservation:assessment_detail', pk=assessment.pk)
    
    if request.method == 'POST':
        decision_type = request.POST.get('decision_type', 'return_to_stack')
        decision_reason = request.POST.get('decision_reason', '')
        compensation_amount = request.POST.get('compensation_amount', None)
        compensation_notes = request.POST.get('compensation_notes', '')
        
        decision = Decision(
            assessment=assessment,
            supervisor=request.user,
            decision_type=decision_type,
            decision_reason=decision_reason,
        )
        
        if compensation_amount:
            decision.compensation_amount = compensation_amount
        if compensation_notes:
            decision.compensation_notes = compensation_notes
        
        decision.save()
        
        messages.success(request, '归库决策已完成。')
        return redirect('conservation:assessment_detail', pk=assessment.pk)
    
    context = {
        'assessment': assessment,
        'page_title': '归库决策',
    }
    return render(request, 'conservation/decision_form.html', context)
