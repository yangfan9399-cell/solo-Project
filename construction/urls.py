from django.urls import path
from . import views

app_name = 'construction'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('plans/', views.plan_list, name='plan_list'),
    path('plans/create/', views.plan_create, name='plan_create'),
    path('plans/<int:pk>/', views.plan_detail, name='plan_detail'),
    path('plans/<int:pk>/edit/', views.plan_edit, name='plan_edit'),
    path('plans/<int:pk>/submit/', views.plan_submit, name='plan_submit'),
    path('plans/<int:pk>/delete/', views.plan_delete, name='plan_delete'),

    path('plans/<int:pk>/pm-review/', views.pm_review, name='pm_review'),
    path('plans/<int:pk>/safety-review/', views.safety_review, name='safety_review'),
    path('plans/<int:pk>/start-work/', views.start_work, name='start_work'),
    path('plans/<int:pk>/complete/', views.complete_work, name='complete_work'),
    path('plans/<int:pk>/accept/', views.acceptance, name='acceptance'),

    path('plans/<int:pk>/delay/', views.delay_apply, name='delay_apply'),
    path('plans/<int:pk>/delay/<int:delay_id>/approve/', views.delay_approve, name='delay_approve'),
    path('plans/<int:pk>/delay/<int:delay_id>/reject/', views.delay_reject, name='delay_reject'),

    path('plans/<int:pk>/workers/', views.manage_workers, name='manage_workers'),

    path('locations/', views.location_list, name='location_list'),
    path('workers/', views.worker_list, name='worker_list'),
    path('weather/', views.weather_list, name='weather_list'),

    path('board/', views.board, name='board'),
]
