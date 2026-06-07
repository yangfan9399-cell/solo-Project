from django.contrib import admin
from .models import (
    Exhibit, Borrower, LoanApplication, TransportRecord,
    InsurancePolicy, EnvironmentData, ReturnInspection,
    StatusHistory, UserProfile
)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department', 'phone')
    list_filter = ('role', 'department')
    search_fields = ('user__username', 'user__email')


class ExhibitAdmin(admin.ModelAdmin):
    list_display = ('name', 'accession_number', 'level', 'status', 'estimated_value')
    list_filter = ('level', 'status', 'category')
    search_fields = ('name', 'accession_number')
    readonly_fields = ('created_at', 'updated_at')


class BorrowerAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'contact_person', 'contact_phone', 'credit_rating')
    list_filter = ('type', 'credit_rating')
    search_fields = ('name', 'contact_person')


class TransportRecordInline(admin.TabularInline):
    model = TransportRecord
    extra = 0


class InsurancePolicyInline(admin.TabularInline):
    model = InsurancePolicy
    extra = 0


class EnvironmentDataInline(admin.TabularInline):
    model = EnvironmentData
    extra = 0


class StatusHistoryInline(admin.TabularInline):
    model = StatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'change_reason', 'changed_at')


class ReturnInspectionInline(admin.StackedInline):
    model = ReturnInspection
    extra = 0
    max_num = 1


class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ('loan_number', 'exhibit', 'borrower', 'status', 'planned_start_date', 'planned_end_date')
    list_filter = ('status', 'exhibit__level', 'borrower')
    search_fields = ('loan_number', 'exhibit__name', 'borrower__name')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [
        TransportRecordInline,
        InsurancePolicyInline,
        EnvironmentDataInline,
        ReturnInspectionInline,
        StatusHistoryInline,
    ]


class TransportRecordAdmin(admin.ModelAdmin):
    list_display = ('loan', 'route_from', 'route_to', 'transport_company', 'registered_by')
    list_filter = ('transport_company',)
    search_fields = ('loan__loan_number', 'route_from', 'route_to')


class InsurancePolicyAdmin(admin.ModelAdmin):
    list_display = ('policy_number', 'loan', 'insurance_company', 'amount', 'status')
    list_filter = ('status', 'insurance_company')
    search_fields = ('policy_number', 'loan__loan_number')


class EnvironmentDataAdmin(admin.ModelAdmin):
    list_display = ('loan', 'record_time', 'temperature', 'humidity', 'is_anomaly', 'anomaly_type')
    list_filter = ('is_anomaly', 'anomaly_type')
    search_fields = ('loan__loan_number',)


class ReturnInspectionAdmin(admin.ModelAdmin):
    list_display = ('loan', 'return_date', 'condition', 'conservator')
    list_filter = ('condition',)
    search_fields = ('loan__loan_number',)


class StatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('loan', 'from_status', 'to_status', 'changed_by', 'changed_at')
    list_filter = ('to_status',)
    search_fields = ('loan__loan_number',)
    readonly_fields = ('loan', 'from_status', 'to_status', 'changed_by', 'change_reason', 'changed_at')


admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Exhibit, ExhibitAdmin)
admin.site.register(Borrower, BorrowerAdmin)
admin.site.register(LoanApplication, LoanApplicationAdmin)
admin.site.register(TransportRecord, TransportRecordAdmin)
admin.site.register(InsurancePolicy, InsurancePolicyAdmin)
admin.site.register(EnvironmentData, EnvironmentDataAdmin)
admin.site.register(ReturnInspection, ReturnInspectionAdmin)
admin.site.register(StatusHistory, StatusHistoryAdmin)
