from django.contrib import admin
from .models import (
    UserProfile, Forwarder, ShippingLine, Container, InspectionWindow,
    DocumentType, InspectionAppointment, Document, FeeItem,
    InspectionHistory, RescheduleRecord,
)


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0
    readonly_fields = ('submitted_at', 'submitted_by')


class FeeItemInline(admin.TabularInline):
    model = FeeItem
    extra = 0
    readonly_fields = ('amount', 'created_at')


class InspectionHistoryInline(admin.TabularInline):
    model = InspectionHistory
    extra = 0
    readonly_fields = ('action', 'status_from', 'status_to', 'operator', 'operated_at', 'remark')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone', 'department')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name')


@admin.register(Forwarder)
class ForwarderAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'email')
    search_fields = ('name', 'contact_person')


@admin.register(ShippingLine)
class ShippingLineAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')


@admin.register(Container)
class ContainerAdmin(admin.ModelAdmin):
    list_display = ('container_no', 'size', 'shipping_line', 'vessel_name', 'voyage_no')
    list_filter = ('size', 'shipping_line')
    search_fields = ('container_no', 'vessel_name', 'voyage_no', 'bl_no')


@admin.register(InspectionWindow)
class InspectionWindowAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'location')


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_required', 'description')
    list_filter = ('is_required',)
    search_fields = ('name',)


@admin.register(InspectionAppointment)
class InspectionAppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'appointment_no', 'container', 'forwarder', 'status',
        'appointment_date', 'appointment_time', 'inspection_window'
    )
    list_filter = ('status', 'inspection_window', 'shipping_line', 'route')
    search_fields = ('appointment_no', 'container__container_no', 'forwarder__name')
    readonly_fields = ('appointment_no', 'created_at', 'updated_at', 'submitted_at')
    inlines = [DocumentInline, FeeItemInline, InspectionHistoryInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('appointment_no', 'container', 'forwarder', 'shipping_line', 'route')
        }),
        ('预约信息', {
            'fields': ('inspection_window', 'appointment_date', 'appointment_time', 'inspection_reason')
        }),
        ('联系信息', {
            'fields': ('contact_person', 'contact_phone')
        }),
        ('状态信息', {
            'fields': ('status', 'created_by', 'created_at', 'updated_at', 'submitted_at')
        }),
        ('查验信息', {
            'fields': ('inspection_started_at', 'inspection_completed_at', 'inspector', 'inspection_result')
        }),
        ('费用信息', {
            'fields': ('demurrage_days', 'demurrage_fee', 'fee_reduction', 'final_fee',
                       'fee_confirmed_by', 'fee_confirmed_at', 'fee_dispute_reason')
        }),
        ('归档信息', {
            'fields': ('archived_at', 'archived_by')
        }),
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'document_type', 'is_submitted', 'submitted_at', 'submitted_by')
    list_filter = ('is_submitted', 'document_type')
    search_fields = ('appointment__appointment_no', 'document_type__name')


@admin.register(FeeItem)
class FeeItemAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'item_name', 'quantity', 'unit_price', 'amount', 'is_reduction')
    list_filter = ('is_reduction',)
    search_fields = ('appointment__appointment_no', 'item_name')


@admin.register(InspectionHistory)
class InspectionHistoryAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'action', 'status_from', 'status_to', 'operator', 'operated_at')
    list_filter = ('action', 'status_to')
    search_fields = ('appointment__appointment_no', 'action', 'remark')


@admin.register(RescheduleRecord)
class RescheduleRecordAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'original_date', 'original_time', 'new_date', 'new_time', 'operator', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('appointment__appointment_no', 'reason')
