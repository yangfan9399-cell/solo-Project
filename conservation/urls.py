from django.urls import path
from . import views

app_name = 'conservation'

urlpatterns = [
    path('assessments/', views.assessment_list, name='assessment_list'),
    path('assess/<int:log_id>/', views.damage_assessment, name='assess'),
    path('assessments/<int:pk>/', views.assessment_detail, name='assessment_detail'),
    path('decisions/', views.decision_list, name='decision_list'),
    path('decision/<int:assessment_id>/', views.final_decision, name='decision'),
]
