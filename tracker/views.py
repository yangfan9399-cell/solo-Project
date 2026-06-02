from django.contrib import messages
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from tracker.forms import (
    CleaningRecordForm,
    ClinicalUsageForm,
    ExpiryRecallForm,
    InfectionInspectionForm,
    InstrumentPackageForm,
    InstrumentStatusForm,
    ReleaseAuditForm,
    SterilizationBatchForm,
)
from tracker.models import (
    CleaningRecord,
    ClinicalUsage,
    ExpiryRecall,
    InfectionInspection,
    InstrumentPackage,
    ReleaseAudit,
    SterilizationBatch,
)

def sync_batch_result(batch):
    tests = [batch.physical_test, batch.chemical_test, batch.biological_test]
    if 'unqualified' in tests:
        batch.result = 'unqualified'
    elif all(test == 'qualified' for test in tests):
        batch.result = 'qualified'
    else:
        batch.result = 'pending'

    if batch.completed_at is None and batch.result != 'pending':
        batch.completed_at = timezone.now()
    batch.save()

    if batch.result == 'qualified':
        batch.instrument_packages.update(status='pending_release')
    elif batch.result == 'unqualified':
        batch.instrument_packages.update(status='cleaning')


def home(request):
    total_instruments = InstrumentPackage.objects.count()
    status_counts = {
        s['status']: s['count']
        for s in InstrumentPackage.objects.values('status').annotate(count=Count('id'))
    }
    pending_batches = SterilizationBatch.objects.filter(result='pending').count()
    pending_recalls = ExpiryRecall.objects.filter(status='pending').count()
    recent_usages = ClinicalUsage.objects.select_related('instrument_package')[:5]
    upcoming_expiry = InstrumentPackage.objects.filter(
        status='registered', expire_at__lte=timezone.now() + timezone.timedelta(days=30)
    ).order_by('expire_at')[:5]

    context = {
        'total_instruments': total_instruments,
        'status_counts': status_counts,
        'pending_batches': pending_batches,
        'pending_recalls': pending_recalls,
        'recent_usages': recent_usages,
        'upcoming_expiry': upcoming_expiry,
        'status_display': dict(InstrumentPackage.STATUS_CHOICES),
    }
    return render(request, 'tracker/home.html', context)


def instrument_list(request):
    status_filter = request.GET.get('status', '')
    category_filter = request.GET.get('category', '')
    search = request.GET.get('q', '')

    qs = InstrumentPackage.objects.all()
    if status_filter:
        qs = qs.filter(status=status_filter)
    if category_filter:
        qs = qs.filter(category=category_filter)
    if search:
        qs = qs.filter(Q(code__icontains=search) | Q(name__icontains=search))

    qs = qs.order_by('-created_at')
    context = {
        'instruments': qs,
        'status_filter': status_filter,
        'category_filter': category_filter,
        'search': search,
        'status_choices': InstrumentPackage.STATUS_CHOICES,
        'category_choices': InstrumentPackage.CATEGORY_CHOICES,
    }
    return render(request, 'tracker/instrument/list.html', context)


def instrument_detail(request, pk):
    instrument = get_object_or_404(InstrumentPackage, pk=pk)
    cleaning_records = instrument.cleaning_records.all()
    sterilization_batches = instrument.sterilization_batches.all()
    release_audits = instrument.release_audits.all()
    clinical_usages = instrument.clinical_usages.all()
    recalls = instrument.recalls.all()
    inspections = instrument.inspections.all()
    status_form = InstrumentStatusForm(current_status=instrument.status)

    context = {
        'instrument': instrument,
        'cleaning_records': cleaning_records,
        'sterilization_batches': sterilization_batches,
        'release_audits': release_audits,
        'clinical_usages': clinical_usages,
        'recalls': recalls,
        'inspections': inspections,
        'status_form': status_form,
    }
    return render(request, 'tracker/instrument/detail.html', context)


