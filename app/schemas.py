from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.constants import UserRole, ReworkStatus, DefectCategory


class UserBase(BaseModel):
    username: str
    name: str
    role: UserRole


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReworkStepBase(BaseModel):
    step_order: int
    step_name: str
    step_description: str
    estimated_time: Optional[float] = None


class ReworkStepCreate(ReworkStepBase):
    pass


class ReworkStep(ReworkStepBase):
    id: int
    rework_order_id: int
    is_completed: int
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReworkOrderBase(BaseModel):
    product_name: str
    product_code: str
    batch_no: str
    quantity: int
    defect_category: DefectCategory
    defect_description: str


class ReworkOrderCreate(ReworkOrderBase):
    steps: List[ReworkStepCreate] = []


class ReworkOrderUpdate(BaseModel):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    batch_no: Optional[str] = None
    quantity: Optional[int] = None
    defect_category: Optional[DefectCategory] = None
    defect_description: Optional[str] = None
    assignee_id: Optional[int] = None
    process_guide_id: Optional[int] = None


class ReworkOrder(ReworkOrderBase):
    id: int
    order_no: str
    status: ReworkStatus
    creator_id: int
    assignee_id: Optional[int] = None
    process_guide_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    creator: Optional[User] = None
    assignee: Optional[User] = None
    rework_steps: List[ReworkStep] = []

    class Config:
        from_attributes = True


class ProcessGuideBase(BaseModel):
    title: str
    defect_category: DefectCategory
    content: str


class ProcessGuideCreate(ProcessGuideBase):
    pass


class ProcessGuide(ProcessGuideBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InspectionBase(BaseModel):
    result: str
    quantity_passed: int
    quantity_failed: int
    remarks: Optional[str] = None


class InspectionCreate(InspectionBase):
    pass


class Inspection(InspectionBase):
    id: int
    rework_order_id: int
    inspector_id: int
    created_at: datetime
    inspector: Optional[User] = None

    class Config:
        from_attributes = True


class StatusLogBase(BaseModel):
    to_status: str
    remarks: Optional[str] = None


class StatusLogCreate(StatusLogBase):
    pass


class StatusLog(StatusLogBase):
    id: int
    rework_order_id: int
    from_status: Optional[str] = None
    operator_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ExceptionFeedbackBase(BaseModel):
    title: str
    description: str
    priority: str = "normal"


class ExceptionFeedbackCreate(ExceptionFeedbackBase):
    rework_order_id: Optional[int] = None


class ExceptionFeedback(ExceptionFeedbackBase):
    id: int
    reporter_id: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QualityStats(BaseModel):
    total_reworks: int
    pending_count: int
    in_progress_count: int
    completed_count: int
    scrap_count: int
    by_defect_category: dict
    by_month: dict
