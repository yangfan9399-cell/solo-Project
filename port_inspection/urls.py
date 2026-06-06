"""
URL configuration for port_inspection project.
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views

from inspection import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', auth_views.LoginView.as_view(template_name='inspection/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('', views.dashboard, name='dashboard'),
    path('appointments/', views.AppointmentListView.as_view(), name='appointment_list'),
    path('appointments/<int:pk>/', views.AppointmentDetailView.as_view(), name='appointment_detail'),
    path('appointments/create/', views.appointment_create, name='appointment_create'),
    path('appointments/<int:pk>/submit/', views.appointment_submit, name='appointment_submit'),
    path('appointments/<int:pk>/start-inspection/', views.inspection_start, name='inspection_start'),
    path('appointments/<int:pk>/inspection-result/', views.inspection_result, name='inspection_result'),
    path('appointments/<int:pk>/reschedule/', views.reschedule, name='appointment_reschedule'),
    path('appointments/<int:pk>/documents/<int:doc_id>/submit/', views.document_submit, name='document_submit'),
    path('appointments/<int:pk>/release-after-doc/', views.release_after_doc, name='release_after_doc'),
    path('appointments/<int:pk>/fee-review/', views.fee_review, name='fee_review'),
    path('appointments/<int:pk>/archive/', views.appointment_archive, name='appointment_archive'),
    path('statistics/', views.statistics, name='statistics'),
]
