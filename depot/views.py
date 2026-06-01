from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse
from django.utils import timezone
from .models import (
    Package, PickupReminder, RetentionAlert,
    AbnormalPackage, Complaint, Responsibility,
    ReturnRecord, Staff,
)
from .forms import (
    PackageCheckinForm, PickupReminderForm, PickupReminderResponseForm,
    AbnormalPackageForm, AbnormalResolveForm,
    ComplaintCreateForm, ComplaintProcessForm,
    ResponsibilityForm, ReturnRecordForm,
)
from .services import check_retention_alerts, get_dashboard_stats
from .role_utils import get_user_role


def login_view(request):
    if request.user.is_authenticated:
        return redirect("depot:dashboard")
    error = ""
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get("next", "/")
            return redirect(next_url)
        else:
            error = "用户名或密码错误"
    return render(request, "depot/login.html", {"error": error, "hide_sidebar": True})


def logout_view(request):
    logout(request)
    return redirect("depot:login")


@login_required
def dashboard(request):
    check_retention_alerts()
    stats = get_dashboard_stats()
    role = get_user_role(request)

    role_todos = []

    if role == "clerk":
        pending_reminders = PickupReminder.objects.filter(response="").select_related("package")[:5]
        pending_abnormals = AbnormalPackage.objects.filter(status="pending").select_related("package", "package__station")[:5]
        todays_checkins = Package.objects.filter(checked_in_at__date=timezone.now().date()).count()

        role_todos = [
            {
                "title": "📩 未回应取件提醒",
                "count": len(pending_reminders),
                "items": pending_reminders,
                "url": "depot:reminder_list",
                "url_params": "response=no_response",
                "color": "blue",
            },
            {
                "title": "❗ 待登记异常件",
                "count": len(pending_abnormals),
                "items": pending_abnormals,
                "url": "depot:abnormal_list",
                "url_params": "status=pending",
                "color": "red",
            },
            {
                "title": "📦 今日入站包裹",
                "count": todays_checkins,
                "items": [],
                "url": "depot:package_list",
                "url_params": "status=checked_in",
                "color": "green",
            },
        ]

    elif role == "supervisor":
        unresolved_alerts = RetentionAlert.objects.filter(is_resolved=False).select_related("package", "package__station")[:5]
        pending_responsibilities = Responsibility.objects.filter(status="pending").select_related("responsible_staff", "complaint")[:5]
        retention_by_station = RetentionAlert.objects.filter(is_resolved=False).values("package__station__name").distinct().count()

        role_todos = [
            {
                "title": "⚠️ 待处理滞留预警",
                "count": len(unresolved_alerts),
                "items": unresolved_alerts,
                "url": "depot:retention_list",
                "url_params": "resolved=no",
                "color": "orange",
            },
            {
                "title": "⚖️ 待确认责任处理",
                "count": len(pending_responsibilities),
                "items": pending_responsibilities,
                "url": "depot:responsibility_list",
                "url_params": "status=pending",
                "color": "purple",
            },
            {
                "title": "🏠 涉及驿站数量",
                "count": retention_by_station,
                "items": [],
                "url": "depot:dashboard",
                "url_params": "",
                "color": "blue",
            },
        ]

    elif role == "cs_specialist":
        pending_complaints = Complaint.objects.filter(status="pending").select_related("station")[:5]
        processing_complaints = Complaint.objects.filter(status__in=["accepted", "processing"]).select_related("station")[:5]
        new_abnormals = AbnormalPackage.objects.filter(status="pending").select_related("package")[:5]

        role_todos = [
            {
                "title": "💬 待受理投诉",
                "count": len(pending_complaints),
                "items": pending_complaints,
                "url": "depot:complaint_list",
                "url_params": "status=pending",
                "color": "red",
            },
            {
                "title": "🔄 处理中投诉",
                "count": len(processing_complaints),
                "items": processing_complaints,
                "url": "depot:complaint_list",
                "url_params": "status=accepted",
                "color": "blue",
            },
            {
                "title": "❗ 新异常反馈",
                "count": len(new_abnormals),
                "items": new_abnormals,
                "url": "depot:abnormal_list",
                "url_params": "status=pending",
                "color": "orange",
            },
        ]

    else:
        recent_alerts = RetentionAlert.objects.filter(is_resolved=False).select_related("package", "package__station")[:5]
        recent_complaints = Complaint.objects.filter(status__in=["pending", "accepted", "processing"]).select_related("station")[:5]
        recent_abnormals = AbnormalPackage.objects.filter(status__in=["pending", "processing"]).select_related("package")[:5]

        role_todos = [
            {
                "title": "🚨 最新滞留预警",
                "count": len(recent_alerts),
                "items": recent_alerts,
                "url": "depot:retention_list",
                "url_params": "resolved=no",
                "color": "red",
            },
            {
                "title": "💬 待处理投诉",
                "count": len(recent_complaints),
                "items": recent_complaints,
                "url": "depot:complaint_list",
                "url_params": "",
                "color": "orange",
            },
            {
                "title": "❗ 待处理异常",
                "count": len(recent_abnormals),
                "items": recent_abnormals,
                "url": "depot:abnormal_list",
                "url_params": "",
                "color": "purple",
            },
        ]

    recent_alerts = RetentionAlert.objects.filter(is_resolved=False).select_related("package", "package__station")[:10]
    recent_complaints = Complaint.objects.filter(status__in=["pending", "accepted", "processing"]).select_related("station")[:5]
    recent_abnormals = AbnormalPackage.objects.filter(status__in=["pending", "processing"]).select_related("package")[:5]

    context = {
        **stats,
        "role_todos": role_todos,
        "recent_alerts": recent_alerts,
        "recent_complaints": recent_complaints,
        "recent_abnormals": recent_abnormals,
        "active_tab": "dashboard",
    }
    return render(request, "depot/dashboard.html", context)


