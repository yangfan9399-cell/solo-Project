using BridgeInspection.Models;
using System.ComponentModel.DataAnnotations;

namespace BridgeInspection.ViewModels;

public class DefectReportViewModel
{
    [Required]
    public int BridgeId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(200)]
    public string? LocationOnBridge { get; set; }

    public double? CrackLength { get; set; }

    public double? CrackWidth { get; set; }

    public double? CrackDepth { get; set; }

    [StringLength(50)]
    public string? CrackDirection { get; set; }

    public List<Bridge>? AvailableBridges { get; set; }
}

public class DefectAssessmentViewModel
{
    public int DefectId { get; set; }

    [Required]
    public DefectSeverity Severity { get; set; }

    [StringLength(1000)]
    public string? AssessmentComment { get; set; }

    public bool IsUpgraded { get; set; }

    public string? MaintenanceUnitId { get; set; }

    public List<ApplicationUser>? MaintenanceUnits { get; set; }
}

public class MaintenanceSubmitViewModel
{
    public int DefectId { get; set; }

    [StringLength(2000)]
    public string? MaintenancePlan { get; set; }

    [Required]
    [StringLength(2000)]
    public string MaintenanceResult { get; set; } = string.Empty;

    public DateTime? MaintenanceStartedAt { get; set; }

    public DateTime? MaintenanceCompletedAt { get; set; }

    public int? MaintenanceDurationHours { get; set; }
}

public class AcceptanceViewModel
{
    public int DefectId { get; set; }

    public bool IsApproved { get; set; }

    [StringLength(1000)]
    public string? AcceptanceComment { get; set; }
}

public class DefectListViewModel
{
    public int Id { get; set; }
    public string BridgeName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DefectSeverity? Severity { get; set; }
    public DefectStatus Status { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
    public string? LocationOnBridge { get; set; }
    public bool IsUpgraded { get; set; }
    public bool RequiresStructuralReview { get; set; }
}

public class DefectDetailViewModel
{
    public Defect Defect { get; set; } = null!;
    public Bridge Bridge { get; set; } = null!;
    public List<DefectHistory> Histories { get; set; } = new();
    public List<SensorReading> SensorReadings { get; set; } = new();
    public List<Sensor> Sensors { get; set; } = new();
}

public class StatisticsViewModel
{
    public List<RouteStat>? RouteStats { get; set; }
    public List<BridgeTypeStat>? BridgeTypeStats { get; set; }
    public List<SeverityStat>? SeverityStats { get; set; }
    public List<DurationStat>? DurationStats { get; set; }
    public int TotalDefects { get; set; }
    public int ClosedDefects { get; set; }
    public int PendingDefects { get; set; }
}

public class RouteStat
{
    public string RouteName { get; set; } = string.Empty;
    public int DefectCount { get; set; }
    public int ClosedCount { get; set; }
    public double AverageDurationHours { get; set; }
}

public class BridgeTypeStat
{
    public BridgeType BridgeType { get; set; }
    public int DefectCount { get; set; }
    public int ClosedCount { get; set; }
}

public class SeverityStat
{
    public DefectSeverity Severity { get; set; }
    public int Count { get; set; }
    public double CloseRate { get; set; }
}

public class DurationStat
{
    public string DurationRange { get; set; } = string.Empty;
    public int Count { get; set; }
}
