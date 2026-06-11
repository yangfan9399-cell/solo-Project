using OceanFarm.Models;

namespace OceanFarm.ViewModels;

public class CageListViewModel
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string SeaAreaName { get; set; } = string.Empty;
    public string FishSpeciesName { get; set; } = string.Empty;
    public int FishCount { get; set; }
    public decimal AverageWeightKg { get; set; }
    public AnomalyType CurrentAnomaly { get; set; }
    public DisposalStatus CurrentStatus { get; set; }
    public DateTime StockingDate { get; set; }
}

public class CageDetailViewModel
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string SeaAreaName { get; set; } = string.Empty;
    public string FishSpeciesName { get; set; } = string.Empty;
    public int FishCount { get; set; }
    public decimal AverageWeightKg { get; set; }
    public decimal TotalWeightKg { get; set; }
    public DateTime StockingDate { get; set; }
    public int StockingDays { get; set; }
    public decimal VolumeCubicMeters { get; set; }
    public AnomalyType CurrentAnomaly { get; set; }
    public DisposalStatus CurrentStatus { get; set; }
    public string? CurrentAnomalyNote { get; set; }
    public DateTime? AnomalyReportedAt { get; set; }
    public decimal OptimalMinDissolvedOxygen { get; set; }
    public decimal DailyFeedRatePerKg { get; set; }
    public decimal ExpectedDailyFeedKg { get; set; }

    public List<WaterQualityRecordViewModel> LatestWaterQuality { get; set; } = new();
    public List<FeedingRecordViewModel> LatestFeedingRecords { get; set; } = new();
    public List<DiseaseReportViewModel> DiseaseReports { get; set; } = new();
    public List<WorkflowNodeViewModel> WorkflowHistory { get; set; } = new();
}

public class WaterQualityRecordViewModel
{
    public int Id { get; set; }
    public DateTime RecordedAt { get; set; }
    public string InspectorName { get; set; } = string.Empty;
    public decimal Temperature { get; set; }
    public decimal DissolvedOxygen { get; set; }
    public decimal Ph { get; set; }
    public decimal Salinity { get; set; }
    public decimal Turbidity { get; set; }
    public AnomalyType AnomalyType { get; set; }
    public string? Remarks { get; set; }
    public bool IsHandled { get; set; }
}

public class FeedingRecordViewModel
{
    public int Id { get; set; }
    public DateTime FeedingTime { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public decimal FeedAmountKg { get; set; }
    public string FeedType { get; set; } = string.Empty;
    public FeedingStatus Status { get; set; }
    public AnomalyType AnomalyType { get; set; }
    public string? Remarks { get; set; }
}

public class DiseaseReportViewModel
{
    public int Id { get; set; }
    public DateTime ReportedAt { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string? VeterinarianName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string Symptoms { get; set; } = string.Empty;
    public int DeadFishCount { get; set; }
    public int AbnormalFishCount { get; set; }
    public string? PhotoUrl { get; set; }
    public DiseaseStatus Status { get; set; }
    public string? VeterinaryOpinion { get; set; }
    public string? DiagnosedDisease { get; set; }
    public string? RecommendedTreatment { get; set; }
    public string? ManagerNote { get; set; }
}

public class WorkflowNodeViewModel
{
    public int Id { get; set; }
    public string NodeType { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AnomalyType? RelatedAnomaly { get; set; }
    public DisposalStatus? StatusAfter { get; set; }
}

public class RecordWaterQualityViewModel
{
    public int CageId { get; set; }
    public string CageCode { get; set; } = string.Empty;
    public int InspectorId { get; set; }
    public decimal Temperature { get; set; }
    public decimal DissolvedOxygen { get; set; }
    public decimal Ph { get; set; } = 7.5m;
    public decimal Salinity { get; set; } = 32m;
    public decimal Turbidity { get; set; }
    public string? Remarks { get; set; }
    public List<AppUser> Inspectors { get; set; } = new();
}

public class SubmitFeedingViewModel
{
    public int CageId { get; set; }
    public string CageCode { get; set; } = string.Empty;
    public int OperatorId { get; set; }
    public decimal FeedAmountKg { get; set; }
    public string FeedType { get; set; } = "配合饲料";
    public bool IsNormal { get; set; } = true;
    public AnomalyType? AnomalyType { get; set; }
    public string? Remarks { get; set; }
    public List<AppUser> Operators { get; set; } = new();
    public bool HasUnresolvedOxygenAnomaly { get; set; }
    public string? AnomalyWarning { get; set; }
}

public class VeterinaryReviewViewModel
{
    public int DiseaseReportId { get; set; }
    public int CageId { get; set; }
    public string CageCode { get; set; } = string.Empty;
    public int VeterinarianId { get; set; }
    public string Symptoms { get; set; } = string.Empty;
    public int DeadFishCount { get; set; }
    public int AbnormalFishCount { get; set; }
    public string? PhotoUrl { get; set; }
    public DiseaseStatus Status { get; set; }
    public string VeterinaryOpinion { get; set; } = string.Empty;
    public string? DiagnosedDisease { get; set; }
    public string RecommendedTreatment { get; set; } = string.Empty;
    public bool IsConfirmed { get; set; } = true;
    public List<AppUser> Veterinarians { get; set; } = new();
}

public class ManagerDisposalViewModel
{
    public int CageId { get; set; }
    public string CageCode { get; set; } = string.Empty;
    public AnomalyType CurrentAnomaly { get; set; }
    public DisposalStatus CurrentStatus { get; set; }
    public string? AnomalyNote { get; set; }
    public int ManagerId { get; set; }
    public string ManagerNote { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public List<AppUser> Managers { get; set; } = new();
    public List<DiseaseReportViewModel> PendingDiseaseReports { get; set; } = new();
}

public class DashboardViewModel
{
    public int TotalCages { get; set; }
    public int NormalCages { get; set; }
    public int AnomalyCages { get; set; }
    public int PendingDisposal { get; set; }

    public List<SeaAreaGroup> BySeaArea { get; set; } = new();
    public List<FishSpeciesGroup> ByFishSpecies { get; set; } = new();
    public List<AnomalyGroup> ByAnomalyType { get; set; } = new();
    public List<DisposalDurationGroup> ByDisposalDuration { get; set; } = new();

    public List<CageAnomalyDetail> RecentAnomalies { get; set; } = new();
}

public class SeaAreaGroup
{
    public string SeaAreaName { get; set; } = string.Empty;
    public int TotalCages { get; set; }
    public int AnomalyCages { get; set; }
    public decimal AnomalyRate { get; set; }
}

public class FishSpeciesGroup
{
    public string SpeciesName { get; set; } = string.Empty;
    public int TotalCages { get; set; }
    public int AnomalyCages { get; set; }
    public decimal AnomalyRate { get; set; }
}

public class AnomalyGroup
{
    public AnomalyType AnomalyType { get; set; }
    public string AnomalyTypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class DisposalDurationGroup
{
    public string DurationRange { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class CageAnomalyDetail
{
    public int CageId { get; set; }
    public int? DiseaseReportId { get; set; }
    public string CageCode { get; set; } = string.Empty;
    public string SeaAreaName { get; set; } = string.Empty;
    public string FishSpeciesName { get; set; } = string.Empty;
    public AnomalyType AnomalyType { get; set; }
    public DisposalStatus Status { get; set; }
    public DateTime? ReportedAt { get; set; }
    public int DurationHours { get; set; }
    public string? Note { get; set; }
}
