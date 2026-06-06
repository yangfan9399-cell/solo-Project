from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, CreateView
from django.urls import reverse_lazy, reverse
from django.http import HttpResponse, HttpResponseForbidden
from django.db.models import Count, Sum, Q, F, Case, When, Value, IntegerField
from django.utils import timezone
from django.contrib import messages
from django.views.decorators.http import require_POST
from django_htmx.http import HttpResponseClientRedirect, trigger_client_event

from .models import (
    InspectionAppointment, AppointmentStatus, Container, Document,
    FeeItem, InspectionHistory, RescheduleRecord, Role,
    DocumentType, Forwarder, ShippingLine, InspectionWindow,
)
from .forms import (
    AppointmentForm, InspectionResultForm, DocumentForm,
    RescheduleForm, FeeReviewForm, FeeItemForm, StatisticsForm,
)


def _has_role(user, role):
    if not user.is_authenticated:
        return False
    try:
        return user.profile.role == role
    except Exception:
        return False


def is_forwarder(user):
    return _has_role(user, Role.FORWARDER)


def is_yard_staff(user):
    return _has_role(user, Role.YARD)


def is_fee_auditor(user):
    return _has_role(user, Role.FEE_AUDITOR)


def _add_history(appointment, action, operator, status_from=None, status_to=None, remark=''):
    InspectionHistory.objects.create(
        appointment=appointment,
        action=action,
        status_from=status_from,
        status_to=status_to,
        operator=operator,
        remark=remark,
    )


@login_required
def dashboard(request):
    total = InspectionAppointment.objects.count()
    pending = InspectionAppointment.objects.filter(status=AppointmentStatus.SUBMITTED).count()
    in_inspection = InspectionAppointment.objects.filter(status=AppointmentStatus.IN_INSPECTION).count()
    pending_fee = InspectionAppointment.objects.filter(status=AppointmentStatus.PENDING_FEE).count()
    doc_missing = InspectionAppointment.objects.filter(status=AppointmentStatus.DOC_MISSING).count()

    recent = InspectionAppointment.objects.all()[:10]

    context = {
        'total': total,
        'pending': pending,
        'in_inspection': in_inspection,
        'pending_fee': pending_fee,
        'doc_missing': doc_missing,
        'recent_appointments': recent,
        'is_forwarder': is_forwarder(request.user),
        'is_yard': is_yard_staff(request.user),
        'is_fee_auditor': is_fee_auditor(request.user),
    }
    return render(request, 'inspection/dashboard.html', context)


class AppointmentListView(LoginRequiredMixin, ListView):
    model = InspectionAppointment
    template_name = 'inspection/appointment_list.html'
    context_object_name = 'appointments'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset().select_related(
            'container', 'forwarder', 'shipping_line', 'inspection_window'
        )
        status = self.request.GET.get('status')
        if status:
            qs = qs.filter(status=status)
        search = self.request.GET.get('search')
        if search:
            qs = qs.filter(
                Q(appointment_no__icontains=search) |
                Q(container__container_no__icontains=search) |
                Q(forwarder__name__icontains=search)
            )
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['status_choices'] = AppointmentStatus.choices
        ctx['current_status'] = self.request.GET.get('status', '')
        ctx['search'] = self.request.GET.get('search', '')
        ctx['is_forwarder'] = is_forwarder(self.request.user)
        ctx['is_yard'] = is_yard_staff(self.request.user)
        ctx['is_fee_auditor'] = is_fee_auditor(self.request.user)
        return ctx


class AppointmentDetailView(LoginRequiredMixin, DetailView):
    model = InspectionAppointment
    template_name = 'inspection/appointment_detail.html'
    context_object_name = 'appointment'

    def get_queryset(self):
        return super().get_queryset().select_related(
            'container', 'forwarder', 'shipping_line', 'inspection_window',
            'created_by', 'inspector', 'fee_confirmed_by', 'archived_by',
        ).prefetch_related(
            'documents__document_type', 'fee_items', 'history__operator', 'reschedules',
        )

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['is_forwarder'] = is_forwarder(self.request.user)
        ctx['is_yard'] = is_yard_staff(self.request.user)
        ctx['is_fee_auditor'] = is_fee_auditor(self.request.user)
        ctx['status_choices'] = AppointmentStatus.choices
        return ctx


