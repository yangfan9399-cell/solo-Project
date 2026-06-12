from django.urls import path
from . import views

app_name = 'access_control'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),

    path('records/', views.record_list, name='record_list'),
    path('records/<int:pk>/', views.record_detail, name='record_detail'),

    path('processing/', views.processing_desk, name='processing_desk'),
    path('review/', views.review_page, name='review_page'),
    path('analytics/', views.analytics_page, name='analytics_page'),

    path('api/records/<int:pk>/accept/', views.api_accept_record, name='api_accept_record'),
    path('api/records/<int:pk>/process/', views.api_process_record, name='api_process_record'),
    path('api/records/<int:pk>/submit-review/', views.api_submit_review, name='api_submit_review'),
    path('api/records/<int:pk>/review-approve/', views.api_review_approve, name='api_review_approve'),
    path('api/records/<int:pk>/review-reject/', views.api_review_reject, name='api_review_reject'),
    path('api/records/<int:pk>/archive/', views.api_archive_record, name='api_archive_record'),
    path('api/records/<int:pk>/reopen/', views.api_reopen_record, name='api_reopen_record'),
    path('api/records/<int:pk>/upload-evidence/', views.api_upload_evidence, name='api_upload_evidence'),

    path('api/records/<int:pk>/summary/', views.api_record_summary, name='api_record_summary'),
    path('api/dashboard/stats/', views.api_dashboard_stats, name='api_dashboard_stats'),
]
