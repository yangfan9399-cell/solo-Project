using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TempPowerInspection.Models;

public enum ApprovalResult
{
    待审批 = 0,
    通过 = 1,
    退回 = 2
}

public class PowerApproval
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int HiddenDangerId { get; set; }

    [MaxLength(50)]
    public string? ApprovedBy { get; set; }

    public ApprovalResult ApprovalResult { get; set; } = ApprovalResult.待审批;

    [MaxLength(500)]
    public string? Comment { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public bool CanPowerOn { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation property
    [ForeignKey("HiddenDangerId")]
    public HiddenDanger? HiddenDanger { get; set; }

    [NotMapped]
    public string ApprovalResultName => ApprovalResult switch
    {
        ApprovalResult.待审批 => "待审批",
        ApprovalResult.通过 => "通过",
        ApprovalResult.退回 => "退回",
        _ => "未知"
    };

    [NotMapped]
    public string ApprovalResultCssClass => ApprovalResult switch
    {
        ApprovalResult.待审批 => "bg-secondary",
        ApprovalResult.通过 => "bg-success",
        ApprovalResult.退回 => "bg-danger",
        _ => "bg-secondary"
    };
}
