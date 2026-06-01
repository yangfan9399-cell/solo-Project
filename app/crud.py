from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models import User, ReworkOrder, ReworkStep, ProcessGuide, Inspection, StatusLog, ExceptionFeedback
from app.schemas import UserCreate, ReworkOrderCreate, ReworkOrderUpdate, ProcessGuideCreate, InspectionCreate, ExceptionFeedbackCreate
from app.constants import ReworkStatus


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate):
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_rework_order(db: Session, rework: ReworkOrderCreate, creator_id: int):
    order_no = f"RW{datetime.now().strftime('%Y%m%d%H%M%S')}"
    db_rework = ReworkOrder(
        **rework.model_dump(exclude={"steps"}),
        order_no=order_no,
        creator_id=creator_id,
        status=ReworkStatus.PENDING
    )
    db.add(db_rework)
    db.flush()

    for step in rework.steps:
        db_step = ReworkStep(**step.model_dump(), rework_order_id=db_rework.id)
        db.add(db_step)

    db.commit()
    db.refresh(db_rework)
    return db_rework


def get_rework_order(db: Session, rework_id: int):
    return db.query(ReworkOrder).filter(ReworkOrder.id == rework_id).first()


def get_rework_order_by_no(db: Session, order_no: str):
    return db.query(ReworkOrder).filter(ReworkOrder.order_no == order_no).first()


def get_rework_orders(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(ReworkOrder).order_by(desc(ReworkOrder.created_at))
    if status:
        query = query.filter(ReworkOrder.status == status)
    return query.offset(skip).limit(limit).all()


def update_rework_order(db: Session, rework_id: int, rework_update: ReworkOrderUpdate):
    db_rework = get_rework_order(db, rework_id)
    if db_rework:
        update_data = rework_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_rework, key, value)
        db.commit()
        db.refresh(db_rework)
    return db_rework


def update_rework_status(db: Session, rework_id: int, new_status: ReworkStatus, operator_id: int, remarks: str = None):
    db_rework = get_rework_order(db, rework_id)
    if db_rework:
        old_status = db_rework.status
        db_rework.status = new_status
        
        log = StatusLog(
            rework_order_id=rework_id,
            from_status=old_status,
            to_status=new_status,
            operator_id=operator_id,
            remarks=remarks
        )
        db.add(log)
        
        if new_status in [ReworkStatus.APPROVED, ReworkStatus.SCRAP_APPROVED]:
            db_rework.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_rework)
    return db_rework


def complete_rework_step(db: Session, step_id: int):
    db_step = db.query(ReworkStep).filter(ReworkStep.id == step_id).first()
    if db_step:
        db_step.is_completed = 1
        db_step.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_step)
    return db_step


def create_process_guide(db: Session, guide: ProcessGuideCreate, author_id: int):
    db_guide = ProcessGuide(**guide.model_dump(), author_id=author_id)
    db.add(db_guide)
    db.commit()
    db.refresh(db_guide)
    return db_guide


def get_process_guides(db: Session, skip: int = 0, limit: int = 100, category: str = None):
    query = db.query(ProcessGuide).order_by(desc(ProcessGuide.created_at))
    if category:
        query = query.filter(ProcessGuide.defect_category == category)
    return query.offset(skip).limit(limit).all()


def get_process_guide(db: Session, guide_id: int):
    return db.query(ProcessGuide).filter(ProcessGuide.id == guide_id).first()


def create_inspection(db: Session, inspection: InspectionCreate, rework_id: int, inspector_id: int):
    db_inspection = Inspection(
        **inspection.model_dump(),
        rework_order_id=rework_id,
        inspector_id=inspector_id
    )
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)
    return db_inspection


def get_inspections_by_rework(db: Session, rework_id: int):
    return db.query(Inspection).filter(Inspection.rework_order_id == rework_id).order_by(desc(Inspection.created_at)).all()


def get_status_logs_by_rework(db: Session, rework_id: int):
    return db.query(StatusLog).filter(StatusLog.rework_order_id == rework_id).order_by(StatusLog.created_at).all()


def create_exception_feedback(db: Session, feedback: ExceptionFeedbackCreate, reporter_id: int):
    db_feedback = ExceptionFeedback(**feedback.model_dump(), reporter_id=reporter_id)
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_exception_feedbacks(db: Session, skip: int = 0, limit: int = 100, status: str = None):
    query = db.query(ExceptionFeedback).order_by(desc(ExceptionFeedback.created_at))
    if status:
        query = query.filter(ExceptionFeedback.status == status)
    return query.offset(skip).limit(limit).all()


def get_exception_feedback(db: Session, feedback_id: int):
    return db.query(ExceptionFeedback).filter(ExceptionFeedback.id == feedback_id).first()


def resolve_exception_feedback(db: Session, feedback_id: int):
    db_feedback = get_exception_feedback(db, feedback_id)
    if db_feedback:
        db_feedback.status = "resolved"
        db_feedback.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(db_feedback)
    return db_feedback


def get_quality_statistics(db: Session):
    total = db.query(func.count(ReworkOrder.id)).scalar()
    pending = db.query(func.count(ReworkOrder.id)).filter(ReworkOrder.status == ReworkStatus.PENDING).scalar()
    in_progress = db.query(func.count(ReworkOrder.id)).filter(
        ReworkOrder.status.in_([ReworkStatus.ASSIGNED, ReworkStatus.IN_PROGRESS, ReworkStatus.REINSPECTION])
    ).scalar()
    completed = db.query(func.count(ReworkOrder.id)).filter(ReworkOrder.status == ReworkStatus.APPROVED).scalar()
    scrap = db.query(func.count(ReworkOrder.id)).filter(ReworkOrder.status == ReworkStatus.SCRAP_APPROVED).scalar()

    by_category = db.query(
        ReworkOrder.defect_category,
        func.count(ReworkOrder.id)
    ).group_by(ReworkOrder.defect_category).all()

    by_month = db.query(
        func.strftime('%Y-%m', ReworkOrder.created_at),
        func.count(ReworkOrder.id)
    ).group_by(func.strftime('%Y-%m', ReworkOrder.created_at)).order_by(func.strftime('%Y-%m', ReworkOrder.created_at)).all()

    return {
        "total_reworks": total,
        "pending_count": pending,
        "in_progress_count": in_progress,
        "completed_count": completed,
        "scrap_count": scrap,
        "by_defect_category": {cat: cnt for cat, cnt in by_category},
        "by_month": {month: cnt for month, cnt in by_month}
    }
