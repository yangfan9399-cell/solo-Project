from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import UserProfile, Role


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = '用户档案'
    fields = ('role', 'real_name', 'phone')


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'get_role', 'get_real_name', 'is_staff')
    list_filter = ('profile__role', 'is_staff')

    def get_role(self, obj):
        return obj.profile.get_role_display()
    get_role.short_description = '角色'

    def get_real_name(self, obj):
        return obj.profile.real_name
    get_real_name.short_description = '真实姓名'


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'real_name', 'phone', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'real_name', 'phone')
    ordering = ('-created_at',)
