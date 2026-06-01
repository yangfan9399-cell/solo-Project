from django.utils import timezone
from .models import Package, RetentionAlert


def check_retention_alerts():
    now = timezone.now()
    pending_packages = Package.objects.filter(
        status__in=["checked_in", "pending_pickup", "retention"]
    )
    alerts_created = []
    for pkg in pending_packages:
        days = (now - pkg.checked_in_at).days
        if days < 3:
            continue
        if days >= 7:
            level = "urgent"
        elif days >= 5:
            level = "critical"
        else:
            level = "warning"
        existing = RetentionAlert.objects.filter(
            package=pkg, alert_level=level, is_resolved=False
        ).exists()
        if not existing:
            alert = RetentionAlert.objects.create(
                package=pkg,
                alert_level=level,
                days_retained=days,
            )
            alerts_created.append(alert)
            if pkg.status != "retention":
                pkg.status = "retention"
                pkg.save(update_fields=["status"])
    return alerts_created


def get_dashboard_stats():
    from .models import (
        Station, AbnormalPackage, Complaint,
        ReturnRecord, PickupReminder,
    )
    now = timezone.now()
    total_packages = Package.objects.count()
    pending_packages = Package.objects.filter(status__in=["checked_in", "pending_pickup"]).count()
    retention_packages = Package.objects.filter(status="retention").count()
    abnormal_packages = Package.objects.filter(status="abnormal").count()
    unresolved_alerts = RetentionAlert.objects.filter(is_resolved=False).count()
    urgent_alerts = RetentionAlert.objects.filter(is_resolved=False, alert_level="urgent").count()
    pending_abnormals = AbnormalPackage.objects.filter(status="pending").count()
    processing_abnormals = AbnormalPackage.objects.filter(status="processing").count()
    pending_complaints = Complaint.objects.filter(status="pending").count()
    processing_complaints = Complaint.objects.filter(status__in=["accepted", "processing"]).count()
    today_returns = ReturnRecord.objects.filter(
        returned_at__date=now.date()
    ).count()
    today_reminders = PickupReminder.objects.filter(
        sent_at__date=now.date()
    ).count()
    alert_level_counts = {}
    for level_key, level_label in RetentionAlert.ALERT_LEVEL_CHOICES:
        alert_level_counts[level_key] = RetentionAlert.objects.filter(
            is_resolved=False, alert_level=level_key
        ).count()
    station_stats = []
    for station in Station.objects.filter(is_active=True):
        s_pending = Package.objects.filter(station=station, status__in=["checked_in", "pending_pickup"]).count()
        s_retention = Package.objects.filter(station=station, status="retention").count()
        s_abnormal = Package.objects.filter(station=station, status="abnormal").count()
        station_stats.append({
            "station": station,
            "pending": s_pending,
            "retention": s_retention,
            "abnormal": s_abnormal,
        })
    return {
        "total_packages": total_packages,
        "pending_packages": pending_packages,
        "retention_packages": retention_packages,
        "abnormal_packages": abnormal_packages,
        "unresolved_alerts": unresolved_alerts,
        "urgent_alerts": urgent_alerts,
        "pending_abnormals": pending_abnormals,
        "processing_abnormals": processing_abnormals,
        "pending_complaints": pending_complaints,
        "processing_complaints": processing_complaints,
        "today_returns": today_returns,
        "today_reminders": today_reminders,
        "alert_level_counts": alert_level_counts,
        "station_stats": station_stats,
    }
