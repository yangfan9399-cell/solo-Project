from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import Booking, Room, SetupRequest, CateringRequest, StaffAssignment, IssueReport, CostItem, Review
from app import db
from datetime import datetime

bookings_bp = Blueprint("bookings", __name__)

@bookings_bp.route("/")
def list_bookings():
    page = request.args.get("page", 1, type=int)
    per_page = 10
    status_filter = request.args.get("status", "")
    query = Booking.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    query = query.order_by(Booking.start_time.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return render_template("bookings/list.html", bookings=pagination.items, pagination=pagination, status_filter=status_filter)

@bookings_bp.route("/new", methods=["GET", "POST"])
def new_booking():
    rooms = Room.query.filter_by(status="available").order_by(Room.name).all()
    if request.method == "POST":
        booking = Booking(
            title=request.form.get("title"),
            room_id=request.form.get("room_id", type=int),
            client_name=request.form.get("client_name"),
            client_contact=request.form.get("client_contact", ""),
            attendees=request.form.get("attendees", 0, type=int),
            start_time=datetime.strptime(request.form.get("start_time"), "%Y-%m-%dT%H:%M"),
            end_time=datetime.strptime(request.form.get("end_time"), "%Y-%m-%dT%H:%M"),
            notes=request.form.get("notes", ""),
            status="draft",
        )
        db.session.add(booking)
        db.session.commit()
        flash("预订创建成功", "success")
        return redirect(url_for("bookings.detail", id=booking.id))
    return render_template("bookings/form.html", booking=None, rooms=rooms)

@bookings_bp.route("/<int:id>")
def detail(id):
    booking = Booking.query.get_or_404(id)
    setup_requests = booking.setup_requests.all()
    catering_requests = booking.catering_requests.all()
    staff_assignments = booking.staff_assignments.all()
    issue_reports = booking.issue_reports.all()
    cost_summary = booking.calculate_cost_summary()
    review = booking.review
    return render_template("bookings/detail.html", booking=booking, setup_requests=setup_requests, catering_requests=catering_requests, staff_assignments=staff_assignments, issue_reports=issue_reports, cost_summary=cost_summary, review=review)

@bookings_bp.route("/<int:id>/edit", methods=["GET", "POST"])
def edit_booking(id):
    booking = Booking.query.get_or_404(id)
    rooms = Room.query.order_by(Room.name).all()
    if request.method == "POST":
        booking.title = request.form.get("title")
        booking.room_id = request.form.get("room_id", type=int)
        booking.client_name = request.form.get("client_name")
        booking.client_contact = request.form.get("client_contact", "")
        booking.attendees = request.form.get("attendees", 0, type=int)
        booking.start_time = datetime.strptime(request.form.get("start_time"), "%Y-%m-%dT%H:%M")
        booking.end_time = datetime.strptime(request.form.get("end_time"), "%Y-%m-%dT%H:%M")
        booking.notes = request.form.get("notes", "")
        booking.updated_at = datetime.utcnow()
        db.session.commit()
        flash("预订更新成功", "success")
        return redirect(url_for("bookings.detail", id=booking.id))
    return render_template("bookings/form.html", booking=booking, rooms=rooms)

@bookings_bp.route("/<int:id>/status", methods=["POST"])
def update_status(id):
    booking = Booking.query.get_or_404(id)
    new_status = request.form.get("status")
    valid_transitions = {
        "draft": ["confirmed", "cancelled"],
        "confirmed": ["in_progress", "cancelled"],
        "in_progress": ["completed", "cancelled"],
    }
    if new_status in valid_transitions.get(booking.status, []):
        booking.status = new_status
        booking.updated_at = datetime.utcnow()
        db.session.commit()
        flash(f"预订状态已更新为{booking.status_label()}", "success")
    else:
        flash("无效的状态变更", "error")
    return redirect(url_for("bookings.detail", id=booking.id))

@bookings_bp.route("/<int:id>/delete", methods=["POST"])
def delete_booking(id):
    booking = Booking.query.get_or_404(id)
    if booking.status == "draft":
        db.session.delete(booking)
        db.session.commit()
        flash("预订已删除", "success")
    else:
        flash("仅草稿状态可删除", "error")
    return redirect(url_for("bookings.list_bookings"))
