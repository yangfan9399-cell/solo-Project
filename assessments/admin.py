from django.contrib import admin
from .models import (
    NursingLevel, AssessmentDimension, AssessmentItem,
    Assessment, AssessmentScore, AssessmentHistory
)


@admin.register(NursingLevel)
class NursingLevelAdmin(admin.ModelAdmin):
    list_display = ('level', 'name', 'monthly_fee', 'is_active')
    list_filter = ('is_active',)
    ordering = ('level',)
    search_fields = ('name',)


class AssessmentItemInline(admin.TabularInline):
    model = AssessmentItem
    extra = 0
    fields = ('name', 'max_score', 'is_required', 'is_active', 'order')


@admin.register(AssessmentDimension)
class AssessmentDimensionAdmin(admin.ModelAdmin):
    list_display = ('name', 'max_score', 'weight', 'order', 'is_active')
    list_filter = ('is_active',)
    ordering = ('order', 'id')
    inlines = [AssessmentItemInline]


class AssessmentScoreInline(admin.TabularInline):
    model = AssessmentScore
    extra = 0
    fields = ('item', 'score', 'notes')
    readonly_fields = ('item',)


class AssessmentHistoryInline(admin.TabularInline):
    model = AssessmentHistory
    extra = 0
    fields = ('action', 'user', 'from_status', 'to_status', 'notes', 'created_at')
    readonly_fields = ('action', 'user', 'from_status', 'to_status', 'notes', 'created_at')


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('elder', 'assessment_date', 'nursing_level', 'status', 
                    'previous_nursing_level', 'get_level_change', 'created_at')
    list_filter = ('status', 'nursing_level', 'assessment_date')
    search_fields = ('elder__name', 'elder__id_number')
    readonly_fields = ('created_at', 'updated_at', 'doctor_confirmed_at', 
                       'family_confirmed_at', 'director_confirmed_at', 'effective_at')
    inlines = [AssessmentScoreInline, AssessmentHistoryInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('elder', 'nurse', 'assessment_date', 'assessment_reason', 'nurse_notes')
        }),
        ('护理等级', {
            'fields': ('nursing_level', 'previous_nursing_level', 'previous_monthly_fee', 'new_monthly_fee')
        }),
        ('状态', {
            'fields': ('status',)
        }),
        ('医生确认', {
            'fields': ('doctor', 'doctor_confirmed_at', 'doctor_notes')
        }),
        ('家属确认', {
            'fields': ('family_member', 'family_confirmed_at', 'family_agreed', 'family_notes', 'objection_reason')
        }),
        ('院长复核', {
            'fields': ('director', 'director_confirmed_at', 'director_approved', 'director_notes', 'effective_at')
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def get_level_change(self, obj):
        change_type = obj.get_level_change_type()
        if change_type == 'unchanged':
            return '等级不变'
        elif change_type == 'upgraded':
            return '护理升级'
        elif change_type == 'downgraded':
            return '护理降级'
        return '-'
    get_level_change.short_description = '等级变化'


@admin.register(AssessmentScore)
class AssessmentScoreAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'item', 'score', 'created_at')
    list_filter = ('item__dimension',)
    search_fields = ('assessment__elder__name',)


@admin.register(AssessmentHistory)
class AssessmentHistoryAdmin(admin.ModelAdmin):
    list_display = ('assessment', 'action', 'user', 'from_status', 'to_status', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('assessment__elder__name',)