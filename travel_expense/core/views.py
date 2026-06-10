from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.core.paginator import Paginator

from .models import Travel, Booking, Reimbursement
from .forms import TravelForm, BookingForm, ReimbursementForm, ApprovalForm
from .services import TravelService, ApprovalService, BookingService, ReimbursementService, StatisticsService


def login_view(request):
    """登录视图"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('travel_list')
        else:
            messages.error(request, '用户名或密码错误')

    return render(request, 'login.html')


def logout_view(request):
    """登出视图"""
    logout(request)
    return redirect('login')


@login_required
def dashboard(request):
    """仪表盘"""
    summary = StatisticsService.get_summary()
    recent_travels = Travel.objects.select_related(
        'applicant', 'department'
    ).order_by('-created_at')[:5]

    context = {
        'summary': summary,
        'recent_travels': recent_travels,
        'user': request.user
    }
    return render(request, 'dashboard.html', context)


@login_required
def travel_list(request):
    """差旅申请列表"""
    user = request.user

    if user.is_superadmin():
        travels = Travel.objects.all()
    elif user.is_manager():
        travels = Travel.objects.filter(department=user.department)
    else:
        travels = Travel.objects.filter(applicant=user)

    status_filter = request.GET.get('status')
    if status_filter:
        travels = travels.filter(status=status_filter)

    paginator = Paginator(travels.select_related('applicant', 'department', 'booking'), 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'status_choices': Travel.STATUS_CHOICES,
        'current_filter': status_filter,
        'user': user
    }
    return render(request, 'travel/list.html', context)


@login_required
def travel_create(request):
    """新建差旅申请"""
    if request.method == 'POST':
        form = TravelForm(request.POST)
        if form.is_valid():
            travel = TravelService.create_travel(request.user, form.cleaned_data)
            messages.success(request, '差旅申请已创建')
            return redirect('travel_detail', travel_id=travel.id)
    else:
        form = TravelForm()

    context = {'form': form, 'user': request.user}
    return render(request, 'travel/create.html', context)


@login_required
def travel_detail(request, travel_id):
    """差旅申请详情"""
    travel = get_object_or_404(Travel.objects.select_related(
        'applicant', 'department', 'booking', 'reimbursement'
    ).prefetch_related('history_nodes__actor'), id=travel_id)

    user = request.user

    if not (user.is_superadmin() or
            (user.is_manager() and travel.department == user.department) or
            travel.applicant == user or
            user.is_admin_staff() or
            user.is_finance()):
        messages.error(request, '无权限查看此申请')
        return redirect('travel_list')

    context = {
        'travel': travel,
        'user': user,
        'can_approve': user.is_manager() and travel.status == 'pending_approval' and travel.department == user.department,
        'can_book': user.is_admin_staff() and travel.status in ['pending_booking', 'booked'],
        'can_reimburse': user.is_finance() and travel.status == 'booked'
    }
    return render(request, 'travel/detail.html', context)


@login_required
@transaction.atomic
def travel_submit(request, travel_id):
    """提交差旅申请"""
    travel = get_object_or_404(Travel, id=travel_id)

    if travel.applicant != request.user:
        messages.error(request, '无权限操作')
        return redirect('travel_list')

    try:
        TravelService.submit_travel(travel, request.user)
        messages.success(request, '差旅申请已提交')
    except ValueError as e:
        messages.error(request, str(e))

    return redirect('travel_detail', travel_id=travel_id)


@login_required
def approval_list(request):
    """待审批列表"""
    user = request.user

    if not user.is_manager():
        messages.error(request, '无权限访问')
        return redirect('travel_list')

    travels = Travel.objects.filter(
        status='pending_approval',
        department=user.department
    ).select_related('applicant', 'department')

    context = {
        'travels': travels,
        'user': user
    }
    return render(request, 'travel/approval_list.html', context)


@login_required
@transaction.atomic
def travel_approve(request, travel_id):
    """审批操作"""
    travel = get_object_or_404(Travel, id=travel_id)

    user = request.user

    if not (user.is_manager() and travel.status == 'pending_approval' and travel.department == user.department):
        messages.error(request, '无权限操作')
        return redirect('approval_list')

    if request.method == 'POST':
        form = ApprovalForm(request.POST)
        if form.is_valid():
            action = form.cleaned_data['action']
            comment = form.cleaned_data['comment']

            try:
                if action == 'approve':
                    ApprovalService.approve_travel(travel, user, comment)
                    messages.success(request, '审批已通过')
                else:
                    ApprovalService.reject_travel(travel, user, comment)
                    messages.success(request, '申请已驳回')
                return redirect('approval_list')
            except ValueError as e:
                messages.error(request, str(e))
    else:
        form = ApprovalForm()

    context = {'form': form, 'travel': travel, 'user': user}
    return render(request, 'travel/approve.html', context)


@login_required
def booking_list(request):
    """预订管理列表"""
    user = request.user

    if not user.is_admin_staff():
        messages.error(request, '无权限访问')
        return redirect('travel_list')

    travels = Travel.objects.filter(
        status__in=['pending_booking', 'booked']
    ).select_related('applicant', 'department', 'booking')

    context = {
        'travels': travels,
        'user': user
    }
    return render(request, 'travel/booking_list.html', context)


@login_required
@transaction.atomic
def travel_booking(request, travel_id):
    """行程预订"""
    travel = get_object_or_404(Travel.objects.select_related('booking'), id=travel_id)

    user = request.user

    if not (user.is_admin_staff() and travel.status in ['pending_booking', 'booked']):
        messages.error(request, '无权限操作')
        return redirect('booking_list')

    booking = getattr(travel, 'booking', None)

    if request.method == 'POST':
        form = BookingForm(request.POST, instance=booking)
        if form.is_valid():
            try:
                BookingService.create_or_update_booking(travel, form.cleaned_data, user)
                messages.success(request, '预订已保存')
                return redirect('booking_list')
            except ValueError as e:
                messages.error(request, str(e))
    else:
        initial_data = {}
        if booking:
            if booking.flight_info:
                flight_lines = []
                if booking.flight_info.get('flight_number'):
                    flight_lines.append(f"航班号: {booking.flight_info['flight_number']}")
                if booking.flight_info.get('departure_time'):
                    flight_lines.append(f"起飞时间: {booking.flight_info['departure_time']}")
                if booking.flight_info.get('price'):
                    flight_lines.append(f"票价: {booking.flight_info['price']}")
                initial_data['flight_info'] = '\n'.join(flight_lines)

            if booking.hotel_info:
                hotel_lines = []
                if booking.hotel_info.get('name'):
                    hotel_lines.append(f"酒店名称: {booking.hotel_info['name']}")
                if booking.hotel_info.get('nights'):
                    hotel_lines.append(f"入住: {booking.hotel_info['nights']}")
                if booking.hotel_info.get('price_per_night'):
                    hotel_lines.append(f"单价: {booking.hotel_info['price_per_night']}")
                initial_data['hotel_info'] = '\n'.join(hotel_lines)

            initial_data['actual_cost'] = booking.actual_cost
            initial_data['over_budget_reason'] = booking.over_budget_reason
            initial_data['over_budget_reason_text'] = booking.over_budget_reason_text
            initial_data['booking_status'] = booking.booking_status

        form = BookingForm(initial=initial_data, instance=booking)

    context = {'form': form, 'travel': travel, 'user': user}
    return render(request, 'travel/booking.html', context)


@login_required
def reimbursement_list(request):
    """报销复核列表"""
    user = request.user

    if not user.is_finance():
        messages.error(request, '无权限访问')
        return redirect('travel_list')

    travels = Travel.objects.filter(
        status='booked'
    ).select_related('applicant', 'department', 'booking', 'reimbursement')

    context = {
        'travels': travels,
        'user': user
    }
    return render(request, 'travel/reimbursement_list.html', context)


@login_required
@transaction.atomic
def travel_reimburse(request, travel_id):
    """报销操作"""
    travel = get_object_or_404(Travel.objects.select_related('reimbursement'), id=travel_id)

    user = request.user

    if not (user.is_finance() and travel.status == 'booked'):
        messages.error(request, '无权限操作')
        return redirect('reimbursement_list')

    reimbursement = getattr(travel, 'reimbursement', None)

    if request.method == 'POST':
        action = request.POST.get('action')

        if action in ['approve', 'return']:
            form = ReimbursementForm(request.POST, instance=reimbursement)
            if form.is_valid():
                ReimbursementService.update_reimbursement(travel, form.cleaned_data, user)

                if action == 'approve':
                    try:
                        ReimbursementService.approve_reimbursement(travel, user, form.cleaned_data.get('finance_comments', ''))
                        messages.success(request, '报销已通过')
                    except ValueError as e:
                        messages.error(request, str(e))
                        return redirect('travel_reimburse', travel_id=travel_id)
                else:
                    comment = request.POST.get('return_comment', '')
                    try:
                        ReimbursementService.return_reimbursement(travel, user, comment)
                        messages.success(request, '报销已退回')
                    except ValueError as e:
                        messages.error(request, str(e))

                return redirect('reimbursement_list')

        elif action == 'check_receipts':
            if reimbursement:
                is_valid, missing_list = reimbursement.validate_receipts()
                if not is_valid:
                    messages.warning(request, f'票据缺失：{"、".join(missing_list)}')

    else:
        form = ReimbursementForm(instance=reimbursement)

    context = {
        'form': form,
        'travel': travel,
        'user': user,
        'reimbursement': reimbursement
    }
    return render(request, 'travel/reimburse.html', context)


@login_required
def statistics(request):
    """统计报表"""
    user = request.user

    if not user.is_superadmin():
        messages.error(request, '无权限访问')
        return redirect('travel_list')

    summary = StatisticsService.get_summary()
    department_stats = StatisticsService.get_department_statistics()
    city_stats = StatisticsService.get_city_statistics()
    over_budget_stats = StatisticsService.get_over_budget_reason_statistics()
    monthly_stats = StatisticsService.get_monthly_statistics()

    context = {
        'summary': summary,
        'department_stats': department_stats,
        'city_stats': city_stats,
        'over_budget_stats': over_budget_stats,
        'monthly_stats': monthly_stats,
        'user': user
    }
    return render(request, 'travel/statistics.html', context)
