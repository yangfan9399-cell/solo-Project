from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.utils import timezone
from .models import Batch, Document, ApprovalHistory, StatusHistory
from observations.models import ObservationRecord


@login_required
def batch_list(request):
    batches = Batch.objects.all().select_related('created_by')
    
    status_filter = request.GET.get('status')
    if status_filter:
        batches = batches.filter(status=status_filter)
    
    country_filter = request.GET.get('country')
    if country_filter:
        batches = batches.filter(origin_country=country_filter)
    
    animal_filter = request.GET.get('animal_type')
    if animal_filter:
        batches = batches.filter(animal_type=animal_filter)
    
    search_query = request.GET.get('search')
    if search_query:
        batches = batches.filter(
            Q(batch_number__icontains=search_query) |
            Q(origin_country__icontains=search_query) |
            Q(animal_type__icontains=search_query)
        )
    
    status_choices = Batch.STATUS_CHOICES
    countries = Batch.objects.values_list('origin_country', flat=True).distinct()
    animal_types = Batch.objects.values_list('animal_type', flat=True).distinct()
    
    context = {
        'batches': batches,
        'status_choices': status_choices,
        'countries': countries,
        'animal_types': animal_types,
        'current_status': status_filter,
        'current_country': country_filter,
        'current_animal': animal_filter,
        'search_query': search_query,
    }
    return render(request, 'batches/batch_list.html', context)


@login_required
def batch_detail(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    observations = ObservationRecord.objects.filter(batch=batch).order_by('-observation_date')
    documents = Document.objects.filter(batch=batch).order_by('-uploaded_at')
    approval_history = ApprovalHistory.objects.filter(batch=batch).order_by('-action_time')
    status_history = StatusHistory.objects.filter(batch=batch).order_by('-changed_at')
    
    can_release = batch.can_release() and request.user.can_approve_release() and batch.status == 'approving'
    can_extend = request.user.can_approve_release() and batch.status in ['approving', 'quarantining']
    can_return = request.user.can_approve_release() and batch.status in ['approving', 'reviewing']
    
    context = {
        'batch': batch,
        'observations': observations,
        'documents': documents,
        'approval_history': approval_history,
        'status_history': status_history,
        'can_release': can_release,
        'can_extend': can_extend,
        'can_return': can_return,
        'quarantine_days': batch.get_quarantine_days(),
        'missing_feeding': batch.has_missing_feeding_records(),
    }
    return render(request, 'batches/batch_detail.html', context)


@login_required
def batch_create(request):
    if not request.user.can_create_batch():
        messages.error(request, '您没有权限创建批次')
        return redirect('batches:list')
    
    if request.method == 'POST':
        batch_number = request.POST.get('batch_number')
        animal_type = request.POST.get('animal_type')
        quantity = request.POST.get('quantity')
        origin_country = request.POST.get('origin_country')
        entry_date = request.POST.get('entry_date')
        quarantine_site = request.POST.get('quarantine_site')
        
        batch = Batch.objects.create(
            batch_number=batch_number,
            animal_type=animal_type,
            quantity=int(quantity),
            origin_country=origin_country,
            entry_date=entry_date,
            quarantine_site=quarantine_site,
            created_by=request.user,
            status='quarantining'
        )
        
        StatusHistory.objects.create(
            batch=batch,
            from_status='pending',
            to_status='quarantining',
            changed_by=request.user,
            notes='批次创建，开始隔离'
        )
        
        messages.success(request, f'批次 {batch.batch_number} 创建成功')
        return redirect('batches:detail', pk=batch.pk)
    
    return render(request, 'batches/batch_create.html')


@login_required
def batch_update_status(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    
    if request.method == 'POST':
        new_status = request.POST.get('status')
        notes = request.POST.get('notes', '')
        
        old_status = batch.status
        batch.status = new_status
        batch.save()
        
        StatusHistory.objects.create(
            batch=batch,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        messages.success(request, f'批次状态已更新为 {batch.get_status_display()}')
        return redirect('batches:detail', pk=batch.pk)
    
    return redirect('batches:detail', pk=batch.pk)


@login_required
def upload_document(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    
    if request.method == 'POST':
        document_type = request.POST.get('document_type')
        file = request.FILES.get('file')
        
        if file:
            file_path = f'media/certificates/{document_type}/{batch.batch_number}_{file.name}'
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            Document.objects.create(
                batch=batch,
                document_type=document_type,
                file_path=file_path,
                uploaded_by=request.user
            )
            
            if document_type == 'vaccine_certificate':
                batch.vaccine_certificate = True
            elif document_type == 'health_certificate':
                batch.health_certificate = True
            elif document_type == 'quarantine_certificate':
                batch.quarantine_certificate = True
            batch.save()
            
            messages.success(request, '文档上传成功')
    
    return redirect('batches:detail', pk=batch.pk)


@login_required
def approve_release(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    
    if not request.user.can_approve_release():
        messages.error(request, '您没有审批权限')
        return redirect('batches:detail', pk=batch.pk)
    
    if not batch.vaccine_certificate:
        messages.error(request, '疫苗证明缺失，无法放行')
        return redirect('batches:detail', pk=batch.pk)
    
    if request.method == 'POST':
        old_status = batch.status
        batch.status = 'released'
        batch.save()
        
        ApprovalHistory.objects.create(
            batch=batch,
            approver=request.user,
            action='release',
            reason=request.POST.get('reason', '')
        )
        
        StatusHistory.objects.create(
            batch=batch,
            from_status=old_status,
            to_status='released',
            changed_by=request.user,
            notes='批准放行'
        )
        
        messages.success(request, f'批次 {batch.batch_number} 已批准放行')
        return redirect('batches:detail', pk=batch.pk)
    
    return redirect('batches:detail', pk=batch.pk)


@login_required
def approve_extend(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    
    if not request.user.can_approve_release():
        messages.error(request, '您没有审批权限')
        return redirect('batches:detail', pk=batch.pk)
    
    if request.method == 'POST':
        extend_days = int(request.POST.get('extend_days', 7))
        reason = request.POST.get('reason', '')
        
        old_status = batch.status
        batch.status = 'extended'
        batch.save()
        
        ApprovalHistory.objects.create(
            batch=batch,
            approver=request.user,
            action='extend',
            reason=reason,
            extend_days=extend_days
        )
        
        StatusHistory.objects.create(
            batch=batch,
            from_status=old_status,
            to_status='extended',
            changed_by=request.user,
            notes=f'延长隔离 {extend_days} 天，原因: {reason}'
        )
        
        messages.success(request, f'批次 {batch.batch_number} 已延长隔离 {extend_days} 天')
        return redirect('batches:detail', pk=batch.pk)
    
    return redirect('batches:detail', pk=batch.pk)


@login_required
def approve_return(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    
    if not request.user.can_approve_release():
        messages.error(request, '您没有审批权限')
        return redirect('batches:detail', pk=batch.pk)
    
    if request.method == 'POST':
        reason = request.POST.get('reason', '')
        
        old_status = batch.status
        batch.status = 'returned'
        batch.save()
        
        ApprovalHistory.objects.create(
            batch=batch,
            approver=request.user,
            action='return',
            reason=reason
        )
        
        StatusHistory.objects.create(
            batch=batch,
            from_status=old_status,
            to_status='returned',
            changed_by=request.user,
            notes=f'批准退运，原因: {reason}'
        )
        
        messages.success(request, f'批次 {batch.batch_number} 已批准退运')
        return redirect('batches:detail', pk=batch.pk)
    
    return redirect('batches:detail', pk=batch.pk)