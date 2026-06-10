from django.contrib import admin
from .models import Statistics


@admin.register(Statistics)
class StatisticsAdmin(admin.ModelAdmin):
    list_display = ('statistic_type', 'dimension', 'value', 'count', 'updated_at')
    list_filter = ('statistic_type', 'dimension')
    search_fields = ('value',)