def instrument_create(request):
    if request.method == 'POST':
        form = InstrumentPackageForm(request.POST)
        if form.is_valid():
            instrument = form.save()
            messages.success(request, f'器械包 {instrument.code} 建档成功')
            return redirect('tracker:instrument_detail', pk=instrument.pk)
    else:
        form = InstrumentPackageForm()
    return render(request, 'tracker/instrument/form.html', {'form': form, 'title': '器械包建档'})


def instrument_status_update(request, pk):
    instrument = get_object_or_404(InstrumentPackage, pk=pk)
    if request.method == 'POST':
        form = InstrumentStatusForm(request.POST, current_status=instrument.status)
        if form.is_valid():
            new_status = form.cleaned_data['new_status']
            instrument.status = new_status

            if new_status == 'registered':
                instrument.last_sterilized_at = timezone.now()
                instrument.expire_at = timezone.now() + timezone.timedelta(
                    days=instrument.sterilization_expiry_days
                )
            elif new_status == 'expired':
                instrument.expire_at = timezone.now()

            instrument.save()
            messages.success(request, f'状态已更新为「{instrument.get_status_display()}」')

            if request.htmx:
                return render(request, 'tracker/components/status_badge.html', {'instrument': instrument})
            return redirect('tracker:instrument_detail', pk=instrument.pk)
    else:
        form = InstrumentStatusForm(current_status=instrument.status)

    return render(request, 'tracker/instrument/status_form.html', {
        'instrument': instrument, 'form': form,
    })


def cleaning_list(request):
    result_filter = request.GET.get('result', '')
    qs = CleaningRecord.objects.select_related('instrument_package').all()
    if result_filter:
        qs = qs.filter(result=result_filter)
    qs = qs.order_by('-started_at')
    context = {
        'records': qs,
        'result_filter': result_filter,
        'result_choices': CleaningRecord.RESULT_CHOICES,
    }
    return render(request, 'tracker/cleaning/list.html', context)


def cleaning_detail(request, pk):
    record = get_object_or_404(CleaningRecord, pk=pk)
    return render(request, 'tracker/cleaning/detail.html', {'record': record})


def cleaning_create(request):
    if request.method == 'POST':
        form = CleaningRecordForm(request.POST)
        if form.is_valid():
            record = form.save()
            record.instrument_package.status = 'cleaning'
            record.instrument_package.save()
            messages.success(request, f'清洗记录创建成功')
            return redirect('tracker:cleaning_list')
    else:
        form = CleaningRecordForm()
    return render(request, 'tracker/cleaning/form.html', {'form': form, 'title': '登记清洗记录'})


def batch_board(request):
    result_filter = request.GET.get('result', '')
    qs = SterilizationBatch.objects.prefetch_related('instrument_packages').all()
    if result_filter:
        qs = qs.filter(result=result_filter)

    batches_by_status = {
        'pending': qs.filter(result='pending'),
        'qualified': qs.filter(result='qualified'),
        'unqualified': qs.filter(result='unqualified'),
    }

    context = {
        'batches_by_status': batches_by_status,
        'result_filter': result_filter,
        'total_batches': qs.count(),
    }
    return render(request, 'tracker/batch/board.html', context)


def batch_detail(request, pk):
    batch = get_object_or_404(SterilizationBatch, pk=pk)
    audits = batch.release_audits.all()
    inspections = batch.inspections.all()
    context = {
        'batch': batch,
        'audits': audits,
        'inspections': inspections,
    }
    return render(request, 'tracker/batch/detail.html', context)


def batch_create(request):
    if request.method == 'POST':
        form = SterilizationBatchForm(request.POST)
        if form.is_valid():
            batch = form.save()
            batch.instrument_packages.update(status='sterilizing')
            messages.success(request, f'灭菌批次 {batch.batch_number} 创建成功')
            return redirect('tracker:batch_board')
    else:
        form = SterilizationBatchForm()
    return render(request, 'tracker/batch/form.html', {'form': form, 'title': '创建灭菌批次'})


