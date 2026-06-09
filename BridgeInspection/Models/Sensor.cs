using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BridgeInspection.Models;

public class Sensor
{
    public int Id { get; set; }

    [Required]
    public int BridgeId { get; set; }

    [ForeignKey(nameof(BridgeId))]
    public Bridge? Bridge { get; set; }

    [Required]
    [StringLength(100)]
    public string SensorCode { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string SensorType { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Location { get; set; }

    public SensorStatus Status { get; set; } = SensorStatus.Online;

    public DateTime? LastOnlineTime { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<SensorReading> Readings { get; set; } = new List<SensorReading>();
}
