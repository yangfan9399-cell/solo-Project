using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BridgeInspection.Models;

public class Defect
{
    public int Id { get; set; }

    [Required]
    public int BridgeId { get; set; }

    [ForeignKey(nameof(BridgeId))]
    public Bridge? Bridge { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(200)]
    public string? LocationOnBridge { get; set; }

    public DefectSeverity? Severity { get; set; }

    [Required]
    public DefectStatus Status { get; set; } = DefectStatus.PendingAssessment;

    public double? CrackLength { get; set; }

    public double? CrackWidth { get; set; }

    public double? CrackDepth { get; set; }

    [StringLength(50)]
    public string? CrackDirection { get; set; }

    [StringLength(200)]
    public string? PhotoUrl { get; set; }

    [Required]
    [StringLength(100)]
    public string ReporterId { get; set; } = string.Empty;

    [ForeignKey(nameof(ReporterId))]
    public ApplicationUser? Reporter { get; set; }

    public DateTime ReportedAt { get; set; } = DateTime.Now;

    [StringLength(100)]
    public string? AssessorId { get; set; }

    [ForeignKey(nameof(AssessorId))]
    public ApplicationUser? Assessor { get; set; }

    public DateTime? AssessedAt { get; set; }

    [StringLength(1000)]
    public string? AssessmentComment { get; set; }

    public bool IsUpgraded { get; set; }

    public bool RequiresStructuralReview { get; set; }

    [StringLength(100)]
    public string? MaintenanceUnitId { get; set; }

    [ForeignKey(nameof(MaintenanceUnitId))]
    public ApplicationUser? MaintenanceUnit { get; set; }

    public DateTime? MaintenanceStartedAt { get; set; }

    public DateTime? MaintenanceCompletedAt { get; set; }

    public int? MaintenanceDurationHours { get; set; }

    [StringLength(2000)]
    public string? MaintenancePlan { get; set; }

    [StringLength(2000)]
    public string? MaintenanceResult { get; set; }

    [StringLength(100)]
    public string? AcceptorId { get; set; }

    [ForeignKey(nameof(AcceptorId))]
    public ApplicationUser? Acceptor { get; set; }

    public DateTime? AcceptedAt { get; set; }

    [StringLength(1000)]
    public string? AcceptanceComment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<DefectHistory> Histories { get; set; } = new List<DefectHistory>();

    public ICollection<SensorReading> SensorReadings { get; set; } = new List<SensorReading>();
}
