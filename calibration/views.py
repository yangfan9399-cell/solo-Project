import csv
import json
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse, reverse_lazy
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib import messages
from .models import Station, Instrument, CalibrationBatch, CalibrationRecord, TransportRecord, Certificate
from .forms import (StationForm, InstrumentForm, CalibrationBatchForm,
                    CalibrationRecordForm, TransportRecordForm, CertificateForm,
                    CalibrationFilterForm)


def dashboard(request):
    total_stations = Station.objects.count()
    active_stations = Station.objects.filter(status='active').count()
    total_instruments = Instrument.objects.count()
    overdue_instruments = [i for i in Instrument.objects.all() if i.is_overdue]
    anomaly_records = CalibrationRecord.objects.filter(is_anomaly=True).count()
    total_records = CalibrationRecord.objects.count()
    recent_batches = CalibrationBatch.objects.all()[:5]
    recent_records = CalibrationRecord.objects.select_related('instrument', 'batch')[:10]
    expired_certs = [c for c in Certificate.objects.filter(is_valid=True) if c.is_expired]

    stations_geo = Station.objects.filter(status='active')
    stations_data = [
        {
            'name': s.name,
            'code': s.code,
            'lat': s.latitude,
            'lng': s.longitude,
            'altitude': s.altitude,
            'region': s.get_region_display(),
            'anomaly_count': s.anomaly_count,
            'instrument_count': s.instruments.count(),
        }
        for s in stations_geo
    ]

    instrument_type_stats = {}
    for t in Instrument.TYPE_CHOICES:
        count = Instrument.objects.filter(instrument_type=t[0]).count()
        instrument_type_stats[t[1]] = count

    result_stats = {}
    for r in CalibrationRecord.RESULT_CHOICES:
        count = CalibrationRecord.objects.filter(result=r[0]).count()
        result_stats[r[1]] = count

    context = {
        'total_stations': total_stations,
        'active_stations': active_stations,
        'total_instruments': total_instruments,
        'overdue_instruments': overdue_instruments,
        'anomaly_records': anomaly_records,
        'total_records': total_records,
        'recent_batches': recent_batches,
        'recent_records': recent_records,
        'expired_certs': expired_certs,
        'stations_data': json.dumps(stations_data, ensure_ascii=False),
        'instrument_type_stats': json.dumps(instrument_type_stats, ensure_ascii=False),
        'result_stats': json.dumps(result_stats, ensure_ascii=False),
    }
    return render(request, 'calibration/dashboard.html', context)


def station_map(request):
    stations = Station.objects.all()
    stations_data = [
        {
            'name': s.name,
            'code': s.code,
            'lat': s.latitude,
            'lng': s.longitude,
            'altitude': s.altitude,
            'region': s.get_region_display(),
            'status': s.get_status_display(),
            'anomaly_count': s.anomaly_count,
            'instrument_count': s.instruments.count(),
            'detail_url': reverse('calibration:station_detail', kwargs={'pk': s.pk}),
        }
        for s in stations
    ]
    context = {
        'stations_data': json.dumps(stations_data, ensure_ascii=False),
        'stations': stations,
    }
    return render(request, 'calibration/station_map.html', context)


class StationListView(ListView):
    model = Station
    template_name = 'calibration/station_list.html'
    context_object_name = 'stations'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset()
        region = self.request.GET.get('region')
        status = self.request.GET.get('status')
        q = self.request.GET.get('q')
        if region:
            qs = qs.filter(region=region)
        if status:
            qs = qs.filter(status=status)
        if q:
            qs = qs.filter(name__icontains=q) | qs.filter(code__icontains=q)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['filter_form'] = CalibrationFilterForm()
        ctx['region_choices'] = Station.REGION_CHOICES
        ctx['status_choices'] = Station.STATUS_CHOICES
        return ctx


class StationDetailView(DetailView):
    model = Station
    template_name = 'calibration/station_detail.html'
    context_object_name = 'station'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['instruments'] = self.object.instruments.all()
        ctx['anomaly_records'] = CalibrationRecord.objects.filter(
            instrument__station=self.object, is_anomaly=True
        ).select_related('instrument', 'batch')[:20]
        return ctx


class StationCreateView(CreateView):
    model = Station
    form_class = StationForm
    template_name = 'calibration/station_form.html'
    success_url = reverse_lazy('station_list')

    def form_valid(self, form):
        messages.success(self.request, f'站点 {form.instance.name} 创建成功')
        return super().form_valid(form)


