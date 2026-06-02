from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from enum import Enum

db = SQLAlchemy()

class EventStatus(Enum):
    PENDING = '待处理'
    ON_SITE = '现场处置中'
    REPORTED = '已报案'
    FOLLOW_UP = '跟进中'
    SETTLED = '已结案'
    CLOSED = '已归档'

class InjurySeverity(Enum):
    MINOR = '轻微'
    MODERATE = '一般'
    SEVERE = '严重'
    CRITICAL = '危重'

class UserRole(Enum):
    DUTY = '场馆值班员'
    MEDICAL = '医务点人员'
    INSURANCE = '保险联络员'

class VenueActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    activity_name = db.Column(db.String(200), nullable=False)
    venue = db.Column(db.String(100), nullable=False)
    activity_type = db.Column(db.String(100))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    participant_count = db.Column(db.Integer, default=0)
    organizer = db.Column(db.String(100))
    contact_phone = db.Column(db.String(20))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    injuries = db.relationship('InjuryEvent', backref='activity', lazy=True)

class InjuryEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_no = db.Column(db.String(50), unique=True, nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('venue_activity.id'), nullable=False)
    reporter_name = db.Column(db.String(100), nullable=False)
    reporter_role = db.Column(db.String(50), nullable=False)
    injured_name = db.Column(db.String(100), nullable=False)
    injured_gender = db.Column(db.String(10))
    injured_age = db.Column(db.Integer)
    injury_time = db.Column(db.DateTime, nullable=False)
    injury_location = db.Column(db.String(200), nullable=False)
    injury_type = db.Column(db.String(100), nullable=False)
    injury_part = db.Column(db.String(100))
    severity = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='待处理')
    risk_level = db.Column(db.String(20), default='medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    treatments = db.relationship('OnSiteTreatment', backref='event', lazy=True, cascade='all, delete-orphan')
    evidences = db.relationship('Evidence', backref='event', lazy=True, cascade='all, delete-orphan')
    insurance_reports = db.relationship('InsuranceReport', backref='event', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('ReviewRectification', backref='event', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('CompensationPayment', backref='event', lazy=True, cascade='all, delete-orphan')
    feedbacks = db.relationship('ExceptionFeedback', backref='event', lazy=True, cascade='all, delete-orphan')

class OnSiteTreatment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('injury_event.id'), nullable=False)
    handler_name = db.Column(db.String(100), nullable=False)
    treatment_time = db.Column(db.DateTime, default=datetime.utcnow)
    measures = db.Column(db.Text, nullable=False)
    vital_signs = db.Column(db.String(200))
    medication = db.Column(db.Text)
    referred = db.Column(db.Boolean, default=False)
    referral_hospital = db.Column(db.String(200))
    next_steps = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Evidence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('injury_event.id'), nullable=False)
    evidence_type = db.Column(db.String(50), nullable=False)
    file_name = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500))
    description = db.Column(db.Text)
    uploader = db.Column(db.String(100))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

class InsuranceReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('injury_event.id'), nullable=False)
    report_no = db.Column(db.String(100), unique=True)
    reporter = db.Column(db.String(100), nullable=False)
    report_time = db.Column(db.DateTime, default=datetime.utcnow)
    insurance_company = db.Column(db.String(200))
    policy_no = db.Column(db.String(100))
    claimant_name = db.Column(db.String(100))
    claimant_contact = db.Column(db.String(50))
    estimated_amount = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='已报案')
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ReviewRectification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('injury_event.id'), nullable=False)
    reviewer = db.Column(db.String(100), nullable=False)
    review_time = db.Column(db.DateTime, default=datetime.utcnow)
    root_cause = db.Column(db.Text, nullable=False)
    improvement_measures = db.Column(db.Text, nullable=False)
    responsible_person = db.Column(db.String(100))
    deadline = db.Column(db.DateTime)
    completed = db.Column(db.Boolean, default=False)
    completion_note = db.Column(db.Text)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CompensationPayment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('injury_event.id'), nullable=False)
    insurance_report_id = db.Column(db.Integer, db.ForeignKey('insurance_report.id'))
    payment_no = db.Column(db.String(100))
    payment_time = db.Column(db.DateTime)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(100))
    payee = db.Column(db.String(100))
    status = db.Column(db.String(50), default='处理中')
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ExceptionFeedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('injury_event.id'), nullable=False)
    feedback_type = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    feedback_by = db.Column(db.String(100), nullable=False)
    feedback_time = db.Column(db.DateTime, default=datetime.utcnow)
    handled = db.Column(db.Boolean, default=False)
    handle_note = db.Column(db.Text)
    handled_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