@login_required
def appointment_create(request):
    if not is_forwarder(request.user):
        return HttpResponseForbidden('只有货代经办人可以创建预约')

    if request.method == 'POST':
        form = AppointmentForm(request.POST)
        if form.is_valid():
            container_no = form.cleaned_data['container_no']
            container_size = form.cleaned_data['container_size']
            vessel_name = form.cleaned_data['vessel_name']
            voyage_no = form.cleaned_data['voyage_no']
            bl_no = form.cleaned_data['bl_no']
            shipping_line = form.cleaned_data['shipping_line']

            container, created = Container.objects.get_or_create(
                container_no=container_no,
                defaults={
                    'size': container_size,
                    'shipping_line': shipping_line,
                    'vessel_name': vessel_name,
                    'voyage_no': voyage_no,
                    'bl_no': bl_no,
                }
            )
            if not created:
                container.size = container_size
                container.shipping_line = shipping_line
                container.vessel_name = vessel_name
                container.voyage_no = voyage_no
                container.bl_no = bl_no
                container.save()

            appointment = form.save(commit=False)
            appointment.container = container
            appointment.created_by = request.user
            appointment.status = AppointmentStatus.DRAFT
            appointment.save()

            for doc_type in DocumentType.objects.all():
                Document.objects.create(
                    appointment=appointment,
                    document_type=doc_type,
                    is_submitted=False,
                )

            _add_history(
                appointment, '创建预约', request.user,
                status_to=AppointmentStatus.DRAFT,
                remark='创建查验预约草稿'
            )

            messages.success(request, '预约创建成功')
            return redirect('appointment_detail', pk=appointment.pk)
    else:
        form = AppointmentForm()

    return render(request, 'inspection/appointment_form.html', {
        'form': form,
        'title': '新建查验预约',
    })


@login_required
@require_POST
def appointment_submit(request, pk):
    if not is_forwarder(request.user):
        return HttpResponseForbidden('只有货代经办人可以提交预约')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    if appointment.status != AppointmentStatus.DRAFT:
        messages.error(request, '当前状态不可提交')
        return redirect('appointment_detail', pk=pk)

    old_status = appointment.status
    appointment.status = AppointmentStatus.SUBMITTED
    appointment.submitted_at = timezone.now()
    appointment.save()

    _add_history(
        appointment, '提交预约', request.user,
        status_from=old_status,
        status_to=AppointmentStatus.SUBMITTED,
    )

    if request.htmx:
        return trigger_client_event(
            render(request, 'inspection/partials/appointment_status.html', {
                'appointment': appointment,
                'is_forwarder': is_forwarder(request.user),
                'is_yard': is_yard_staff(request.user),
                'is_fee_auditor': is_fee_auditor(request.user),
            }),
            'appointmentUpdated',
        )

    messages.success(request, '预约已提交')
    return redirect('appointment_detail', pk=pk)


@login_required
@require_POST
def inspection_start(request, pk):
    if not is_yard_staff(request.user):
        return HttpResponseForbidden('只有场站人员可以开始查验')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    if appointment.status not in [AppointmentStatus.SUBMITTED, AppointmentStatus.RESCHEDULED]:
        messages.error(request, '当前状态不可开始查验')
        return redirect('appointment_detail', pk=pk)

    old_status = appointment.status
    appointment.status = AppointmentStatus.IN_INSPECTION
    appointment.inspection_started_at = timezone.now()
    appointment.inspector = request.user
    appointment.save()

    _add_history(
        appointment, '开始查验', request.user,
        status_from=old_status,
        status_to=AppointmentStatus.IN_INSPECTION,
    )

    if request.htmx:
        return trigger_client_event(
            render(request, 'inspection/partials/appointment_status.html', {
                'appointment': appointment,
                'is_forwarder': is_forwarder(request.user),
                'is_yard': is_yard_staff(request.user),
                'is_fee_auditor': is_fee_auditor(request.user),
            }),
            'appointmentUpdated',
        )

    return redirect('appointment_detail', pk=pk)


