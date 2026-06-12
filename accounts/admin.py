from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'get_full_name', 'role', 'department', 'employee_id', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'department')
    search_fields = ('username', 'first_name', 'last_name', 'employee_id', 'phone', 'email')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('个人信息', {'fields': ('first_name', 'last_name', 'email', 'phone', 'employee_id', 'department')}),
        ('角色权限', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('重要日期', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role', 'first_name', 'last_name', 'employee_id', 'department'),
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        is_superuser = request.user.is_superuser
        if not is_superuser and obj:
            if 'role' in form.base_fields:
                if request.user.is_reviewer and obj.role == User.Role.ADMIN:
                    form.base_fields['role'].disabled = True
        return form
