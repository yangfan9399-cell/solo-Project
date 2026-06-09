from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('procurements/', views.procurement_list, name='procurement_list'),
    path('procurements/create/', views.procurement_create, name='procurement_create'),
    path('procurements/<int:pk>/', views.procurement_detail, name='procurement_detail'),
    path('procurements/<int:pk>/submit/', views.procurement_submit, name='procurement_submit'),
    path('procurements/<int:pk>/freeze/', views.budget_freeze, name='budget_freeze'),
    path('procurements/<int:pk>/acceptance/', views.acceptance_create, name='acceptance_create'),
    path('procurements/<int:pk>/invoice/', views.invoice_create, name='invoice_create'),
    path('procurements/<int:pk>/verify/', views.invoice_verify, name='invoice_verify'),

    path('kanban/', views.kanban, name='kanban'),
    path('suppliers/', views.supplier_list, name='supplier_list'),
    path('projects/', views.project_list, name='project_list'),
]
