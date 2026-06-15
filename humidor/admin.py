from django.contrib import admin
from .models import (
    CigarTag,
    HumidorCabinet,
    CabinetRecord,
    HumidityDetail,
    CigarPosition,
    RotationResult,
    AlertReminder,
)


@admin.register(CigarTag)
class CigarTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color')
    search_fields = ('name',)


@admin.register(HumidorCabinet)
class HumidorCabinetAdmin(admin.ModelAdmin):
    list_display = ('name', 'cabinet_code', 'layers', 'status')
    list_filter = ('status',)
    search_fields = ('name', 'cabinet_code')


class HumidityDetailInline(admin.TabularInline):
    model = HumidityDetail
    extra = 0
    fields = ('temperature', 'humidity', 'measure_time', 'is_alert', 'alert_type')
    readonly_fields = ('is_alert', 'alert_type')


class CigarPositionInline(admin.TabularInline):
    model = CigarPosition
    extra = 0
    fields = ('cigar_name', 'cigar_code', 'position_type', 'to_layer', 'to_slot', 'operation_time')


@admin.register(CabinetRecord)
class CabinetRecordAdmin(admin.ModelAdmin):
    list_display = ('batch_no', 'collector', 'cabinet_layer', 'status', 'record_date', 'version')
    list_filter = ('status', 'record_date')
    search_fields = ('batch_no', 'collector', 'tasting_notes')
    inlines = [HumidityDetailInline, CigarPositionInline]
    filter_horizontal = ('tags',)


@admin.register(HumidityDetail)
class HumidityDetailAdmin(admin.ModelAdmin):
    list_display = ('record', 'temperature', 'humidity', 'measure_time', 'is_alert', 'alert_type')
    list_filter = ('is_alert', 'alert_type', 'measure_time')
    search_fields = ('record__batch_no',)


@admin.register(CigarPosition)
class CigarPositionAdmin(admin.ModelAdmin):
    list_display = ('cigar_name', 'cigar_code', 'position_type', 'to_layer', 'to_slot', 'operation_time')
    list_filter = ('position_type', 'operation_time')
    search_fields = ('cigar_name', 'cigar_code')


@admin.register(RotationResult)
class RotationResultAdmin(admin.ModelAdmin):
    list_display = ('record', 'rotation_date', 'result', 'cigar_count', 'executor')
    list_filter = ('result', 'rotation_date')
    search_fields = ('record__batch_no', 'executor')


@admin.register(AlertReminder)
class AlertReminderAdmin(admin.ModelAdmin):
    list_display = ('title', 'reminder_type', 'severity', 'status', 'created_at')
    list_filter = ('reminder_type', 'severity', 'status', 'created_at')
    search_fields = ('title', 'content')
