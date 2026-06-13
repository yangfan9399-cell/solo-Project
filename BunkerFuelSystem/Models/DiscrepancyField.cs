using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BunkerFuelSystem.Models;

public class DiscrepancyField
{
    [Key]
    [Display(Name = "编号")]
    public int Id { get; set; }

    [Required]
    [Display(Name = "加注申请编号")]
    public int BunkerApplicationId { get; set; }

    [Required]
    [StringLength(100)]
    [Display(Name = "字段名称")]
    public string FieldName { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    [Display(Name = "字段标签")]
    public string FieldLabel { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    [Display(Name = "原始值")]
    public string OriginalValue { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    [Display(Name = "当前值")]
    public string CurrentValue { get; set; } = string.Empty;

    [Required]
    [Display(Name = "变更时间")]
    public DateTime ChangedAt { get; set; }

    [Required]
    [StringLength(100)]
    [Display(Name = "变更人")]
    public string ChangedBy { get; set; } = string.Empty;

    [Required]
    [Display(Name = "是否关键字段")]
    public bool IsKeyField { get; set; }

    [ForeignKey(nameof(BunkerApplicationId))]
    public BunkerApplication BunkerApplication { get; set; } = null!;
}