def batch_update_tests(request, pk):
    batch = get_object_or_404(SterilizationBatch, pk=pk)
    if request.method == 'POST':
        batch.physical_test = request.POST.get('physical_test', batch.physical_test)
        batch.chemical_test = request.POST.get('chemical_test', batch.chemical_test)
        batch.biological_test = request.POST.get('biological_test', batch.biological_test)
        sync_batch_result(batch)

        messages.success(request, f'批次 {batch.batch_number} 监测结果已更新')

        if request.htmx:
            return render(request, 'tracker/batch/detail.html', {
                'batch': batch,
                'audits': batch.release_audits.all(),
                'inspections': batch.inspections.all(),
            })
        return redirect('tracker:batch_detail', pk=batch.pk)

    return redirect('tracker:batch_detail', pk=batch.pk)


def audit_list(request):
    result_filter = request.GET.get('result', '')
    qs = ReleaseAudit.objects.select_related('instrument_package', 'batch').all()
    if result_filter:
        qs = qs.filter(audit_result=result_filter)
    qs = qs.order_by('-audited_at')
    context = {
        'audits': qs,
        'result_filter': result_filter,
        'result_choices': ReleaseAudit.RESULT_CHOICES,
    }
    return render(request, 'tracker/audit/list.html', context)


def audit_detail(request, pk):
    audit = get_object_or_404(ReleaseAudit, pk=pk)
    return render(request, 'tracker/audit/detail.html', {'audit': audit})


def audit_create(request):
    if request.method == 'POST':
        form = ReleaseAuditForm(request.POST)
        if form.is_valid():
            audit = form.save()
            if audit.audit_result == 'approved':
                audit.instrument_package.status = 'registered'
                audit.instrument_package.last_sterilized_at = audit.batch.completed_at
                audit.instrument_package.expire_at = timezone.now() + timezone.timedelta(
                    days=audit.instrument_package.sterilization_expiry_days
                )
                audit.instrument_package.save()
            else:
                audit.instrument_package.status = 'cleaning'
                audit.instrument_package.save()
            messages.success(request, '放行审核完成')
            return redirect('tracker:audit_list')
    else:
        form = ReleaseAuditForm()
    return render(request, 'tracker/audit/form.html', {'form': form, 'title': '放行审核'})


def usage_list(request):
    clinic_filter = request.GET.get('clinic', '')
    search = request.GET.get('q', '')

    qs = ClinicalUsage.objects.select_related('instrument_package').all()
    if clinic_filter:
        qs = qs.filter(clinic=clinic_filter)
    if search:
        qs = qs.filter(
            Q(patient_name__icontains=search)
            | Q(patient_id__icontains=search)
            | Q(doctor__icontains=search)
        )
    qs = qs.order_by('-used_at')
    clinics = ClinicalUsage.objects.values_list('clinic', flat=True).distinct()

    context = {
        'records': qs,
        'clinic_filter': clinic_filter,
        'search': search,
        'clinics': clinics,
    }
    return render(request, 'tracker/usage/list.html', context)


def usage_detail(request, pk):
    record = get_object_or_404(ClinicalUsage, pk=pk)
    return render(request, 'tracker/usage/detail.html', {'record': record})


def usage_create(request):
    if request.method == 'POST':
        form = ClinicalUsageForm(request.POST)
        if form.is_valid():
            usage = form.save()
            usage.instrument_package.status = 'in_use'
            usage.instrument_package.save()
            messages.success(request, '诊疗使用登记成功')
            return redirect('tracker:usage_list')
    else:
        form = ClinicalUsageForm()
    return render(request, 'tracker/usage/form.html', {'form': form, 'title': '登记诊疗使用'})