@login_required
def package_list(request):
    status_filter = request.GET.get("status", "")
    station_filter = request.GET.get("station", "")
    search = request.GET.get("search", "")
    qs = Package.objects.select_related("station", "checked_in_by")
    if status_filter:
        qs = qs.filter(status=status_filter)
    if station_filter:
        qs = qs.filter(station_id=station_filter)
    if search:
        qs = qs.filter(tracking_number__icontains=search) | qs.filter(receiver_name__icontains=search) | qs.filter(receiver_phone__icontains=search)
    packages = qs.order_by("-checked_in_at")
    stations = Package.objects.values_list("station__id", "station__name").distinct()
    context = {
        "packages": packages,
        "status_filter": status_filter,
        "station_filter": station_filter,
        "search": search,
        "status_choices": Package.STATUS_CHOICES,
        "stations": stations,
        "active_tab": "packages",
    }
    return render(request, "depot/package_list.html", context)


@login_required
def package_detail(request, pk):
    package = get_object_or_404(Package, pk=pk)
    reminders = package.reminders.all().order_by("-sent_at")
    alerts = package.retention_alerts.all().order_by("-triggered_at")
    abnormals = package.abnormal_records.all().order_by("-registered_at")
    complaints = package.complaints.all().order_by("-created_at")
    returns = package.returned_records.all().order_by("-returned_at")
    context = {
        "package": package,
        "reminders": reminders,
        "alerts": alerts,
        "abnormals": abnormals,
        "complaints": complaints,
        "returns": returns,
        "active_tab": "packages",
    }
    return render(request, "depot/package_detail.html", context)


@login_required
def package_checkin(request):
    if request.method == "POST":
        form = PackageCheckinForm(request.POST)
        if form.is_valid():
            package = form.save(commit=False)
            try:
                staff = request.user.staff
            except Staff.DoesNotExist:
                staff = None
            package.checked_in_by = staff
            package.status = "checked_in"
            package.save()
            return redirect("depot:package_detail", pk=package.pk)
    else:
        form = PackageCheckinForm()
    context = {"form": form, "active_tab": "packages"}
    return render(request, "depot/package_checkin.html", context)


