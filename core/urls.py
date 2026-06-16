from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('samples/', views.sample_list, name='sample_list'),
    path('samples/<int:pk>/', views.sample_detail, name='sample_detail'),
    path('samples/create/', views.sample_create, name='sample_create'),
    path('samples/<int:pk>/edit/', views.sample_edit, name='sample_edit'),
    path('tasks/', views.task_list, name='task_list'),
    path('tasks/<int:pk>/', views.task_detail, name='task_detail'),
    path('tasks/create/', views.task_create, name='task_create'),
    path('tasks/<int:pk>/edit/', views.task_edit, name='task_edit'),
    path('workbench/', views.workbench, name='workbench'),
    path('batches/', views.batch_list, name='batch_list'),
    path('batches/<int:pk>/', views.batch_detail, name='batch_detail'),
    path('batches/create/', views.batch_create, name='batch_create'),
    path('anomalies/', views.anomaly_list, name='anomaly_list'),
    path('anomalies/<int:pk>/resolve/', views.anomaly_resolve, name='anomaly_resolve'),
    path('export/summary/', views.export_summary, name='export_summary'),
    path('export/summary/xlsx/', views.export_summary_xlsx, name='export_summary_xlsx'),
    path('cutters/', views.cutter_list, name='cutter_list'),
    path('purposes/', views.purpose_list, name='purpose_list'),
]
