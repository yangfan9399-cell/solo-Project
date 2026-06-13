using WaterQuotaSystem.Models;

namespace WaterQuotaSystem.ViewModels;

public class ProcessingDeskViewModel
{
    public WaterQuotaApplication Application { get; set; } = null!;
    public List<ProcessingNode> HistoryNodes { get; set; } = [];
    public List<EvidenceAttachment> Attachments { get; set; } = [];
    public RoleType CurrentUserRole { get; set; }
    public bool CanEdit { get; set; }
    public bool CanReview { get; set; }
    public bool CanArchive { get; set; }
    public bool CanReturnForEvidence { get; set; }
    public bool IsFieldPersonnel { get; set; }
    public bool IsReviewer { get; set; }
}

public class ProcessActionInput
{
    public int ApplicationId { get; set; }
    public RoleType CurrentUserRole { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public string BusinessRecord { get; set; } = string.Empty;
    public string FieldDescription { get; set; } = string.Empty;
    public decimal? ApprovedQuota { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string EvidenceDescription { get; set; } = string.Empty;
    public string EvidenceFileName { get; set; } = string.Empty;
    public string EvidenceFileType { get; set; } = string.Empty;
}
