using System.ComponentModel.DataAnnotations;
using BunkerFuelSystem.Models;

namespace BunkerFuelSystem.Models.ViewModels;

public class BunkerApplicationListViewModel
{
    public List<BunkerApplicationListItem> Applications { get; set; } = [];

    [Display(Name = "状态筛选")]
    public WorkflowStatus? FilterStatus { get; set; }

    [Display(Name = "类别筛选")]
    public ApplicationCategory? FilterCategory { get; set; }

    [Display(Name = "搜索关键词")]
    public string? SearchKeyword { get; set; }
}

public class BunkerApplicationListItem
{
    [Display(Name = "编号")]
    public int Id { get; set; }

    [Display(Name = "申请编号")]
    public string ApplicationNo { get; set; } = string.Empty;

    [Display(Name = "船名")]
    public string ShipName { get; set; } = string.Empty;

    [Display(Name = "燃油类型")]
    public string FuelType { get; set; } = string.Empty;

    [Display(Name = "申请数量")]
    public decimal OrderedQuantity { get; set; }

    [Display(Name = "实际数量")]
    public decimal ActualQuantity { get; set; }

    [Display(Name = "流程状态")]
    public WorkflowStatus Status { get; set; }

    [Display(Name = "申请类别")]
    public ApplicationCategory Category { get; set; }

    [Display(Name = "当前负责人")]
    public string CurrentResponsiblePerson { get; set; } = string.Empty;

    [Display(Name = "当前负责人角色")]
    public UserRole CurrentResponsibleRole { get; set; }

    [Display(Name = "结论")]
    public string? Conclusion { get; set; }

    [Display(Name = "摘要")]
    public string? Summary { get; set; }

    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; }

    [Display(Name = "更新时间")]
    public DateTime UpdatedAt { get; set; }

    [Display(Name = "是否存在差异")]
    public bool HasDiscrepancy { get; set; }

    [Display(Name = "阻断原因")]
    public string? BlockedReason { get; set; }
}
