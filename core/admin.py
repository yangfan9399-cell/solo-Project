from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Elder


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('个人信息'), {'fields': ('first_name', 'last_name', 'email', 'phone')}),
        (_('权限'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('重要日期'), {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('username', 'email', 'role', 'phone', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'phone')


@admin.register(Elder)
class ElderAdmin(admin.ModelAdmin):
    list_display = ('name', 'gender', 'age', 'floor', 'room_number', 'bed_number', 
                    'current_nursing_level', 'current_monthly_fee', 'admission_date')
    list_filter = ('gender', 'floor', 'current_nursing_level')
    search_fields = ('name', 'id_number', 'room_number', 'bed_number')
    filter_horizontal = ('family_members',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'gender', 'birth_date', 'id_number')
        }),
        ('居住信息', {
            'fields': ('floor', 'room_number', 'bed_number', 'admission_date')
        }),
        ('健康信息', {
            'fields': ('medical_history', 'allergies')
        }),
        ('联系信息', {
            'fields': ('emergency_contact', 'emergency_phone', 'family_members')
        }),
        ('护理信息', {
            'fields': ('current_nursing_level', 'current_monthly_fee')
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at')
        }),
    )