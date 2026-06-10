from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Elder, User
from assessments.models import Assessment, NursingLevel


@login_required
def dashboard(request):
    user = request.user
    context = {
        'user': user,
    }
    
    if user.is_nurse():
        assessments = Assessment.objects.filter(
            Q(nurse=user) | Q(status='draft')
        ).select_related('elder', 'nursing_level').order_by('-created_at')[:10]
        context['assessments'] = assessments
        context['pending_count'] = Assessment.objects.filter(
            nurse=user, status='draft'
        ).count()
    elif user.is_doctor():
        assessments = Assessment.objects.filter(
            status='pending_doctor'
        ).select_related('elder', 'nursing_level').order_by('-created_at')[:10]
        context['assessments'] = assessments
        context['pending_count'] = assessments.count()
    elif user.is_family():
        elders = user.elders.all()
        assessments = Assessment.objects.filter(
            elder__in=elders, status='pending_family'
        ).select_related('elder', 'nursing_level').order_by('-created_at')[:10]
        context['assessments'] = assessments
        context['elders'] = elders
        context['pending_count'] = assessments.count()
    elif user.is_director():
        assessments = Assessment.objects.filter(
            status='pending_director'
        ).select_related('elder', 'nursing_level').order_by('-created_at')[:10]
        context['assessments'] = assessments
        context['pending_count'] = assessments.count()
    
    return render(request, 'core/dashboard.html', context)


@login_required
def elder_list(request):
    elders = Elder.objects.all().select_related('current_nursing_level')
    
    search = request.GET.get('search', '')
    if search:
        elders = elders.filter(
            Q(name__icontains=search) |
            Q(id_number__icontains=search) |
            Q(room_number__icontains=search)
        )
    
    floor = request.GET.get('floor', '')
    if floor:
        elders = elders.filter(floor=floor)
    
    nursing_level = request.GET.get('nursing_level', '')
    if nursing_level:
        elders = elders.filter(current_nursing_level_id=nursing_level)
    
    floors = Elder.objects.values_list('floor', flat=True).distinct().order_by('floor')
    nursing_levels = NursingLevel.objects.all().order_by('level')
    
    context = {
        'elders': elders,
        'floors': floors,
        'nursing_levels': nursing_levels,
        'search': search,
        'selected_floor': floor,
        'selected_nursing_level': nursing_level,
    }
    return render(request, 'core/elder_list.html', context)


@login_required
def elder_detail(request, pk):
    elder = get_object_or_404(Elder, pk=pk)
    assessments = Assessment.objects.filter(elder=elder).select_related(
        'nursing_level', 'nurse', 'doctor', 'family_member', 'director'
    ).order_by('-created_at')
    
    context = {
        'elder': elder,
        'assessments': assessments,
    }
    return render(request, 'core/elder_detail.html', context)


@login_required
def elder_create(request):
    if not (request.user.is_nurse() or request.user.is_director()):
        messages.error(request, '您没有权限执行此操作')
        return redirect('core:dashboard')
    
    if request.method == 'POST':
        try:
            elder = Elder.objects.create(
                name=request.POST.get('name'),
                gender=request.POST.get('gender'),
                birth_date=request.POST.get('birth_date'),
                id_number=request.POST.get('id_number'),
                floor=request.POST.get('floor'),
                room_number=request.POST.get('room_number'),
                bed_number=request.POST.get('bed_number'),
                admission_date=request.POST.get('admission_date'),
                medical_history=request.POST.get('medical_history', ''),
                allergies=request.POST.get('allergies', ''),
                emergency_contact=request.POST.get('emergency_contact'),
                emergency_phone=request.POST.get('emergency_phone'),
            )
            
            family_ids = request.POST.getlist('family_members')
            if family_ids:
                elder.family_members.set(family_ids)
            
            messages.success(request, f'长者 {elder.name} 创建成功')
            return redirect('core:elder_detail', pk=elder.pk)
        except Exception as e:
            messages.error(request, f'创建失败: {str(e)}')
    
    family_users = User.objects.filter(role=User.Role.FAMILY)
    floors = ['1楼', '2楼', '3楼', '4楼', '5楼']
    
    context = {
        'family_users': family_users,
        'floors': floors,
    }
    return render(request, 'core/elder_form.html', context)


@login_required
def elder_edit(request, pk):
    elder = get_object_or_404(Elder, pk=pk)
    
    if not (request.user.is_nurse() or request.user.is_director()):
        messages.error(request, '您没有权限执行此操作')
        return redirect('core:elder_detail', pk=pk)
    
    if request.method == 'POST':
        try:
            elder.name = request.POST.get('name')
            elder.gender = request.POST.get('gender')
            elder.birth_date = request.POST.get('birth_date')
            elder.id_number = request.POST.get('id_number')
            elder.floor = request.POST.get('floor')
            elder.room_number = request.POST.get('room_number')
            elder.bed_number = request.POST.get('bed_number')
            elder.admission_date = request.POST.get('admission_date')
            elder.medical_history = request.POST.get('medical_history', '')
            elder.allergies = request.POST.get('allergies', '')
            elder.emergency_contact = request.POST.get('emergency_contact')
            elder.emergency_phone = request.POST.get('emergency_phone')
            elder.save()
            
            family_ids = request.POST.getlist('family_members')
            elder.family_members.set(family_ids)
            
            messages.success(request, f'长者 {elder.name} 更新成功')
            return redirect('core:elder_detail', pk=elder.pk)
        except Exception as e:
            messages.error(request, f'更新失败: {str(e)}')
    
    family_users = User.objects.filter(role=User.Role.FAMILY)
    floors = ['1楼', '2楼', '3楼', '4楼', '5楼']
    
    context = {
        'elder': elder,
        'family_users': family_users,
        'floors': floors,
    }
    return render(request, 'core/elder_form.html', context)