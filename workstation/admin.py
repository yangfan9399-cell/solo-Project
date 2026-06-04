from django.contrib import admin
from .models import (
    ExaminationType, Patient, Appointment,
    RescheduleRecord, ReportClaimRecord, AbnormalRecord, OperationLog
)


@admin.register(ExaminationType)
class ExaminationTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'estimated_duration')
    search_fields = ('name', 'department')


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id_card', 'name', 'gender', 'birth_date', 'phone')
    search_fields = ('name', 'id_card', 'phone')
    list_filter = ('gender',)


class RescheduleRecordInline(admin.TabularInline):
    model = RescheduleRecord
    extra = 0
    readonly_fields = ('created_at', 'operator')


class ReportClaimRecordInline(admin.TabularInline):
    model = ReportClaimRecord
    extra = 0
    readonly_fields = ('created_at', 'operator')


class AbnormalRecordInline(admin.TabularInline):
    model = AbnormalRecord
    extra = 0
    readonly_fields = ('created_at',)


class OperationLogInline(admin.TabularInline):
    model = OperationLog
    extra = 0
    readonly_fields = ('created_at', 'operator', 'operation_type', 'details')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'appointment_no', 'patient', 'examination_type',
        'current_appointment_time', 'status', 'report_status'
    )
    list_filter = ('status', 'report_status', 'examination_type')
    search_fields = ('appointment_no', 'patient__name', 'patient__id_card')
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    inlines = [RescheduleRecordInline, ReportClaimRecordInline, AbnormalRecordInline, OperationLogInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('appointment_no', 'patient', 'examination_type', 'room', 'notes')
        }),
        ('预约时间', {
            'fields': ('original_appointment_time', 'current_appointment_time')
        }),
        ('状态信息', {
            'fields': ('status', 'report_status', 'check_in_time', 'completion_time')
        }),
        ('系统信息', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RescheduleRecord)
class RescheduleRecordAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'old_time', 'new_time', 'reason', 'operator', 'created_at')
    list_filter = ('reason',)
    search_fields = ('appointment__appointment_no', 'operator__username')
    readonly_fields = ('created_at', 'operator')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.operator = request.user
        super().save_model(request, obj, form, change)


@admin.register(ReportClaimRecord)
class ReportClaimRecordAdmin(admin.ModelAdmin):
    list_display = (
        'appointment', 'claim_type', 'claimant_name',
        'verification_result', 'is_blocked', 'review_status', 'operator'
    )
    list_filter = ('claim_type', 'verification_result', 'review_status', 'is_blocked')
    search_fields = ('appointment__appointment_no', 'claimant_name', 'claimant_id_card')
    readonly_fields = ('created_at', 'operator')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.operator = request.user
        super().save_model(request, obj, form, change)


@admin.register(AbnormalRecord)
class AbnormalRecordAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'abnormal_type', 'status', 'handler', 'created_at')
    list_filter = ('abnormal_type', 'status')
    search_fields = ('appointment__appointment_no', 'description')
    readonly_fields = ('created_at',)


@admin.register(OperationLog)
class OperationLogAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'operation_type', 'operator', 'created_at')
    list_filter = ('operation_type',)
    search_fields = ('appointment__appointment_no', 'details')
    readonly_fields = ('created_at', 'operator', 'operation_type', 'details', 'evidence', 'appointment')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
