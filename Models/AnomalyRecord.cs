using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class AnomalyRecord
{
    public int Id { get; set; }

    public int InstrumentSetId { get; set; }
    public InstrumentSet InstrumentSet { get; set; } = null!;

    public AnomalyType AnomalyType { get; set; }

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public int ReportedByUserId { get; set; }
    public User ReportedByUser { get; set; } = null!;

    public DateTime ReportedAt { get; set; }

    public bool Resolved { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [MaxLength(500)]
    public string? ResolutionNotes { get; set; }

    public int? ReplenishmentDurationMinutes { get; set; }
}
