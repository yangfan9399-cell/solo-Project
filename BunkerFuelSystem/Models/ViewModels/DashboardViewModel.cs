using System.ComponentModel.DataAnnotations;
using BunkerFuelSystem.Models;

namespace BunkerFuelSystem.Models.ViewModels;

public class DashboardViewModel
{
    [Display(Name = "总数")]
    public int TotalCount { get; set; }

    [Display(Name = "正常放行数")]
    public int NormalCount { get; set; }

    [Display(Name = "指标超限数")]
    public int OverLimitCount { get; set; }

    [Display(Name = "证据缺失数")]
    public int EvidenceMissingCount { get; set; }

    [Display(Name = "审批超时数")]
    public int TimeoutCount { get; set; }

    [Display(Name = "已归档数")]
    public int ArchivedCount { get; set; }

    [Display(Name = "活跃数")]
    public int ActiveCount { get; set; }

    [Display(Name = "状态分布")]
    public Dictionary<string, int> StatusDistribution { get; set; } = [];

    [Display(Name = "类别分布")]
    public Dictionary<string, int> CategoryDistribution { get; set; } = [];

    [Display(Name = "最近项")]
    public List<BunkerApplicationListItem> RecentItems { get; set; } = [];

    [Display(Name = "下钻结果")]
    public List<BunkerApplicationListItem>? DrillDownResults { get; set; }

    [Display(Name = "下钻筛选")]
    public string? DrillDownFilter { get; set; }
}
