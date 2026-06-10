using HazardousGoodsYard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HazardousGoodsYard.Controllers;

[Authorize]
public class DashboardController : Controller
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    public async Task<IActionResult> Index()
    {
        var statistics = await _dashboardService.GetStatistics();
        var byGoodsCategory = await _dashboardService.GetReservationsByGoodsCategory();
        var byYard = await _dashboardService.GetReservationsByYard();
        var byRejectionReason = await _dashboardService.GetReservationsByRejectionReason();
        var byWaitingTime = await _dashboardService.GetReservationsByWaitingTime();
        var yardCapacity = await _dashboardService.GetYardCapacityStatistics();

        ViewBag.Statistics = statistics;
        ViewBag.ByGoodsCategory = byGoodsCategory;
        ViewBag.ByYard = byYard;
        ViewBag.ByRejectionReason = byRejectionReason;
        ViewBag.ByWaitingTime = byWaitingTime;
        ViewBag.YardCapacity = yardCapacity;

        return View();
    }

    public async Task<IActionResult> GoodsCategory()
    {
        var data = await _dashboardService.GetReservationsByGoodsCategory();
        return Json(data);
    }

    public async Task<IActionResult> Yard()
    {
        var data = await _dashboardService.GetReservationsByYard();
        return Json(data);
    }

    public async Task<IActionResult> RejectionReason()
    {
        var data = await _dashboardService.GetReservationsByRejectionReason();
        return Json(data);
    }

    public async Task<IActionResult> WaitingTime()
    {
        var data = await _dashboardService.GetReservationsByWaitingTime();
        return Json(data);
    }

    public async Task<IActionResult> Capacity()
    {
        var data = await _dashboardService.GetYardCapacityStatistics();
        return Json(data);
    }
}