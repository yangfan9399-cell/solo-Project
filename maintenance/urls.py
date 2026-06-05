from django.urls import path
from . import views

app_name = 'maintenance'

urlpatterns = [
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    path('tickets/', views.ticket_list, name='ticket_list'),
    path('tickets/<int:pk>/', views.ticket_detail, name='ticket_detail'),
    path('tickets/<int:pk>/confirm-stop/', views.confirm_stop, name='confirm_stop'),
    path('tickets/<int:pk>/dispatch/', views.dispatch_ticket, name='dispatch_ticket'),
    path('tickets/<int:pk>/parts-waiting/', views.mark_parts_waiting, name='mark_parts_waiting'),
    path('tickets/<int:pk>/start-repair/', views.start_repair, name='start_repair'),
    path('tickets/<int:pk>/complete-repair/', views.complete_repair, name='complete_repair'),
    path('tickets/<int:pk>/review/', views.review_ticket, name='review_ticket'),
    path('tickets/<int:pk>/note/', views.add_note, name='add_note'),
    
    path('elevators/', views.elevator_list, name='elevator_list'),
    path('elevators/<int:pk>/', views.elevator_detail, name='elevator_detail'),
    
    path('plans/', views.plan_list, name='plan_list'),
]
