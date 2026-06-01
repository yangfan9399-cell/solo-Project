from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import Staff, StaffAssignment, Booking, CostItem
from app import db
from datetime import datetime, timedelta
from app.blueprints.costs import update_booking_total_cost

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
        db.session.flush()

        hours = (shift_end - shift_start).total_seconds() / 3600
        cost_amount = max(200, hours * 50)
        staff = Staff.query.get(staff_id)
        cost = CostItem(
            booking_id=booking_id,
            category="人员费",
            description=f"{staff.name}-{role} {hours:.1f}小时",
            amount=cost_amount,
            status="pending",
        )
        db.session.add(cost)
        db.session.commit()
        update_booking_total_cost(booking_id)

        flash("排班分配成功，已生成待审批费用项", "success")
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


@staffs_bp.route("/assignments/<int:id>/checkin", methods=["POST"])
def checkin_assignment(id):
    assignment = StaffAssignment.query.get_or_404(id)
    if assignment.status == "assigned":
        assignment.status = "checked_in"
        db.session.commit()
        flash("已签到", "success")
    else:
        flash("仅已分配状态可签到", "error")
    return redirect(request.referrer or url_for("staffs.schedule"))


@staffs_bp.route("/assignments/<int:id>/complete", methods=["POST"])
def complete_assignment(id):
    assignment = StaffAssignment.query.get_or_404(id)
    if assignment.status == "checked_in":
        assignment.status = "completed"
        db.session.commit()
        flash("排班已完成", "success")
    else:
        flash("仅已签到状态可完成", "error")
    return redirect(request.referrer or url_for("staffs.schedule"))


@staffs_bp.route("/assignments/<int:id>/absent", methods=["POST"])
def mark_absent(id):
    assignment = StaffAssignment.query.get_or_404(id)
    if assignment.status in ["assigned", "checked_in"]:
        assignment.status = "absent"
        db.session.commit()
        flash("已标记为缺席", "warning")
    else:
        flash("该状态不可标记缺席", "error")
    return redirect(request.referrer or url_for("staffs.schedule"))