class StationUpdateView(UpdateView):
    model = Station
    form_class = StationForm
    template_name = 'calibration/station_form.html'

    def get_success_url(self):
        return reverse_lazy('station_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, f'站点 {form.instance.name} 更新成功')
        return super().form_valid(form)


class InstrumentListView(ListView):
    model = Instrument
    template_name = 'calibration/instrument_list.html'
    context_object_name = 'instruments'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset().select_related('station')
        instrument_type = self.request.GET.get('instrument_type')
        status = self.request.GET.get('status')
        station = self.request.GET.get('station')
        q = self.request.GET.get('q')
        if instrument_type:
            qs = qs.filter(instrument_type=instrument_type)
        if status:
            qs = qs.filter(status=status)
        if station:
            qs = qs.filter(station_id=station)
        if q:
            qs = qs.filter(serial_number__icontains=q) | qs.filter(model_name__icontains=q)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['type_choices'] = Instrument.TYPE_CHOICES
        ctx['status_choices'] = Instrument.STATUS_CHOICES
        ctx['stations'] = Station.objects.all()
        return ctx


class InstrumentDetailView(DetailView):
    model = Instrument
    template_name = 'calibration/instrument_detail.html'
    context_object_name = 'instrument'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['calibration_records'] = self.object.calibration_records.select_related('batch')[:20]
        ctx['transport_records'] = self.object.transport_records.select_related('from_station', 'to_station')[:10]
        ctx['certificates'] = Certificate.objects.filter(record__instrument=self.object)[:10]
        return ctx


class InstrumentCreateView(CreateView):
    model = Instrument
    form_class = InstrumentForm
    template_name = 'calibration/instrument_form.html'
    success_url = reverse_lazy('instrument_list')

    def form_valid(self, form):
        messages.success(self.request, f'仪器 {form.instance.serial_number} 创建成功')
        return super().form_valid(form)


class InstrumentUpdateView(UpdateView):
    model = Instrument
    form_class = InstrumentForm
    template_name = 'calibration/instrument_form.html'

    def get_success_url(self):
        return reverse_lazy('instrument_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, f'仪器 {form.instance.serial_number} 更新成功')
        return super().form_valid(form)


def calibration_list(request):
    records = CalibrationRecord.objects.select_related('instrument', 'instrument__station', 'batch').all()
    form = CalibrationFilterForm(request.GET)

    if form.is_valid():
        q = form.cleaned_data.get('q')
        instrument_type = form.cleaned_data.get('instrument_type')
        result = form.cleaned_data.get('result')
        is_anomaly = form.cleaned_data.get('is_anomaly')
        batch = form.cleaned_data.get('batch')
        date_from = form.cleaned_data.get('date_from')
        date_to = form.cleaned_data.get('date_to')

        if q:
            records = records.filter(
                instrument__serial_number__icontains=q
            ) | records.filter(test_point__icontains=q)
        if instrument_type:
            records = records.filter(instrument__instrument_type=instrument_type)
        if result:
            records = records.filter(result=result)
        if is_anomaly == '1':
            records = records.filter(is_anomaly=True)
        elif is_anomaly == '0':
            records = records.filter(is_anomaly=False)
        if batch:
            records = records.filter(batch__batch_number__icontains=batch)
        if date_from:
            records = records.filter(batch__calibration_date__gte=date_from)
        if date_to:
            records = records.filter(batch__calibration_date__lte=date_to)

    records = records[:100]

    export = request.GET.get('export')
    if export == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="calibration_records.csv"'
        writer = csv.writer(response)
        writer.writerow(['仪器序列号', '仪器类型', '所属站点', '测试点', '校准前读数',
                         '校准后读数', '标准值', '校准前偏差', '校准后偏差',
                         '允许误差', '结果', '异常', '批次号', '校准日期'])
        for r in records:
            writer.writerow([
                r.instrument.serial_number,
                r.instrument.get_instrument_type_display(),
                r.instrument.station.name,
                r.test_point,
                r.before_value,
                r.after_value,
                r.standard_value or '',
                r.deviation_before or '',
                r.deviation_after or '',
                r.tolerance or '',
                r.get_result_display(),
                '是' if r.is_anomaly else '否',
                r.batch.batch_number,
                r.batch.calibration_date,
            ])
        return response
    elif export == 'json':
        data = []
        for r in records:
            data.append({
                'instrument_serial': r.instrument.serial_number,
                'instrument_type': r.instrument.get_instrument_type_display(),
                'station': r.instrument.station.name,
                'test_point': r.test_point,
                'before_value': r.before_value,
                'after_value': r.after_value,
                'standard_value': r.standard_value,
                'deviation_before': r.deviation_before,
                'deviation_after': r.deviation_after,
                'tolerance': r.tolerance,
                'result': r.get_result_display(),
                'is_anomaly': r.is_anomaly,
                'batch_number': r.batch.batch_number,
                'calibration_date': str(r.batch.calibration_date),
            })
        response = HttpResponse(json.dumps(data, ensure_ascii=False, indent=2), content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename="calibration_records.json"'
        return response

    context = {
        'records': records,
        'filter_form': form,
    }
    return render(request, 'calibration/calibration_list.html', context)


class CalibrationRecordDetailView(DetailView):
    model = CalibrationRecord
    template_name = 'calibration/calibration_detail.html'
    context_object_name = 'record'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['certificates'] = self.object.certificates.all()
        return ctx


class CalibrationRecordCreateView(CreateView):
    model = CalibrationRecord
    form_class = CalibrationRecordForm
    template_name = 'calibration/calibration_form.html'
    success_url = reverse_lazy('calibration_list')

    def form_valid(self, form):
        messages.success(self.request, '校准记录创建成功')
        return super().form_valid(form)


class CalibrationRecordUpdateView(UpdateView):
    model = CalibrationRecord
    form_class = CalibrationRecordForm
    template_name = 'calibration/calibration_form.html'

    def get_success_url(self):
        return reverse_lazy('calibration_detail', kwargs={'pk': self.object.pk})

    def form_valid(self, form):
        messages.success(self.request, '校准记录更新成功')
        return super().form_valid(form)


def batch_list(request):
    batches = CalibrationBatch.objects.all()
    batch_number = request.GET.get('batch_number')
    if batch_number:
        batches = batches.filter(batch_number__icontains=batch_number)

    batch_data = []
    for b in batches:
        versions = CalibrationBatch.objects.filter(batch_number=b.batch_number).order_by('-version')
        batch_data.append({
            'batch': b,
            'versions': versions,
        })

    seen = set()
    unique_batch_data = []
    for bd in batch_data:
        bn = bd['batch'].batch_number
        if bn not in seen:
            seen.add(bn)
            unique_batch_data.append(bd)

    context = {
        'batch_data': unique_batch_data,
    }
    return render(request, 'calibration/batch_list.html', context)


class BatchDetailView(DetailView):
    model = CalibrationBatch
    template_name = 'calibration/batch_detail.html'
    context_object_name = 'batch'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['records'] = self.object.records.select_related('instrument', 'instrument__station').all()
        ctx['versions'] = CalibrationBatch.objects.filter(
            batch_number=self.object.batch_number
        ).order_by('-version')
        return ctx


class BatchCreateView(CreateView):
    model = CalibrationBatch
    form_class = CalibrationBatchForm
    template_name = 'calibration/batch_form.html'
    success_url = reverse_lazy('batch_list')

    def form_valid(self, form):
        messages.success(self.request, f'批次 {form.instance.batch_number} 创建成功')
        return super().form_valid(form)


class TransportListView(ListView):
    model = TransportRecord
    template_name = 'calibration/transport_list.html'
    context_object_name = 'transports'
    paginate_by = 20

    def get_queryset(self):
        return super().get_queryset().select_related('instrument', 'from_station', 'to_station')


class TransportCreateView(CreateView):
    model = TransportRecord
    form_class = TransportRecordForm
    template_name = 'calibration/transport_form.html'
    success_url = reverse_lazy('transport_list')

    def form_valid(self, form):
        messages.success(self.request, '运输记录创建成功')
        return super().form_valid(form)


class TransportDetailView(DetailView):
    model = TransportRecord
    template_name = 'calibration/transport_detail.html'
    context_object_name = 'transport'


class CertificateListView(ListView):
    model = Certificate
    template_name = 'calibration/certificate_list.html'
    context_object_name = 'certificates'
    paginate_by = 20

    def get_queryset(self):
        return super().get_queryset().select_related('record', 'record__instrument')


class CertificateCreateView(CreateView):
    model = Certificate
    form_class = CertificateForm
    template_name = 'calibration/certificate_form.html'
    success_url = reverse_lazy('certificate_list')

    def form_valid(self, form):
        messages.success(self.request, f'证书 {form.instance.certificate_number} 创建成功')
        return super().form_valid(form)


class CertificateDetailView(DetailView):
    model = Certificate
    template_name = 'calibration/certificate_detail.html'
    context_object_name = 'certificate'


def anomaly_overview(request):
    anomaly_records = CalibrationRecord.objects.filter(
        is_anomaly=True
    ).select_related('instrument', 'instrument__station', 'batch')

    high_impact_transports = TransportRecord.objects.filter(
        impact_score__gte=5
    ).select_related('instrument', 'from_station', 'to_station')

    overdue_instruments = [i for i in Instrument.objects.select_related('station') if i.is_overdue]
    expired_certs = [c for c in Certificate.objects.filter(is_valid=True).select_related('record') if c.is_expired]

    context = {
        'anomaly_records': anomaly_records[:50],
        'anomaly_count': anomaly_records.count(),
        'high_impact_transports': high_impact_transports[:20],
        'overdue_instruments': overdue_instruments,
        'expired_certs': expired_certs,
    }
    return render(request, 'calibration/anomaly_overview.html', context)


def offline_sync(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            records = data.get('records', [])
            created_count = 0
            errors = []

            for rec_data in records:
                try:
                    instrument = Instrument.objects.get(serial_number=rec_data.get('instrument_serial'))
                    batch = CalibrationBatch.objects.get(batch_number=rec_data.get('batch_number'))

                    CalibrationRecord.objects.create(
                        instrument=instrument,
                        batch=batch,
                        test_point=rec_data.get('test_point', ''),
                        before_value=rec_data.get('before_value', 0),
                        after_value=rec_data.get('after_value', 0),
                        standard_value=rec_data.get('standard_value'),
                        tolerance=rec_data.get('tolerance'),
                        result=rec_data.get('result', 'pass'),
                        is_anomaly=rec_data.get('is_anomaly', False),
                        anomaly_note=rec_data.get('anomaly_note', ''),
                        notes=rec_data.get('notes', ''),
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(str(e))

            return JsonResponse({
                'status': 'ok',
                'created': created_count,
                'errors': errors,
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    return JsonResponse({'status': 'ready', 'message': '离线同步端点就绪'})


def export_summary(request):
    summary = {
        'stations': Station.objects.count(),
        'instruments': Instrument.objects.count(),
        'calibration_records': CalibrationRecord.objects.count(),
        'anomaly_records': CalibrationRecord.objects.filter(is_anomaly=True).count(),
        'transport_records': TransportRecord.objects.count(),
        'certificates': Certificate.objects.count(),
        'valid_certificates': Certificate.objects.filter(is_valid=True).count(),
    }

    type_summary = {}
    for t in Instrument.TYPE_CHOICES:
        type_summary[t[1]] = {
            'count': Instrument.objects.filter(instrument_type=t[0]).count(),
            'anomalies': CalibrationRecord.objects.filter(
                instrument__instrument_type=t[0], is_anomaly=True
            ).count(),
        }

    result_summary = {}
    for r in CalibrationRecord.RESULT_CHOICES:
        result_summary[r[1]] = CalibrationRecord.objects.filter(result=r[0]).count()

    fmt = request.GET.get('format', 'json')
    data = {
        'summary': summary,
        'by_instrument_type': type_summary,
        'by_result': result_summary,
    }

    if fmt == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="calibration_summary.csv"'
        writer = csv.writer(response)
        writer.writerow(['指标', '数值'])
        for k, v in summary.items():
            writer.writerow([k, v])
        writer.writerow([])
        writer.writerow(['仪器类型', '数量', '异常数'])
        for k, v in type_summary.items():
            writer.writerow([k, v['count'], v['anomalies']])
        writer.writerow([])
        writer.writerow(['校准结果', '数量'])
        for k, v in result_summary.items():
            writer.writerow([k, v])
        return response

    response = HttpResponse(json.dumps(data, ensure_ascii=False, indent=2), content_type='application/json')
    response['Content-Disposition'] = 'attachment; filename="calibration_summary.json"'
    return response
