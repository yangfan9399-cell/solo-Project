from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models import Count, Q
from .models import ObservationRecord, ObservationPhoto
from batches.models import Batch, StatusHistory


@login_required
def observation_list(request):
    observations = ObservationRecord.objects.all().select_related('batch', 'observer').order_by('-observation_date')
    
    batch_filter = request.GET.get('batch')
    if batch_filter:
        observations = observations.filter(batch_id=batch_filter)
    
    abnormal_filter = request.GET.get('abnormal')
    if abnormal_filter == 'true':
        observations = observations.filter(is_abnormal=True)
    
    batches = Batch.objects.all()
    
    context = {
        'observations': observations,
        'batches': batches,
        'current_batch': batch_filter,
        'current_abnormal': abnormal_filter,
    }
    return render(request, 'observations/observation_list.html', context)


@login_required
def observation_create(request, batch_id):
    if not request.user.can_write_observation():
        messages.error(request, '您没有权限填写观察记录')
        return redirect('batches:detail', pk=batch_id)
    
    batch = get_object_or_404(Batch, pk=batch_id)
    
    if request.method == 'POST':
        observation_date = request.POST.get('observation_date')
        temperature = request.POST.get('temperature')
        appetite = request.POST.get('appetite')
        mental_state = request.POST.get('mental_state')
        excretion = request.POST.get('excretion')
        abnormal_symptoms = request.POST.get('abnormal_symptoms', '')
        feeding_record = request.POST.get('feeding_record')
        water_intake = request.POST.get('water_intake')
        environment_temp = request.POST.get('environment_temp')
        environment_humidity = request.POST.get('environment_humidity')
        
        observation = ObservationRecord.objects.create(
            batch=batch,
            observation_date=observation_date,
            observer=request.user,
            temperature=float(temperature),
            appetite=appetite,
            mental_state=mental_state,
            excretion=excretion,
            abnormal_symptoms=abnormal_symptoms if abnormal_symptoms else None,
            feeding_record=feeding_record,
            water_intake=water_intake,
            environment_temp=float(environment_temp),
            environment_humidity=float(environment_humidity),
        )
        
        if observation.is_abnormal:
            StatusHistory.objects.create(
                batch=batch,
                from_status=batch.status,
                to_status='reviewing',
                changed_by=request.user,
                notes=f'发现异常症状: {abnormal_symptoms}'
            )
            batch.status = 'reviewing'
            batch.save()
            messages.warning(request, '发现异常症状，已自动标记为待复核状态')
        
        messages.success(request, '观察记录已添加')
        return redirect('batches:detail', pk=batch.pk)
    
    today = timezone.now().date()
    context = {
        'batch': batch,
        'today': today,
    }
    return render(request, 'observations/observation_form.html', context)


@login_required
def observation_detail(request, pk):
    observation = get_object_or_404(ObservationRecord, pk=pk)
    context = {
        'observation': observation,
    }
    return render(request, 'observations/observation_detail.html', context)


@login_required
def veterinary_review_list(request):
    if not request.user.can_review_health():
        messages.error(request, '您没有权限访问兽医复核功能')
        return redirect('batches:list')
    
    batches_to_review = Batch.objects.filter(status='reviewing').select_related('created_by')
    batches_with_abnormal = Batch.objects.filter(status='quarantining').annotate(
        abnormal_count=Count('observation_records', filter=Q(observation_records__is_abnormal=True))
    ).filter(abnormal_count__gt=0)
    
    context = {
        'batches_to_review': batches_to_review,
        'batches_with_abnormal': batches_with_abnormal,
    }
    return render(request, 'observations/veterinary_review_list.html', context)


@login_required
def veterinary_review(request, batch_id):
    if not request.user.can_review_health():
        messages.error(request, '您没有权限进行兽医复核')
        return redirect('batches:list')
    
    batch = get_object_or_404(Batch, pk=batch_id)
    observations = ObservationRecord.objects.filter(batch=batch).order_by('-observation_date')
    
    if request.method == 'POST':
        health_status = request.POST.get('health_status')
        comments = request.POST.get('comments', '')
        
        old_status = batch.status
        if health_status == 'healthy':
            batch.status = 'approving'
            action = 'approve'
        elif health_status == 'attention_needed':
            batch.status = 'extended'
            action = 'extend'
        else:
            batch.status = 'returned'
            action = 'return'
        
        batch.save()
        
        StatusHistory.objects.create(
            batch=batch,
            from_status=old_status,
            to_status=batch.status,
            changed_by=request.user,
            notes=f'兽医复核: {comments}'
        )
        
        from batches.models import ApprovalHistory
        ApprovalHistory.objects.create(
            batch=batch,
            approver=request.user,
            action='veterinary_review',
            reason=f'健康状态: {health_status}, 备注: {comments}'
        )
        
        messages.success(request, f'兽医复核完成，批次状态已更新为 {batch.get_status_display()}')
        return redirect('observations:review_list')
    
    context = {
        'batch': batch,
        'observations': observations,
    }
    return render(request, 'observations/veterinary_review_form.html', context)