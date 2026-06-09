from django.contrib import admin
from .models import (
    User,
    BillboardLocation,
    ConstructionPlan,
    Worker,
    Qualification,
    WeatherRecord,
    AuditNode,
    DelayRecord,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'role', 'real_name', 'is_active']
    list_filter = ['role']
    search_fields = ['username', 'real_name']


@admin.register(BillboardLocation)
class BillboardLocationAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'city', 'location_type', 'height', 'is_active']
    list_filter = ['city', 'location_type', 'is_active']
    search_fields = ['code', 'name', 'address']


@admin.register(ConstructionPlan)
class ConstructionPlanAdmin(admin.ModelAdmin):
    list_display = ['plan_no', 'title', 'location', 'status', 'planned_start_date', 'rework_count']
    list_filter = ['status', 'rework_count']
    search_fields = ['plan_no', 'title']
    date_hierarchy = 'planned_start_date'


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ['name', 'id_card', 'phone', 'is_active']
    search_fields = ['name', 'id_card', 'phone']


@admin.register(Qualification)
class QualificationAdmin(admin.ModelAdmin):
    list_display = ['worker', 'cert_type', 'cert_no', 'issue_date', 'expiry_date', 'is_valid']
    list_filter = ['cert_type', 'is_valid']
    search_fields = ['worker__name', 'cert_no']


@admin.register(WeatherRecord)
class WeatherRecordAdmin(admin.ModelAdmin):
    list_display = ['location', 'record_date', 'weather', 'wind_level', 'wind_speed', 'has_wind_warning']
    list_filter = ['weather', 'has_wind_warning']
    search_fields = ['location__name']
    date_hierarchy = 'record_date'


@admin.register(AuditNode)
class AuditNodeAdmin(admin.ModelAdmin):
    list_display = ['plan', 'node_type', 'operator', 'status', 'created_at']
    list_filter = ['node_type', 'status']
    search_fields = ['plan__plan_no', 'plan__title']


@admin.register(DelayRecord)
class DelayRecordAdmin(admin.ModelAdmin):
    list_display = ['plan', 'delay_type', 'delay_days', 'approved', 'created_at']
    list_filter = ['delay_type', 'approved']
    search_fields = ['plan__plan_no']
