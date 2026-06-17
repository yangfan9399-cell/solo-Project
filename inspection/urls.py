from django.urls import path
from . import views

app_name = 'inspection'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('records/', views.record_list, name='record_list'),
    path('records/create/', views.record_create, name='record_create'),
    path('records/<int:pk>/', views.record_detail, name='record_detail'),
    path('records/<int:pk>/edit/', views.record_edit, name='record_edit'),
    path('records/<int:pk>/delete/', views.record_delete, name='record_delete'),
    path('records/<int:pk>/versions/', views.record_versions, name='record_versions'),
    path('records/<int:pk>/revert/<int:version_no>/', views.record_revert, name='record_revert'),
    path('batches/', views.batch_list, name='batch_list'),
    path('alerts/', views.alert_list, name='alert_list'),
    path('alerts/<int:pk>/resolve/', views.alert_resolve, name='alert_resolve'),
    path('pools/', views.pool_list, name='pool_list'),
    path('pools/<int:pk>/', views.pool_detail, name='pool_detail'),
    path('export/csv/', views.export_csv, name='export_csv'),
    path('export/excel/', views.export_excel, name='export_excel'),
    path('export/summary/', views.export_summary, name='export_summary'),
    path('api/pool-status/', views.api_pool_status, name='api_pool_status'),
    path('api/trend-data/', views.api_trend_data, name='api_trend_data'),
]
