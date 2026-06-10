namespace TempPowerInspection.Services;

public interface IDashboardService
{
    Task<DashboardViewModel> GetDashboardDataAsync();
}

public class DashboardViewModel
{
    public int TotalCount { get; set; }
    public int PendingCount { get; set; }
    public int InProgressCount { get; set; }
    public int PendingReviewCount { get; set; }
    public int PassedCount { get; set; }
    public int PoweredOnCount { get; set; }
    public int ReturnedCount { get; set; }

    public List<BuildingStat> BuildingStats { get; set; } = new();
    public List<TeamStat> TeamStats { get; set; } = new();
    public List<DangerTypeStat> DangerTypeStats { get; set; } = new();
    public List<RectificationDurationStat> RectificationDurationStats { get; set; } = new();
}

public class BuildingStat
{
    public string BuildingName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int PendingCount { get; set; }
    public int InProgressCount { get; set; }
    public int PassedCount { get; set; }
}

public class TeamStat
{
    public string TeamName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int PendingCount { get; set; }
}

public class DangerTypeStat
{
    public string DangerType { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RectificationDurationStat
{
    public string DistributionBoxName { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public bool IsOverdue { get; set; }
}
