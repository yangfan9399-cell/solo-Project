from django.contrib import admin
from .models import PlayerProfile, Level, GameSession, GameAction, GameResult


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'nickname', 'user', 'total_score', 'play_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['nickname', 'user__username']
    readonly_fields = ['created_at']


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'difficulty', 'best_steps', 'created_at']
    list_filter = ['difficulty', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at']


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'player', 'level', 'status', 'current_steps', 'start_time', 'end_time']
    list_filter = ['status', 'start_time', 'end_time', 'level__difficulty']
    search_fields = ['player__nickname', 'level__name']
    readonly_fields = ['start_time']
    raw_id_fields = ['player', 'level']


@admin.register(GameAction)
class GameActionAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'action_number', 'action_type', 'direction', 'is_valid', 'timestamp']
    list_filter = ['action_type', 'direction', 'is_valid', 'timestamp']
    search_fields = ['session__id', 'session__player__nickname']
    readonly_fields = ['timestamp']
    raw_id_fields = ['session']


@admin.register(GameResult)
class GameResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'is_passed', 'final_score', 'server_score', 'steps_used', 'collapse_count', 'undo_count']
    list_filter = ['is_passed']
    search_fields = ['session__id', 'session__player__nickname']
    raw_id_fields = ['session']
