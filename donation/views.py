from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Count, Sum, F, Q, Avg
from django.utils import timezone
from datetime import date, timedelta
from .models import Donor, Material, MaterialCategory, Batch, Recipient, Project, DistributionPlan, Receipt, AuditRecord, HistoryNode

def create_default_user():
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')

def index(request):
    create_default_user()
    today = date.today()
    pending_batches = Batch.objects.filter(status='pending').count()
    in_stock_batches = Batch.objects.filter(status='in_stock').count()
    expired_batches = Batch.objects.filter(Q(expire_date__lt=today) & ~Q(status='expired')).count()
    pending_distributions = DistributionPlan.objects.filter(status='draft').count()
    pending_signatures = DistributionPlan.objects.filter(status='distributed').count()
    
    context = {
        'pending_batches': pending_batches,
        'in_stock_batches': in_stock_batches,
        'expired_batches': expired_batches,
        'pending_distributions': pending_distributions,
        'pending_signatures': pending_signatures,
    }
    return render(request, 'donation/index.html', context)

def batch_list(request):
    status = request.GET.get('status', '')
    batches = Batch.objects.select_related('donor', 'material', 'material__category').all()
    if status:
        batches = batches.filter(status=status)
    return render(request, 'donation/batch_list.html', {'batches': batches})

