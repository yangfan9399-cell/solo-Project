from django.urls import path
from . import views
from .views import EnrollmentApprovalView

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('courses/', views.course_list, name='course_list'),
    path('schedules/', views.schedule_list, name='schedule_list'),
    path('schedules/create/', views.schedule_create, name='schedule_create'),
    path('schedules/<int:schedule_id>/edit/', views.schedule_edit, name='schedule_edit'),
    path('schedules/<int:schedule_id>/toggle/', views.schedule_toggle, name='schedule_toggle'),
    path('enroll/<int:schedule_id>/', views.enroll_course, name='enroll_course'),
    path('my-enrollments/', views.my_enrollments, name='my_enrollments'),
    path('enrollment/<int:enrollment_id>/', views.enrollment_detail, name='enrollment_detail'),
    path('enrollments/', views.enrollment_list, name='enrollment_list'),
    path('enrollment/<int:enrollment_id>/<str:action>/', EnrollmentApprovalView.as_view(), name='enrollment_action'),
    path('attendance/<int:schedule_id>/', views.attendance_manage, name='attendance_manage'),
    path('attendance/update/<int:attendance_id>/', views.update_attendance, name='update_attendance'),
    path('exam/<int:schedule_id>/', views.exam_manage, name='exam_manage'),
    path('exam/update/<int:exam_id>/', views.update_exam, name='update_exam'),
    path('certificates/', views.certificate_list, name='certificate_list'),
    path('certificate/<int:certificate_id>/issue/', views.issue_certificate, name='issue_certificate'),
    path('certificate/<int:certificate_id>/revoke/', views.revoke_certificate, name='revoke_certificate'),
    path('analytics/', views.analytics_view, name='analytics'),
]
