from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import (
    District, Vehicle, Route, Station, RouteAssignment,
    CheckIn, VehicleFault, Complaint, ReviewRecord, RouteEvent
)


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'vehicle_count', 'route_count', 'created_at')
    search_fields = ('name', 'code')
    ordering = ('code',)

    def vehicle_count(self, obj):
        return obj.vehicles.count()
    vehicle_count.short_description = '车辆数'

    def route_count(self, obj):
        return obj.routes.count()
    route_count.short_description = '路线数'


class StationInline(admin.TabularInline):
    model = Station
    extra = 1
    fields = ('name', 'address', 'order', 'bin_count')
    ordering = ('order',)


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'district', 'station_count', 'estimated_duration', 'is_active')
    list_filter = ('district', 'is_active')
    search_fields = ('code', 'name')
    ordering = ('code',)
    inlines = [StationInline]

    def station_count(self, obj):
        return obj.station_count
    station_count.short_description = '站点数'


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('name', 'route', 'order', 'address', 'bin_count')
    list_filter = ('route__district', 'route')
    search_fields = ('name', 'address')
    ordering = ('route', 'order')


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('plate_number', 'vehicle_type', 'capacity', 'status', 'district', 'driver_name')
    list_filter = ('status', 'district', 'vehicle_type')
    search_fields = ('plate_number', 'vehicle_type')
    ordering = ('plate_number',)

    def driver_name(self, obj):
        if obj.driver:
            return obj.driver.profile.real_name or obj.driver.username
        return '-'
    driver_name.short_description = '固定司机'


class CheckInInline(admin.TabularInline):
    model = CheckIn
    extra = 0
    fields = ('station', 'check_in_time', 'status', 'waste_weight')
    readonly_fields = ('check_in_time',)
    ordering = ('check_in_time',)

    def has_add_permission(self, request, obj=None):
        return False


class RouteEventInline(admin.TabularInline):
    model = RouteEvent
    extra = 0
    fields = ('event_type', 'description', 'created_by', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(RouteAssignment)
class RouteAssignmentAdmin(admin.ModelAdmin):
    list_display = ('route', 'vehicle', 'driver_name', 'dispatcher_name',
                    'assigned_date', 'status', 'progress')
    list_filter = ('status', 'assigned_date', 'route__district')
    search_fields = ('route__code', 'vehicle__plate_number')
    date_hierarchy = 'assigned_date'
    ordering = ('-assigned_date', '-created_at')
    inlines = [CheckInInline, RouteEventInline]

    def driver_name(self, obj):
        return obj.driver.profile.real_name or obj.driver.username
    driver_name.short_description = '司机'

    def dispatcher_name(self, obj):
        return obj.dispatcher.profile.real_name or obj.dispatcher.username
    dispatcher_name.short_description = '调度员'

    def progress(self, obj):
        total = obj.total_stations()
        checked = obj.checked_in_stations()
        if total == 0:
            return '0%'
        percent = int(checked / total * 100)
        color = 'green' if percent == 100 else 'orange' if percent > 50 else 'red'
        return format_html(
            '<span style="color: {};">{} / {} ({}%)</span>',
            color, checked, total, percent
        )
    progress.short_description = '进度'


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ('station', 'assignment', 'driver_name', 'check_in_time', 'status', 'waste_weight')
    list_filter = ('status', 'check_in_time', 'assignment__route__district')
    search_fields = ('station__name', 'assignment__route__code')
    date_hierarchy = 'check_in_time'
    ordering = ('-check_in_time',)

    def driver_name(self, obj):
        return obj.driver.profile.real_name or obj.driver.username
    driver_name.short_description = '司机'


@admin.register(VehicleFault)
class VehicleFaultAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'fault_type', 'severity', 'status', 'reporter_name', 'reported_at')
    list_filter = ('status', 'severity', 'fault_type')
    search_fields = ('vehicle__plate_number', 'fault_type', 'description')
    date_hierarchy = 'reported_at'
    ordering = ('-reported_at',)

    def reporter_name(self, obj):
        return obj.reporter.profile.real_name or obj.reporter.username
    reporter_name.short_description = '上报人'


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('complaint_type', 'station', 'complainant', 'status',
                    'inspector_name', 'reported_at')
    list_filter = ('complaint_type', 'status', 'station__route__district')
    search_fields = ('complainant', 'description', 'station__name')
    date_hierarchy = 'reported_at'
    ordering = ('-reported_at',)
    readonly_fields = ('reported_at',)

    def inspector_name(self, obj):
        if obj.inspector:
            return obj.inspector.profile.real_name or obj.inspector.username
        return '-'
    inspector_name.short_description = '处理巡检员'

    def has_photo(self, obj):
        return bool(obj.photo_evidence)
    has_photo.boolean = True
    has_photo.short_description = '有照片'


@admin.register(ReviewRecord)
class ReviewRecordAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'reviewer_name', 'review_result',
                    'reviewed_at', 'rectification_deadline')
    list_filter = ('review_result', 'reviewed_at')
    search_fields = ('assignment__route__code', 'review_notes')
    date_hierarchy = 'reviewed_at'
    ordering = ('-reviewed_at',)

    def reviewer_name(self, obj):
        return obj.reviewer.profile.real_name or obj.reviewer.username
    reviewer_name.short_description = '复核主管'


@admin.register(RouteEvent)
class RouteEventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'assignment', 'created_by_name', 'created_at')
    list_filter = ('event_type', 'created_at', 'assignment__route__district')
    search_fields = ('description', 'assignment__route__code')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    def created_by_name(self, obj):
        return obj.created_by.profile.real_name or obj.created_by.username
    created_by_name.short_description = '操作人'