def batch_detail(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    distributions = DistributionPlan.objects.filter(batch=batch).select_related('project', 'recipient')
    history = HistoryNode.objects.filter(batch=batch).order_by('-created_at')
    return render(request, 'donation/batch_detail.html', {'batch': batch, 'distributions': distributions, 'history': history})

def batch_create(request):
    if request.method == 'POST':
        donor_name = request.POST.get('donor_name')
        donor, _ = Donor.objects.get_or_create(name=donor_name)
        
        category_name = request.POST.get('category_name')
        category, _ = MaterialCategory.objects.get_or_create(name=category_name)
        
        material_name = request.POST.get('material_name')
        material, _ = Material.objects.get_or_create(name=material_name, category=category)
        
        batch = Batch.objects.create(
            donor=donor,
            material=material,
            quantity=request.POST.get('quantity'),
            expire_date=request.POST.get('expire_date'),
            batch_number=request.POST.get('batch_number'),
            storage_location=request.POST.get('storage_location'),
            operator=request.user if request.user.is_authenticated else None,
        )
        
        HistoryNode.objects.create(
            batch=batch,
            node_type='receive',
            operator=request.user if request.user.is_authenticated else None,
            description=f'创建批次 {batch.batch_number}'
        )
        return redirect('batch_detail', pk=batch.pk)
    
    donors = Donor.objects.all()
    categories = MaterialCategory.objects.all()
    return render(request, 'donation/batch_create.html', {'donors': donors, 'categories': categories})

def batch_receive(request, pk):
    batch = get_object_or_404(Batch, pk=pk)
    if request.method == 'POST':
        batch.received_quantity = request.POST.get('received_quantity', batch.quantity)
        batch.status = 'in_stock'
        batch.received_at = timezone.now()
        batch.operator = request.user if request.user.is_authenticated else None
        batch.save()
        
        HistoryNode.objects.create(
            batch=batch,
            node_type='receive',
            operator=request.user if request.user.is_authenticated else None,
            description=f'入库 {batch.received_quantity} {batch.material.unit}'
        )
        return redirect('batch_detail', pk=batch.pk)
    return render(request, 'donation/batch_receive.html', {'batch': batch})

def distribution_list(request):
    status = request.GET.get('status', '')
    distributions = DistributionPlan.objects.select_related('batch', 'batch__material', 'project', 'recipient').all()
    if status:
        distributions = distributions.filter(status=status)
    return render(request, 'donation/distribution_list.html', {'distributions': distributions})

def distribution_create(request):
    if request.method == 'POST':
        batch = Batch.objects.get(pk=request.POST.get('batch'))
        project = Project.objects.get(pk=request.POST.get('project'))
        recipient = Recipient.objects.get(pk=request.POST.get('recipient'))
        
        if batch.is_expired:
            return JsonResponse({'error': '物资已过期，无法分配'}, status=400)
        
        if batch.available_quantity < int(request.POST.get('quantity')):
            return JsonResponse({'error': '库存不足'}, status=400)
        
        distribution = DistributionPlan.objects.create(
            batch=batch,
            project=project,
            recipient=recipient,
            quantity=request.POST.get('quantity'),
            planned_date=request.POST.get('planned_date'),
            operator=request.user if request.user.is_authenticated else None,
        )
        
        HistoryNode.objects.create(
            batch=batch,
            distribution=distribution,
            node_type='distribute',
            operator=request.user if request.user.is_authenticated else None,
            description=f'创建分配计划 {distribution.id}'
        )
        return redirect('distribution_detail', pk=distribution.pk)
    
    batches = Batch.objects.filter(status='in_stock').exclude(available_quantity=0).select_related('material')
    projects = Project.objects.filter(status='active')
    recipients = Recipient.objects.filter(is_valid=True)
    return render(request, 'donation/distribution_create.html', {'batches': batches, 'projects': projects, 'recipients': recipients})

def distribution_detail(request, pk):
    distribution = get_object_or_404(DistributionPlan, pk=pk)
    receipt = Receipt.objects.filter(distribution=distribution).first()
    audit_records = AuditRecord.objects.filter(distribution=distribution)
    history = HistoryNode.objects.filter(Q(batch=distribution.batch) | Q(distribution=distribution)).order_by('-created_at')
    
    return render(request, 'donation/distribution_detail.html', {
        'distribution': distribution,
        'receipt': receipt,
        'audit_records': audit_records,
        'history': history
    })

def distribution_approve(request, pk):
    distribution = get_object_or_404(DistributionPlan, pk=pk)
    if request.method == 'POST':
        distribution.status = 'approved'
        distribution.save()
        
        HistoryNode.objects.create(
            batch=distribution.batch,
            distribution=distribution,
            node_type='approve',
            operator=request.user if request.user.is_authenticated else None,
            description='分配计划已批准'
        )
        return redirect('distribution_detail', pk=distribution.pk)
    return render(request, 'donation/distribution_approve.html', {'distribution': distribution})

def distribution_distribute(request, pk):
    distribution = get_object_or_404(DistributionPlan, pk=pk)
    if request.method == 'POST':
        distribution.status = 'distributed'
        distribution.actual_distributed_date = date.today()
        distribution.save()
        
        distribution.batch.distributed_quantity += distribution.quantity
        distribution.batch.save()
        
        HistoryNode.objects.create(
            batch=distribution.batch,
            distribution=distribution,
            node_type='distribute',
            operator=request.user if request.user.is_authenticated else None,
            description=f'已发放 {distribution.quantity} {distribution.batch.material.unit}'
        )
        return redirect('distribution_detail', pk=distribution.pk)
    return render(request, 'donation/distribution_distribute.html', {'distribution': distribution})

def distribution_sign(request, pk):
    distribution = get_object_or_404(DistributionPlan, pk=pk)
    if request.method == 'POST':
        receipt = Receipt.objects.create(
            distribution=distribution,
            quantity_received=request.POST.get('quantity_received'),
            signed_by=request.POST.get('signed_by'),
            notes=request.POST.get('notes'),
            discrepancy_reason=request.POST.get('discrepancy_reason'),
        )
        
        if 'evidence' in request.FILES:
            receipt.evidence = request.FILES['evidence']
            receipt.save()
        
        distribution.status = 'received'
        distribution.save()
        
        HistoryNode.objects.create(
            batch=distribution.batch,
            distribution=distribution,
            node_type='sign',
            operator=request.user if request.user.is_authenticated else None,
            description=f'{receipt.signed_by} 签收 {receipt.quantity_received} {distribution.batch.material.unit}'
        )
        return redirect('distribution_detail', pk=distribution.pk)
    return render(request, 'donation/distribution_sign.html', {'distribution': distribution})

def distribution_audit(request, pk):
    distribution = get_object_or_404(DistributionPlan, pk=pk)
    if request.method == 'POST':
        action = request.POST.get('action')
        notes = request.POST.get('notes')
        
        AuditRecord.objects.create(
            distribution=distribution,
            action=action,
            auditor=request.user if request.user.is_authenticated else None,
            notes=notes,
        )
        
        if action == 'archive':
            distribution.status = 'archived'
            HistoryNode.objects.create(
                batch=distribution.batch,
                distribution=distribution,
                node_type='archive',
                operator=request.user if request.user.is_authenticated else None,
                description='已归档'
            )
        elif action == 'investigate':
            HistoryNode.objects.create(
                batch=distribution.batch,
                distribution=distribution,
                node_type='audit',
                operator=request.user if request.user.is_authenticated else None,
                description=f'追查: {notes}'
            )
        
        distribution.save()
        return redirect('distribution_detail', pk=distribution.pk)
    return render(request, 'donation/distribution_audit.html', {'distribution': distribution})

def recipient_list(request):
    recipients = Recipient.objects.all()
    return render(request, 'donation/recipient_list.html', {'recipients': recipients})

def recipient_create(request):
    if request.method == 'POST':
        Recipient.objects.create(
            name=request.POST.get('name'),
            contact=request.POST.get('contact'),
            phone=request.POST.get('phone'),
            address=request.POST.get('address'),
        )
        return redirect('recipient_list')
    return render(request, 'donation/recipient_create.html')

def recipient_edit(request, pk):
    recipient = get_object_or_404(Recipient, pk=pk)
    if request.method == 'POST':
        recipient.name = request.POST.get('name')
        recipient.contact = request.POST.get('contact')
        recipient.phone = request.POST.get('phone')
        recipient.address = request.POST.get('address')
        recipient.save()
        return redirect('recipient_list')
    return render(request, 'donation/recipient_edit.html', {'recipient': recipient})

def review_dashboard(request):
    by_project = DistributionPlan.objects.values('project__name').annotate(
        count=Count('id'),
        total_quantity=Sum('quantity')
    ).order_by('-count')
    
    by_category = DistributionPlan.objects.values('batch__material__category__name').annotate(
        count=Count('id'),
        total_quantity=Sum('quantity')
    ).order_by('-count')
    
    by_discrepancy_reason = DistributionPlan.objects.filter(
        receipt__quantity_received__lt=F('quantity')
    ).values('receipt__discrepancy_reason').annotate(
        count=Count('id'),
        total_discrepancy=Sum(F('quantity') - F('receipt__quantity_received'))
    ).order_by('-count')
    
    by_cycle = DistributionPlan.objects.filter(
        status='received',
        actual_distributed_date__isnull=False
    ).annotate(
        cycle=F('receipt__signed_at') - F('actual_distributed_date')
    ).values('cycle').annotate(
        count=Count('id')
    ).order_by('cycle')
    
    avg_cycle = DistributionPlan.objects.filter(
        status='received',
        actual_distributed_date__isnull=False
    ).annotate(
        cycle=F('receipt__signed_at') - F('actual_distributed_date')
    ).aggregate(Avg('cycle'))
    
    discrepancies = DistributionPlan.objects.filter(
        receipt__quantity_received__lt=F('quantity')
    ).count()
    
    received_count = DistributionPlan.objects.filter(status='received').count()
    archived_count = DistributionPlan.objects.filter(status='archived').count()
    
    cycle_buckets = []
    bucket_labels = ['3天内', '3-7天', '7-14天', '14天以上']
    thresholds = [timedelta(days=3), timedelta(days=7), timedelta(days=14)]
    
    # 3天内: cycle < 3天
    count_0_3 = DistributionPlan.objects.filter(
        status='received',
        actual_distributed_date__isnull=False
    ).annotate(
        cycle=F('receipt__signed_at') - F('actual_distributed_date')
    ).filter(cycle__lt=thresholds[0]).count()
    cycle_buckets.append({'label': bucket_labels[0], 'count': count_0_3})
    
    # 3-7天: 3天 <= cycle < 7天
    count_3_7 = DistributionPlan.objects.filter(
        status='received',
        actual_distributed_date__isnull=False
    ).annotate(
        cycle=F('receipt__signed_at') - F('actual_distributed_date')
    ).filter(cycle__gte=thresholds[0], cycle__lt=thresholds[1]).count()
    cycle_buckets.append({'label': bucket_labels[1], 'count': count_3_7})
    
    # 7-14天: 7天 <= cycle < 14天
    count_7_14 = DistributionPlan.objects.filter(
        status='received',
        actual_distributed_date__isnull=False
    ).annotate(
        cycle=F('receipt__signed_at') - F('actual_distributed_date')
    ).filter(cycle__gte=thresholds[1], cycle__lt=thresholds[2]).count()
    cycle_buckets.append({'label': bucket_labels[2], 'count': count_7_14})
    
    # 14天以上: cycle >= 14天
    count_14_plus = DistributionPlan.objects.filter(
        status='received',
        actual_distributed_date__isnull=False
    ).annotate(
        cycle=F('receipt__signed_at') - F('actual_distributed_date')
    ).filter(cycle__gte=thresholds[2]).count()
    cycle_buckets.append({'label': bucket_labels[3], 'count': count_14_plus})
    
    context = {
        'by_project': by_project,
        'by_category': by_category,
        'by_discrepancy_reason': by_discrepancy_reason,
        'by_cycle': cycle_buckets,
        'discrepancies': discrepancies,
        'received_count': received_count,
        'archived_count': archived_count,
        'avg_cycle': avg_cycle,
    }
    return render(request, 'donation/review_dashboard.html', context)

def api_batches(request):
    status = request.GET.get('status', '')
    batches = Batch.objects.filter(status=status) if status else Batch.objects.all()
    data = [{
        'id': b.id,
        'batch_number': b.batch_number,
        'material': b.material.name,
        'quantity': b.quantity,
        'available': b.available_quantity,
        'expire_date': b.expire_date.isoformat(),
        'is_expired': b.is_expired,
    } for b in batches]
    return JsonResponse(data, safe=False)

def api_distributions(request):
    status = request.GET.get('status', '')
    distributions = DistributionPlan.objects.filter(status=status) if status else DistributionPlan.objects.all()
    data = [{
        'id': d.id,
        'batch': d.batch.batch_number,
        'recipient': d.recipient.name,
        'quantity': d.quantity,
        'status': d.status,
    } for d in distributions]
    return JsonResponse(data, safe=False)
