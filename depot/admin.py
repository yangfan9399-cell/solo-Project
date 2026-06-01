from django.contrib import admin
from .models import (
    Station, Staff, Package, PickupReminder,
    RetentionAlert, AbnormalPackage, Complaint,
    Responsibility, ReturnRecord,
)


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "district", "phone", "is_active"]
    list_filter = ["district", "is_active"]
    search_fields = ["code", "name", "address"]


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "station", "phone", "is_active"]
    list_filter = ["role", "is_active", "station"]
    search_fields = ["name", "phone"]


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ["tracking_number", "receiver_name", "station", "status", "carrier", "checked_in_at"]
    list_filter = ["status", "carrier", "station"]
    search_fields = ["tracking_number", "receiver_name", "receiver_phone"]
    date_hierarchy = "checked_in_at"


@admin.register(PickupReminder)
class PickupReminderAdmin(admin.ModelAdmin):
    list_display = ["package", "reminder_type", "status", "response", "sent_at"]
    list_filter = ["reminder_type", "status", "response"]


@admin.register(RetentionAlert)
class RetentionAlertAdmin(admin.ModelAdmin):
    list_display = ["package", "alert_level", "days_retained", "is_resolved", "triggered_at"]
    list_filter = ["alert_level", "is_resolved"]


@admin.register(AbnormalPackage)
class AbnormalPackageAdmin(admin.ModelAdmin):
    list_display = ["package", "abnormal_type", "status", "registered_at"]
    list_filter = ["abnormal_type", "status"]


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ["complaint_number", "complainant_name", "complaint_type", "station", "status", "created_at"]
    list_filter = ["complaint_type", "status", "station"]
    search_fields = ["complaint_number", "complainant_name"]


@admin.register(Responsibility)
class ResponsibilityAdmin(admin.ModelAdmin):
    list_display = ["complaint", "responsible_staff", "responsibility_type", "penalty_type", "status"]
    list_filter = ["responsibility_type", "penalty_type", "status"]


@admin.register(ReturnRecord)
class ReturnRecordAdmin(admin.ModelAdmin):
    list_display = ["package", "return_reason", "returned_to", "returned_at"]
    list_filter = ["return_reason"]
