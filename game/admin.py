from django.contrib import admin
from .models import Level, GameSession, FoldHistory, DeliveryDetail, GameResult


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'grid_width', 'grid_height', 'max_steps', 'min_folds', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'level', 'status', 'step_count', 'fold_count', 'score', 'started_at')
    list_filter = ('status', 'started_at')
    search_fields = ('session_id',)
    readonly_fields = ('session_id', 'started_at', 'ended_at')


@admin.register(FoldHistory)
class FoldHistoryAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'fold_number', 'direction', 'fold_line', 'created_at')
    list_filter = ('direction', 'created_at')
    search_fields = ('game_session__session_id',)


@admin.register(DeliveryDetail)
class DeliveryDetailAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'step_number', 'action', 'is_valid', 'step_cost', 'created_at')
    list_filter = ('action', 'is_valid', 'created_at')
    search_fields = ('game_session__session_id', 'letter_color', 'address_id')


@admin.register(GameResult)
class GameResultAdmin(admin.ModelAdmin):
    list_display = ('game_session', 'is_success', 'final_score', 'final_rank', 'is_optimal', 'validated_at')
    list_filter = ('is_success', 'is_optimal', 'final_rank', 'validated_at')
    search_fields = ('game_session__session_id',)
