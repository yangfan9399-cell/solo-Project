from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('appeal/<int:appeal_id>/', views.appeal_detail, name='appeal_detail'),
    path('penalty/create/', views.create_penalty, name='create_penalty'),
    path('penalty/<int:penalty_id>/appeal/', views.submit_appeal, name='submit_appeal'),
    path('appeal/<int:appeal_id>/first-review/', views.first_review, name='first_review'),
    path('appeal/<int:appeal_id>/arbitration/', views.arbitration_review, name='arbitration_review'),
    path('appeal/<int:appeal_id>/resubmit/', views.resubmit_evidence, name='resubmit_evidence'),
    path('appeal/<int:appeal_id>/recalculate-trajectory/', views.recalculate_trajectory, name='recalculate_trajectory'),
    path('kanban/', views.kanban, name='kanban'),
    path('penalties/', views.penalty_list, name='penalty_list'),
]