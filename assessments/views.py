from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import Q
from core.models import Elder, User
from .models import (
    NursingLevel, AssessmentDimension, AssessmentItem,
    Assessment, AssessmentScore, AssessmentHistory
)


@login_required
def assessment_list(request):
    user = request.user
    assessments = Assessment.objects.all().select_related(
        'elder', 'nursing_level', 'nurse', 'doctor', 'family_member', 'director'
    )
    
    if user.is_nurse():
        assessments = assessments.filter(nurse=user)
    elif user.is_doctor():
        assessments = assessments.filter(status='pending_doctor')
    elif user.is_family():
        elders = user.elders.all()
        assessments = assessments.filter(elder__in=elders)
    elif user.is_director():
        assessments = assessments.filter(status='pending_director')
    
    status = request.GET.get('status', '')
    if status:
        assessments = assessments.filter(status=status)
    
    search = request.GET.get('search', '')
    if search:
        assessments = assessments.filter(
            Q(elder__name__icontains=search) |
            Q(elder__id_number__icontains=search)
        )
    
    assessments = assessments.order_by('-created_at')
    
    context = {
        'assessments': assessments,
        'status_choices': Assessment.STATUS_CHOICES,
        'selected_status': status,
        'search': search,
    }
    return render(request, 'assessments/assessment_list.html', context)


@login_required
def assessment_create(request, elder_id=None):
    if not request.user.is_nurse():
        messages.error(request, '只有护士可以创建评估')
        return redirect('core:dashboard')
    
    elder = None
    if elder_id:
        elder = get_object_or_404(Elder, pk=elder_id)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                elder_id = request.POST.get('elder')
                elder = get_object_or_404(Elder, pk=elder_id)
                
                assessment = Assessment.objects.create(
                    elder=elder,
                    nurse=request.user,
                    nursing_level_id=request.POST.get('nursing_level'),
                    previous_nursing_level=elder.current_nursing_level,
                    previous_monthly_fee=elder.current_monthly_fee,
                    assessment_date=request.POST.get('assessment_date'),
                    assessment_reason=request.POST.get('assessment_reason', ''),
                    nurse_notes=request.POST.get('nurse_notes', ''),
                    status='draft'
                )
                
                nursing_level = assessment.nursing_level
                if nursing_level:
                    assessment.new_monthly_fee = nursing_level.monthly_fee
                    assessment.save()
                
                dimensions = AssessmentDimension.objects.filter(is_active=True).prefetch_related('items')
                for dimension in dimensions:
                    for item in dimension.items.filter(is_active=True):
                        score_value = request.POST.get(f'score_{item.id}')
                        if score_value:
                            AssessmentScore.objects.create(
                                assessment=assessment,
                                item=item,
                                score=int(score_value),
                                notes=request.POST.get(f'notes_{item.id}', '')
                            )
                
                AssessmentHistory.objects.create(
                    assessment=assessment,
                    action='create',
                    user=request.user,
                    to_status='draft',
                    notes='创建评估记录'
                )
                
                messages.success(request, '评估创建成功')
                return redirect('assessments:assessment_detail', pk=assessment.pk)
        except Exception as e:
            messages.error(request, f'创建失败: {str(e)}')
    
    elders = Elder.objects.all().order_by('name')
    nursing_levels = NursingLevel.objects.filter(is_active=True).order_by('level')
    dimensions = AssessmentDimension.objects.filter(is_active=True).prefetch_related('items')
    
    context = {
        'elder': elder,
        'elders': elders,
        'nursing_levels': nursing_levels,
        'dimensions': dimensions,
        'today': timezone.now().date(),
    }
    return render(request, 'assessments/assessment_form.html', context)


@login_required
def assessment_detail(request, pk):
    assessment = get_object_or_404(
        Assessment.objects.prefetch_related('scores__item__dimension'),
        pk=pk
    )
    
    dimensions = AssessmentDimension.objects.filter(is_active=True).prefetch_related('items')
    scores_dict = {score.item_id: score for score in assessment.scores.all()}
    
    dimension_scores = []
    for dimension in dimensions:
        items_data = []
        for item in dimension.items.filter(is_active=True):
            score = scores_dict.get(item.id)
            items_data.append({
                'item': item,
                'score': score,
            })
        dimension_scores.append({
            'dimension': dimension,
            'items': items_data,
        })
    
    missing_items = assessment.get_missing_items()
    is_complete = assessment.is_complete()
    
    history = assessment.history.all().select_related('user')
    
    context = {
        'assessment': assessment,
        'dimension_scores': dimension_scores,
        'missing_items': missing_items,
        'is_complete': is_complete,
        'history': history,
    }
    return render(request, 'assessments/assessment_detail.html', context)


