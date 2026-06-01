from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import Staff, StaffAssignment, Booking
from app import db
from datetime import datetime, timedelta

staffs_bp = Blueprint("staffs", __name__)

@staffs_bp.route("/")
def list_staffs():
    staffs = Staff.query.order_by(Staff.name).all()
    return render_template("staffs/list.html", staffs=staffs)

@staffs_bp.route("/<int:id>")
def detail(id):
    staff = Staff.query.get_or_404(id)
    assignments = staff.assignments.order_by(StaffAssignment.shift_start.desc()).all()
    return render_template("staffs/detail.html", staff=staff, assignments=assignments)

@staffs_bp.route("/schedule", methods=["GET", "POST"])
def schedule():
    week_offset = request.args.get("week_offset", 0, type=int)
    now = datetime.now()
    week_start = now + timedelta(weeks=week_offset)
    week_start = week_start - timedelta(days=week_start.weekday())
    week_end = week_start + timedelta(days=7)

    if request.method == "POST":
        booking_id = request.form.get("booking_id", type=int)
        staff_id = request.form.get("staff_id", type=int)
        role = request.form.get("role", "")
        shift_start = datetime.strptime(request.form.get("shift_start"), "%Y-%m-%dT%H:%M")
        shift_end = datetime.strptime(request.form.get("shift_end"), "%Y-%m-%dT%H:%M")
        assignment = StaffAssignment(
            booking_id=booking_id,
            staff_id=staff_id,
            role=role,
            shift_start=shift_start,
            shift_end=shift_end,
            status="assigned",
        )
        db.session.add(assignment)
        db.session.commit()
        flash("排班分配成功", "success")
        return redirect(url_for("staffs.schedule", week_offset=week_offset))

    assignments = StaffAssignment.query.filter(
        StaffAssignment.shift_start >= week_start,
        StaffAssignment.shift_start < week_end,
    ).all()
    staffs = Staff.query.order_by(Staff.name).all()
    bookings = Booking.query.filter(Booking.status.in_(["confirmed", "in_progress"])).order_by(Booking.start_time).all()

    schedule_data = {}
    for a in assignments:
        day_key = a.shift_start.strftime("%Y-%m-%d")
        if day_key not in schedule_data:
            schedule_data[day_key] = []
        schedule_data[day_key].append(a)

    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    calendar_days = []
    for i in range(7):
        day_date = week_start + timedelta(days=i)
        day_key = day_date.strftime("%Y-%m-%d")
        day_assignments = schedule_data.get(day_key, [])
        calendar_days.append({
            "date": day_date,
            "name": day_names[i],
            "key": day_key,
            "assignments": day_assignments,
        })

    week_end_str = (week_start + timedelta(days=6)).strftime("%m/%d")
    week_start_str = week_start.strftime("%m/%d")

    return render_template("staffs/schedule.html", calendar_days=calendar_days, staffs=staffs, bookings=bookings, week_start=week_start, week_start_str=week_start_str, week_end_str=week_end_str, week_offset=week_offset)
