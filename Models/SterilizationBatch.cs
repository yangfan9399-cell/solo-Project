using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class SterilizationBatch
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string BatchNumber { get; set; } = string.Empty;

    public DateTime SterilizationDate { get; set; }

    public DateTime ExpirationDate { get; set; }

    [MaxLength(100)]
    public string? SterilizerCode { get; set; }

    [MaxLength(50)]
    public string? SterilizationMethod { get; set; }

    public int PackedByUserId { get; set; }
    public User PackedByUser { get; set; } = null!;

    public bool IsExpired => DateTime.Now > ExpirationDate;

    public ICollection<InstrumentSet> InstrumentSets { get; set; } = new List<InstrumentSet>();
}
