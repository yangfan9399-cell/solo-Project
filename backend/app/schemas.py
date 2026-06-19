from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class Coords(BaseModel):
    lat: float
    lng: float


class SpecimenBase(BaseModel):
    status: Optional[str] = None
    specimen_no: Optional[str] = None
    collection_point: Optional[str] = None
    collection_coords: Optional[Coords] = None
    collection_altitude: Optional[int] = None
    substrate: Optional[str] = None
    spore_density: Optional[str] = None
    humidity_exposure: Optional[str] = None
    collection_source: Optional[str] = None
    micrograph_url: Optional[str] = None
    interpreter_opinion: Optional[str] = None
    original_belongs_to: Optional[str] = None
    current_belongs_to: Optional[str] = None
    is_remeasure: Optional[bool] = False
    parent_specimen_id: Optional[int] = None
    season: Optional[str] = None
    collection_date: Optional[datetime] = None


class SpecimenCreate(SpecimenBase):
    pass


class SpecimenUpdate(SpecimenBase):
    pass


class Specimen(SpecimenBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AssignmentBase(BaseModel):
    specimen_id: int
    assign_from: Optional[str] = None
    assign_to: str
    notes: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    pass


class Assignment(AssignmentBase):
    id: int
    assigned_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RejectionBase(BaseModel):
    specimen_id: int
    rejected_by: str
    reason: str
    is_deficient: Optional[bool] = False


class RejectionCreate(RejectionBase):
    pass


class Rejection(RejectionBase):
    id: int
    rejected_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ExportBatchBase(BaseModel):
    batch_no: str
    exported_by: str
    included_ids: List[int]
    excluded_ids: List[int]
    exclusion_reasons: Dict[str, str]


class ExportBatchCreate(ExportBatchBase):
    pass


class ExportBatch(ExportBatchBase):
    id: int
    exported_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LockRecordBase(BaseModel):
    specimen_id: int
    locked_by: str
    unlock_reason: Optional[str] = None
    is_locked: Optional[bool] = True


class LockRecordCreate(LockRecordBase):
    pass


class LockRecord(LockRecordBase):
    id: int
    locked_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SpecimenDetail(Specimen):
    assignments: List[Assignment] = []
    rejections: List[Rejection] = []
    lock_records: List[LockRecord] = []


class BatchAssignRequest(BaseModel):
    specimen_ids: List[int]
    assign_to: str
    notes: Optional[str] = None


class BatchRejectRequest(BaseModel):
    specimen_ids: List[int]
    reason: str
    rejected_by: str
    is_deficient: Optional[bool] = False


class StatusUpdateRequest(BaseModel):
    status: str


class ReviewRequest(BaseModel):
    interpreter_opinion: str
    status: Optional[str] = None
    current_belongs_to: Optional[str] = None


class LockRequest(BaseModel):
    locked_by: str
    unlock_reason: Optional[str] = None
    target_status_after_unlock: Optional[str] = None


class ExportPreviewResponse(BaseModel):
    exportable: List[Specimen]
    excluded: List[Dict[str, Any]]


class HistoryRecord(BaseModel):
    specimen_id: int
    specimen_no: str
    collection_date: Optional[datetime]
    season: Optional[str]
    original_belongs_to: Optional[str]
    current_belongs_to: Optional[str]
    interpreter_opinion: Optional[str]
    collection_point: Optional[str]
