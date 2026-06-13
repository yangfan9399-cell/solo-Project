using System.ComponentModel.DataAnnotations;
using BunkerFuelSystem.Models;

namespace BunkerFuelSystem.Models.ViewModels;

public class BunkerApplicationDetailViewModel
{
    [Display(Name = "加注申请")]
    public BunkerApplication Application { get; set; } = null!;

    [Display(Name = "流程节点")]
    public List<ProcessNode> ProcessNodes { get; set; } = [];

    [Display(Name = "差异字段")]
    public List<DiscrepancyField> DiscrepancyFields { get; set; } = [];

    [Display(Name = "证据附件")]
    public List<EvidenceAttachment> EvidenceAttachments { get; set; } = [];

    [Display(Name = "可处理")]
    public bool CanProcess { get; set; }

    [Display(Name = "可复核")]
    public bool CanReview { get; set; }

    [Display(Name = "可归档")]
    public bool CanArchive { get; set; }

    [Display(Name = "只读")]
    public bool IsReadOnly { get; set; }

    [Display(Name = "可重新处理")]
    public bool CanReprocess { get; set; }
}
