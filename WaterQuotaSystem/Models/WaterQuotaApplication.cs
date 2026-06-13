namespace WaterQuotaSystem.Models;

public class WaterQuotaApplication
{
    public int Id { get; set; }
    public string ApplicationNo { get; set; } = string.Empty;
    public string ParkName { get; set; } = string.Empty;
    public string ApplicantName { get; set; } = string.Empty;
    public string ApplicantDepartment { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public SampleType SampleType { get; set; }
    public ApplicationStatus Status { get; set; }
    public string CurrentResponsiblePerson { get; set; } = string.Empty;
    public RoleType CurrentRole { get; set; }
    public decimal AppliedQuota { get; set; }
    public decimal ApprovedQuota { get; set; }
    public decimal QuotaLimit { get; set; }
    public string QuotaUnit { get; set; } = "吨/月";
    public string KeyObject { get; set; } = string.Empty;
    public string Basis { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public string BusinessRecord { get; set; } = string.Empty;
    public string FieldDescription { get; set; } = string.Empty;
    public string BlockingReason { get; set; } = string.Empty;
    public string DifferentialFields { get; set; } = string.Empty;
    public string RemediationPath { get; set; } = string.Empty;
    public DateTime ApplicationDate { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime? ProcessedDate { get; set; }
    public DateTime? ReviewedDate { get; set; }
    public DateTime? ArchivedDate { get; set; }
    public bool IsReadOnly { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ProcessingNode> ProcessingNodes { get; set; } = [];
    public List<FieldChangeRecord> FieldChanges { get; set; } = [];
    public List<EvidenceAttachment> EvidenceAttachments { get; set; } = [];
}
