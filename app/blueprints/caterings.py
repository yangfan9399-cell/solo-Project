from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import CateringRequest, Booking, CostItem
from app import db
from datetime import datetime
from app.blueprints.costs import update_booking_total_cost

caterings_bp = Blueprint("caterings", __name__)

CATERING_COSTS = {
    "简约套餐": 40,
    "标准套餐": 50,
    "豪华套餐": 70,
    "尊享套餐": 100,
}


@caterings_bp.route("/")
def list_caterings():
    status_filter = request.args.get("status", "")
    query = CateringRequest.query.join(Booking)
    if status_filter:
        query = query.filter(CateringRequest.status == status_filter)
    caterings = query.order_by(CateringRequest.id.desc()).all()
    return render_template("caterings/list.html", caterings=caterings, status_filter=status_filter)


@caterings_bp.route("/new", methods=["GET", "POST"])
def new_catering():
    bookings = Booking.query.filter(Booking.status.in_(["confirmed", "draft"])).order_by(Booking.start_time).all()
    if request.method == "POST":
        booking_id = request.form.get("booking_id", type=int)
        package_type = request.form.get("package_type")
        pax = request.form.get("pax", 0, type=int)
        catering = CateringRequest(
            booking_id=booking_id,
            package_type=package_type,
            pax=pax,
            extra_items=request.form.get("extra_items", ""),
            equipment_needs=request.form.get("equipment_needs", ""),
            serve_time=datetime.strptime(request.form.get("serve_time"), "%Y-%m-%dT%H:%M") if request.form.get("serve_time") else None,
            status="pending",
        )
        db.session.add(catering)
        db.session.flush()

        cost_per_pax = CATERING_COSTS.get(package_type, 50)
        cost_amount = cost_per_pax * pax
        cost = CostItem(
            booking_id=booking_id,
            category="茶歇费",
            description=f"{package_type}×{pax}人",
            amount=cost_amount,
            status="pending",
        )
        db.session.add(cost)
        db.session.commit()
        update_booking_total_cost(booking_id)

        flash("茶歇设备需求创建成功，已生成待审批费用项", "success")
        return redirect(url_for("caterings.detail", id=catering.id))
    return render_template("caterings/form.html", catering=None, bookings=bookings, package_costs=CATERING_COSTS)


@caterings_bp.route("/<int:id>")
def detail(id):
    catering = CateringRequest.query.get_or_404(id)
    return render_template("caterings/detail.html", catering=catering)


@caterings_bp.route("/<int:id>/confirm", methods=["POST"])
def confirm_catering(id):
    catering = CateringRequest.query.get_or_404(id)
    if catering.status == "pending":
        catering.status = "confirmed"
        db.session.commit()
        flash("茶歇设备已确认", "success")
    else:
        flash("仅待确认状态可确认", "error")
    return redirect(url_for("caterings.detail", id=catering.id))


@caterings_bp.route("/<int:id>/start", methods=["POST"])
def start_catering(id):
    catering = CateringRequest.query.get_or_404(id)
    if catering.status == "confirmed":
        catering.status = "serving"
        db.session.commit()
        flash("茶歇服务已开始", "success")
    else:
        flash("仅已确认状态可开始服务", "error")
    return redirect(url_for("caterings.detail", id=catering.id))


@caterings_bp.route("/<int:id>/complete", methods=["POST"])
def complete_catering(id):
    catering = CateringRequest.query.get_or_404(id)
    if catering.status == "serving":
        catering.status = "completed"
        db.session.commit()
        flash("茶歇服务已完成", "success")
    else:
        flash("仅服务中状态可完成", "error")
    return redirect(url_for("caterings.detail", id=catering.id))
