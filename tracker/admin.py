from django.contrib import admin

from tracker.models import (
    CleaningRecord,
    ClinicalUsage,
    ExpiryRecall,
    InfectionInspection,
    InstrumentPackage,
    ReleaseAudit,
    SterilizationBatch,
)


@admin.register(InstrumentPackage)
class InstrumentPackageAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'status', 'clinic', 'expire_at', 'created_at']
    list_filter = ['status', 'category', 'clinic']
    search_fields = ['code', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CleaningRecord)
class CleaningRecordAdmin(admin.ModelAdmin):
    list_display = ['instrument_package', 'method', 'cleaner', 'result', 'started_at', 'completed_at']
    list_filter = ['method', 'result']
    search_fields = ['instrument_package__code', 'cleaner']
    raw_id_fields = ['instrument_package']


@admin.register(SterilizationBatch)
class SterilizationBatchAdmin(admin.ModelAdmin):
    list_display = ['batch_number', 'method', 'operator', 'result', 'started_at', 'completed_at']
    list_filter = ['method', 'result', 'physical_test', 'chemical_test', 'biological_test']
    search_fields = ['batch_number', 'operator']
    filter_horizontal = ['instrument_packages']


@admin.register(ReleaseAudit)
class ReleaseAuditAdmin(admin.ModelAdmin):
    list_display = ['instrument_package', 'batch', 'auditor', 'audit_result', 'audited_at']
    list_filter = ['audit_result', 'packaging_intact', 'indicator_changed', 'label_clear', 'seal_intact']
    raw_id_fields = ['instrument_package', 'batch']


@admin.register(ClinicalUsage)
class ClinicalUsageAdmin(admin.ModelAdmin):
    list_display = ['instrument_package', 'patient_name', 'doctor', 'clinic', 'procedure', 'used_at', 'returned_at']
    list_filter = ['clinic']
    search_fields = ['instrument_package__code', 'patient_name', 'doctor', 'patient_id']
    raw_id_fields = ['instrument_package']


@admin.register(ExpiryRecall)
class ExpiryRecallAdmin(admin.ModelAdmin):
    list_display = ['instrument_package', 'reason', 'initiator', 'status', 'initiated_at', 'handler']
    list_filter = ['reason', 'status']
    search_fields = ['instrument_package__code', 'initiator', 'handler']
    raw_id_fields = ['instrument_package']


@admin.register(InfectionInspection)
class InfectionInspectionAdmin(admin.ModelAdmin):
    list_display = ['inspection_type', 'inspector', 'result', 'handling_status', 'handled_by', 'inspected_at', 'handled_at']
    list_filter = ['inspection_type', 'result', 'handling_status']
    search_fields = ['inspector', 'handled_by', 'findings']
    raw_id_fields = ['instrument_package', 'batch']
    readonly_fields = ['id', 'created_at']
