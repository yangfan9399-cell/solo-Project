using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class TrackingRecord
{
    public int Id { get; set; }

    public int InstrumentSetId { get; set; }
    public InstrumentSet InstrumentSet { get; set; } = null!;

    public TrackingAction Action { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime ActionTime { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public InstrumentSetStatus? FromStatus { get; set; }

    public InstrumentSetStatus? ToStatus { get; set; }
}
