from django.contrib import admin
from .models import (
    PlayerProfile, Level, TrapType, Trap, CraftsmanTask,
    GameSession, Enemy, ActionHistory, BattleReport,
    ReplayFrame, ScoreRecord
)


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'user', 'gold', 'total_score', 'wins', 'losses', 'current_level')
    search_fields = ('display_name', 'user__username')


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('number', 'name', 'base_reward', 'difficulty', 'unlocked')
    list_filter = ('unlocked',)
    ordering = ('number',)


@admin.register(TrapType)
class TrapTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'cost', 'damage', 'range', 'cooldown', 'emoji', 'color')


@admin.register(Trap)
class TrapAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'trap_type', 'position_x', 'position_y', 'is_active')
    list_filter = ('is_active', 'trap_type')


@admin.register(CraftsmanTask)
class CraftsmanTaskAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'name', 'status', 'start_turn', 'end_turn')
    list_filter = ('status',)


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'player', 'level', 'status', 'current_turn', 'score', 'created_at')
    list_filter = ('status', 'level')
    search_fields = ('player__display_name',)


@admin.register(Enemy)
class EnemyAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'enemy_type', 'health', 'position_x', 'position_y', 'is_alive')
    list_filter = ('enemy_type', 'is_alive')


@admin.register(ActionHistory)
class ActionHistoryAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'turn', 'action_type', 'timestamp')
    list_filter = ('action_type', 'turn')
    ordering = ('-turn', '-timestamp')


@admin.register(BattleReport)
class BattleReportAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'title', 'final_score', 'enemies_killed', 'created_at')
    search_fields = ('title',)


@admin.register(ReplayFrame)
class ReplayFrameAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'turn', 'timestamp')
    list_filter = ('turn',)


@admin.register(ScoreRecord)
class ScoreRecordAdmin(admin.ModelAdmin):
    list_display = ('player', 'level', 'score', 'server_calculated_score', 'is_valid', 'created_at')
    list_filter = ('is_valid', 'level')
    search_fields = ('player__display_name',)
