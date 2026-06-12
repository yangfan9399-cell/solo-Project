using MeetingRoomEquipment.Services;
using MeetingRoomEquipment.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoomEquipment.Controllers;

public class DashboardController : Controller
{
    private readonly IStatisticsService _stats;
    private readonly ICurrentUserService _user;

    public DashboardController(IStatisticsService stats, ICurrentUserService user)
    {
        _stats = stats;
        _user = user;
    }

    public async Task<IActionResult> Index()
    {
        var vm = await _stats.GetDashboardAsync();
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        return View(vm);
    }
}
