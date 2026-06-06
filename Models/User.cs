using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string EmployeeId { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public ICollection<TrackingRecord> TrackingRecords { get; set; } = new List<TrackingRecord>();
}