@login_required
def inspection_result(request, pk):
    if not is_yard_staff(request.user):
        return HttpResponseForbidden('只有场站人员可以登记查验结果')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    if appointment.status != AppointmentStatus.IN_INSPECTION:
        messages.error(request, '当前状态不可登记查验结果')
        return redirect('appointment_detail', pk=pk)

    if request.method == 'POST':
        form = InspectionResultForm(request.POST)
        result_type = request.POST.get('result_type')

        if result_type == 'normal':
            if not appointment.is_doc_complete:
                missing = [d.name for d in appointment.missing_documents]
                messages.error(
                    request,
                    f'单证不完整，无法放行。缺失单证：{", ".join(missing)}'
                )
                return redirect('appointment_detail', pk=pk)

            appointment.inspection_result = form.data.get('inspection_result', '')
            appointment.inspection_completed_at = timezone.now()
            appointment.status = AppointmentStatus.NORMAL_RELEASE
            appointment.calculate_demurrage()
            appointment.save()

            FeeItem.objects.get_or_create(
                appointment=appointment,
                item_name='滞箱费',
                defaults={
                    'quantity': appointment.demurrage_days,
                    'unit_price': appointment.demurrage_fee / max(appointment.demurrage_days, 1) if appointment.demurrage_days else 0,
                    'amount': appointment.demurrage_fee,
                }
            )

            appointment.status = AppointmentStatus.PENDING_FEE
            appointment.save()

            _add_history(
                appointment, '正常放行', request.user,
                status_from=AppointmentStatus.IN_INSPECTION,
                status_to=AppointmentStatus.PENDING_FEE,
                remark=form.data.get('inspection_result', ''),
            )

            messages.success(request, '查验完成，正常放行，已进入费用复核')
            return redirect('appointment_detail', pk=pk)

        elif result_type == 'doc_missing':
            appointment.inspection_result = form.data.get('inspection_result', '')
            appointment.inspection_completed_at = timezone.now()
            appointment.status = AppointmentStatus.DOC_MISSING
            appointment.save()

            _add_history(
                appointment, '单证缺失', request.user,
                status_from=AppointmentStatus.IN_INSPECTION,
                status_to=AppointmentStatus.DOC_MISSING,
                remark=f'查验发现单证缺失，请补全单证后再放行。{form.data.get("inspection_result", "")}',
            )

            messages.warning(request, '已登记单证缺失，请补全单证')
            return redirect('appointment_detail', pk=pk)

    else:
        form = InspectionResultForm()

    return render(request, 'inspection/inspection_result.html', {
        'form': form,
        'appointment': appointment,
    })


@login_required
@require_POST
def document_submit(request, pk, doc_id):
    if not is_forwarder(request.user) and not is_yard_staff(request.user):
        return HttpResponseForbidden('无权限操作')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    document = get_object_or_404(Document, pk=doc_id, appointment=appointment)

    document.is_submitted = True
    document.submitted_at = timezone.now()
    document.submitted_by = request.user
    document.save()

    _add_history(
        appointment, '提交单证', request.user,
        remark=f'提交单证：{document.document_type.name}',
    )

    if request.htmx:
        return render(request, 'inspection/partials/documents_list.html', {
            'appointment': appointment,
            'is_forwarder': is_forwarder(request.user),
            'is_yard': is_yard_staff(request.user),
        })

    return redirect('appointment_detail', pk=pk)


@login_required
@require_POST
def release_after_doc(request, pk):
    if not is_yard_staff(request.user):
        return HttpResponseForbidden('只有场站人员可以执行放行')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    if appointment.status != AppointmentStatus.DOC_MISSING:
        messages.error(request, '当前状态不可执行此操作')
        return redirect('appointment_detail', pk=pk)

    if not appointment.is_doc_complete:
        missing = [d.name for d in appointment.missing_documents]
        messages.error(
            request,
            f'单证不完整，无法放行。缺失：{", ".join(missing)}'
        )
        return redirect('appointment_detail', pk=pk)

    appointment.status = AppointmentStatus.NORMAL_RELEASE
    appointment.calculate_demurrage()
    appointment.save()

    FeeItem.objects.get_or_create(
        appointment=appointment,
        item_name='滞箱费',
        defaults={
            'quantity': appointment.demurrage_days,
            'unit_price': appointment.demurrage_fee / max(appointment.demurrage_days, 1) if appointment.demurrage_days else 0,
            'amount': appointment.demurrage_fee,
        }
    )

    appointment.status = AppointmentStatus.PENDING_FEE
    appointment.save()

    _add_history(
        appointment, '补证后放行', request.user,
        status_from=AppointmentStatus.DOC_MISSING,
        status_to=AppointmentStatus.PENDING_FEE,
        remark='单证已补全，正常放行',
    )

    messages.success(request, '单证已补全，正常放行')
    return redirect('appointment_detail', pk=pk)


