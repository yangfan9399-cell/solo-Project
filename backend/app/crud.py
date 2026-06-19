from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from . import models, schemas


def get_specimens(db: Session, status: Optional[str] = None) -> List[models.Specimen]:
    query = db.query(models.Specimen)
    if status:
        query = query.filter(models.Specimen.status == status)
    return query.order_by(models.Specimen.id.desc()).all()


def get_specimen(db: Session, specimen_id: int) -> Optional[models.Specimen]:
    return db.query(models.Specimen).filter(models.Specimen.id == specimen_id).first()


def get_specimen_by_no(db: Session, specimen_no: str) -> Optional[models.Specimen]:
    return db.query(models.Specimen).filter(models.Specimen.specimen_no == specimen_no).first()


def create_specimen(db: Session, specimen: schemas.SpecimenCreate) -> models.Specimen:
    coords_data = specimen.collection_coords.model_dump() if specimen.collection_coords else None
    db_specimen = models.Specimen(
        **specimen.model_dump(exclude={"collection_coords"}),
        collection_coords=coords_data
    )
    db.add(db_specimen)
    db.commit()
    db.refresh(db_specimen)
    return db_specimen


def update_specimen_status(db: Session, specimen_id: int, status: str) -> Optional[models.Specimen]:
    db_specimen = get_specimen(db, specimen_id)
    if db_specimen:
        db_specimen.status = status
        db_specimen.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_specimen)
    return db_specimen


def create_assignment(db: Session, assignment: schemas.AssignmentCreate) -> models.Assignment:
    db_assignment = models.Assignment(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


def get_assignments(db: Session) -> List[models.Assignment]:
    return db.query(models.Assignment).order_by(models.Assignment.id.desc()).all()


def create_rejection(db: Session, rejection: schemas.RejectionCreate) -> models.Rejection:
    db_rejection = models.Rejection(**rejection.model_dump())
    db.add(db_rejection)
    db.commit()
    db.refresh(db_rejection)
    return db_rejection


def get_rejections(db: Session) -> List[models.Rejection]:
    return db.query(models.Rejection).order_by(models.Rejection.id.desc()).all()


def create_export_batch(db: Session, export_batch: schemas.ExportBatchCreate) -> models.ExportBatch:
    db_export = models.ExportBatch(**export_batch.model_dump())
    db.add(db_export)
    db.commit()
    db.refresh(db_export)
    return db_export


def get_export_batches(db: Session) -> List[models.ExportBatch]:
    return db.query(models.ExportBatch).order_by(models.ExportBatch.id.desc()).all()


def create_lock_record(db: Session, lock_record: schemas.LockRecordCreate) -> models.LockRecord:
    db_lock = models.LockRecord(**lock_record.model_dump())
    db.add(db_lock)
    db.commit()
    db.refresh(db_lock)
    return db_lock


def get_latest_lock_record(db: Session, specimen_id: int) -> Optional[models.LockRecord]:
    return db.query(models.LockRecord).filter(
        models.LockRecord.specimen_id == specimen_id
    ).order_by(models.LockRecord.id.desc()).first()


def is_specimen_locked(db: Session, specimen_id: int) -> bool:
    lock_record = get_latest_lock_record(db, specimen_id)
    return lock_record is not None and lock_record.is_locked


def update_specimen_review(
    db: Session,
    specimen_id: int,
    interpreter_opinion: str,
    status: Optional[str] = None,
    current_belongs_to: Optional[str] = None
) -> Optional[models.Specimen]:
    db_specimen = get_specimen(db, specimen_id)
    if db_specimen:
        db_specimen.interpreter_opinion = interpreter_opinion
        if status:
            db_specimen.status = status
        if current_belongs_to:
            db_specimen.current_belongs_to = current_belongs_to
        db_specimen.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_specimen)
    return db_specimen


def get_exportable_specimens(db: Session) -> Tuple[List[models.Specimen], List[dict]]:
    all_specimens = db.query(models.Specimen).all()
    exportable = []
    excluded = []

    for specimen in all_specimens:
        exclusion_reason = None

        if specimen.status != "已锁定":
            exclusion_reason = f"状态为'{specimen.status}'，需为'已锁定'"
        elif not specimen.interpreter_opinion:
            exclusion_reason = "缺少判读意见"
        elif not specimen.current_belongs_to:
            exclusion_reason = "缺少当前归属地"

        if exclusion_reason:
            excluded.append({
                "specimen_id": specimen.id,
                "specimen_no": specimen.specimen_no,
                "status": specimen.status,
                "reason": exclusion_reason
            })
        else:
            exportable.append(specimen)

    return exportable, excluded


def get_specimen_history(db: Session, specimen_id: int) -> List[dict]:
    history = []
    current = get_specimen(db, specimen_id)

    while current:
        history.append({
            "specimen_id": current.id,
            "specimen_no": current.specimen_no,
            "collection_date": current.collection_date,
            "season": current.season,
            "original_belongs_to": current.original_belongs_to,
            "current_belongs_to": current.current_belongs_to,
            "interpreter_opinion": current.interpreter_opinion,
            "collection_point": current.collection_point
        })
        if current.parent_specimen_id:
            current = get_specimen(db, current.parent_specimen_id)
        else:
            break

    return history


def batch_assign_specimens(
    db: Session,
    specimen_ids: List[int],
    assign_to: str,
    notes: Optional[str] = None
) -> List[models.Assignment]:
    assignments = []
    for specimen_id in specimen_ids:
        specimen = get_specimen(db, specimen_id)
        if specimen and specimen.status != "已锁定":
            assignment = schemas.AssignmentCreate(
                specimen_id=specimen_id,
                assign_from="系统",
                assign_to=assign_to,
                notes=notes
            )
            db_assignment = create_assignment(db, assignment)
            update_specimen_status(db, specimen_id, "复判中")
            assignments.append(db_assignment)
    return assignments


def batch_reject_specimens(
    db: Session,
    specimen_ids: List[int],
    reason: str,
    rejected_by: str,
    is_deficient: bool = False
) -> List[models.Rejection]:
    rejections = []
    for specimen_id in specimen_ids:
        specimen = get_specimen(db, specimen_id)
        if specimen and specimen.status != "已锁定":
            rejection = schemas.RejectionCreate(
                specimen_id=specimen_id,
                rejected_by=rejected_by,
                reason=reason,
                is_deficient=is_deficient
            )
            db_rejection = create_rejection(db, rejection)
            update_specimen_status(db, specimen_id, "已退回")
            rejections.append(db_rejection)
    return rejections
