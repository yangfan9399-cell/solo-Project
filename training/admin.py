from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Department, EmployeeProfile, Course, TrainingSchedule,
    Enrollment, Attendance, Exam, Certificate, CertificateHistory
)


class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'get_full_name', 'role', 'email', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('扩展信息', {'fields': ('role', 'phone', 'first_name', 'last_name', 'email')}),
    )
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    get_full_name.short_description = '姓名'


class EmployeeProfileInline(admin.StackedInline):
    model = EmployeeProfile
    can_delete = False
    verbose_name_plural = '员工档案'


class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'user', 'department', 'position', 'hire_date')
    list_filter = ('department',)
    search_fields = ('employee_id', 'user__username', 'user__first_name', 'user__last_name')


class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'employee_count', 'created_at')
    search_fields = ('name',)

    def employee_count(self, obj):
        return obj.employees.count()
    employee_count.short_description = '员工数'


class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_hours', 'pass_score', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


class TrainingScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'instructor', 'start_date', 'end_date', 'location', 'max_students', 'enrolled_count_display', 'is_active')
    list_filter = ('is_active', 'course', 'instructor')
    search_fields = ('course__name', 'instructor__username', 'location')
    date_hierarchy = 'start_date'

    def enrolled_count_display(self, obj):
        return f'{obj.enrolled_count()}/{obj.max_students}'
    enrolled_count_display.short_description = '已报名/最大人数'


class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'schedule', 'status', 'applied_at', 'approved_at', 'approved_by')
    list_filter = ('status', 'schedule__course')
    search_fields = ('employee__username', 'employee__first_name', 'employee__last_name', 'schedule__course__name')
    date_hierarchy = 'applied_at'


class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'check_date', 'status', 'check_in_time', 'checked_by')
    list_filter = ('status', 'check_date')
    search_fields = ('enrollment__employee__username', 'enrollment__employee__first_name', 'enrollment__employee__last_name')
    date_hierarchy = 'check_date'


class ExamAdmin(admin.ModelAdmin):
    list_display = ('enrollment', 'score', 'status', 'failure_reason', 'exam_date', 'confirmed_by')
    list_filter = ('status', 'failure_reason')
    search_fields = ('enrollment__employee__username', 'enrollment__employee__first_name', 'enrollment__employee__last_name')
    date_hierarchy = 'exam_date'


class CertificateHistoryInline(admin.TabularInline):
    model = CertificateHistory
    extra = 0
    readonly_fields = ('action', 'operator', 'remark', 'created_at')
    can_delete = False


class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_no', 'employee_name', 'course_name', 'status', 'issued_date', 'issued_by')
    list_filter = ('status',)
    search_fields = ('certificate_no', 'enrollment__employee__username', 'enrollment__employee__first_name', 'enrollment__schedule__course__name')
    readonly_fields = ('certificate_no',)
    date_hierarchy = 'issued_date'
    inlines = [CertificateHistoryInline]

    def employee_name(self, obj):
        return obj.enrollment.employee.get_full_name() or obj.enrollment.employee.username
    employee_name.short_description = '员工'

    def course_name(self, obj):
        return obj.enrollment.schedule.course.name
    course_name.short_description = '课程'


class CertificateHistoryAdmin(admin.ModelAdmin):
    list_display = ('certificate', 'action', 'operator', 'created_at')
    list_filter = ('action',)
    search_fields = ('certificate__certificate_no',)
    date_hierarchy = 'created_at'


admin.site.register(User, UserAdmin)
admin.site.register(Department, DepartmentAdmin)
admin.site.register(EmployeeProfile, EmployeeProfileAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(TrainingSchedule, TrainingScheduleAdmin)
admin.site.register(Enrollment, EnrollmentAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(Exam, ExamAdmin)
admin.site.register(Certificate, CertificateAdmin)
admin.site.register(CertificateHistory, CertificateHistoryAdmin)

admin.site.site_header = '企业培训管理系统'
admin.site.site_title = '培训管理系统'
admin.site.index_title = '欢迎使用企业培训管理系统'
