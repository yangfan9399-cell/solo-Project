using System.ComponentModel.DataAnnotations;

namespace BridgeInspection.Models;

public class Bridge
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(200)]
    public string? RouteName { get; set; }

    [Required]
    public BridgeType BridgeType { get; set; }

    [StringLength(500)]
    public string? Location { get; set; }

    public double? Length { get; set; }

    public double? Width { get; set; }

    public int? BuildYear { get; set; }

    [StringLength(100)]
    public string? ManagementUnit { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<Defect> Defects { get; set; } = new List<Defect>();

    public ICollection<Sensor> Sensors { get; set; } = new List<Sensor>();
}
