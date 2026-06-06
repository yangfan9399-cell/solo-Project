from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.utils import timezone
from django.http import JsonResponse
from .models import Reservation
from catalog.models import RareBook
from datetime import datetime


@login_required
def reservation_list(request):
    status = request.GET.get('status', '')
    reservations = Reservation.objects.all()
    
    if not request.user.is_librarian and not request.user.is_supervisor:
        reservations = reservations.filter(user=request.user)
    
    if status:
        reservations = reservations.filter(status=status)
    
    reservations = reservations.select_related('book', 'user').order_by('-created_at')
    
    context = {
        'reservations': reservations,
        'current_status': status,
        'page_title': '预约管理',
    }
    return render(request, 'reservations/reservation_list.html', context)


@login_required
def reservation_detail(request, pk):
    reservation = get_object_or_404(Reservation, pk=pk)
    timeline = reservation.get_timeline()
    
    has_circulation = hasattr(reservation, 'circulation_log')
    has_assessment = False
    has_decision = False
    circulation = None
    assessment = None
    decision = None
    
    if has_circulation:
        circulation = reservation.circulation_log
        has_assessment = hasattr(circulation, 'damage_assessment')
        if has_assessment:
            assessment = circulation.damage_assessment
            has_decision = hasattr(assessment, 'decision')
            if has_decision:
                decision = assessment.decision
    
    can_approve = request.user.is_librarian and reservation.status == Reservation.STATUS_PENDING
    can_reject = request.user.is_librarian and reservation.status == Reservation.STATUS_PENDING
    can_cancel = request.user == reservation.user and reservation.status in [Reservation.STATUS_PENDING, Reservation.STATUS_APPROVED]
    can_checkout = request.user.is_librarian and reservation.status == Reservation.STATUS_APPROVED and not has_circulation
    can_assess = request.user.is_conservator and has_circulation and circulation.is_returned and not has_assessment
    can_decide = request.user.is_supervisor and has_assessment and not has_decision
    
    context = {
        'reservation': reservation,
        'timeline': timeline,
        'circulation': circulation,
        'assessment': assessment,
        'decision': decision,
        'has_circulation': has_circulation,
        'has_assessment': has_assessment,
        'has_decision': has_decision,
        'can_approve': can_approve,
        'can_reject': can_reject,
        'can_cancel': can_cancel,
        'can_checkout': can_checkout,
        'can_assess': can_assess,
        'can_decide': can_decide,
        'page_title': f'预约详情 - {reservation.book.title}',
    }
    return render(request, 'reservations/reservation_detail.html', context)


@login_required
@user_passes_test(lambda u: u.is_reader)
def reservation_create(request):
    if request.method == 'POST':
        book_id = request.POST.get('book')
        reserved_date = request.POST.get('reserved_date')
        start_time = request.POST.get('start_time')
        end_time = request.POST.get('end_time')
        purpose = request.POST.get('purpose')
        purpose_detail = request.POST.get('purpose_detail', '')
        
        book = get_object_or_404(RareBook, pk=book_id)
        
        reservation = Reservation(
            book=book,
            user=request.user,
            reserved_date=reserved_date,
            start_time=start_time,
            end_time=end_time,
            purpose=purpose,
            purpose_detail=purpose_detail,
            status=Reservation.STATUS_PENDING,
        )
        
        passed, issues = reservation.check_qualification()
        
        if not passed:
            reservation.save()
            messages.error(request, '资格核验未通过：' + '; '.join(issues))
            return redirect('reservations:reservation_detail', pk=reservation.pk)
        
        reservation.save()
        messages.success(request, '预约申请已提交，请等待馆员审核。')
        return redirect('reservations:reservation_detail', pk=reservation.pk)
    
    book_id = request.GET.get('book_id', '')
    selected_book = None
    if book_id:
        selected_book = RareBook.objects.filter(pk=book_id, status='in_stack').first()
    
    available_books = RareBook.objects.filter(status='in_stack').select_related('category')
    
    context = {
        'available_books': available_books,
        'selected_book': selected_book,
        'page_title': '提交预约申请',
    }
    return render(request, 'reservations/reservation_form.html', context)


