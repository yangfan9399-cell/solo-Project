from django.urls import path

from . import views

app_name = "depot"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("packages/", views.package_list, name="package_list"),
    path("packages/checkin/", views.package_checkin, name="package_checkin"),
    path("packages/<int:pk>/", views.package_detail, name="package_detail"),
    path("packages/<int:pk>/status/", views.package_status_update, name="package_status_update"),
    path("reminders/", views.reminder_list, name="reminder_list"),
    path("reminders/create/<int:package_pk>/", views.reminder_create, name="reminder_create"),
    path("reminders/<int:pk>/response/", views.reminder_response, name="reminder_response"),
    path("retention/", views.retention_list, name="retention_list"),
    path("retention/<int:pk>/resolve/", views.retention_resolve, name="retention_resolve"),
    path("abnormals/", views.abnormal_list, name="abnormal_list"),
    path("abnormals/register/", views.abnormal_register, name="abnormal_register"),
    path("abnormals/<int:pk>/", views.abnormal_detail, name="abnormal_detail"),
    path("complaints/", views.complaint_list, name="complaint_list"),
    path("complaints/create/", views.complaint_create, name="complaint_create"),
    path("complaints/<int:pk>/", views.complaint_detail, name="complaint_detail"),
    path("complaints/<int:complaint_pk>/responsibility/", views.responsibility_create, name="responsibility_create"),
    path("responsibilities/", views.responsibility_list, name="responsibility_list"),
    path("responsibilities/<int:pk>/action/", views.responsibility_confirm, name="responsibility_confirm"),
    path("returns/", views.return_list, name="return_list"),
    path("returns/create/<int:package_pk>/", views.return_create, name="return_create"),
]
