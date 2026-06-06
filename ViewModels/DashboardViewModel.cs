using SurgicalInstrumentTracking.Models;

namespace SurgicalInstrumentTracking.ViewModels;

public class DashboardViewModel
{
    public int TotalSets { get; set; }
    public int ReadyForUseCount { get; set; }
    public int InUseCount { get; set; }
    public int MissingItemsCount { get; set; }
    public int ExpiredCount { get; set; }
    public int WrongDepartmentCount { get; set; }

    public List<DepartmentStatsViewModel> DepartmentStats { get; set; } = new();
    public List<SetTypeStatsViewModel> SetTypeStats { get; set; } = new();
    public List<MissingItemStatsViewModel> MissingItemStats { get; set; } = new();
    public List<ReplenishmentStatsViewModel> ReplenishmentStats { get; set; } = new();
    public List<InstrumentSet> RecentAnomalies { get; set; } = new();
}

public class DepartmentStatsViewModel
{
    public string DepartmentName { get; set; } = string.Empty;
    public int TotalSets { get; set; }
    public int ReadyCount { get; set; }
    public int InUseCount { get; set; }
    public int AnomalyCount { get; set; }
}

public class SetTypeStatsViewModel
{
    public string SetType { get; set; } = string.Empty;
    public int Count { get; set; }
    public int AnomalyCount { get; set; }
}

public class MissingItemStatsViewModel
{
    public string InstrumentName { get; set; } = string.Empty;
    public int MissingCount { get; set; }
}

public class ReplenishmentStatsViewModel
{
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime CompletedAt { get; set; }
}