@login_required
@user_passes_test(lambda u: u.is_librarian)
def reservation_approve(request, pk):
    reservation = get_object_or_404(Reservation, pk=pk)
    
    if reservation.status != Reservation.STATUS_PENDING:
        messages.error(request, '该预约状态不支持审核操作。')
        return redirect('reservations:reservation_detail', pk=pk)
    
    if reservation.has_time_conflict():
        conflicts = reservation.get_conflicting_reservations()
        conflict_info = ', '.join([f'{c.user.real_name} ({c.reserved_date} {c.start_time}-{c.end_time})' for c in conflicts])
        messages.error(request, f'存在调阅时间冲突：{conflict_info}')
        return redirect('reservations:reservation_detail', pk=pk)
    
    reservation.status = Reservation.STATUS_APPROVED
    reservation.approved_by = request.user
    reservation.approved_at = timezone.now()
    reservation.book.status = 'reserved'
    reservation.book.save()
    reservation.save()
    
    messages.success(request, '预约审核通过，已通知读者。')
    return redirect('reservations:reservation_detail', pk=pk)


@login_required
@user_passes_test(lambda u: u.is_librarian)
def reservation_reject(request, pk):
    if request.method == 'POST':
        reservation = get_object_or_404(Reservation, pk=pk)
        
        if reservation.status != Reservation.STATUS_PENDING:
            messages.error(request, '该预约状态不支持驳回操作。')
            return redirect('reservations:reservation_detail', pk=pk)
        
        reject_reason = request.POST.get('reject_reason', '')
        reservation.status = Reservation.STATUS_REJECTED
        reservation.reject_reason = reject_reason
        reservation.approved_by = request.user
        reservation.approved_at = timezone.now()
        reservation.save()
        
        messages.success(request, '预约已驳回。')
        return redirect('reservations:reservation_detail', pk=pk)
    
    reservation = get_object_or_404(Reservation, pk=pk)
    context = {
        'reservation': reservation,
        'page_title': '驳回预约',
    }
    return render(request, 'reservations/reservation_reject.html', context)


@login_required
def reservation_cancel(request, pk):
    reservation = get_object_or_404(Reservation, pk=pk)
    
    if request.user != reservation.user and not request.user.is_librarian:
        messages.error(request, '您没有权限取消此预约。')
        return redirect('reservations:reservation_detail', pk=pk)
    
    if reservation.status not in [Reservation.STATUS_PENDING, Reservation.STATUS_APPROVED]:
        messages.error(request, '该预约状态不支持取消操作。')
        return redirect('reservations:reservation_detail', pk=pk)
    
    reservation.status = Reservation.STATUS_CANCELLED
    if reservation.book.status == 'reserved':
        reservation.book.status = 'in_stack'
        reservation.book.save()
    reservation.save()
    
    messages.success(request, '预约已取消。')
    return redirect('reservations:reservation_list')


@login_required
def check_qualification(request):
    book_id = request.GET.get('book_id') or request.GET.get('book')
    
    if not book_id or not request.user.is_reader:
        context = {
            'passed': False,
            'issues': ['无效请求'],
            'required_proofs': [],
            'reader_type': '',
            'book_rarity': '',
        }
        return render(request, 'reservations/partials/qualification_result.html', context)
    
    book = get_object_or_404(RareBook, pk=book_id)
    
    temp_reservation = Reservation(book=book, user=request.user)
    passed, issues = temp_reservation.check_qualification()
    
    required_proofs = []
    if not request.user.has_proof and book.category.rarity_level == 'precious':
        required_proofs.append('有效身份证件')
        required_proofs.append('研究单位介绍信')
    if request.user.reader_type == 'undergrad' and book.category.rarity_level in ['rare', 'precious']:
        required_proofs.append('所在学院出具的研究证明')
    if request.user.reader_type == 'graduate' and book.category.rarity_level == 'precious':
        required_proofs.append('导师推荐信')
    
    context = {
        'passed': passed,
        'issues': issues,
        'required_proofs': required_proofs,
        'reader_type': request.user.get_reader_type_display(),
        'book_rarity': book.category.get_rarity_level_display(),
    }
    return render(request, 'reservations/partials/qualification_result.html', context)
