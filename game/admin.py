from django.contrib import admin
from game.models import (
    Level, GameSession, DispatchDetail, TouristHistory,
    PatienceResult, Complaint, IncomeSnapshot,
)


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['name', 'difficulty', 'target_income', 'max_complaints', 'time_limit']
    list_filter = ['difficulty']


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'level', 'status', 'ticket_price', 'total_income', 'total_complaints', 'final_score', 'created_at']
    list_filter = ['status', 'level']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DispatchDetail)
class DispatchDetailAdmin(admin.ModelAdmin):
    list_display = ['session', 'tick', 'car_index', 'passenger_count', 'revenue']
    list_filter = ['session']


@admin.register(TouristHistory)
class TouristHistoryAdmin(admin.ModelAdmin):
    list_display = ['session', 'tick_entered', 'destination', 'patience', 'served', 'complained']
    list_filter = ['session', 'served', 'complained', 'needs_transfer']


@admin.register(PatienceResult)
class PatienceResultAdmin(admin.ModelAdmin):
    list_display = ['session', 'tick', 'action', 'tourist_count', 'complaint_count']
    list_filter = ['session', 'action']


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['session', 'tick', 'reason', 'severity', 'rolled_back']
    list_filter = ['session', 'rolled_back', 'severity']


@admin.register(IncomeSnapshot)
class IncomeSnapshotAdmin(admin.ModelAdmin):
    list_display = ['session', 'tick', 'cumulative_income', 'tick_income', 'ticket_price', 'queue_length']
    list_filter = ['session']
