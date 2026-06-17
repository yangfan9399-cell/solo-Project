from django.contrib import admin
from .models import Station, Instrument, CalibrationBatch, CalibrationRecord, TransportRecord, Certificate


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'altitude', 'region', 'status', 'created_at']
    list_filter = ['region', 'status']
    search_fields = ['name', 'code']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'instrument_type', 'model_name', 'station', 'status', 'next_calibration_due']
    list_filter = ['instrument_type', 'status']
    search_fields = ['serial_number', 'model_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CalibrationBatch)
class CalibrationBatchAdmin(admin.ModelAdmin):
    list_display = ['batch_number', 'calibration_date', 'operator', 'version', 'is_superseded', 'created_at']
    list_filter = ['is_superseded', 'operator']
    search_fields = ['batch_number']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CalibrationRecord)
class CalibrationRecordAdmin(admin.ModelAdmin):
    list_display = ['instrument', 'batch', 'test_point', 'before_value', 'after_value', 'result', 'is_anomaly']
    list_filter = ['result', 'is_anomaly', 'instrument__instrument_type']
    search_fields = ['test_point', 'instrument__serial_number']
    readonly_fields = ['id', 'deviation_before', 'deviation_after', 'created_at', 'updated_at']


@admin.register(TransportRecord)
class TransportRecordAdmin(admin.ModelAdmin):
    list_display = ['instrument', 'from_station', 'to_station', 'transport_date', 'impact_score']
    list_filter = ['method']
    search_fields = ['instrument__serial_number']
    readonly_fields = ['id', 'reading_deviation', 'created_at', 'updated_at']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'issued_by', 'issued_date', 'expiry_date', 'is_valid']
    list_filter = ['is_valid', 'issued_by']
    search_fields = ['certificate_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
