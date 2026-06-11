using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OceanFarm.Models;

public class WaterQualityRecord
{
    public int Id { get; set; }

    public int CageId { get; set; }

    [ForeignKey(nameof(CageId))]
    public Cage Cage { get; set; } = null!;

    public int InspectorId { get; set; }

    [ForeignKey(nameof(InspectorId))]
    public AppUser Inspector { get; set; } = null!;

    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;

    public decimal Temperature { get; set; }

    public decimal DissolvedOxygen { get; set; }

    public decimal Ph { get; set; }

    public decimal Salinity { get; set; }

    public decimal Turbidity { get; set; }

    public AnomalyType AnomalyType { get; set; } = AnomalyType.None;

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public bool IsHandled { get; set; } = false;
}
