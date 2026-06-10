from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.db.models import Count, Sum, Q, F, ExpressionWrapper, DurationField
from django.utils import timezone
from datetime import timedelta
from .models import (
    Consumable, Batch, ResearchGroup, UserProfile, Application,
    ReturnRecord, ApplicationHistory, College, ConsumableCategory
)
from .forms import ApplicationForm, LoginForm, ReturnForm

def user_login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
            if user:
                login(request, user)
                return redirect('dashboard')
            messages.error(request, '用户名或密码错误')
    else:
        form = LoginForm()
    return render(request, 'login.html', {'form': form})

def user_logout(request):
    logout(request)
    return redirect('login')

@login_required
def dashboard(request):
    user_profile = UserProfile.objects.get(user=request.user)
    role = user_profile.role
    
    pending_count = Application.objects.filter(status='pending').count()
    inventory_checked_count = Application.objects.filter(status='inventory_checked').count()
    safety_checked_count = Application.objects.filter(status='safety_checked').count()
    issued_count = Application.objects.filter(status='issued').count()
    overdue_count = Application.objects.filter(status='overdue').count()
    
    low_stock_items = Batch.objects.filter(quantity__lt=F('consumable__min_stock'), is_active=True).count()
    
    context = {
        'role': role,
        'pending_count': pending_count,
        'inventory_checked_count': inventory_checked_count,
        'safety_checked_count': safety_checked_count,
        'issued_count': issued_count,
        'overdue_count': overdue_count,
        'low_stock_items': low_stock_items,
    }
    
    return render(request, 'dashboard.html', context)

@login_required
def application_list(request):
    user_profile = UserProfile.objects.get(user=request.user)
    role = user_profile.role
    
    if role == 'teacher':
        applications = Application.objects.filter(applicant=request.user).order_by('-created_at')
    elif role == 'stock_manager':
        applications = Application.objects.filter(status='pending').order_by('-created_at')
    elif role == 'safety_officer':
        applications = Application.objects.filter(status='inventory_checked').order_by('-updated_at')
    elif role == 'lab_manager':
        applications = Application.objects.filter(status='issued').order_by('-issued_at')
    else:
        applications = Application.objects.all().order_by('-created_at')
    
    return render(request, 'application_list.html', {'applications': applications, 'role': role})

@login_required
def application_detail(request, pk):
    application = get_object_or_404(Application, pk=pk)
    history = ApplicationHistory.objects.filter(application=application).order_by('-operated_at')
    alternatives = []
    
    if application.status == 'issued' or application.status == 'approved':
        alternatives = Batch.objects.filter(
            consumable=application.consumable,
            is_active=True,
            quantity__gt=0
        ).exclude(pk=application.batch.pk) if application.batch else Batch.objects.none()
    
    return render(request, 'application_detail.html', {
        'application': application,
        'history': history,
        'alternatives': alternatives
    })

@login_required
def create_application(request):
    if request.method == 'POST':
        form = ApplicationForm(request.POST)
        if form.is_valid():
            application = form.save(commit=False)
            application.applicant = request.user
            user_profile = UserProfile.objects.get(user=request.user)
            application.research_group = user_profile.research_group
            application.expected_return_date = timezone.now().date() + timedelta(days=7)
            application.save()
            
            ApplicationHistory.objects.create(
                application=application,
                status_before='pending',
                status_after='pending',
                operated_by=request.user,
                comment='创建申请'
            )
            
            messages.success(request, '申请已提交')
            return redirect('application_list')
    else:
        form = ApplicationForm()
    
    return render(request, 'create_application.html', {'form': form})

@login_required
def inventory_check(request, pk):
    application = get_object_or_404(Application, pk=pk)
    
    if application.status != 'pending':
        messages.error(request, '申请状态不允许此操作')
        return redirect('application_detail', pk=pk)
    
    batch = Batch.objects.filter(
        consumable=application.consumable,
        is_active=True,
        quantity__gte=application.requested_quantity
    ).first()
    
    if batch:
        application.batch = batch
        application.status = 'inventory_checked'
        application.inventory_checker = request.user
        application.save()
        
        ApplicationHistory.objects.create(
            application=application,
            status_before='pending',
            status_after='inventory_checked',
            operated_by=request.user,
            comment='库存审核通过'
        )
        messages.success(request, '库存审核通过')
    else:
        application.status = 'rejected'
        application.exception_reason = 'stock_shortage'
        application.exception_note = '库存不足，无法满足申请'
        application.inventory_checker = request.user
        application.save()
        
        ApplicationHistory.objects.create(
            application=application,
            status_before='pending',
            status_after='rejected',
            operated_by=request.user,
            comment='库存不足，申请已拒绝'
        )
        messages.error(request, '库存不足，申请已拒绝')
    
    return redirect('application_detail', pk=pk)

@login_required
def safety_check(request, pk):
    application = get_object_or_404(Application, pk=pk)
    
    if application.status != 'inventory_checked':
        messages.error(request, '申请状态不允许此操作')
        return redirect('application_detail', pk=pk)
    
    applicant_profile = UserProfile.objects.get(user=application.applicant)
    
    if application.consumable.requires_qualification and not applicant_profile.has_dangerous_qualification:
        application.status = 'rejected'
        application.exception_reason = 'qualification_missing'
        application.exception_note = '申请人未获得危险品操作资质'
        application.safety_checker = request.user
        application.save()
        
        ApplicationHistory.objects.create(
            application=application,
            status_before='inventory_checked',
            status_after='rejected',
            operated_by=request.user,
            comment='危险品资质缺失，申请已拒绝'
        )
        messages.error(request, '危险品资质缺失，申请已拒绝')
    else:
        application.status = 'safety_checked'
        application.safety_checker = request.user
        application.save()
        
        ApplicationHistory.objects.create(
            application=application,
            status_before='inventory_checked',
            status_after='safety_checked',
            operated_by=request.user,
            comment='安全审核通过'
        )
        messages.success(request, '安全审核通过')
    
    return redirect('application_detail', pk=pk)

