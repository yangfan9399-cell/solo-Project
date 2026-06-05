from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, LightPole, EnergyReading, WorkOrder, WorkOrderHistory, Evidence


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'full_name', 'role', 'phone', 'department', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'phone')
    fieldsets = UserAdmin.fieldsets + (
        ('额外信息', {'fields': ('role', 'phone', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('额外信息', {'fields': ('role', 'phone', 'department')}),
    )

    def full_name(self, obj):
        return obj.get_full_name() or obj.username
    full_name.short_description = '姓名'


@admin.register(LightPole)
class LightPoleAdmin(admin.ModelAdmin):
    list_display = ('pole_number', 'area', 'address', 'device_id', 'rated_power', 'is_active')
    list_filter = ('area', 'is_active')
    search_fields = ('pole_number', 'address', 'device_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(EnergyReading)
class EnergyReadingAdmin(admin.ModelAdmin):
    list_display = ('light_pole', 'reading_date', 'daily_energy', 'cumulative_energy', 'is_anomaly')
    list_filter = ('is_anomaly', 'reading_date', 'light_pole__area')
    search_fields = ('light_pole__pole_number',)
    date_hierarchy = 'reading_date'


class WorkOrderHistoryInline(admin.TabularInline):
    model = WorkOrderHistory
    extra = 0
    readonly_fields = ('action', 'operator', 'comment', 'old_status', 'new_status', 'created_at')


class EvidenceInline(admin.TabularInline):
    model = Evidence
    extra = 0
    readonly_fields = ('evidence_type', 'file', 'description', 'uploaded_by', 'created_at')


@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'title', 'light_pole', 'fault_type', 'status', 'inspector', 'reviewer', 'rework_count', 'created_at')
    list_filter = ('status', 'fault_type', 'fault_source', 'light_pole__area', 'created_at')
    search_fields = ('order_number', 'title', 'light_pole__pole_number')
    readonly_fields = ('created_at', 'updated_at', 'inspected_at', 'reviewed_at', 'archived_at')
    inlines = [WorkOrderHistoryInline, EvidenceInline]
    date_hierarchy = 'created_at'


@admin.register(WorkOrderHistory)
class WorkOrderHistoryAdmin(admin.ModelAdmin):
    list_display = ('work_order', 'action', 'operator', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('work_order__order_number', 'comment')
    date_hierarchy = 'created_at'


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ('work_order', 'evidence_type', 'description', 'uploaded_by', 'created_at')
    list_filter = ('evidence_type', 'created_at')
    search_fields = ('work_order__order_number', 'description')
    date_hierarchy = 'created_at'
