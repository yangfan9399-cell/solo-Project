from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.dashboard, name='dashboard'),
    path('batch/<int:pk>/', views.batch_detail, name='batch_detail'),
    path('batch/create/', views.batch_create, name='batch_create'),
    path('batch/<int:pk>/qc/', views.batch_qc, name='batch_qc'),
    path('batch/<int:pk>/load/', views.batch_load, name='batch_load'),
    path('batch/<int:pk>/recall/', views.batch_recall, name='batch_recall'),
    path('recall/<int:pk>/resolve/', views.recall_resolve, name='recall_resolve'),
    path('batch/<int:pk>/temperature/', views.add_temperature, name='add_temperature'),
    path('batch/<int:pk>/cold-start/', views.start_cold_storage, name='start_cold_storage'),
    path('batch/<int:pk>/cold-end/', views.end_cold_storage, name='end_cold_storage'),
    path('review/', views.review_page, name='review'),
]
