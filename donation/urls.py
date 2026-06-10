from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('batch/list/', views.batch_list, name='batch_list'),
    path('batch/<int:pk>/', views.batch_detail, name='batch_detail'),
    path('batch/create/', views.batch_create, name='batch_create'),
    path('batch/<int:pk>/receive/', views.batch_receive, name='batch_receive'),
    path('distribution/list/', views.distribution_list, name='distribution_list'),
    path('distribution/create/', views.distribution_create, name='distribution_create'),
    path('distribution/<int:pk>/', views.distribution_detail, name='distribution_detail'),
    path('distribution/<int:pk>/approve/', views.distribution_approve, name='distribution_approve'),
    path('distribution/<int:pk>/distribute/', views.distribution_distribute, name='distribution_distribute'),
    path('distribution/<int:pk>/sign/', views.distribution_sign, name='distribution_sign'),
    path('distribution/<int:pk>/audit/', views.distribution_audit, name='distribution_audit'),
    path('recipient/list/', views.recipient_list, name='recipient_list'),
    path('recipient/create/', views.recipient_create, name='recipient_create'),
    path('recipient/<int:pk>/edit/', views.recipient_edit, name='recipient_edit'),
    path('review/', views.review_dashboard, name='review_dashboard'),
    path('api/batches/', views.api_batches, name='api_batches'),
    path('api/distributions/', views.api_distributions, name='api_distributions'),
]