@login_required
def reschedule(request, pk):
    appointment = get_object_or_404(InspectionAppointment, pk=pk)

    if request.method == 'POST':
        form = RescheduleForm(request.POST)
        if form.is_valid():
            reschedule_record = form.save(commit=False)
            reschedule_record.appointment = appointment
            reschedule_record.original_date = appointment.appointment_date
            reschedule_record.original_time = appointment.appointment_time
            reschedule_record.operator = request.user
            reschedule_record.save()

            old_status = appointment.status
            appointment.appointment_date = form.cleaned_data['new_date']
            appointment.appointment_time = form.cleaned_data['new_time']
            appointment.status = AppointmentStatus.RESCHEDULED
            appointment.save()

            _add_history(
                appointment, '查验改期', request.user,
                status_from=old_status,
                status_to=AppointmentStatus.RESCHEDULED,
                remark=f'改期原因：{form.cleaned_data["reason"]}',
            )

            messages.success(request, '改期成功')
            return redirect('appointment_detail', pk=pk)
    else:
        form = RescheduleForm()

    return render(request, 'inspection/reschedule.html', {
        'form': form,
        'appointment': appointment,
    })


@login_required
def fee_review(request, pk):
    if not is_fee_auditor(request.user):
        return HttpResponseForbidden('只有费用复核人可以操作')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    if appointment.status not in [AppointmentStatus.PENDING_FEE, AppointmentStatus.FEE_DISPUTED]:
        messages.error(request, '当前状态不可复核费用')
        return redirect('appointment_detail', pk=pk)

    if request.method == 'POST':
        form = FeeReviewForm(request.POST)
        if form.is_valid():
            action = form.cleaned_data['action']

            if action == 'confirm':
                appointment.fee_confirmed_by = request.user
                appointment.fee_confirmed_at = timezone.now()
                old_status = appointment.status
                appointment.status = AppointmentStatus.FEE_CONFIRMED
                appointment.save()

                _add_history(
                    appointment, '费用确认', request.user,
                    status_from=old_status,
                    status_to=AppointmentStatus.FEE_CONFIRMED,
                    remark=f'确认费用：{appointment.final_fee}元',
                )

                messages.success(request, '费用已确认')

            elif action == 'reduce':
                reduction = form.cleaned_data['fee_reduction'] or 0
                appointment.fee_reduction = reduction
                appointment.final_fee = appointment.demurrage_fee - reduction
                appointment.fee_confirmed_by = request.user
                appointment.fee_confirmed_at = timezone.now()
                old_status = appointment.status
                appointment.status = AppointmentStatus.FEE_CONFIRMED
                appointment.save()

                if reduction > 0:
                    FeeItem.objects.create(
                        appointment=appointment,
                        item_name='费用减免',
                        quantity=1,
                        unit_price=reduction,
                        is_reduction=True,
                        remark=form.cleaned_data['reduction_reason'],
                    )

                _add_history(
                    appointment, '费用减免确认', request.user,
                    status_from=old_status,
                    status_to=AppointmentStatus.FEE_CONFIRMED,
                    remark=f'减免金额：{reduction}元，说明：{form.cleaned_data.get("reduction_reason", "")}',
                )

                messages.success(request, f'已减免{reduction}元，费用已确认')

            elif action == 'dispute':
                appointment.fee_dispute_reason = form.cleaned_data['dispute_reason']
                old_status = appointment.status
                appointment.status = AppointmentStatus.FEE_DISPUTED
                appointment.save()

                _add_history(
                    appointment, '滞箱费异议', request.user,
                    status_from=old_status,
                    status_to=AppointmentStatus.FEE_DISPUTED,
                    remark=f'异议原因：{form.cleaned_data["dispute_reason"]}',
                )

                messages.warning(request, '已登记滞箱费异议')

            return redirect('appointment_detail', pk=pk)
    else:
        form = FeeReviewForm()

    return render(request, 'inspection/fee_review.html', {
        'form': form,
        'appointment': appointment,
    })


@login_required
@require_POST
def appointment_archive(request, pk):
    if not is_fee_auditor(request.user):
        return HttpResponseForbidden('只有费用复核人可以归档')

    appointment = get_object_or_404(InspectionAppointment, pk=pk)
    if appointment.status != AppointmentStatus.FEE_CONFIRMED:
        messages.error(request, '当前状态不可归档')
        return redirect('appointment_detail', pk=pk)

    old_status = appointment.status
    appointment.status = AppointmentStatus.ARCHIVED
    appointment.archived_at = timezone.now()
    appointment.archived_by = request.user
    appointment.save()

    _add_history(
        appointment, '归档', request.user,
        status_from=old_status,
        status_to=AppointmentStatus.ARCHIVED,
    )

    messages.success(request, '已归档')
    return redirect('appointment_detail', pk=pk)


