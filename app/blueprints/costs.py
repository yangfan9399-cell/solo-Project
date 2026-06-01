from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import CostItem, Booking
from app import db
from datetime import datetime

costs_bp = Blueprint("costs", __name__)

@costs_bp.route("/")
def list_costs():
    status_filter = request.args.get("status", "")
    query = CostItem.query.join(Booking)
    if status_filter:
        query = query.filter(CostItem.status == status_filter)
    costs = query.order_by(CostItem.id.desc()).all()
    return render_template("costs/list.html", costs=costs, status_filter=status_filter)

@costs_bp.route("/<int:id>")
def detail(id):
    cost = CostItem.query.get_or_404(id)
    return render_template("costs/detail.html", cost=cost)

@costs_bp.route("/<int:id>/approve", methods=["POST"])
def approve_cost(id):
    cost = CostItem.query.get_or_404(id)
    action = request.form.get("action", "")
    comment = request.form.get("comment", "")
    if cost.status == "pending":
        if action == "approve":
            cost.status = "approved"
            cost.approved_by = "客户经理"
            cost.approved_at = datetime.utcnow()
            cost.comment = comment
            flash("费用已审批通过", "success")
        elif action == "reject":
            cost.status = "rejected"
            cost.approved_by = "客户经理"
            cost.approved_at = datetime.utcnow()
            cost.comment = comment
            flash("费用已退回", "warning")
        else:
            flash("无效的操作", "error")
        db.session.commit()
    else:
        flash("仅待审批状态可操作", "error")
    return redirect(url_for("costs.detail", id=cost.id))

@costs_bp.route("/<int:id>/adjust", methods=["POST"])
def adjust_cost(id):
    cost = CostItem.query.get_or_404(id)
    if cost.status in ["pending", "rejected"]:
        new_amount = request.form.get("amount", type=float)
        new_description = request.form.get("description", "")
        if new_amount is not None:
            cost.amount = new_amount
        if new_description:
            cost.description = new_description
        cost.status = "pending"
        cost.approved_by = ""
        cost.approved_at = None
        db.session.commit()
        flash("费用已调整", "success")
    else:
        flash("已审批的费用不可调整", "error")
    return redirect(url_for("costs.detail", id=cost.id))
