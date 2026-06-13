using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BunkerFuelSystem.Models;

public class ProcessNode
{
    [Key]
    [Display(Name = "编号")]
    public int Id { get; set; }

    [Required]
    [Display(Name = "加注申请编号")]
    public int BunkerApplicationId { get; set; }

    [Required]
    [Display(Name = "节点类型")]
    public NodeType NodeType { get; set; }

    [Required]
    [StringLength(100)]
    [Display(Name = "操作人")]
    public string OperatorName { get; set; } = string.Empty;

    [Required]
    [Display(Name = "操作人角色")]
    public UserRole OperatorRole { get; set; }

    [Required]
    [StringLength(100)]
    [Display(Name = "操作")]
    public string Action { get; set; } = string.Empty;

    [StringLength(1000)]
    [Display(Name = "备注")]
    public string? Comment { get; set; }

    [StringLength(500)]
    [Display(Name = "阻断原因")]
    public string? BlockedReason { get; set; }

    [StringLength(500)]
    [Display(Name = "补救路径")]
    public string? RemediationPath { get; set; }

    [Required]
    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; }

    [ForeignKey(nameof(BunkerApplicationId))]
    public BunkerApplication BunkerApplication { get; set; } = null!;
}
