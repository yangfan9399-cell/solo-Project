from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, CablewayEquipment, DailyInspection, InspectionMetric,
    EvidenceAttachment, ApprovalNode, BusinessRecord
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'role', 'department', 'phone', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'department')}),
    )


@admin.register(CablewayEquipment)
class CablewayEquipmentAdmin(admin.ModelAdmin):
    list_display = ('equipment_no', 'name', 'location', 'status', 'install_date')
    list_filter = ('status',)
    search_fields = ('equipment_no', 'name', 'location')


class InspectionMetricInline(admin.TabularInline):
    model = InspectionMetric
    extra = 0
    fields = ('metric_name', 'category', 'standard_value', 'measured_value', 'is_abnormal')


class EvidenceAttachmentInline(admin.TabularInline):
    model = EvidenceAttachment
    extra = 0
    fields = ('file_type', 'file_name', 'description', 'uploaded_by')


class ApprovalNodeInline(admin.TabularInline):
    model = ApprovalNode
    extra = 0
    fields = ('node_no', 'action', 'operator', 'action_time', 'remarks')
    readonly_fields = ('node_no', 'action', 'operator', 'action_time')
    ordering = ('-action_time',)


@admin.register(DailyInspection)
class DailyInspectionAdmin(admin.ModelAdmin):
    list_display = ('inspection_no', 'equipment', 'inspection_date', 'status', 'abnormal_type', 'current_handler')
    list_filter = ('status', 'abnormal_type', 'source', 'inspection_date')
    search_fields = ('inspection_no', 'equipment__name', 'summary')
    date_hierarchy = 'inspection_date'
    inlines = [InspectionMetricInline, EvidenceAttachmentInline, ApprovalNodeInline]
    readonly_fields = ('inspection_no', 'created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {
            'fields': ('inspection_no', 'equipment', 'source', 'inspection_date', 'inspector', 'current_handler')
        }),
        ('状态信息', {
            'fields': ('status', 'abnormal_type', 'is_archived')
        }),
        ('内容信息', {
            'fields': ('summary', 'conclusion', 'block_reason', 'remediation_path')
        }),
        ('金额与责任', {
            'fields': ('estimated_loss', 'actual_loss', 'responsible_party')
        }),
        ('时间节点', {
            'fields': ('submitted_at', 'reviewed_at', 'archived_at', 'deadline', 'created_at', 'updated_at')
        }),
    )


@admin.register(ApprovalNode)
class ApprovalNodeAdmin(admin.ModelAdmin):
    list_display = ('node_no', 'inspection', 'action', 'operator', 'action_time')
    list_filter = ('action', 'action_time')
    search_fields = ('node_no', 'inspection__inspection_no', 'remarks')
    date_hierarchy = 'action_time'


@admin.register(BusinessRecord)
class BusinessRecordAdmin(admin.ModelAdmin):
    list_display = ('title', 'record_type', 'inspection', 'recorded_by', 'record_time')
    list_filter = ('record_type', 'record_time')
    search_fields = ('title', 'content')
