from django.urls import path

from tracker import views

app_name = 'tracker'

urlpatterns = [
    path('', views.home, name='home'),
    path('check-expiry/', views.check_expiry, name='check_expiry'),

    path('instruments/', views.instrument_list, name='instrument_list'),
    path('instruments/create/', views.instrument_create, name='instrument_create'),
    path('instruments/<uuid:pk>/', views.instrument_detail, name='instrument_detail'),
    path('instruments/<uuid:pk>/status/', views.instrument_status_update, name='instrument_status_update'),

    path('cleanings/', views.cleaning_list, name='cleaning_list'),
    path('cleanings/create/', views.cleaning_create, name='cleaning_create'),
    path('cleanings/<uuid:pk>/', views.cleaning_detail, name='cleaning_detail'),

    path('batches/', views.batch_board, name='batch_board'),
    path('batches/create/', views.batch_create, name='batch_create'),
    path('batches/<int:pk>/', views.batch_detail, name='batch_detail'),
    path('batches/<int:pk>/tests/', views.batch_update_tests, name='batch_update_tests'),

    path('audits/', views.audit_list, name='audit_list'),
    path('audits/create/', views.audit_create, name='audit_create'),
    path('audits/<uuid:pk>/', views.audit_detail, name='audit_detail'),

    path('usages/', views.usage_list, name='usage_list'),
    path('usages/create/', views.usage_create, name='usage_create'),
    path('usages/<uuid:pk>/', views.usage_detail, name='usage_detail'),
    path('usages/<uuid:pk>/return/', views.usage_return, name='usage_return'),

    path('recalls/', views.recall_list, name='recall_list'),
    path('recalls/create/', views.recall_create, name='recall_create'),
    path('recalls/<uuid:pk>/', views.recall_detail, name='recall_detail'),
    path('recalls/<uuid:pk>/handle/', views.recall_handle, name='recall_handle'),

    path('inspections/', views.inspection_list, name='inspection_list'),
    path('inspections/create/', views.inspection_create, name='inspection_create'),
    path('inspections/<uuid:pk>/', views.inspection_detail, name='inspection_detail'),
    path('inspections/<uuid:pk>/handle/', views.inspection_handle, name='inspection_handle'),
]
