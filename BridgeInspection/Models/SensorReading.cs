using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BridgeInspection.Models;

public class SensorReading
{
    public int Id { get; set; }

    [Required]
    public int SensorId { get; set; }

    [ForeignKey(nameof(SensorId))]
    public Sensor? Sensor { get; set; }

    public int? DefectId { get; set; }

    [ForeignKey(nameof(DefectId))]
    public Defect? Defect { get; set; }

    public DateTime ReadingTime { get; set; }

    public double? Value { get; set; }

    [StringLength(50)]
    public string? Unit { get; set; }

    [StringLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
