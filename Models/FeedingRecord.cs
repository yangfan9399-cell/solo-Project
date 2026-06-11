using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OceanFarm.Models;

public class FeedingRecord
{
    public int Id { get; set; }

    public int CageId { get; set; }

    [ForeignKey(nameof(CageId))]
    public Cage Cage { get; set; } = null!;

    public int OperatorId { get; set; }

    [ForeignKey(nameof(OperatorId))]
    public AppUser Operator { get; set; } = null!;

    public DateTime FeedingTime { get; set; } = DateTime.UtcNow;

    public decimal FeedAmountKg { get; set; }

    [MaxLength(100)]
    public string FeedType { get; set; } = string.Empty;

    public FeedingStatus Status { get; set; } = FeedingStatus.Pending;

    public AnomalyType AnomalyType { get; set; } = AnomalyType.None;

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
