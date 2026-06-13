using WaterQuotaSystem.Models;

namespace WaterQuotaSystem.ViewModels;

public class KeyFieldEditViewModel
{
    public WaterQuotaApplication Application { get; set; } = null!;
    public List<ProcessingNode> HistoryNodes { get; set; } = [];
    public List<FieldChangeRecord> PreviousKeyChanges { get; set; } = [];
}

public class KeyFieldEditInput
{
    public int ApplicationId { get; set; }
    public RoleType CurrentUserRole { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string ChangeReason { get; set; } = string.Empty;

    public DateTime? NewApplicationDate { get; set; }
    public DateTime? NewDeadline { get; set; }

    public string NewCurrentResponsiblePerson { get; set; } = string.Empty;
    public string NewApplicantName { get; set; } = string.Empty;

    public decimal? NewAppliedQuota { get; set; }
    public decimal? NewApprovedQuota { get; set; }
    public decimal? NewQuotaLimit { get; set; }

    public string NewConclusion { get; set; } = string.Empty;
}