@login_required
def assessment_edit(request, pk):
    assessment = get_object_or_404(Assessment, pk=pk)
    
    if assessment.status != 'draft':
        messages.error(request, '只有草稿状态的评估可以编辑')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if not (request.user == assessment.nurse or request.user.is_director()):
        messages.error(request, '您没有权限编辑此评估')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                assessment.nursing_level_id = request.POST.get('nursing_level')
                assessment.assessment_date = request.POST.get('assessment_date')
                assessment.assessment_reason = request.POST.get('assessment_reason', '')
                assessment.nurse_notes = request.POST.get('nurse_notes', '')
                
                if assessment.nursing_level:
                    assessment.new_monthly_fee = assessment.nursing_level.monthly_fee
                assessment.save()
                
                assessment.scores.all().delete()
                
                dimensions = AssessmentDimension.objects.filter(is_active=True).prefetch_related('items')
                for dimension in dimensions:
                    for item in dimension.items.filter(is_active=True):
                        score_value = request.POST.get(f'score_{item.id}')
                        if score_value:
                            AssessmentScore.objects.create(
                                assessment=assessment,
                                item=item,
                                score=int(score_value),
                                notes=request.POST.get(f'notes_{item.id}', '')
                            )
                
                AssessmentHistory.objects.create(
                    assessment=assessment,
                    action='edit',
                    user=request.user,
                    notes='编辑评估记录'
                )
                
                messages.success(request, '评估更新成功')
                return redirect('assessments:assessment_detail', pk=assessment.pk)
        except Exception as e:
            messages.error(request, f'更新失败: {str(e)}')
    
    nursing_levels = NursingLevel.objects.filter(is_active=True).order_by('level')
    dimensions = AssessmentDimension.objects.filter(is_active=True).prefetch_related('items')
    scores_dict = {score.item_id: score for score in assessment.scores.all()}
    
    context = {
        'assessment': assessment,
        'nursing_levels': nursing_levels,
        'dimensions': dimensions,
        'scores_dict': scores_dict,
    }
    return render(request, 'assessments/assessment_form.html', context)


@login_required
def assessment_submit(request, pk):
    assessment = get_object_or_404(Assessment, pk=pk)
    
    if assessment.status != 'draft':
        messages.error(request, '只有草稿状态的评估可以提交')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if not (request.user == assessment.nurse or request.user.is_director()):
        messages.error(request, '您没有权限提交此评估')
        return redirect('assessments:assessment_detail', pk=pk)
    
    missing_items = assessment.get_missing_items()
    if missing_items:
        item_names = ', '.join([item.name for item in missing_items[:5]])
        if len(missing_items) > 5:
            item_names += f' 等{len(missing_items)}项'
        messages.error(request, f'评估表存在缺项，无法提交: {item_names}')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if request.method == 'POST':
        old_status = assessment.status
        assessment.status = 'pending_doctor'
        assessment.save()
        
        AssessmentHistory.objects.create(
            assessment=assessment,
            action='submit',
            user=request.user,
            from_status=old_status,
            to_status='pending_doctor',
            notes='提交评估审核'
        )
        
        messages.success(request, '评估已提交，等待医生确认')
        return redirect('assessments:assessment_detail', pk=assessment.pk)
    
    context = {
        'assessment': assessment,
        'missing_items': missing_items,
    }
    return render(request, 'assessments/assessment_submit.html', context)


@login_required
def doctor_confirm(request, pk):
    assessment = get_object_or_404(Assessment, pk=pk)
    
    if not request.user.is_doctor():
        messages.error(request, '只有医生可以确认护理建议')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if assessment.status != 'pending_doctor':
        messages.error(request, '当前状态不允许医生确认')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if request.method == 'POST':
        old_status = assessment.status
        assessment.doctor = request.user
        assessment.doctor_confirmed_at = timezone.now()
        assessment.doctor_notes = request.POST.get('doctor_notes', '')
        assessment.status = 'pending_family'
        assessment.save()
        
        AssessmentHistory.objects.create(
            assessment=assessment,
            action='doctor_confirm',
            user=request.user,
            from_status=old_status,
            to_status='pending_family',
            notes=assessment.doctor_notes
        )
        
        messages.success(request, '护理建议已确认，等待家属确认')
        return redirect('assessments:assessment_detail', pk=assessment.pk)
    
    context = {
        'assessment': assessment,
    }
    return render(request, 'assessments/doctor_confirm.html', context)


