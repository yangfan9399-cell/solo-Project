using HazardousGoodsYard.Models;
using HazardousGoodsYard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HazardousGoodsYard.Controllers;

[Authorize]
public class HomeController : Controller
{
    private readonly IDashboardService _dashboardService;

    public HomeController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    public async Task<IActionResult> Index()
    {
        var statistics = await _dashboardService.GetStatistics();
        var recentReservations = await _dashboardService.GetRecentReservations(10);
        var pendingReservations = await _dashboardService.GetPendingReservations();
        var yardCapacity = await _dashboardService.GetYardCapacityStatistics();

        ViewBag.Statistics = statistics;
        ViewBag.RecentReservations = recentReservations;
        ViewBag.PendingReservations = pendingReservations;
        ViewBag.YardCapacity = yardCapacity;

        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [AllowAnonymous]
    public IActionResult Error()
    {
        return View();
    }
}