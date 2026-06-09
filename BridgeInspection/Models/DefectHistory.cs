using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BridgeInspection.Models;

public class DefectHistory
{
    public int Id { get; set; }

    [Required]
    public int DefectId { get; set; }

    [ForeignKey(nameof(DefectId))]
    public Defect? Defect { get; set; }

    [Required]
    public DefectStatus ActionType { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(100)]
    public string OperatorId { get; set; } = string.Empty;

    [ForeignKey(nameof(OperatorId))]
    public ApplicationUser? Operator { get; set; }

    public DateTime OperatedAt { get; set; } = DateTime.Now;

    [StringLength(200)]
    public string? Remark { get; set; }
}
