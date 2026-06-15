from django.urls import path
from . import views

app_name = 'humidor'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('cabinet/<int:cabinet_id>/', views.cabinet_detail, name='cabinet_detail'),
    path('record/<int:record_id>/', views.record_detail, name='record_detail'),
    path('api/cabinet/<int:cabinet_id>/humidity-data/', views.humidity_chart_data, name='humidity_chart_data'),
    path('api/record/<int:record_id>/positions/', views.position_data, name='position_data'),
    path('reminders/', views.reminder_list, name='reminder_list'),
    path('export/<int:record_id>/', views.export_record, name='export_record'),
]
