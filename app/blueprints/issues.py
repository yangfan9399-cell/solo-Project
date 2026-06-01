from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import IssueReport, Booking
from app import db
from datetime import datetime

issues_bp = Blueprint("issues", __name__)

@issues_bp.route("/")
def list_issues():
    status_filter = request.args.get("status", "")
    priority_filter = request.args.get("priority", "")
    query = IssueReport.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    issues = query.order_by(IssueReport.created_at.desc()).all()
    return render_template("issues/list.html", issues=issues, status_filter=status_filter, priority_filter=priority_filter)

@issues_bp.route("/new", methods=["GET", "POST"])
def new_issue():
    bookings = Booking.query.filter(Booking.status.in_(["confirmed", "in_progress"])).order_by(Booking.start_time).all()
    if request.method == "POST":
        issue = IssueReport(
            booking_id=request.form.get("booking_id", type=int),
            title=request.form.get("title"),
            description=request.form.get("description", ""),
            priority=request.form.get("priority", "medium"),
            reported_by=request.form.get("reported_by", ""),
            assigned_to=request.form.get("assigned_to", ""),
            status="open",
        )
        db.session.add(issue)
        db.session.commit()
        flash("问题反馈提交成功", "success")
        return redirect(url_for("issues.detail", id=issue.id))
    return render_template("issues/form.html", issue=None, bookings=bookings)

@issues_bp.route("/<int:id>")
def detail(id):
    issue = IssueReport.query.get_or_404(id)
    return render_template("issues/detail.html", issue=issue)

@issues_bp.route("/<int:id>/resolve", methods=["POST"])
def resolve_issue(id):
    issue = IssueReport.query.get_or_404(id)
    new_status = request.form.get("status", "")
    resolution = request.form.get("resolution", "")
    if new_status in ["in_progress", "resolved", "closed"]:
        issue.status = new_status
        if resolution:
            issue.resolution = resolution
        if new_status == "resolved":
            issue.resolved_at = datetime.utcnow()
        db.session.commit()
        flash(f"问题状态已更新为{issue.status_label()}", "success")
    else:
        flash("无效的状态变更", "error")
    return redirect(url_for("issues.detail", id=issue.id))
