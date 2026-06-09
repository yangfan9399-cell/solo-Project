from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Airline, Flight, MealCategory, Allergen,
    MealBatch, TemperatureRecord, BatchHistory, RecallRecord
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('角色信息', {'fields': ('role', 'phone')}),
    )


@admin.register(Airline)
class AirlineAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')
    search_fields = ('code', 'name')


@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ('flight_number', 'airline', 'departure', 'destination', 'departure_time')
    list_filter = ('airline', 'departure_time')
    search_fields = ('flight_number', 'departure', 'destination')
    date_hierarchy = 'departure_time'


@admin.register(MealCategory)
class MealCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Allergen)
class AllergenAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'description')
    search_fields = ('name',)


@admin.register(MealBatch)
class MealBatchAdmin(admin.ModelAdmin):
    list_display = ('batch_number', 'meal_category', 'flight', 'quantity', 'status', 'anomaly_type', 'created_at')
    list_filter = ('status', 'anomaly_type', 'meal_category', 'flight__airline')
    search_fields = ('batch_number', 'flight__flight_number')
    date_hierarchy = 'created_at'
    raw_id_fields = ('flight', 'created_by', 'qc_officer', 'loaded_by')
    filter_horizontal = ('allergens',)


@admin.register(TemperatureRecord)
class TemperatureRecordAdmin(admin.ModelAdmin):
    list_display = ('batch', 'temperature', 'recorded_at', 'location')
    list_filter = ('location', 'recorded_at')
    search_fields = ('batch__batch_number',)
    date_hierarchy = 'recorded_at'


@admin.register(BatchHistory)
class BatchHistoryAdmin(admin.ModelAdmin):
    list_display = ('batch', 'action', 'user', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('batch__batch_number', 'action')
    date_hierarchy = 'timestamp'


@admin.register(RecallRecord)
class RecallRecordAdmin(admin.ModelAdmin):
    list_display = ('batch', 'anomaly_type', 'initiated_by', 'initiated_at', 'is_resolved')
    list_filter = ('anomaly_type', 'is_resolved', 'initiated_at')
    search_fields = ('batch__batch_number', 'reason')
    date_hierarchy = 'initiated_at'
