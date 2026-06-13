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
    public decimal TotalAppliedQuota { get; set; }
    public decimal TotalApprovedQuota { get; set; }
    public double AverageProcessingDays { get; set; }
    public List<StatusDistributionItem> StatusDistribution { get; set; } = [];
    public List<SampleTypeDistributionItem> SampleTypeDistribution { get; set; } = [];
    public List<MonthlyTrendItem> MonthlyTrend { get; set; } = [];
    public List<WaterQuotaApplication> DrillDownRecords { get; set; } = [];
    public string? DrillDownFilter { get; set; }
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