def usage_return(request, pk):
    record = get_object_or_404(ClinicalUsage, pk=pk)
    if request.method == 'POST' and record.returned_at is None:
        record.returned_at = timezone.now()
        record.save()
        record.instrument_package.status = 'cleaning'
        record.instrument_package.save()
        messages.success(request, '器械已归还，状态已更新为清洗中')
    return redirect('tracker:usage_detail', pk=record.pk)


def recall_list(request):
    status_filter = request.GET.get('status', '')
    qs = ExpiryRecall.objects.select_related('instrument_package').all()
    if status_filter:
        qs = qs.filter(status=status_filter)
    qs = qs.order_by('-initiated_at')
    context = {
        'records': qs,
        'status_filter': status_filter,
        'status_choices': ExpiryRecall.STATUS_CHOICES,
    }
    return render(request, 'tracker/recall/list.html', context)


def recall_detail(request, pk):
    record = get_object_or_404(ExpiryRecall, pk=pk)
    return render(request, 'tracker/recall/detail.html', {'record': record})


def recall_create(request):
    if request.method == 'POST':
        form = ExpiryRecallForm(request.POST)
        if form.is_valid():
            recall = form.save()
            recall.instrument_package.status = 'recalled'
            recall.instrument_package.save()
            messages.success(request, '召回记录创建成功')
            return redirect('tracker:recall_list')
    else:
        form = ExpiryRecallForm()
    return render(request, 'tracker/recall/form.html', {'form': form, 'title': '发起召回'})


def recall_handle(request, pk):
    record = get_object_or_404(ExpiryRecall, pk=pk)
    if request.method == 'POST' and record.status == 'pending':
        record.status = request.POST.get('action', 'recalled')
        record.handler = request.POST.get('handler', '')
        record.handled_at = timezone.now()
        record.save()

        if record.status == 'recalled':
            record.instrument_package.status = 'recalled'
        elif record.status == 'destroyed':
            record.instrument_package.status = 'recalled'
        record.instrument_package.save()

        messages.success(request, f'召回已处理: {record.get_status_display()}')
    return redirect('tracker:recall_detail', pk=record.pk)


def inspection_list(request):
    type_filter = request.GET.get('type', '')
    result_filter = request.GET.get('result', '')
    qs = InfectionInspection.objects.select_related('instrument_package', 'batch').all()
    if type_filter:
        qs = qs.filter(inspection_type=type_filter)
    if result_filter:
        qs = qs.filter(result=result_filter)
    qs = qs.order_by('-inspected_at')
    context = {
        'records': qs,
        'type_filter': type_filter,
        'result_filter': result_filter,
        'type_choices': InfectionInspection.TYPE_CHOICES,
        'result_choices': InfectionInspection.RESULT_CHOICES,
    }
    return render(request, 'tracker/inspection/list.html', context)


def inspection_detail(request, pk):
    record = get_object_or_404(InfectionInspection, pk=pk)
    return render(request, 'tracker/inspection/detail.html', {'record': record})


def inspection_create(request):
    if request.method == 'POST':
        form = InfectionInspectionForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '院感抽查记录创建成功')
            return redirect('tracker:inspection_list')
    else:
        form = InfectionInspectionForm()
    return render(request, 'tracker/inspection/form.html', {'form': form, 'title': '新建院感抽查'})


def check_expiry(request):
    now = timezone.now()
    expired = InstrumentPackage.objects.filter(
        status='registered', expire_at__lte=now
    )
    count = 0
    for instrument in expired:
        instrument.status = 'expired'
        instrument.save()
        ExpiryRecall.objects.get_or_create(
            instrument_package=instrument,
            reason='expired',
            defaults={
                'initiator': '系统自动',
                'initiated_at': now,
                'status': 'pending',
            }
        )
        count += 1

    messages.success(request, f'过期检查完成，发现 {count} 个过期器械包')
    return redirect('tracker:home')
