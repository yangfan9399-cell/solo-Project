from app import db
from datetime import datetime


class Room(db.Model):
    __tablename__ = "room"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    floor = db.Column(db.Integer, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    equipment = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="available")
    image_url = db.Column(db.String(255), default="")

    bookings = db.relationship("Booking", backref="room", lazy="dynamic")

    def __repr__(self):
        return f"<Room {self.name}>"


class Staff(db.Model):
    __tablename__ = "staff"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    skills = db.Column(db.Text, default="")
    phone = db.Column(db.String(20), default="")
    status = db.Column(db.String(20), default="available")

    assignments = db.relationship("StaffAssignment", backref="staff", lazy="dynamic")

    def __repr__(self):
        return f"<Staff {self.name}>"


class Booking(db.Model):
    __tablename__ = "booking"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("room.id"), nullable=False)
    client_name = db.Column(db.String(100), nullable=False)
    client_contact = db.Column(db.String(50), default="")
    attendees = db.Column(db.Integer, default=0)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="draft")
    notes = db.Column(db.Text, default="")
    total_cost = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    setup_requests = db.relationship("SetupRequest", backref="booking", lazy="dynamic")
    catering_requests = db.relationship("CateringRequest", backref="booking", lazy="dynamic")
    staff_assignments = db.relationship("StaffAssignment", backref="booking", lazy="dynamic")
    issue_reports = db.relationship("IssueReport", backref="booking", lazy="dynamic")
    cost_items = db.relationship("CostItem", backref="booking", lazy="dynamic")
    review = db.relationship("Review", backref="booking", uselist=False)

    STATUS_LABELS = {
        "draft": "草稿",
        "confirmed": "已确认",
        "in_progress": "进行中",
        "completed": "已完成",
        "cancelled": "已取消",
    }

    STATUS_COLORS = {
        "draft": "gray",
        "confirmed": "blue",
        "in_progress": "amber",
        "completed": "green",
        "cancelled": "red",
    }

    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def status_color(self):
        return self.STATUS_COLORS.get(self.status, "gray")

    def calculate_cost_summary(self):
        cost_items = self.cost_items.all()
        approved = sum(ci.amount for ci in cost_items if ci.status == "approved")
        pending = sum(ci.amount for ci in cost_items if ci.status == "pending")
        rejected = sum(ci.amount for ci in cost_items if ci.status == "rejected")
        total = approved + pending
        return {
            "total": total,
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
            "items": cost_items,
        }

    def __repr__(self):
        return f"<Booking {self.title}>"


def calculate_booking_total(cost_items):
    approved = sum(ci.amount for ci in cost_items if ci.status == "approved")
    pending = sum(ci.amount for ci in cost_items if ci.status == "pending")
    return approved + pending


class SetupRequest(db.Model):
    __tablename__ = "setup_request"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    layout_type = db.Column(db.String(50), nullable=False)
    requirements = db.Column(db.Text, default="")
    special_requests = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="pending")
    expected_complete = db.Column(db.DateTime)
    confirmed_at = db.Column(db.DateTime)

    STATUS_LABELS = {
        "pending": "待确认",
        "confirmed": "已确认",
        "in_progress": "布置中",
        "completed": "已完成",
    }

    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def __repr__(self):
        return f"<SetupRequest {self.id}>"


class CateringRequest(db.Model):
    __tablename__ = "catering_request"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    package_type = db.Column(db.String(50), nullable=False)
    pax = db.Column(db.Integer, default=0)
    extra_items = db.Column(db.Text, default="")
    equipment_needs = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="pending")
    serve_time = db.Column(db.DateTime)

    STATUS_LABELS = {
        "pending": "待确认",
        "confirmed": "已确认",
        "serving": "服务中",
        "completed": "已完成",
    }

    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def __repr__(self):
        return f"<CateringRequest {self.id}>"


class StaffAssignment(db.Model):
    __tablename__ = "staff_assignment"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id"), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    shift_start = db.Column(db.DateTime, nullable=False)
    shift_end = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="assigned")

    STATUS_LABELS = {
        "assigned": "已分配",
        "checked_in": "已签到",
        "completed": "已完成",
        "absent": "缺席",
    }

    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def __repr__(self):
        return f"<StaffAssignment {self.id}>"


class IssueReport(db.Model):
    __tablename__ = "issue_report"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    priority = db.Column(db.String(20), default="medium")
    status = db.Column(db.String(20), default="open")
    reported_by = db.Column(db.String(100), default="")
    assigned_to = db.Column(db.String(100), default="")
    resolution = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

    PRIORITY_LABELS = {
        "low": "低",
        "medium": "中",
        "high": "高",
        "urgent": "紧急",
    }

    STATUS_LABELS = {
        "open": "待处理",
        "in_progress": "处理中",
        "resolved": "已解决",
        "closed": "已关闭",
    }

    def priority_label(self):
        return self.PRIORITY_LABELS.get(self.priority, self.priority)

    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def __repr__(self):
        return f"<IssueReport {self.title}>"


class CostItem(db.Model):
    __tablename__ = "cost_item"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200), default="")
    amount = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), default="pending")
    approved_by = db.Column(db.String(100), default="")
    approved_at = db.Column(db.DateTime)
    comment = db.Column(db.Text, default="")

    STATUS_LABELS = {
        "pending": "待审批",
        "approved": "已审批",
        "rejected": "已退回",
    }

    def status_label(self):
        return self.STATUS_LABELS.get(self.status, self.status)

    def __repr__(self):
        return f"<CostItem {self.category}>"


class Review(db.Model):
    __tablename__ = "review"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    overall_rating = db.Column(db.Integer, default=0)
    service_rating = db.Column(db.Integer, default=0)
    facility_rating = db.Column(db.Integer, default=0)
    issues_summary = db.Column(db.Text, default="")
    improvements = db.Column(db.Text, default="")
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Review {self.id}>"
