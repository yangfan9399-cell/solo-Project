from flask import Blueprint, render_template, request
from app.models import Booking, IssueReport, Room
from datetime import datetime, timedelta
from app import db

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/")
def index():
    now = datetime.now()
    week_offset = request.args.get("week_offset", 0, type=int)
    week_start = now + timedelta(weeks=week_offset)
    week_start = week_start - timedelta(days=week_start.weekday())
    week_end = week_start + timedelta(days=7)

    upcoming_bookings = Booking.query.filter(
        Booking.start_time >= now,
        Booking.status.in_(["confirmed", "in_progress"])
    ).order_by(Booking.start_time).limit(5).all()

    today_bookings = Booking.query.filter(
        db.func.date(Booking.start_time) == now.date(),
        Booking.status.in_(["confirmed", "in_progress"])
    ).all()

    open_issues = IssueReport.query.filter(
        IssueReport.status.in_(["open", "in_progress"])
    ).order_by(IssueReport.created_at.desc()).all()

    pending_setups = Booking.query.filter(
        Booking.status == "confirmed",
        Booking.start_time >= now
    ).order_by(Booking.start_time).limit(5).all()

    stats = {
        "total_bookings": Booking.query.count(),
        "confirmed_bookings": Booking.query.filter_by(status="confirmed").count(),
        "in_progress": Booking.query.filter_by(status="in_progress").count(),
        "open_issues": IssueReport.query.filter(IssueReport.status.in_(["open", "in_progress"])).count(),
        "available_rooms": Room.query.filter_by(status="available").count(),
        "total_rooms": Room.query.count(),
    }

    week_bookings = Booking.query.filter(
        Booking.start_time >= week_start,
        Booking.start_time < week_end,
        Booking.status != "cancelled"
    ).all()

    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    calendar_days = []
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        day_bookings = [b for b in week_bookings if b.start_time.date() == day_date.date()]
        calendar_days.append({
            "date": day_date,
            "name": day_names[i],
            "is_today": day_date.date() == now.date(),
            "bookings": day_bookings,
        })

    return render_template("dashboard/index.html",
        upcoming_bookings=upcoming_bookings,
        today_bookings=today_bookings,
        open_issues=open_issues,
        pending_setups=pending_setups,
        stats=stats,
        calendar_days=calendar_days,
        week_start=week_start,
        week_offset=week_offset,
        now=now
    )
