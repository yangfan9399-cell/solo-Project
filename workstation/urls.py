from django.urls import path
from . import views

app_name = 'workstation'

urlpatterns = [
    path('', views.workstation, name='workstation'),
    path('appointment/<int:appointment_id>/', views.appointment_detail, name='appointment_detail'),
    path('appointment/<int:appointment_id>/reschedule/', views.reschedule_appointment, name='reschedule_appointment'),
    path('appointment/<int:appointment_id>/claim/', views.claim_report, name='claim_report'),
    path('claim/<int:claim_id>/review/', views.review_claim, name='review_claim'),
    path('abnormal/<int:abnormal_id>/handle/', views.handle_abnormal, name='handle_abnormal'),
    path('appointments/partial/', views.appointment_list_partial, name='appointment_list_partial'),
]
