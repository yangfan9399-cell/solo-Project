using MeetingRoomEquipment.Models;

namespace MeetingRoomEquipment.ViewModels;

public class RecordListViewModel
{
    public int Id { get; set; }
    public string RecordNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public SampleCategory SampleCategory { get; set; }
    public string SampleCategoryText { get; set; } = string.Empty;
    public RecordStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string StatusBadgeClass { get; set; } = string.Empty;
    public string CategoryBadgeClass { get; set; } = string.Empty;
    public string EquipmentName { get; set; } = string.Empty;
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerDept { get; set; } = string.Empty;
    public string CurrentResponsibleName { get; set; } = string.Empty;
    public decimal? CompensationAmount { get; set; }
    public bool HasBlocking { get; set; }
    public string? BlockingReason { get; set; }
    public string Summary { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
    public bool IsArchived { get; set; }
}

public class RecordDetailViewModel
{
    public EquipmentBorrowRecord Record { get; set; } = null!;
    public List<RecordNode> Nodes { get; set; } = new();
    public List<EvidenceAttachment> Evidences { get; set; } = new();
    public List<FieldSnapshot> Snapshots { get; set; } = new();
    public string StatusText { get; set; } = string.Empty;
    public string CategoryText { get; set; } = string.Empty;
    public string StatusBadgeClass { get; set; } = string.Empty;
    public string CategoryBadgeClass { get; set; } = string.Empty;
    public Dictionary<string, string> KeyValuePairs { get; set; } = new();
    public List<DiffFieldDisplay> DiffFields { get; set; } = new();
    public bool CanEdit { get; set; }
    public bool CanReview { get; set; }
    public bool CanArchive { get; set; }
    public bool IsReadOnly { get; set; }
}

public class DiffFieldDisplay
{
    public string FieldName { get; set; } = string.Empty;
    public string FieldDisplayName { get; set; } = string.Empty;
    public string? BeforeValue { get; set; }
    public string? AfterValue { get; set; }
    public string? ChangeReason { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}

public class NodeDisplay
{
    public int Id { get; set; }
    public int Sequence { get; set; }
    public NodeType NodeType { get; set; }
    public string NodeTitle { get; set; } = string.Empty;
    public string? FromStatusText { get; set; }
    public string? ToStatusText { get; set; }
    public string Remark { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
    public string OperatorRoleText { get; set; } = string.Empty;
    public DateTime OperatedAt { get; set; }
    public string? ChangedFields { get; set; }
}

public class ProcessViewModel
{
    public int Id { get; set; }
    public string RecordNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public SampleCategory SampleCategory { get; set; }
    public string CategoryText { get; set; } = string.Empty;
    public string CategoryBadgeClass { get; set; } = string.Empty;
    public RecordStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string StatusBadgeClass { get; set; } = string.Empty;

    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerDept { get; set; } = string.Empty;
    public string EquipmentName { get; set; } = string.Empty;
    public string EquipmentCode { get; set; } = string.Empty;
    public string MeetingRoom { get; set; } = string.Empty;
    public DateTime BorrowDate { get; set; }
    public DateTime DueReturnDate { get; set; }
    public DateTime? ActualReturnDate { get; set; }
    public bool HasDamage { get; set; }
    public string DamageDescription { get; set; } = string.Empty;
    public decimal OriginalValue { get; set; }
    public decimal? CompensationAmount { get; set; }
    public decimal? ActualCompensation { get; set; }

    public string FieldDescription { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public string Basis { get; set; } = string.Empty;

    public string? BlockingReason { get; set; }
    public string? RemedyPath { get; set; }
    public string? DiffFields { get; set; }

    public string CurrentResponsibleId { get; set; } = string.Empty;
    public string CurrentResponsibleName { get; set; } = string.Empty;

    public bool HasBlocking { get; set; }
    public bool IsArchived { get; set; }
    public bool IsReadOnly { get; set; }
    public bool CanFieldEdit { get; set; }
    public bool CanReview { get; set; }

    public List<EvidenceAttachment> Evidences { get; set; } = new();
    public List<FieldSnapshot> Snapshots { get; set; } = new();

    public string ActionRemark { get; set; } = string.Empty;
    public ActionType? SelectedAction { get; set; }
}

public class DashboardViewModel
{
    public int TotalCount { get; set; }
    public int PendingAcceptance { get; set; }
    public int Processing { get; set; }
    public int PendingReview { get; set; }
    public int ReturnedForSupplement { get; set; }
    public int Archived { get; set; }

    public int NormalCount { get; set; }
    public int MetricExceededCount { get; set; }
    public int EvidenceMissingCount { get; set; }
    public int ApprovalTimeoutCount { get; set; }

    public decimal TotalCompensation { get; set; }
    public decimal ActualCompensationTotal { get; set; }
    public int BlockedCount { get; set; }
    public int OverdueCount { get; set; }

    public List<StatusStatItem> StatusStats { get; set; } = new();
    public List<CategoryStatItem> CategoryStats { get; set; } = new();
    public List<DepartmentStatItem> DepartmentStats { get; set; } = new();
    public List<MonthlyStatItem> MonthlyStats { get; set; } = new();
    public List<RecordListViewModel> RecentRecords { get; set; } = new();
    public List<RecordListViewModel> OverdueRecords { get; set; } = new();
}

public class StatusStatItem
{
    public RecordStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public int Count { get; set; }
    public string BadgeClass { get; set; } = string.Empty;
}

public class CategoryStatItem
{
    public SampleCategory Category { get; set; }
    public string CategoryText { get; set; } = string.Empty;
    public int Count { get; set; }
    public string BadgeClass { get; set; } = string.Empty;
}

public class DepartmentStatItem
{
    public string Department { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Compensation { get; set; }
}

public class MonthlyStatItem
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Compensation { get; set; }
}

public class ReviewViewModel
{
    public int RecordId { get; set; }
    public string RecordNo { get; set; } = string.Empty;
    public ActionType Action { get; set; }
    public string Remark { get; set; } = string.Empty;
    public string? Conclusion { get; set; }
    public string? Basis { get; set; }
    public decimal? ActualCompensation { get; set; }
    public string? NextResponsibleId { get; set; }
}

public class SupplementViewModel
{
    public int RecordId { get; set; }
    public string FieldDescription { get; set; } = string.Empty;
    public string Remark { get; set; } = string.Empty;
}

public class UserSwitchViewModel
{
    public List<User> Users { get; set; } = new();
    public string CurrentUserId { get; set; } = string.Empty;
    public string CurrentUserName { get; set; } = string.Empty;
    public string CurrentRole { get; set; } = string.Empty;
}