@login_required
def package_status_update(request, pk):
    package = get_object_or_404(Package, pk=pk)
    new_status = request.POST.get("new_status", "")
    if new_status and new_status in dict(Package.STATUS_CHOICES):
        package.status = new_status
        if new_status == "picked_up":
            package.picked_up_at = timezone.now()
            package.picked_up_by_name = request.POST.get("picked_up_by_name", "")
        package.save()
    if request.htmx:
        return render(request, "depot/partials/package_status_badge.html", {"package": package})
    return redirect("depot:package_detail", pk=package.pk)


@login_required
def reminder_list(request):
    role = get_user_role(request)
    status_filter = request.GET.get("status", "")
    response_filter = request.GET.get("response", "")

    if role == "clerk" and not status_filter and not response_filter:
        response_filter = "no_response"

    qs = PickupReminder.objects.select_related("package", "package__station", "sent_by")
    if status_filter:
        qs = qs.filter(status=status_filter)
    if response_filter:
        qs = qs.filter(response=response_filter)
    reminders = qs.order_by("-sent_at")
    context = {
        "reminders": reminders,
        "status_filter": status_filter,
        "response_filter": response_filter,
        "status_choices": PickupReminder.STATUS_CHOICES,
        "response_choices": PickupReminder.RESPONSE_CHOICES,
        "active_tab": "reminders",
    }
    return render(request, "depot/reminder_list.html", context)


@login_required
def reminder_create(request, package_pk):
    package = get_object_or_404(Package, pk=package_pk)
    if request.method == "POST":
        form = PickupReminderForm(request.POST)
        if form.is_valid():
            reminder = form.save(commit=False)
            reminder.package = package
            try:
                reminder.sent_by = request.user.staff
            except Staff.DoesNotExist:
                pass
            reminder.save()
            if package.status == "checked_in":
                package.status = "pending_pickup"
                package.save(update_fields=["status"])
            return redirect("depot:package_detail", pk=package.pk)
    else:
        form = PickupReminderForm()
    context = {"form": form, "package": package, "active_tab": "reminders"}
    return render(request, "depot/reminder_create.html", context)


@login_required
def reminder_response(request, pk):
    reminder = get_object_or_404(PickupReminder, pk=pk)
    if request.method == "POST":
        form = PickupReminderResponseForm(request.POST, instance=reminder)
        if form.is_valid():
            reminder = form.save()
            if reminder.response == "confirmed_pickup":
                reminder.package.status = "picked_up"
                reminder.package.picked_up_at = timezone.now()
                reminder.package.save(update_fields=["status", "picked_up_at"])
    if request.htmx:
        return render(request, "depot/partials/reminder_row.html", {"reminder": reminder})
    return redirect("depot:reminder_list")


@login_required
def retention_list(request):
    role = get_user_role(request)
    level_filter = request.GET.get("level", "")
    resolved_filter = request.GET.get("resolved", "")

    if role == "supervisor" and not resolved_filter:
        resolved_filter = "no"

    qs = RetentionAlert.objects.select_related("package", "package__station", "resolved_by")
    if level_filter:
        qs = qs.filter(alert_level=level_filter)
    if resolved_filter == "yes":
        qs = qs.filter(is_resolved=True)
    elif resolved_filter == "no":
        qs = qs.filter(is_resolved=False)
    alerts = qs.order_by("-triggered_at")
    context = {
        "alerts": alerts,
        "level_filter": level_filter,
        "resolved_filter": resolved_filter,
        "level_choices": RetentionAlert.ALERT_LEVEL_CHOICES,
        "active_tab": "retention",
    }
    return render(request, "depot/retention_list.html", context)


@login_required
def retention_resolve(request, pk):
    alert = get_object_or_404(RetentionAlert, pk=pk)
    if request.method == "POST":
        note = request.POST.get("resolution_note", "")
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        alert.resolution_note = note
        try:
            alert.resolved_by = request.user.staff
        except Staff.DoesNotExist:
            pass
        alert.save()
    if request.htmx:
        return render(request, "depot/partials/retention_row.html", {"alert": alert})
    return redirect("depot:retention_list")


