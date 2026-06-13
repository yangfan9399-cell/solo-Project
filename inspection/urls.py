from django.urls import path
from . import views

app_name = 'inspection'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('list/', views.inspection_list, name='list'),
    path('detail/<uuid:pk>/', views.inspection_detail, name='detail'),
    path('handle/<uuid:pk>/', views.inspection_handle, name='handle'),
    path('review/', views.review_board, name='review_board'),
    path('api/stats/', views.api_stats, name='api_stats'),
    path('api/record/<uuid:pk>/metrics/', views.api_record_metrics, name='api_record_metrics'),
    path('api/record/<uuid:pk>/timeline/', views.api_record_timeline, name='api_record_timeline'),
    path('api/record/<uuid:pk>/action/', views.api_record_action, name='api_record_action'),
    path('api/record/<uuid:pk>/evidence/', views.api_upload_evidence, name='api_upload_evidence'),
    path('api/record/<uuid:pk>/business-record/', views.api_add_business_record, name='api_add_business_record'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]
