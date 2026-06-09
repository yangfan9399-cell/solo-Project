from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, College, ResearchProject, BudgetSubject,
    ProjectBudget, Supplier, Procurement, Acceptance,
    Invoice, HistoryNode
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'college', 'is_staff')
    list_filter = ('role', 'college')
    fieldsets = UserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'college')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'college')}),
    )


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'dean')
    search_fields = ('name', 'code')


@admin.register(ResearchProject)
class ResearchProjectAdmin(admin.ModelAdmin):
    list_display = ('project_no', 'name', 'college', 'principal', 'total_budget', 'start_date', 'end_date')
    list_filter = ('college',)
    search_fields = ('name', 'project_no')
    date_hierarchy = 'start_date'


@admin.register(BudgetSubject)
class BudgetSubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'parent')
    search_fields = ('name', 'code')
    list_filter = ('parent',)


@admin.register(ProjectBudget)
class ProjectBudgetAdmin(admin.ModelAdmin):
    list_display = ('project', 'subject', 'planned_amount', 'frozen_amount', 'used_amount', 'available_amount')
    list_filter = ('project__college', 'subject')
    search_fields = ('project__name', 'subject__name')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'tax_no', 'contact_person', 'phone')
    search_fields = ('name', 'tax_no')


@admin.register(Procurement)
class ProcurementAdmin(admin.ModelAdmin):
    list_display = ('procurement_no', 'title', 'project', 'amount', 'status', 'exception_reason', 'applicant', 'created_at')
    list_filter = ('status', 'exception_reason', 'project__college')
    search_fields = ('title', 'procurement_no')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Acceptance)
class AcceptanceAdmin(admin.ModelAdmin):
    list_display = ('procurement', 'asset_staff', 'acceptance_date', 'passed')
    list_filter = ('passed',)
    search_fields = ('procurement__title',)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_no', 'procurement', 'title', 'amount', 'verified', 'created_at')
    list_filter = ('verified',)
    search_fields = ('invoice_no', 'title')


@admin.register(HistoryNode)
class HistoryNodeAdmin(admin.ModelAdmin):
    list_display = ('procurement', 'status', 'operator', 'action', 'created_at')
    list_filter = ('status',)
    search_fields = ('procurement__title', 'action')
    date_hierarchy = 'created_at'
