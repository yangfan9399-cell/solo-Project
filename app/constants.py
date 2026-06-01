from enum import Enum


class UserRole(str, Enum):
    LINE_LEADER = "line_leader"
    QUALITY_INSPECTOR = "quality_inspector"
    PROCESS_ENGINEER = "process_engineer"


class ReworkStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    REINSPECTION = "reinspection"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCRAP = "scrap"
    SCRAP_APPROVED = "scrap_approved"


class DefectCategory(str, Enum):
    SURFACE = "surface"
    DIMENSION = "dimension"
    ASSEMBLY = "assembly"
    MATERIAL = "material"
    FUNCTION = "function"
    OTHER = "other"
