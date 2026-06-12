namespace MeetingRoomEquipment.Models;

public enum RecordStatus
{
    PendingAcceptance = 10,
    Processing = 20,
    PendingReview = 30,
    ReturnedForSupplement = 35,
    Archived = 40,
    Rejected = 50
}

public enum UserRole
{
    FieldStaff = 1,
    Reviewer = 2,
    Admin = 3
}

public enum SampleCategory
{
    NormalRelease = 1,
    MetricExceeded = 2,
    EvidenceMissing = 3,
    ApprovalTimeout = 4
}

public enum NodeType
{
    Acceptance = 1,
    ProcessUpdate = 2,
    Review = 3,
    ReturnSupplement = 4,
    Archive = 5,
    Reopen = 6
}

public enum EvidenceType
{
    Photo = 1,
    Video = 2,
    Document = 3,
    SignForm = 4
}

public enum ActionType
{
    Submit = 1,
    Approve = 2,
    Return = 3,
    Archive = 4,
    Reopen = 5,
    Supplement = 6
}
