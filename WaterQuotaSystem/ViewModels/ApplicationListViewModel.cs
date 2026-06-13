using WaterQuotaSystem.Models;

namespace WaterQuotaSystem.ViewModels;

public class ApplicationListViewModel
{
    public List<WaterQuotaApplication> Applications { get; set; } = [];
    public ApplicationStatus? StatusFilter { get; set; }
    public SampleType? SampleTypeFilter { get; set; }
    public string? SearchKeyword { get; set; }
    public int TotalCount { get; set; }
    public int NormalCount { get; set; }
    public int BlockedCount { get; set; }
    public int ReturnedCount { get; set; }
    public int TimeoutCount { get; set; }
    public int ArchivedCount { get; set; }
}
