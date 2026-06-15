from django.contrib import admin
from .models import (
    RescueSession, RescueNode, RescueDetail, RescueHistory,
    RescueResult, SeedSample
)


class RescueNodeInline(admin.TabularInline):
    model = RescueNode
    extra = 0
    fields = ('node_type', 'node_id', 'x', 'y', 'terrain_type', 'load_capacity', 'actual_load', 'is_valid')


class RescueDetailInline(admin.TabularInline):
    model = RescueDetail
    extra = 0
    fields = ('detail_type', 'detail_id', 'x', 'y', 'is_valid')


class RescueHistoryInline(admin.TabularInline):
    model = RescueHistory
    extra = 0
    fields = ('step', 'action', 'action_type', 'weather', 'rope_tension', 'is_safe')


class RescueResultInline(admin.StackedInline):
    model = RescueResult
    extra = 0


@admin.register(RescueSession)
class RescueSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'status', 'terrain_type', 'weather', 'total_score', 'safety_score', 'created_at')
    list_filter = ('status', 'terrain_type', 'weather', 'seed_type')
    search_fields = ('session_id', 'player_name')
    inlines = [RescueNodeInline, RescueDetailInline, RescueHistoryInline, RescueResultInline]


@admin.register(SeedSample)
class SeedSampleAdmin(admin.ModelAdmin):
    list_display = ('name', 'seed_type', 'terrain_type', 'weather', 'difficulty', 'is_active')
    list_filter = ('terrain_type', 'weather', 'is_active')
    search_fields = ('name', 'seed_type', 'description')