@login_required
def family_confirm(request, pk):
    assessment = get_object_or_404(Assessment, pk=pk)
    
    if not request.user.is_family():
        messages.error(request, '只有家属可以确认费用')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if assessment.elder not in request.user.elders.all():
        messages.error(request, '您不是该长者的家属')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if assessment.status != 'pending_family':
        messages.error(request, '当前状态不允许家属确认')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if request.method == 'POST':
        old_status = assessment.status
        assessment.family_member = request.user
        assessment.family_confirmed_at = timezone.now()
        assessment.family_agreed = request.POST.get('family_agreed') == 'true'
        assessment.family_notes = request.POST.get('family_notes', '')
        assessment.objection_reason = request.POST.get('objection_reason', '')
        
        if assessment.family_agreed:
            assessment.status = 'pending_director'
            AssessmentHistory.objects.create(
                assessment=assessment,
                action='family_confirm',
                user=request.user,
                from_status=old_status,
                to_status='pending_director',
                notes='家属同意: ' + assessment.family_notes
            )
            messages.success(request, '费用已确认，等待院长复核')
        else:
            assessment.status = 'pending_director'
            AssessmentHistory.objects.create(
                assessment=assessment,
                action='family_confirm',
                user=request.user,
                from_status=old_status,
                to_status='pending_director',
                notes='家属异议: ' + assessment.objection_reason
            )
            messages.info(request, '已记录您的异议，等待院长复核')
        
        assessment.save()
        return redirect('assessments:assessment_detail', pk=assessment.pk)
    
    context = {
        'assessment': assessment,
    }
    return render(request, 'assessments/family_confirm.html', context)


@login_required
def director_review(request, pk):
    assessment = get_object_or_404(Assessment, pk=pk)
    
    if not request.user.is_director():
        messages.error(request, '只有院长可以复核')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if assessment.status != 'pending_director':
        messages.error(request, '当前状态不允许院长复核')
        return redirect('assessments:assessment_detail', pk=pk)
    
    if request.method == 'POST':
        old_status = assessment.status
        assessment.director = request.user
        assessment.director_confirmed_at = timezone.now()
        assessment.director_approved = request.POST.get('director_approved') == 'true'
        assessment.director_notes = request.POST.get('director_notes', '')
        
        if assessment.director_approved:
            if not assessment.is_complete():
                messages.error(request, '评估表存在缺项，无法生效')
                return redirect('assessments:assessment_detail', pk=pk)
            
            assessment.status = 'approved'
            assessment.effective_at = timezone.now()
            assessment.elder.current_nursing_level = assessment.nursing_level
            assessment.elder.current_monthly_fee = assessment.new_monthly_fee
            assessment.elder.save()
            
            AssessmentHistory.objects.create(
                assessment=assessment,
                action='director_approve',
                user=request.user,
                from_status=old_status,
                to_status='approved',
                notes=assessment.director_notes
            )
            messages.success(request, '评估已生效')
        else:
            assessment.status = 'rejected'
            AssessmentHistory.objects.create(
                assessment=assessment,
                action='director_reject',
                user=request.user,
                from_status=old_status,
                to_status='rejected',
                notes=assessment.director_notes
            )
            messages.info(request, '评估已退回')
        
        assessment.save()
        return redirect('assessments:assessment_detail', pk=assessment.pk)
    
    context = {
        'assessment': assessment,
        'missing_items': assessment.get_missing_items(),
        'is_complete': assessment.is_complete(),
    }
    return render(request, 'assessments/director_review.html', context)


@login_required
def nursing_level_list(request):
    levels = NursingLevel.objects.all().order_by('level')
    context = {
        'levels': levels,
    }
    return render(request, 'assessments/nursing_level_list.html', context)


@login_required
def dimension_list(request):
    dimensions = AssessmentDimension.objects.filter(is_active=True).prefetch_related('items')
    context = {
        'dimensions': dimensions,
    }
    return render(request, 'assessments/dimension_list.html', context)