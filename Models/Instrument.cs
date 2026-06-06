using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class Instrument
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Specification { get; set; }

    [MaxLength(20)]
    public string? InstrumentCode { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    public ICollection<InstrumentSetItem> InstrumentSetItems { get; set; } = new List<InstrumentSetItem>();
}
