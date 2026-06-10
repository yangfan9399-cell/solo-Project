from django.urls import path
from . import views

app_name = 'assessments'

urlpatterns = [
    path('', views.assessment_list, name='assessment_list'),
    path('create/', views.assessment_create, name='assessment_create'),
    path('create/<int:elder_id>/', views.assessment_create, name='assessment_create_for_elder'),
    path('<int:pk>/', views.assessment_detail, name='assessment_detail'),
    path('<int:pk>/edit/', views.assessment_edit, name='assessment_edit'),
    path('<int:pk>/submit/', views.assessment_submit, name='assessment_submit'),
    path('<int:pk>/doctor-confirm/', views.doctor_confirm, name='doctor_confirm'),
    path('<int:pk>/family-confirm/', views.family_confirm, name='family_confirm'),
    path('<int:pk>/director-review/', views.director_review, name='director_review'),
    path('levels/', views.nursing_level_list, name='nursing_level_list'),
    path('dimensions/', views.dimension_list, name='dimension_list'),
]