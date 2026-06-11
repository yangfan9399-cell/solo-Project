using Microsoft.AspNetCore.Mvc;
using OceanFarm.Services;
using OceanFarm.ViewModels;

namespace OceanFarm.Controllers;

public class HomeController : Controller
{
    private readonly IDashboardService _dashboardService;

    public HomeController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    public async Task<IActionResult> Index()
    {
        var model = await _dashboardService.GetDashboardAsync();
        return View(model);
    }
}
