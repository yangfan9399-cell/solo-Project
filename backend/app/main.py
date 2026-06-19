from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from . import models, schemas, crud
from .database import engine, Base, get_db
from .seed_data import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(title="地衣标本管理系统 API", description="地衣标本判读工作平台后端服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_database(db)
    db.close()


@app.get("/api/specimens", response_model=List[schemas.Specimen])
def get_specimens(status: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_specimens(db, status=status)


@app.get("/api/specimens/{specimen_id}", response_model=schemas.SpecimenDetail)
def get_specimen(specimen_id: int, db: Session = Depends(get_db)):
    specimen = crud.get_specimen(db, specimen_id=specimen_id)
    if not specimen:
        raise HTTPException(status_code=404, detail="Specimen not found")
    return specimen


@app.post("/api/specimens/batch-assign", response_model=List[schemas.Assignment])
def batch_assign(request: schemas.BatchAssignRequest, db: Session = Depends(get_db)):
    assignments = crud.batch_assign_specimens(
        db,
        specimen_ids=request.specimen_ids,
        assign_to=request.assign_to,
        notes=request.notes
    )
    return assignments


@app.post("/api/specimens/batch-reject", response_model=List[schemas.Rejection])
def batch_reject(request: schemas.BatchRejectRequest, db: Session = Depends(get_db)):
    rejections = crud.batch_reject_specimens(
        db,
        specimen_ids=request.specimen_ids,
        reason=request.reason,
        rejected_by=request.rejected_by
    )
    return rejections


@app.post("/api/specimens/{specimen_id}/review", response_model=schemas.Specimen)
def review_specimen(specimen_id: int, request: schemas.ReviewRequest, db: Session = Depends(get_db)):
    specimen = crud.get_specimen(db, specimen_id=specimen_id)
    if not specimen:
        raise HTTPException(status_code=404, detail="Specimen not found")

    if specimen.status == "已锁定":
        raise HTTPException(status_code=400, detail="已锁定的标本无法修改")

    updated_specimen = crud.update_specimen_review(
        db,
        specimen_id=specimen_id,
        interpreter_opinion=request.interpreter_opinion,
        status=request.status,
        current_belongs_to=request.current_belongs_to
    )
    return updated_specimen


@app.post("/api/specimens/{specimen_id}/lock", response_model=schemas.LockRecord)
def toggle_lock(specimen_id: int, request: schemas.LockRequest, db: Session = Depends(get_db)):
    specimen = crud.get_specimen(db, specimen_id=specimen_id)
    if not specimen:
        raise HTTPException(status_code=404, detail="Specimen not found")

    is_locked = crud.is_specimen_locked(db, specimen_id)

    if is_locked:
        if not request.unlock_reason:
            raise HTTPException(status_code=400, detail="解锁时必须提供解锁原因")
        lock_record = schemas.LockRecordCreate(
            specimen_id=specimen_id,
            locked_by=request.locked_by,
            unlock_reason=request.unlock_reason,
            is_locked=False
        )
        crud.update_specimen_status(db, specimen_id, "复判中")
    else:
        if not specimen.interpreter_opinion:
            raise HTTPException(status_code=400, detail="未填写判读意见的标本无法锁定")
        if not specimen.current_belongs_to:
            raise HTTPException(status_code=400, detail="未确定归属地的标本无法锁定")
        lock_record = schemas.LockRecordCreate(
            specimen_id=specimen_id,
            locked_by=request.locked_by,
            is_locked=True
        )
        crud.update_specimen_status(db, specimen_id, "已锁定")

    return crud.create_lock_record(db, lock_record)


@app.get("/api/export/preview", response_model=schemas.ExportPreviewResponse)
def export_preview(db: Session = Depends(get_db)):
    exportable, excluded = crud.get_exportable_specimens(db)
    return {"exportable": exportable, "excluded": excluded}


@app.post("/api/export/execute", response_model=schemas.ExportBatch)
def execute_export(db: Session = Depends(get_db)):
    exportable, excluded = crud.get_exportable_specimens(db)

    if not exportable:
        raise HTTPException(status_code=400, detail="没有可导出的标本")

    batch_no = f"EXPORT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    included_ids = [s.id for s in exportable]
    excluded_ids = [e["specimen_id"] for e in excluded]
    exclusion_reasons = {str(e["specimen_id"]): e["reason"] for e in excluded}

    export_batch = schemas.ExportBatchCreate(
        batch_no=batch_no,
        exported_by="系统",
        included_ids=included_ids,
        excluded_ids=excluded_ids,
        exclusion_reasons=exclusion_reasons
    )

    return crud.create_export_batch(db, export_batch)


@app.get("/api/specimens/{specimen_id}/history", response_model=List[schemas.HistoryRecord])
def get_specimen_history(specimen_id: int, db: Session = Depends(get_db)):
    specimen = crud.get_specimen(db, specimen_id=specimen_id)
    if not specimen:
        raise HTTPException(status_code=404, detail="Specimen not found")

    history = crud.get_specimen_history(db, specimen_id)
    return history


@app.get("/api/assignments", response_model=List[schemas.Assignment])
def get_assignments(db: Session = Depends(get_db)):
    return crud.get_assignments(db)


@app.get("/api/rejections", response_model=List[schemas.Rejection])
def get_rejections(db: Session = Depends(get_db)):
    return crud.get_rejections(db)


@app.get("/api/export-batches", response_model=List[schemas.ExportBatch])
def get_export_batches(db: Session = Depends(get_db)):
    return crud.get_export_batches(db)


@app.get("/")
def root():
    return {"message": "地衣标本管理系统 API 服务运行中", "docs": "/docs"}
