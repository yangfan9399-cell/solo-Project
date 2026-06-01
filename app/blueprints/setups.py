from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import SetupRequest, Booking
from app import db
from datetime import datetime

setups_bp = Blueprint("setups", __name__)

@setups_bp.route("/")
def list_setups():
    status_filter = request.args.get("status", "")
    query = SetupRequest.query.join(Booking)
    if status_filter:
        query = query.filter(SetupRequest.status == status_filter)
    setups = query.order_by(SetupRequest.id.desc()).all()
    return render_template("setups/list.html", setups=setups, status_filter=status_filter)

@setups_bp.route("/new", methods=["GET", "POST"])
def new_setup():
    bookings = Booking.query.filter(Booking.status.in_(["confirmed", "draft"])).order_by(Booking.start_time).all()
    if request.method == "POST":
        setup = SetupRequest(
            booking_id=request.form.get("booking_id", type=int),
            layout_type=request.form.get("layout_type"),
            requirements=request.form.get("requirements", ""),
            special_requests=request.form.get("special_requests", ""),
            expected_complete=datetime.strptime(request.form.get("expected_complete"), "%Y-%m-%dT%H:%M") if request.form.get("expected_complete") else None,
            status="pending",
        )
        db.session.add(setup)
        db.session.commit()
        flash("布场需求创建成功", "success")
        return redirect(url_for("setups.detail", id=setup.id))
    return render_template("setups/form.html", setup=None, bookings=bookings)

@setups_bp.route("/<int:id>")
def detail(id):
    setup = SetupRequest.query.get_or_404(id)
    return render_template("setups/detail.html", setup=setup)

@setups_bp.route("/<int:id>/confirm", methods=["POST"])
def confirm_setup(id):
    setup = SetupRequest.query.get_or_404(id)
    if setup.status == "pending":
        setup.status = "confirmed"
        setup.confirmed_at = datetime.utcnow()
        db.session.commit()
        flash("布场方案已确认", "success")
    else:
        flash("仅待确认状态可确认", "error")
    return redirect(url_for("setups.detail", id=setup.id))
