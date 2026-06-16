from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Player, Level, Station, Carriage, Ingredient, Recipe,
    RecipeIngredient, OrderTemplate, GameSession, Order,
    Preparation, Delivery, ActionHistory, Settlement
)


@admin.register(Player)
class PlayerAdmin(UserAdmin):
    list_display = ('username', 'nickname', 'avatar', 'total_score',
                   'games_played', 'games_won', 'highest_level')
    fieldsets = UserAdmin.fieldsets + (
        ('游戏信息', {'fields': ('nickname', 'avatar', 'total_score',
                                'games_played', 'games_won', 'highest_level')}),
    )


class StationInline(admin.TabularInline):
    model = Station
    extra = 0


class CarriageInline(admin.TabularInline):
    model = Carriage
    extra = 0


class OrderTemplateInline(admin.TabularInline):
    model = OrderTemplate
    extra = 0


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('level_number', 'name', 'difficulty', 'target_score',
                   'time_limit', 'station_count', 'is_active')
    list_filter = ('difficulty', 'is_active')
    inlines = [StationInline, CarriageInline, OrderTemplateInline]


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'category', 'prep_time', 'heat_time', 'cost')
    list_filter = ('category',)


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 0


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'category', 'base_price', 'cook_time')
    list_filter = ('category',)
    inlines = [RecipeIngredientInline]


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'player', 'level', 'status', 'score',
                   'current_time', 'start_time', 'end_time')
    list_filter = ('status', 'level')
    search_fields = ('player__username', 'player__nickname')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'recipe', 'carriage', 'priority',
                   'status', 'created_at', 'final_price', 'tip')
    list_filter = ('priority', 'status')


@admin.register(Preparation)
class PreparationAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'order', 'task_type', 'status',
                   'start_time', 'duration', 'station_index')
    list_filter = ('task_type', 'status')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'order', 'carriage', 'status',
                   'start_time', 'travel_time', 'waiter_id')
    list_filter = ('status',)


@admin.register(ActionHistory)
class ActionHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'action_type', 'game_time', 'sequence', 'timestamp')
    list_filter = ('action_type',)


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'final_score', 'star_rating',
                   'orders_completed', 'orders_failed', 'recalculated', 'created_at')
    list_filter = ('star_rating', 'recalculated')