@login_required
def statistics(request):
    form = StatisticsForm(request.GET or None)
    group_by = request.GET.get('group_by', 'route')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    qs = InspectionAppointment.objects.all()
    if start_date:
        qs = qs.filter(created_at__date__gte=start_date)
    if end_date:
        qs = qs.filter(created_at__date__lte=end_date)

    stats = []
    if group_by == 'route':
        stats = qs.values('route').annotate(
            total=Count('id'),
            normal=Count('id', filter=Q(status=AppointmentStatus.NORMAL_RELEASE) | Q(status=AppointmentStatus.PENDING_FEE) | Q(status=AppointmentStatus.FEE_CONFIRMED) | Q(status=AppointmentStatus.ARCHIVED)),
            doc_missing=Count('id', filter=Q(status=AppointmentStatus.DOC_MISSING)),
            rescheduled=Count('id', filter=Q(status=AppointmentStatus.RESCHEDULED)),
            fee_disputed=Count('id', filter=Q(status=AppointmentStatus.FEE_DISPUTED)),
            total_demurrage=Sum('demurrage_days'),
            total_fee=Sum('final_fee'),
        ).order_by('-total')
    elif group_by == 'forwarder':
        stats = qs.values(
            forwarder_name=F('forwarder__name')
        ).annotate(
            total=Count('id'),
            normal=Count('id', filter=Q(status=AppointmentStatus.NORMAL_RELEASE) | Q(status=AppointmentStatus.PENDING_FEE) | Q(status=AppointmentStatus.FEE_CONFIRMED) | Q(status=AppointmentStatus.ARCHIVED)),
            doc_missing=Count('id', filter=Q(status=AppointmentStatus.DOC_MISSING)),
            rescheduled=Count('id', filter=Q(status=AppointmentStatus.RESCHEDULED)),
            fee_disputed=Count('id', filter=Q(status=AppointmentStatus.FEE_DISPUTED)),
            total_demurrage=Sum('demurrage_days'),
            total_fee=Sum('final_fee'),
        ).order_by('-total')
    elif group_by == 'anomaly_type':
        anomaly_counts = {
            '正常放行': qs.filter(Q(status=AppointmentStatus.NORMAL_RELEASE) | Q(status=AppointmentStatus.PENDING_FEE) | Q(status=AppointmentStatus.FEE_CONFIRMED) | Q(status=AppointmentStatus.ARCHIVED)).count(),
            '单证缺失': qs.filter(status=AppointmentStatus.DOC_MISSING).count(),
            '查验改期': qs.filter(status=AppointmentStatus.RESCHEDULED).count(),
            '滞箱费异议': qs.filter(status=AppointmentStatus.FEE_DISPUTED).count(),
            '待查验': qs.filter(status=AppointmentStatus.SUBMITTED).count(),
            '查验中': qs.filter(status=AppointmentStatus.IN_INSPECTION).count(),
        }
        stats = [
            {'anomaly_type': k, 'count': v}
            for k, v in anomaly_counts.items()
        ]
    elif group_by == 'demurrage_days':
        demurrage_ranges = [
            ('0-3天', 0, 3),
            ('4-7天', 4, 7),
            ('8-14天', 8, 14),
            ('15-30天', 15, 30),
            ('30天以上', 31, 9999),
        ]
        stats = []
        for label, min_d, max_d in demurrage_ranges:
            count = qs.filter(demurrage_days__gte=min_d, demurrage_days__lte=max_d).count()
            stats.append({
                'range': label,
                'count': count,
                'total_fee': qs.filter(demurrage_days__gte=min_d, demurrage_days__lte=max_d).aggregate(
                    s=Sum('final_fee')
                )['s'] or 0,
            })

    total_count = qs.count()
    total_fee = qs.aggregate(s=Sum('final_fee'))['s'] or 0
    avg_demurrage = qs.filter(demurrage_days__gt=0).aggregate(
        avg=Sum('demurrage_days')
    )['avg'] or 0

    return render(request, 'inspection/statistics.html', {
        'form': form,
        'stats': stats,
        'group_by': group_by,
        'total_count': total_count,
        'total_fee': total_fee,
        'avg_demurrage': avg_demurrage,
    })
