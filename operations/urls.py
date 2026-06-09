from django.urls import path
from . import views

app_name = 'operations'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('assignments/', views.assignment_list, name='assignment_list'),
    path('assignments/<int:pk>/', views.assignment_detail, name='assignment_detail'),
    path('assignments/create/', views.assignment_create, name='assignment_create'),
    path('assignments/<int:pk>/start/', views.assignment_start, name='assignment_start'),
    path('assignments/<int:pk>/complete/', views.assignment_complete, name='assignment_complete'),
    path('assignments/<int:pk>/suspend/', views.assignment_suspend, name='assignment_suspend'),
    path('assignments/<int:pk>/resume/', views.assignment_resume, name='assignment_resume'),
    path('assignments/<int:pk>/reassign/', views.assignment_reassign, name='assignment_reassign'),

    path('checkins/<int:assignment_pk>/create/<int:station_pk>/', views.checkin_create, name='checkin_create'),
    path('checkins/<int:assignment_pk>/cancel/<int:station_pk>/', views.checkin_cancel, name='checkin_cancel'),
    path('checkins/<int:pk>/', views.checkin_detail, name='checkin_detail'),

    path('faults/', views.fault_list, name='fault_list'),
    path('faults/<int:pk>/', views.fault_detail, name='fault_detail'),
    path('faults/create/assignment/<int:assignment_pk>/', views.fault_create_for_assignment,
         name='fault_create_for_assignment'),
    path('faults/<int:pk>/resolve/', views.fault_resolve, name='fault_resolve'),

    path('complaints/', views.complaint_list, name='complaint_list'),
    path('complaints/<int:pk>/', views.complaint_detail, name='complaint_detail'),
    path('complaints/create/assignment/<int:assignment_pk>/', views.complaint_create, name='complaint_create'),
    path('complaints/<int:pk>/confirm/', views.complaint_confirm, name='complaint_confirm'),
    path('complaints/<int:pk>/resolve/', views.complaint_resolve, name='complaint_resolve'),

    path('reviews/', views.review_list, name='review_list'),
    path('reviews/<int:pk>/', views.review_detail, name='review_detail'),
    path('reviews/create/assignment/<int:assignment_pk>/', views.review_create, name='review_create'),
    path('reviews/<int:pk>/rectify/', views.review_rectify, name='review_rectify'),

    path('analytics/', views.analytics, name='analytics'),

    path('routes/', views.route_list, name='route_list'),
    path('routes/<int:pk>/', views.route_detail, name='route_detail'),

    path('vehicles/', views.vehicle_list, name='vehicle_list'),
    path('vehicles/<int:pk>/', views.vehicle_detail, name='vehicle_detail'),

    path('stations/', views.station_list, name='station_list'),
    path('stations/<int:pk>/', views.station_detail, name='station_detail'),
]
