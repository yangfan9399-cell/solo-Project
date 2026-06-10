from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('', views.dashboard, name='dashboard'),
    path('applications/', views.application_list, name='application_list'),
    path('applications/<int:pk>/', views.application_detail, name='application_detail'),
    path('applications/create/', views.create_application, name='create_application'),
    path('applications/<int:pk>/inventory-check/', views.inventory_check, name='inventory_check'),
    path('applications/<int:pk>/safety-check/', views.safety_check, name='safety_check'),
    path('applications/<int:pk>/approve/', views.approve_application, name='approve_application'),
    path('applications/<int:pk>/issue/', views.issue_application, name='issue_application'),
    path('applications/<int:pk>/return/', views.return_application, name='return_application'),
    path('statistics/', views.statistics, name='statistics'),
    path('check-overdue/', views.check_overdue, name='check_overdue'),
    path('low-stock/', views.low_stock_warning, name='low_stock_warning'),
]
