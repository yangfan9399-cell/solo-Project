from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import SetupRequest, Booking, CostItem
from app import db
from datetime import datetime

setups_bp = Blueprint("setups", __name__)

SETUP_COSTS = {
    "剧院式": 2000,
    "课桌式": 1800,
    "U型": 1500,
    "宴会式": 2500,
    "中空式": 1600,
}


def update_booking_total_cost(booking_id):
    booking = Booking.query.get(booking_id)
    if booking:
        total = sum(ci.amount for ci in booking.cost_items if ci.status == "approved")
        booking.total_cost = total
        db.session.commit()


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
        booking_id = request.form.get("booking_id", type=int)
        layout_type = request.form.get("layout_type")
        setup = SetupRequest(
            booking_id=booking_id,
            layout_type=layout_type,
            requirements=request.form.get("requirements", ""),
            special_requests=request.form.get("special_requests", ""),
            expected_complete=datetime.strptime(request.form.get("expected_complete"), "%Y-%m-%dT%H:%M") if request.form.get("expected_complete") else None,
            status="pending",
        )
        db.session.add(setup)
        db.session.flush()

        cost_amount = SETUP_COSTS.get(layout_type, 1500)
        cost = CostItem(
            booking_id=booking_id,
            category="布场费",
            description=f"{layout_type}布置服务",
            amount=cost_amount,
            status="pending",
        )
        db.session.add(cost)
        db.session.commit()

        flash("布场需求创建成功，已生成待审批费用项", "success")
        return redirect(url_for("setups.detail", id=setup.id))
    return render_template("setups/form.html", setup=None, bookings=bookings, layout_costs=SETUP_COSTS)


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


@setups_bp.route("/<int:id>/start", methods=["POST"])
def start_setup(id):
    setup = SetupRequest.query.get_or_404(id)
    if setup.status == "confirmed":
        setup.status = "in_progress"
        db.session.commit()
        flash("布场已开始", "success")
    else:
        flash("仅已确认状态可开始布置", "error")
    return redirect(url_for("setups.detail", id=setup.id))


@setups_bp.route("/<int:id>/complete", methods=["POST"])
def complete_setup(id):
    setup = SetupRequest.query.get_or_404(id)
    if setup.status == "in_progress":
        setup.status = "completed"
        db.session.commit()
        flash("布场已完成", "success")
    else:
        flash("仅布置中状态可完成", "error")
    return redirect(url_for("setups.detail", id=setup.id))
