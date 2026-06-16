from django.contrib import admin
from .models import Player, Level, Round, Operation, OrderEvaluation


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'current_level', 'total_revenue', 'total_rounds', 'best_score', 'created_at']
    search_fields = ['name']


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['level_number', 'title', 'difficulty', 'time_limit', 'ink_budget', 'pass_score', 'base_reward']
    list_filter = ['difficulty']
    ordering = ['level_number']


@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ['id', 'player', 'level', 'status', 'ink_used', 'proofread_count', 'elapsed_seconds', 'started_at']
    list_filter = ['status']
    raw_id_fields = ['player', 'level']


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ['id', 'round', 'op_type', 'position', 'char_value', 'seq', 'created_at']
    list_filter = ['op_type']
    raw_id_fields = ['round']


@admin.register(OrderEvaluation)
class OrderEvaluationAdmin(admin.ModelAdmin):
    list_display = ['id', 'round', 'final_score', 'revenue', 'passed', 'server_calculated', 'calculated_at']
    list_filter = ['passed', 'server_calculated']
    raw_id_fields = ['round']
