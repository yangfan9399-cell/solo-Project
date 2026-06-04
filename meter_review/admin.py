from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, District, Customer, AnomalyType, MeterReading, FieldNote, FeeAdjustment, HistoryLog


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone')}),
    )


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'manager')
    search_fields = ('code', 'name')
    list_filter = ('manager',)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('customer_no', 'name', 'meter_no', 'district', 'phone', 'is_active')
    search_fields = ('customer_no', 'name', 'meter_no', 'phone')
    list_filter = ('district', 'is_active')


@admin.register(AnomalyType)
class AnomalyTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'block_adjustment', 'sort_order')
    list_filter = ('block_adjustment',)
    search_fields = ('code', 'name')


class FieldNoteInline(admin.TabularInline):
    model = FieldNote
    extra = 0
    readonly_fields = ('created_at',)


class FeeAdjustmentInline(admin.TabularInline):
    model = FeeAdjustment
    extra = 0
    readonly_fields = ('created_at',)


class HistoryLogInline(admin.TabularInline):
    model = HistoryLog
    extra = 0
    readonly_fields = ('created_at', 'operator', 'old_status', 'new_status', 'old_owner', 'new_owner', 'remark')


@admin.register(MeterReading)
class MeterReadingAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'reading_date', 'last_reading', 'current_reading', 'usage', 'original_fee', 'anomaly_type', 'status', 'current_owner', 'rework_count')
    list_filter = ('status', 'anomaly_type', 'customer__district', 'reading_date')
    search_fields = ('customer__customer_no', 'customer__name', 'customer__meter_no')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [FieldNoteInline, FeeAdjustmentInline, HistoryLogInline]
    fieldsets = (
        ('基本信息', {'fields': ('customer', 'reading_date')}),
        ('读数信息', {'fields': ('last_reading', 'current_reading', 'adjusted_reading', 'usage', 'adjusted_usage')}),
        ('费用信息', {'fields': ('original_fee', 'adjusted_fee')}),
        ('异常信息', {'fields': ('anomaly_type', 'anomaly_detail', 'adjustment_basis')}),
        ('状态信息', {'fields': ('status', 'current_owner', 'assigned_reader', 'rework_count')}),
        ('系统信息', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(FieldNote)
class FieldNoteAdmin(admin.ModelAdmin):
    list_display = ('reading', 'reader', 'created_at')
    list_filter = ('reader', 'created_at')
    search_fields = ('reading__customer__customer_no', 'reading__customer__name', 'note')
    readonly_fields = ('created_at',)


@admin.register(FeeAdjustment)
class FeeAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('reading', 'reviewer', 'action', 'old_fee', 'new_fee', 'created_at')
    list_filter = ('action', 'reviewer', 'created_at')
    search_fields = ('reading__customer__customer_no', 'reading__customer__name', 'adjustment_reason')
    readonly_fields = ('created_at',)


@admin.register(HistoryLog)
class HistoryLogAdmin(admin.ModelAdmin):
    list_display = ('reading', 'operator', 'old_status', 'new_status', 'created_at')
    list_filter = ('new_status', 'operator', 'created_at')
    search_fields = ('reading__customer__customer_no', 'reading__customer__name', 'remark')
    readonly_fields = ('created_at',)
