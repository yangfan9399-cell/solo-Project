using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BunkerFuelSystem.Models;

public class EvidenceAttachment
{
    [Key]
    [Display(Name = "编号")]
    public int Id { get; set; }

    [Required]
    [Display(Name = "加注申请编号")]
    public int BunkerApplicationId { get; set; }

    [Required]
    [StringLength(500)]
    [Display(Name = "文件名")]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    [Display(Name = "文件路径")]
    public string FilePath { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    [Display(Name = "文件类型")]
    public string FileType { get; set; } = string.Empty;

    [StringLength(1000)]
    [Display(Name = "描述")]
    public string? Description { get; set; }

    [Required]
    [StringLength(100)]
    [Display(Name = "上传人")]
    public string UploadedBy { get; set; } = string.Empty;

    [Required]
    [Display(Name = "上传时间")]
    public DateTime UploadedAt { get; set; }

    [Display(Name = "流程节点编号")]
    public int? ProcessNodeId { get; set; }

    [ForeignKey(nameof(BunkerApplicationId))]
    public BunkerApplication BunkerApplication { get; set; } = null!;
}
