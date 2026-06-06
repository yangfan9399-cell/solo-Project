using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class Department
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public ICollection<InstrumentSet> InstrumentSets { get; set; } = new List<InstrumentSet>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
