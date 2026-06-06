from django.urls import path
from . import views

app_name = 'reservations'

urlpatterns = [
    path('', views.reservation_list, name='reservation_list'),
    path('new/', views.reservation_create, name='reservation_create'),
    path('<int:pk>/', views.reservation_detail, name='reservation_detail'),
    path('<int:pk>/approve/', views.reservation_approve, name='reservation_approve'),
    path('<int:pk>/reject/', views.reservation_reject, name='reservation_reject'),
    path('<int:pk>/cancel/', views.reservation_cancel, name='reservation_cancel'),
    path('check-qualification/', views.check_qualification, name='check_qualification'),
]
