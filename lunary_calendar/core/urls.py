"""
URL configuration for core app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('record/<int:pk>/', views.record_detail, name='record_detail'),
    path('record/new/', views.record_new, name='record_new'),
    path('record/<int:pk>/edit/', views.record_edit, name='record_edit'),
    path('record/<int:pk>/delete/', views.record_delete, name='record_delete'),
    path('record/<int:pk>/history/', views.record_history, name='record_history'),
    path('record/<int:pk>/export/', views.record_export, name='record_export'),
    path('record/<int:pk>/calculate/', views.calculate_record, name='calculate_record'),
    path('record/<int:pk>/verify/', views.verify_record, name='verify_record'),
    path('batch/<int:pk>/', views.batch_detail, name='batch_detail'),
    path('batch/new/', views.batch_new, name='batch_new'),
    path('export/', views.export_summary, name='export_summary'),
    path('abnormal/<int:pk>/resolve/', views.resolve_abnormal, name='resolve_abnormal'),
]
