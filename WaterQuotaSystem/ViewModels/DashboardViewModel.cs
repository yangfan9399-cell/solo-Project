using WaterQuotaSystem.Models;

namespace WaterQuotaSystem.ViewModels;

public class DashboardViewModel
{
    public int TotalApplications { get; set; }
    public int NormalCount { get; set; }
    public int OverLimitCount { get; set; }
    public int MissingEvidenceCount { get; set; }
    public int TimeoutCount { get; set; }
    public int ArchivedCount { get; set; }
    public int ActiveCount { get; set; }
    public int BlockedStatusCount { get; set; }
    public int ReviewingCount { get; set; }
    public int ProcessingCount { get; set; }
    public decimal TotalAppliedQuota { get; set; }
    public decimal TotalApprovedQuota { get; set; }
    public decimal QuotaApprovalRate { get; set; }
    public double AverageProcessingDays { get; set; }
    public int PendingTimeoutCount { get; set; }
    public List<StatusDistributionItem> StatusDistribution { get; set; } = [];
    public List<SampleTypeDistributionItem> SampleTypeDistribution { get; set; } = [];
    public List<MonthlyTrendItem> MonthlyTrend { get; set; } = [];
    public List<RecentKeyChangeItem> RecentKeyChanges { get; set; } = [];
    public List<ResponsiblePersonItem> ResponsiblePersonStats { get; set; } = [];
    public List<ConclusionDistributionItem> ConclusionDistribution { get; set; } = [];
    public int WithReviewerCommentCount { get; set; }
    public List<WaterQuotaApplication> DrillDownRecords { get; set; } = [];
    public string? DrillDownFilter { get; set; }
}

public class RecentKeyChangeItem
{
    public string ApplicationNo { get; set; } = string.Empty;
    public string ParkName { get; set; } = string.Empty;
    public string FieldDisplayName { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public int ApplicationId { get; set; }
}

public class ConclusionDistributionItem
{
    public string ConclusionLabel { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
    public int WithCommentCount { get; set; }
    public List<string> SampleComments { get; set; } = [];
}

public class ResponsiblePersonItem
{
    public string ResponsiblePerson { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAppliedQuota { get; set; }
    public string LatestConclusion { get; set; } = string.Empty;
}

public class StatusDistributionItem
{
    public ApplicationStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class SampleTypeDistributionItem
{
    public SampleType SampleType { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class MonthlyTrendItem
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalQuota { get; set; }
}
