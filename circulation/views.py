from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.utils import timezone
from .models import CirculationLog
from reservations.models import Reservation


@login_required
@user_passes_test(lambda u: u.is_librarian)
def checkout_list(request):
    status = request.GET.get('status', 'all')
    
    if status == 'active':
        logs = CirculationLog.objects.filter(return_time__isnull=True)
    elif status == 'returned':
        logs = CirculationLog.objects.filter(return_time__isnull=False)
    else:
        logs = CirculationLog.objects.all()
    
    logs = logs.select_related('book', 'reservation', 'reservation__user').order_by('-checkout_time')
    
    context = {
        'logs': logs,
        'current_status': status,
        'page_title': '流通管理',
    }
    return render(request, 'circulation/checkout_list.html', context)


@login_required
@user_passes_test(lambda u: u.is_librarian)
def checkout_book(request, reservation_id):
    reservation = get_object_or_404(Reservation, pk=reservation_id)
    
    if reservation.status != Reservation.STATUS_APPROVED:
        messages.error(request, '该预约状态不支持办理调阅。')
        return redirect('reservations:reservation_detail', pk=reservation_id)
    
    if hasattr(reservation, 'circulation_log'):
        messages.error(request, '该预约已办理调阅。')
        return redirect('reservations:reservation_detail', pk=reservation_id)
    
    if request.method == 'POST':
        condition_out = request.POST.get('condition_out', 'good')
        condition_out_notes = request.POST.get('condition_out_notes', '')
        reader_signature = request.POST.get('reader_signature', '')
        
        log = CirculationLog(
            reservation=reservation,
            book=reservation.book,
            librarian=request.user,
            condition_out=condition_out,
            condition_out_notes=condition_out_notes,
            reader_signature=reader_signature,
        )
        log.checkout(request.user)
        
        messages.success(request, '调阅手续办理完成。')
        return redirect('reservations:reservation_detail', pk=reservation_id)
    
    context = {
        'reservation': reservation,
        'page_title': '办理调阅',
    }
    return render(request, 'circulation/checkout_form.html', context)


@login_required
@user_passes_test(lambda u: u.is_librarian)
def return_book(request, log_id):
    log = get_object_or_404(CirculationLog, pk=log_id)
    
    if log.is_returned:
        messages.error(request, '该珍本已归还。')
        return redirect('circulation:checkout_list')
    
    if request.method == 'POST':
        condition_in = request.POST.get('condition_in', 'good')
        condition_in_notes = request.POST.get('condition_in_notes', '')
        
        log.return_book(request.user, condition_in, condition_in_notes)
        
        messages.success(request, '归还登记完成，请通知修复员进行损伤鉴定。')
        return redirect('circulation:checkout_list')
    
    context = {
        'log': log,
        'page_title': '办理归还',
    }
    return render(request, 'circulation/return_form.html', context)
