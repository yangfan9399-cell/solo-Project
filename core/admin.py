from django.contrib import admin
from .models import (
    CoreSample, Cutter, CuttingPurpose, CuttingTask,
    BatchVersion, AnomalyRecord
)


@admin.register(CoreSample)
class CoreSampleAdmin(admin.ModelAdmin):
    list_display = ['sample_no', 'well_name', 'total_length', 'remaining_length',
                    'priority', 'status', 'has_anomaly', 'created_at']
    list_filter = ['priority', 'status', 'lithology', 'formation']
    search_fields = ['sample_no', 'well_name', 'description']
    readonly_fields = ['usage_rate']
    fieldsets = [
        ('基本信息', {'fields': ['sample_no', 'well_name', 'lithology', 'formation']}),
        ('深度与长度', {'fields': [('depth_start', 'depth_end'), ('total_length', 'remaining_length')]}),
        ('管理信息', {'fields': ['priority', 'status', 'storage_location', 'collected_date']}),
        ('其他', {'fields': ['description', 'usage_rate']}),
    ]


@admin.register(Cutter)
class CutterAdmin(admin.ModelAdmin):
    list_display = ['cutter_no', 'name', 'cutter_type', 'status',
                    'daily_capacity', 'blade_loss_rate']
    list_filter = ['status', 'cutter_type']
    search_fields = ['cutter_no', 'name']
    fieldsets = [
        ('基本信息', {'fields': ['cutter_no', 'name', 'cutter_type', 'status']}),
        ('性能参数', {'fields': [('min_cut_length', 'max_cut_length'),
                               'daily_capacity', 'blade_loss_rate']}),
        ('工作时段', {'fields': [('work_start_time', 'work_end_time')]}),
        ('维护', {'fields': [('last_maintenance', 'next_maintenance')]}),
        ('其他', {'fields': ['location', 'description']}),
    ]


@admin.register(CuttingPurpose)
class CuttingPurposeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'standard_loss_rate', 'typical_length', 'is_active']
    list_filter = ['is_active', 'requires_quality_check']
    search_fields = ['code', 'name']


@admin.register(CuttingTask)
class CuttingTaskAdmin(admin.ModelAdmin):
    list_display = ['task_no', 'core_sample', 'cutter', 'purpose',
                    'planned_cut_length', 'status', 'scheduled_date']
    list_filter = ['status', 'scheduled_date', 'quality_checked']
    search_fields = ['task_no', 'core_sample__sample_no', 'remarks']
    date_hierarchy = 'scheduled_date'
    fieldsets = [
        ('基本信息', {'fields': ['task_no', 'core_sample', 'cutter', 'purpose', 'status']}),
        ('切割参数', {'fields': [('planned_cut_length', 'actual_cut_length'),
                               'loss_length', ('slice_count', 'slice_thickness')]}),
        ('排程时间', {'fields': ['scheduled_date', ('scheduled_start_time', 'scheduled_end_time')]}),
        ('执行信息', {'fields': [('actual_start_time', 'actual_end_time'),
                               'operator', 'quality_checked', 'quality_result']}),
        ('其他', {'fields': ['batch_version', 'remarks']}),
    ]


@admin.register(BatchVersion)
class BatchVersionAdmin(admin.ModelAdmin):
    list_display = ['version_no', 'batch_no', 'batch_type', 'is_current', 'created_at']
    list_filter = ['batch_type', 'is_current']
    search_fields = ['version_no', 'batch_no']
    readonly_fields = ['snapshot_data']


@admin.register(AnomalyRecord)
class AnomalyRecordAdmin(admin.ModelAdmin):
    list_display = ['anomaly_type', 'severity', 'core_sample', 'cutting_task',
                    'resolved', 'detected_at']
    list_filter = ['anomaly_type', 'severity', 'resolved']
    search_fields = ['description', 'resolution']
    readonly_fields = ['detected_at']
