from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship

from app.database import Base
from app.constants import UserRole, ReworkStatus, DefectCategory


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    role = Column(Enum(UserRole))
    created_at = Column(DateTime, default=datetime.utcnow)

    created_reworks = relationship("ReworkOrder", back_populates="creator", foreign_keys="ReworkOrder.creator_id")
    assigned_reworks = relationship("ReworkOrder", back_populates="assignee", foreign_keys="ReworkOrder.assignee_id")
    inspections = relationship("Inspection", back_populates="inspector")
    process_guides = relationship("ProcessGuide", back_populates="author")


class ReworkOrder(Base):
    __tablename__ = "rework_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True)
    product_name = Column(String(100))
    product_code = Column(String(50))
    batch_no = Column(String(50))
    quantity = Column(Integer)
    defect_category = Column(Enum(DefectCategory))
    defect_description = Column(Text)
    status = Column(Enum(ReworkStatus), default=ReworkStatus.PENDING)
    process_guide_id = Column(Integer, ForeignKey("process_guides.id"), nullable=True)
    
    creator_id = Column(Integer, ForeignKey("users.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    creator = relationship("User", back_populates="created_reworks", foreign_keys=[creator_id])
    assignee = relationship("User", back_populates="assigned_reworks", foreign_keys=[assignee_id])
    process_guide = relationship("ProcessGuide", back_populates="reworks")
    rework_steps = relationship("ReworkStep", back_populates="rework_order", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="rework_order", cascade="all, delete-orphan")
    status_logs = relationship("StatusLog", back_populates="rework_order", cascade="all, delete-orphan")


class ReworkStep(Base):
    __tablename__ = "rework_steps"

    id = Column(Integer, primary_key=True, index=True)
    rework_order_id = Column(Integer, ForeignKey("rework_orders.id"))
    step_order = Column(Integer)
    step_name = Column(String(100))
    step_description = Column(Text)
    estimated_time = Column(Float, nullable=True)
    is_completed = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    rework_order = relationship("ReworkOrder", back_populates="rework_steps")


class ProcessGuide(Base):
    __tablename__ = "process_guides"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    defect_category = Column(Enum(DefectCategory))
    content = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User", back_populates="process_guides")
    reworks = relationship("ReworkOrder", back_populates="process_guide")


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    rework_order_id = Column(Integer, ForeignKey("rework_orders.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"))
    result = Column(String(20))
    quantity_passed = Column(Integer, default=0)
    quantity_failed = Column(Integer, default=0)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    rework_order = relationship("ReworkOrder", back_populates="inspections")
    inspector = relationship("User", back_populates="inspections")


class StatusLog(Base):
    __tablename__ = "status_logs"

    id = Column(Integer, primary_key=True, index=True)
    rework_order_id = Column(Integer, ForeignKey("rework_orders.id"))
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50))
    operator_id = Column(Integer, ForeignKey("users.id"))
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    rework_order = relationship("ReworkOrder", back_populates="status_logs")


class ExceptionFeedback(Base):
    __tablename__ = "exception_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    rework_order_id = Column(Integer, ForeignKey("rework_orders.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200))
    description = Column(Text)
    priority = Column(String(20), default="normal")
    status = Column(String(20), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
