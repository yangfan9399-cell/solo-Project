using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class InstrumentSet
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string SetCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? SetType { get; set; }

    public InstrumentSetStatus Status { get; set; }

    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public int? SterilizationBatchId { get; set; }
    public SterilizationBatch? SterilizationBatch { get; set; }

    public int? ReceivedByUserId { get; set; }
    public User? ReceivedByUser { get; set; }

    public DateTime? ReceivedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<InstrumentSetItem> Items { get; set; } = new List<InstrumentSetItem>();
    public ICollection<TrackingRecord> TrackingRecords { get; set; } = new List<TrackingRecord>();
    public ICollection<AnomalyRecord> AnomalyRecords { get; set; } = new List<AnomalyRecord>();
}
