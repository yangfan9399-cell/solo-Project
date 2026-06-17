from django.contrib import admin
from .models import CrystallizationPool, InspectionRecord, RecordVersion, AnomalyAlert


@admin.register(CrystallizationPool)
class CrystallizationPoolAdmin(admin.ModelAdmin):
    list_display = ('pool_code', 'pool_name', 'pool_group', 'area', 'status', 'position_x', 'position_y')
    list_filter = ('pool_group', 'status')
    search_fields = ('pool_code', 'pool_name')


@admin.register(InspectionRecord)
class InspectionRecordAdmin(admin.ModelAdmin):
    list_display = ('pool', 'inspection_date', 'inspection_time', 'brine_concentration',
                    'surface_status', 'salt_yield', 'has_anomaly', 'version', 'batch_no')
    list_filter = ('pool__pool_group', 'surface_status', 'weather_type', 'has_anomaly', 'inspection_date')
    search_fields = ('pool__pool_code', 'batch_no', 'inspector')
    date_hierarchy = 'inspection_date'


@admin.register(RecordVersion)
class RecordVersionAdmin(admin.ModelAdmin):
    list_display = ('record', 'version_no', 'action', 'changed_by', 'changed_at')
    list_filter = ('action',)
    search_fields = ('record__id', 'change_summary')


@admin.register(AnomalyAlert)
class AnomalyAlertAdmin(admin.ModelAdmin):
    list_display = ('pool', 'anomaly_type', 'severity', 'title', 'status', 'detected_at')
    list_filter = ('anomaly_type', 'severity', 'status')
    search_fields = ('title', 'description')
