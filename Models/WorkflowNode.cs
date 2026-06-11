using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OceanFarm.Models;

public class WorkflowNode
{
    public int Id { get; set; }

    public int CageId { get; set; }

    [ForeignKey(nameof(CageId))]
    public Cage Cage { get; set; } = null!;

    public int OperatorId { get; set; }

    [ForeignKey(nameof(OperatorId))]
    public AppUser Operator { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string NodeType { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public AnomalyType? RelatedAnomaly { get; set; }

    public DisposalStatus? StatusAfter { get; set; }

    public int? RelatedRecordId { get; set; }

    [MaxLength(100)]
    public string? RelatedRecordType { get; set; }
}
