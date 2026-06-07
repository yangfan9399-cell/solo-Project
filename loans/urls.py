from django.urls import path
from . import views

app_name = 'loans'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('loans/', views.loan_list, name='loan_list'),
    path('loans/<int:pk>/', views.loan_detail, name='loan_detail'),
    path('loans/create/', views.loan_create, name='loan_create'),
    path('loans/<int:pk>/submit/', views.loan_submit, name='loan_submit'),
    path('loans/<int:pk>/release/', views.loan_release, name='loan_release'),
    path('loans/<int:pk>/arrived/', views.loan_mark_arrived, name='loan_mark_arrived'),
    path('loans/<int:pk>/start-return/', views.loan_start_return, name='loan_start_return'),
    path('loans/<int:pk>/returned/', views.loan_mark_returned, name='loan_mark_returned'),
    path('loans/<int:pk>/complete/', views.loan_complete, name='loan_complete'),

    path('loans/<int:pk>/transport/', views.transport_register, name='transport_register'),
    path('loans/<int:pk>/insurance/add/', views.insurance_add, name='insurance_add'),
    path('loans/<int:pk>/insurance/review/', views.insurance_review, name='insurance_review'),
    path('loans/<int:pk>/environment/add/', views.environment_add, name='environment_add'),
    path('loans/<int:pk>/inspection/', views.return_inspection, name='return_inspection'),

    path('exhibits/', views.exhibit_list, name='exhibit_list'),
    path('borrowers/', views.borrower_list, name='borrower_list'),
    path('statistics/', views.statistics, name='statistics'),
]
