using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BunkerFuelSystem.Models;

public class BunkerApplication
{
    [Key]
    [Display(Name = "编号")]
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    [Display(Name = "申请编号")]
    public string ApplicationNo { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    [Display(Name = "船名")]
    public string ShipName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    [Display(Name = "航次号")]
    public string VoyageNo { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    [Display(Name = "燃油类型")]
    public string FuelType { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "申请数量")]
    public decimal OrderedQuantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "实际数量")]
    public decimal ActualQuantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,4)")]
    [Display(Name = "单价")]
    public decimal UnitPrice { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Display(Name = "总金额")]
    public decimal TotalAmount { get; set; }

    [Required]
    [Display(Name = "加注日期")]
    public DateTime BunkerDate { get; set; }

    [Required]
    [StringLength(200)]
    [Display(Name = "加注港口")]
    public string BunkerPort { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    [Display(Name = "供应商名称")]
    public string SupplierName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    [Display(Name = "申请来源")]
    public string ApplicationSource { get; set; } = string.Empty;

    [Required]
    [Display(Name = "申请类别")]
    public ApplicationCategory Category { get; set; }

    [Required]
    [Display(Name = "流程状态")]
    public WorkflowStatus Status { get; set; }

    [Required]
    [StringLength(100)]
    [Display(Name = "当前负责人")]
    public string CurrentResponsiblePerson { get; set; } = string.Empty;

    [Required]
    [Display(Name = "当前负责人角色")]
    public UserRole CurrentResponsibleRole { get; set; }

    [StringLength(500)]
    [Display(Name = "结论")]
    public string? Conclusion { get; set; }

    [StringLength(1000)]
    [Display(Name = "摘要")]
    public string? Summary { get; set; }

    [StringLength(500)]
    [Display(Name = "阻断原因")]
    public string? BlockedReason { get; set; }

    [StringLength(500)]
    [Display(Name = "补救路径")]
    public string? RemediationPath { get; set; }

    [StringLength(500)]
    [Display(Name = "采用依据")]
    public string? Basis { get; set; }

    [Required]
    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; }

    [Required]
    [Display(Name = "更新时间")]
    public DateTime UpdatedAt { get; set; }

    public List<ProcessNode> ProcessNodes { get; set; } = [];

    public List<DiscrepancyField> DiscrepancyFields { get; set; } = [];

    public List<EvidenceAttachment> EvidenceAttachments { get; set; } = [];
}
