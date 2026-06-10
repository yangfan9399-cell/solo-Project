from django.urls import path
from . import views

app_name = 'statistics'

urlpatterns = [
    path('', views.statistics_dashboard, name='dashboard'),
    path('floor/', views.statistics_by_floor, name='by_floor'),
    path('level/', views.statistics_by_level, name='by_level'),
    path('objection/', views.statistics_by_objection, name='by_objection'),
    path('period/', views.statistics_by_period, name='by_period'),
]