from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from .database import Base


class Specimen(Base):
    __tablename__ = "specimens"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="待接收", index=True)
    specimen_no = Column(String, unique=True, index=True)
    collection_point = Column(String, index=True)
    collection_coords = Column(JSON)
    collection_altitude = Column(Integer)
    substrate = Column(String)
    spore_density = Column(String)
    humidity_exposure = Column(String)
    collection_source = Column(String)
    micrograph_url = Column(String)
    interpreter_opinion = Column(String)
    original_belongs_to = Column(String)
    current_belongs_to = Column(String)
    is_remeasure = Column(Boolean, default=False)
    parent_specimen_id = Column(Integer, ForeignKey("specimens.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    season = Column(String)
    collection_date = Column(DateTime)

    assignments = relationship("Assignment", back_populates="specimen")
    rejections = relationship("Rejection", back_populates="specimen")
    lock_records = relationship("LockRecord", back_populates="specimen")
    parent_specimen = relationship("Specimen", remote_side=[id])


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    specimen_id = Column(Integer, ForeignKey("specimens.id"))
    assign_from = Column(String)
    assign_to = Column(String, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(String)

    specimen = relationship("Specimen", back_populates="assignments")


class Rejection(Base):
    __tablename__ = "rejections"

    id = Column(Integer, primary_key=True, index=True)
    specimen_id = Column(Integer, ForeignKey("specimens.id"))
    rejected_by = Column(String)
    reason = Column(String)
    rejected_at = Column(DateTime, default=datetime.utcnow)
    is_deficient = Column(Boolean, default=False)

    specimen = relationship("Specimen", back_populates="rejections")


class ExportBatch(Base):
    __tablename__ = "export_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String, unique=True, index=True)
    exported_by = Column(String)
    exported_at = Column(DateTime, default=datetime.utcnow)
    included_ids = Column(JSON)
    excluded_ids = Column(JSON)
    exclusion_reasons = Column(JSON)


class LockRecord(Base):
    __tablename__ = "lock_records"

    id = Column(Integer, primary_key=True, index=True)
    specimen_id = Column(Integer, ForeignKey("specimens.id"))
    locked_by = Column(String)
    locked_at = Column(DateTime, default=datetime.utcnow)
    unlock_reason = Column(String)
    is_locked = Column(Boolean, default=True)

    specimen = relationship("Specimen", back_populates="lock_records")
