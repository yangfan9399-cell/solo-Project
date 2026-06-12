from django.contrib import admin
from django.utils.html import format_html
from .models import (
    AccessRecoveryRecord, ProcessingNode, EvidenceAttachment,
    FieldChangeLog, AnomalyBlockRecord
)


class ProcessingNodeInline(admin.TabularInline):
    model = ProcessingNode
    extra = 0
    readonly_fields = ('node_type', 'node_title', 'operator', 'previous_status', 'new_status', 'created_at', 'sequence')
    can_delete = False
    max_num = 0


class EvidenceAttachmentInline(admin.TabularInline):
    model = EvidenceAttachment
    extra = 0
    readonly_fields = ('evidence_type', 'title', 'uploaded_by', 'uploaded_at', 'is_valid')
    can_delete = True


class FieldChangeLogInline(admin.TabularInline):
    model = FieldChangeLog
    extra = 0
    readonly_fields = ('field_label', 'old_value', 'new_value', 'changed_by', 'changed_at')
    can_delete = False
    max_num = 0


class AnomalyBlockRecordInline(admin.TabularInline):
    model = AnomalyBlockRecord
    extra = 0
    readonly_fields = ('block_code', 'block_reason', 'blocked_by', 'blocked_at', 'resolved', 'resolved_at')
    can_delete = False
    max_num = 0


@admin.register(AccessRecoveryRecord)
class AccessRecoveryRecordAdmin(admin.ModelAdmin):
    list_display = (
        'record_no', 'title', 'status_tag', 'sample_type_tag', 'applicant_name',
        'lab_name', 'expiry_date', 'current_owner', 'risk_tag', 'is_overdue_tag',
        'has_anomaly_tag', 'created_at'
    )
    list_filter = (
        'status', 'sample_type', 'source', 'risk_level', 'is_archived',
        'is_blocked', 'has_anomaly', 'created_at', 'expiry_date'
    )
    search_fields = (
        'record_no', 'title', 'applicant_name', 'applicant_id', 'lab_name',
        'lab_code', 'business_note', 'conclusion'
    )
    readonly_fields = (
        'record_no', 'created_at', 'updated_at', 'accepted_at', 'processed_at',
        'reviewed_at', 'archived_at', 'snapshot_before', 'snapshot_after', 'diff_fields'
    )
    list_per_page = 20
    inlines = [ProcessingNodeInline, EvidenceAttachmentInline, FieldChangeLogInline, AnomalyBlockRecordInline]

    fieldsets = (
        ('基本信息', {
            'fields': ('record_no', 'title', 'source', 'sample_type', 'status', 'risk_level')
        }),
        ('申请人信息', {
            'fields': ('applicant_name', 'applicant_dept', 'applicant_id')
        }),
        ('实验室信息', {
            'fields': ('lab_name', 'lab_code', 'access_area')
        }),
        ('时间信息', {
            'fields': ('original_authorized_date', 'expiry_date', 'recovered_date', 'deadline')
        }),
        ('关键指标', {
            'fields': ('authorized_person_count', 'involved_amount')
        }),
        ('处理信息', {
            'fields': (
                'business_note', 'site_description', 'conclusion', 'recovery_basis',
                'remedial_path', 'block_reason'
            )
        }),
        ('责任人', {
            'fields': ('current_owner', 'accepted_by', 'processed_by', 'reviewed_by', 'archived_by')
        }),
        ('状态标记', {
            'fields': ('is_archived', 'is_blocked', 'has_anomaly')
        }),
        ('系统字段', {
            'fields': ('created_by', 'created_at', 'updated_at', 'accepted_at', 'processed_at', 'reviewed_at', 'archived_at'),
            'classes': ('collapse',)
        }),
        ('数据快照', {
            'fields': ('snapshot_before', 'snapshot_after', 'diff_fields'),
            'classes': ('collapse',)
        }),
    )

    def status_tag(self, obj):
        return format_html(
            '<span class="badge {}">{}</span>',
            obj.get_status_display_class(),
            obj.get_status_display()
        )
    status_tag.short_description = '状态'
    status_tag.admin_order_field = 'status'

    def sample_type_tag(self, obj):
        colors = {
            'normal_release': 'bg-success',
            'over_limit': 'bg-warning',
            'evidence_missing': 'bg-orange',
            'timeout': 'bg-danger',
        }
        return format_html(
            '<span class="badge {}">{}</span>',
            colors.get(obj.sample_type, 'bg-secondary'),
            obj.get_sample_type_display()
        )
    sample_type_tag.short_description = '样本类型'

    def risk_tag(self, obj):
        return format_html(
            '<span class="{}"><strong>{}</strong></span>',
            obj.get_risk_display_class(),
            obj.get_risk_level_display()
        )
    risk_tag.short_description = '风险等级'

    def is_overdue_tag(self, obj):
        if obj.is_overdue:
            return format_html('<span class="text-danger"><strong>已逾期 {} 天</strong></span>', obj.days_overdue)
        return format_html('<span class="text-success">正常</span>')
    is_overdue_tag.short_description = '是否逾期'

    def has_anomaly_tag(self, obj):
        if obj.has_anomaly:
            return format_html('<span class="badge bg-danger">存在异常</span>')
        if obj.is_blocked:
            return format_html('<span class="badge bg-warning">已阻断</span>')
        return format_html('<span class="badge bg-success">正常</span>')
    has_anomaly_tag.short_description = '异常标记'

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj and obj.is_archived:
            for field_name in form.base_fields:
                if field_name not in ['is_archived']:
                    form.base_fields[field_name].disabled = True
        return form


@admin.register(ProcessingNode)
class ProcessingNodeAdmin(admin.ModelAdmin):
    list_display = ('record', 'node_type', 'node_title', 'operator', 'previous_status', 'new_status', 'sequence', 'created_at')
    list_filter = ('node_type', 'created_at')
    search_fields = ('record__record_no', 'node_title', 'description', 'remarks')
    readonly_fields = ('created_at', 'sequence')


@admin.register(EvidenceAttachment)
class EvidenceAttachmentAdmin(admin.ModelAdmin):
    list_display = ('record', 'evidence_type', 'title', 'uploaded_by', 'uploaded_at', 'is_valid')
    list_filter = ('evidence_type', 'is_valid', 'uploaded_at')
    search_fields = ('record__record_no', 'title', 'description')
    readonly_fields = ('uploaded_at', 'file_name', 'file_size')


@admin.register(FieldChangeLog)
class FieldChangeLogAdmin(admin.ModelAdmin):
    list_display = ('record', 'field_label', 'old_value', 'new_value', 'changed_by', 'changed_at')
    list_filter = ('field_name', 'changed_at')
    search_fields = ('record__record_no', 'field_label', 'old_value', 'new_value')
    readonly_fields = ('changed_at',)


@admin.register(AnomalyBlockRecord)
class AnomalyBlockRecordAdmin(admin.ModelAdmin):
    list_display = ('record', 'block_code', 'block_reason', 'blocked_by', 'blocked_at', 'resolved', 'resolved_at')
    list_filter = ('block_code', 'resolved', 'blocked_at')
    search_fields = ('record__record_no', 'block_code', 'block_reason')
    readonly_fields = ('blocked_at',)