@login_required
def abnormal_list(request):
    role = get_user_role(request)
    type_filter = request.GET.get("type", "")
    status_filter = request.GET.get("status", "")

    if role == "clerk" and not status_filter:
        status_filter = "pending"

    qs = AbnormalPackage.objects.select_related("package", "package__station", "registered_by", "resolved_by")
    if type_filter:
        qs = qs.filter(abnormal_type=type_filter)
    if status_filter:
        qs = qs.filter(status=status_filter)
    abnormals = qs.order_by("-registered_at")
    context = {
        "abnormals": abnormals,
        "type_filter": type_filter,
        "status_filter": status_filter,
        "type_choices": AbnormalPackage.ABNORMAL_TYPE_CHOICES,
        "status_choices": AbnormalPackage.STATUS_CHOICES,
        "active_tab": "abnormals",
    }
    return render(request, "depot/abnormal_list.html", context)


@login_required
def abnormal_detail(request, pk):
    abnormal = get_object_or_404(AbnormalPackage, pk=pk)
    if request.method == "POST":
        form = AbnormalResolveForm(request.POST, instance=abnormal)
        if form.is_valid():
            abnormal = form.save(commit=False)
            if abnormal.status == "resolved":
                abnormal.resolved_at = timezone.now()
                try:
                    abnormal.resolved_by = request.user.staff
                except Staff.DoesNotExist:
                    pass
                if abnormal.package.status == "abnormal":
                    abnormal.package.status = "returned"
                    abnormal.package.save(update_fields=["status"])
            abnormal.save()
            return redirect("depot:abnormal_detail", pk=abnormal.pk)
    else:
        form = AbnormalResolveForm(instance=abnormal)
    context = {
        "abnormal": abnormal,
        "form": form,
        "active_tab": "abnormals",
    }
    return render(request, "depot/abnormal_detail.html", context)


@login_required
def abnormal_register(request):
    package_pk = request.GET.get("package", "")
    selected_package = None
    if package_pk:
        try:
            selected_package = Package.objects.get(pk=package_pk)
        except (Package.DoesNotExist, ValueError):
            selected_package = None

    if request.method == "POST":
        form = AbnormalPackageForm(request.POST)
        if form.is_valid():
            abnormal = form.save(commit=False)
            try:
                abnormal.registered_by = request.user.staff
            except Staff.DoesNotExist:
                pass
            abnormal.save()
            if abnormal.package:
                abnormal.package.status = "abnormal"
                abnormal.package.save(update_fields=["status"])
            return redirect("depot:abnormal_detail", pk=abnormal.pk)
    else:
        initial = {}
        if selected_package:
            initial["package"] = selected_package.pk
        form = AbnormalPackageForm(initial=initial)
    context = {
        "form": form,
        "selected_package": selected_package,
        "active_tab": "abnormals",
    }
    return render(request, "depot/abnormal_register.html", context)


@login_required
def complaint_list(request):
    role = get_user_role(request)
    type_filter = request.GET.get("type", "")
    status_filter = request.GET.get("status", "")

    if role == "cs_specialist" and not status_filter:
        status_filter = "pending"

    qs = Complaint.objects.select_related("station", "package", "accepted_by")
    if type_filter:
        qs = qs.filter(complaint_type=type_filter)
    if status_filter:
        qs = qs.filter(status=status_filter)
    complaints = qs.order_by("-created_at")
    context = {
        "complaints": complaints,
        "type_filter": type_filter,
        "status_filter": status_filter,
        "type_choices": Complaint.COMPLAINT_TYPE_CHOICES,
        "status_choices": Complaint.STATUS_CHOICES,
        "active_tab": "complaints",
    }
    return render(request, "depot/complaint_list.html", context)


@login_required
def complaint_detail(request, pk):
    complaint = get_object_or_404(Complaint, pk=pk)
    responsibilities = complaint.responsibilities.all().order_by("-created_at")
    if request.method == "POST":
        form = ComplaintProcessForm(request.POST, instance=complaint)
        if form.is_valid():
            complaint = form.save(commit=False)
            if complaint.status == "accepted" and not complaint.accepted_at:
                complaint.accepted_at = timezone.now()
                try:
                    complaint.accepted_by = request.user.staff
                except Staff.DoesNotExist:
                    pass
            if complaint.status in ["resolved", "closed"]:
                complaint.resolved_at = timezone.now()
            complaint.save()
            return redirect("depot:complaint_detail", pk=complaint.pk)
    else:
        form = ComplaintProcessForm(instance=complaint)
    context = {
        "complaint": complaint,
        "responsibilities": responsibilities,
        "form": form,
        "active_tab": "complaints",
    }
    return render(request, "depot/complaint_detail.html", context)


