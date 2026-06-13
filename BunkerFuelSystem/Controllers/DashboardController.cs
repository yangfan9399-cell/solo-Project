using BunkerFuelSystem.Services;
using Microsoft.AspNetCore.Mvc;

namespace BunkerFuelSystem.Controllers;

public class DashboardController : Controller
{
    private readonly IBunkerService _bunkerService;

    public DashboardController(IBunkerService bunkerService)
    {
        _bunkerService = bunkerService;
    }

    [HttpGet]
    public async Task<IActionResult> Index(string? drillDownFilter)
    {
        var viewModel = await _bunkerService.GetDashboardAsync(drillDownFilter);
        return View(viewModel);
    }

    [HttpGet("/Dashboard/DrillDown")]
    public async Task<IActionResult> DrillDown(string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter))
        {
            return RedirectToAction(nameof(Index));
        }

        var viewModel = await _bunkerService.GetDashboardAsync(filter);

        if (Request.Headers.XRequestedWith == "XMLHttpRequest")
        {
            return PartialView("_DrillDownResults", viewModel);
        }

        return RedirectToAction(nameof(Index), new { drillDownFilter = filter });
    }
}
