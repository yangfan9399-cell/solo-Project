from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Department, User, Travel, Booking, Reimbursement, HistoryNode


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_at']
    search_fields = ['name', 'code']
    ordering = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'department', 'is_staff']
    list_filter = ['role', 'department', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['username']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('其他信息', {'fields': ('role', 'department', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('其他信息', {'fields': ('role', 'department', 'phone')}),
    )


@admin.register(Travel)
class TravelAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'destination_city', 'estimated_budget', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'destination_city', 'department']
    search_fields = ['applicant__username', 'purpose', 'destination_city']
    ordering = ['-created_at']
    raw_id_fields = ['applicant', 'department']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['travel', 'actual_cost', 'over_budget_reason', 'booking_status']
    list_filter = ['booking_status', 'over_budget_reason']
    search_fields = ['travel__applicant__username', 'travel__destination_city']
    raw_id_fields = ['travel']


@admin.register(Reimbursement)
class ReimbursementAdmin(admin.ModelAdmin):
    list_display = ['travel', 'total_actual_cost', 'receipt_status', 'review_status']
    list_filter = ['receipt_status', 'review_status']
    search_fields = ['travel__applicant__username', 'travel__destination_city']
    raw_id_fields = ['travel']


@admin.register(HistoryNode)
class HistoryNodeAdmin(admin.ModelAdmin):
    list_display = ['travel', 'action_type', 'actor', 'created_at']
    list_filter = ['action_type']
    search_fields = ['travel__applicant__username', 'comment']
    ordering = ['-created_at']
    raw_id_fields = ['travel', 'actor']
