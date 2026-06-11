using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OceanFarm.Models;

public class Cage
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    public int SeaAreaId { get; set; }

    [ForeignKey(nameof(SeaAreaId))]
    public SeaArea SeaArea { get; set; } = null!;

    public int FishSpeciesId { get; set; }

    [ForeignKey(nameof(FishSpeciesId))]
    public FishSpecies FishSpecies { get; set; } = null!;

    public int FishCount { get; set; }

    public decimal AverageWeightKg { get; set; }

    public DateTime StockingDate { get; set; }

    public decimal VolumeCubicMeters { get; set; }

    public bool IsActive { get; set; } = true;

    public AnomalyType CurrentAnomaly { get; set; } = AnomalyType.None;

    public DisposalStatus CurrentStatus { get; set; } = DisposalStatus.Pending;

    [MaxLength(500)]
    public string? CurrentAnomalyNote { get; set; }

    public DateTime? AnomalyReportedAt { get; set; }

    public ICollection<WaterQualityRecord> WaterQualityRecords { get; set; } = new List<WaterQualityRecord>();

    public ICollection<FeedingRecord> FeedingRecords { get; set; } = new List<FeedingRecord>();

    public ICollection<DiseaseReport> DiseaseReports { get; set; } = new List<DiseaseReport>();

    public ICollection<WorkflowNode> WorkflowNodes { get; set; } = new List<WorkflowNode>();
}
