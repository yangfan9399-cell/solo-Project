using MeetingRoomEquipment.Models;
using MeetingRoomEquipment.Services;
using MeetingRoomEquipment.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomEquipment.Controllers;

public class ReviewController : Controller
{
    private readonly IStatisticsService _stats;
    private readonly IRecordService _recordSvc;
    private readonly ICurrentUserService _user;

    public ReviewController(IStatisticsService stats, IRecordService recordSvc, ICurrentUserService user)
    {
        _stats = stats;
        _recordSvc = recordSvc;
        _user = user;
    }

    public async Task<IActionResult> Index()
    {
        var vm = await _stats.GetDashboardAsync();
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        return View(vm);
    }

    public async Task<IActionResult> ByStatus(RecordStatus status)
    {
        var list = await _stats.GetByStatusAsync(status);
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        ViewData["DrillTitle"] = $"状态钻取 - {EnumDisplay.GetStatusText(status)}";
        return View("DrillResult", list);
    }

    public async Task<IActionResult> ByCategory(SampleCategory category)
    {
        var list = await _stats.GetByCategoryAsync(category);
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        ViewData["DrillTitle"] = $"分类钻取 - {EnumDisplay.GetCategoryText(category)}";
        return View("DrillResult", list);
    }

    public async Task<IActionResult> ByDepartment(string department)
    {
        var list = await _stats.GetByDepartmentAsync(department);
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        ViewData["DrillTitle"] = $"部门钻取 - {department}";
        return View("DrillResult", list);
    }
}