@login_required
def approve_application(request, pk):
    application = get_object_or_404(Application, pk=pk)
    
    if application.status != 'safety_checked':
        messages.error(request, '申请状态不允许此操作')
        return redirect('application_detail', pk=pk)
    
    application.status = 'approved'
    application.save()
    
    ApplicationHistory.objects.create(
        application=application,
        status_before='safety_checked',
        status_after='approved',
        operated_by=request.user,
        comment='申请已批准'
    )
    messages.success(request, '申请已批准')
    
    return redirect('application_detail', pk=pk)

@login_required
def issue_application(request, pk):
    application = get_object_or_404(Application, pk=pk)
    
    if application.status != 'approved':
        messages.error(request, '申请状态不允许此操作')
        return redirect('application_detail', pk=pk)
    
    if application.batch.quantity < application.requested_quantity:
        messages.error(request, '库存不足，无法出库')
        return redirect('application_detail', pk=pk)
    
    application.batch.quantity -= application.requested_quantity
    application.batch.save()
    
    application.status = 'issued'
    application.actual_quantity = application.requested_quantity
    application.issued_at = timezone.now()
    application.save()
    
    ApplicationHistory.objects.create(
        application=application,
        status_before='approved',
        status_after='issued',
        operated_by=request.user,
        comment='已出库'
    )
    messages.success(request, '已出库')
    
    return redirect('application_detail', pk=pk)

@login_required
def return_application(request, pk):
    application = get_object_or_404(Application, pk=pk)
    
    if application.status not in ['issued', 'overdue']:
        messages.error(request, '申请状态不允许此操作')
        return redirect('application_detail', pk=pk)
    
    if request.method == 'POST':
        form = ReturnForm(request.POST)
        if form.is_valid():
            returned_quantity = form.cleaned_data['returned_quantity']
            
            if returned_quantity > application.actual_quantity:
                messages.error(request, '归还数量不能超过领用数量')
                return redirect('return_application', pk=pk)
            
            ReturnRecord.objects.create(
                application=application,
                returned_quantity=returned_quantity,
                returned_by=request.user,
                condition=form.cleaned_data['condition'],
                notes=form.cleaned_data['notes']
            )
            
            if application.batch:
                application.batch.quantity += returned_quantity
                application.batch.save()
            
            application.status = 'returned'
            application.returned_at = timezone.now()
            application.save()
            
            ApplicationHistory.objects.create(
                application=application,
                status_before=application.status,
                status_after='returned',
                operated_by=request.user,
                comment=f'已归还 {returned_quantity} {application.consumable.unit}'
            )
            messages.success(request, '归还成功')
            return redirect('application_detail', pk=pk)
    else:
        form = ReturnForm()
    
    return render(request, 'return_application.html', {'application': application, 'form': form})

@login_required
def statistics(request):
    stats_by_college = Application.objects.values(
        'research_group__college__name'
    ).annotate(
        total=Count('id'),
        returned=Count('id', filter=Q(status='returned')),
        overdue=Count('id', filter=Q(status='overdue'))
    ).order_by('research_group__college__name')
    
    stats_by_category = Application.objects.values(
        'consumable__category__name'
    ).annotate(
        total=Count('id'),
        returned=Count('id', filter=Q(status='returned')),
        overdue=Count('id', filter=Q(status='overdue'))
    ).order_by('consumable__category__name')
    
    stats_by_exception = Application.objects.values(
        'exception_reason'
    ).annotate(
        count=Count('id')
    ).filter(exception_reason__isnull=False)
    
    returned_apps = Application.objects.filter(
        status='returned',
        issued_at__isnull=False,
        returned_at__isnull=False
    )
    
    total_days = 0
    count = 0
    for app in returned_apps:
        if app.issued_at and app.returned_at:
            total_days += (app.returned_at - app.issued_at).days
            count += 1
    
    avg_turnover = total_days / count if count > 0 else None
    
    low_stock_items = Batch.objects.filter(
        quantity__lt=F('consumable__min_stock'),
        is_active=True
    ).select_related('consumable')
    
    return render(request, 'statistics.html', {
        'stats_by_college': stats_by_college,
        'stats_by_category': stats_by_category,
        'stats_by_exception': stats_by_exception,
        'avg_turnover': avg_turnover['avg_days'],
        'low_stock_items': low_stock_items,
    })

@login_required
def check_overdue(request):
    overdue_applications = Application.objects.filter(
        status='issued',
        expected_return_date__lt=timezone.now().date()
    )
    
    for app in overdue_applications:
        if app.status == 'issued':
            app.status = 'overdue'
            app.exception_reason = 'overdue'
            app.save()
            
            ApplicationHistory.objects.create(
                application=app,
                status_before='issued',
                status_after='overdue',
                operated_by=request.user,
                comment='系统自动标记为逾期'
            )
    
    messages.success(request, f'已处理 {overdue_applications.count()} 个逾期申请')
    return redirect('application_list')

@login_required
def low_stock_warning(request):
    low_stock_items = Batch.objects.filter(
        quantity__lt=F('consumable__min_stock'),
        is_active=True
    ).select_related('consumable')
    
    return render(request, 'low_stock_warning.html', {'low_stock_items': low_stock_items})
