from django.contrib import admin
from .models import (
    MaintenanceCompany,
    Elevator,
    UserProfile,
    MaintenancePlan,
    Part,
    FaultTicket,
    TicketPart,
    ActionLog,
    MaintenanceRecord,
)


class TicketPartInline(admin.TabularInline):
    model = TicketPart
    extra = 1


class ActionLogInline(admin.TabularInline):
    model = ActionLog
    extra = 0
    readonly_fields = ('action_type', 'description', 'performed_by', 'performed_at')
    can_delete = False


@admin.register(MaintenanceCompany)
class MaintenanceCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'contact_phone', 'created_at')
    search_fields = ('name', 'contact_person')


@admin.register(Elevator)
class ElevatorAdmin(admin.ModelAdmin):
    list_display = ('elevator_number', 'building', 'floor', 'status', 'maintenance_company')
    list_filter = ('status', 'maintenance_company')
    search_fields = ('elevator_number', 'building')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone', 'company')
    list_filter = ('role', 'company')
    search_fields = ('user__username', 'user__first_name', 'user__last_name')


@admin.register(MaintenancePlan)
class MaintenancePlanAdmin(admin.ModelAdmin):
    list_display = ('elevator', 'plan_type', 'plan_date', 'status', 'assigned_to')
    list_filter = ('plan_type', 'status', 'plan_date')
    search_fields = ('elevator__elevator_number',)
    inlines = [ActionLogInline]


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ('name', 'part_number', 'quantity', 'status', 'unit')
    list_filter = ('status',)
    search_fields = ('name', 'part_number')


@admin.register(FaultTicket)
class FaultTicketAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'elevator', 'fault_source', 'status', 'priority',
        'current_responsible', 'report_time'
    )
    list_filter = ('status', 'priority', 'fault_source', 'is_repeat_fault')
    search_fields = ('elevator__elevator_number', 'fault_description')
    readonly_fields = ('created_at',)
    inlines = [TicketPartInline, ActionLogInline]


@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    list_display = ('action_type', 'ticket', 'plan', 'performed_by', 'performed_at')
    list_filter = ('action_type', 'performed_at')
    search_fields = ('description',)


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ('elevator', 'plan', 'maintenance_staff', 'record_time')
    list_filter = ('record_time',)
    search_fields = ('elevator__elevator_number',)
