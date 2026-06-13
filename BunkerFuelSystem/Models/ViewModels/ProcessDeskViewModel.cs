using System.ComponentModel.DataAnnotations;
using BunkerFuelSystem.Models;

namespace BunkerFuelSystem.Models.ViewModels;

public class ProcessDeskViewModel
{
    [Display(Name = "加注申请")]
    public BunkerApplication Application { get; set; } = null!;

    [Display(Name = "当前用户角色")]
    public UserRole CurrentUserRole { get; set; }

    [Display(Name = "可用操作")]
    public List<string> AvailableActions { get; set; } = [];

    [Display(Name = "业务记录")]
    public string? BusinessRecord { get; set; }

    [Display(Name = "现场描述")]
    public string? SiteDescription { get; set; }

    [Display(Name = "备注")]
    public string? Comment { get; set; }

    [Display(Name = "结论")]
    public string? Conclusion { get; set; }
}