@login_required
def complaint_create(request):
    if request.method == "POST":
        form = ComplaintCreateForm(request.POST)
        if form.is_valid():
            complaint = form.save()
            return redirect("depot:complaint_detail", pk=complaint.pk)
    else:
        initial = {}
        package_pk = request.GET.get("package", "")
        if package_pk:
            try:
                pkg = Package.objects.get(pk=package_pk)
                initial["package"] = pkg
                initial["station"] = pkg.station
            except Package.DoesNotExist:
                pass
        form = ComplaintCreateForm(initial=initial)
    context = {"form": form, "active_tab": "complaints"}
    return render(request, "depot/complaint_create.html", context)


@login_required
def responsibility_create(request, complaint_pk):
    complaint = get_object_or_404(Complaint, pk=complaint_pk)
    if request.method == "POST":
        form = ResponsibilityForm(request.POST)
        if form.is_valid():
            resp = form.save(commit=False)
            resp.complaint = complaint
            try:
                resp.created_by = request.user.staff
            except Staff.DoesNotExist:
                pass
            resp.save()
            return redirect("depot:complaint_detail", pk=complaint.pk)
    else:
        form = ResponsibilityForm()
    context = {"form": form, "complaint": complaint, "active_tab": "complaints"}
    return render(request, "depot/responsibility_create.html", context)


@login_required
def responsibility_confirm(request, pk):
    resp = get_object_or_404(Responsibility, pk=pk)
    if request.method == "POST":
        action = request.POST.get("action", "")
        if action == "confirm":
            resp.status = "confirmed"
        elif action == "execute":
            resp.status = "executed"
        elif action == "appeal":
            resp.status = "appealed"
            resp.appeal_note = request.POST.get("appeal_note", "")
            resp.appeal_at = timezone.now()
        resp.save()
    if request.htmx:
        return HttpResponse("")
    return redirect("depot:complaint_detail", pk=resp.complaint.pk)


@login_required
def responsibility_list(request):
    role = get_user_role(request)
    status_filter = request.GET.get("status", "")

    if role == "supervisor" and not status_filter:
        status_filter = "pending"

    qs = Responsibility.objects.select_related(
        "responsible_staff", "complaint", "complaint__station", "created_by"
    )
    if status_filter:
        qs = qs.filter(status=status_filter)
    responsibilities = qs.order_by("-created_at")
    context = {
        "responsibilities": responsibilities,
        "status_filter": status_filter,
        "status_choices": Responsibility.STATUS_CHOICES,
        "active_tab": "responsibilities",
    }
    return render(request, "depot/responsibility_list.html", context)


@login_required
def return_list(request):
    reason_filter = request.GET.get("reason", "")
    qs = ReturnRecord.objects.select_related("package", "package__station", "returned_by")
    if reason_filter:
        qs = qs.filter(return_reason=reason_filter)
    returns = qs.order_by("-returned_at")
    context = {
        "returns": returns,
        "reason_filter": reason_filter,
        "reason_choices": ReturnRecord.RETURN_REASON_CHOICES,
        "active_tab": "returns",
    }
    return render(request, "depot/return_list.html", context)


@login_required
def return_create(request, package_pk):
    package = get_object_or_404(Package, pk=package_pk)
    if request.method == "POST":
        form = ReturnRecordForm(request.POST)
        if form.is_valid():
            ret = form.save(commit=False)
            ret.package = package
            try:
                ret.returned_by = request.user.staff
            except Staff.DoesNotExist:
                pass
            ret.save()
            package.status = "returned"
            package.save(update_fields=["status"])
            return redirect("depot:package_detail", pk=package.pk)
    else:
        form = ReturnRecordForm()
    context = {"form": form, "package": package, "active_tab": "returns"}
    return render(request, "depot/return_create.html", context)
