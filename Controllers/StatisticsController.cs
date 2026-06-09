using FuelManagementSystem.Models;
using FuelManagementSystem.Services;
using Microsoft.AspNetCore.Mvc;

namespace FuelManagementSystem.Controllers;

public class StatisticsController : Controller
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    public async Task<IActionResult> Index(int? year)
    {
        var shipStats = await _statisticsService.GetShipStatisticsAsync(year);
        var supplierStats = await _statisticsService.GetSupplierStatisticsAsync(year);
        var discrepancyStats = await _statisticsService.GetDiscrepancyStatisticsAsync(year);
        var settlementStats = await _statisticsService.GetSettlementStatisticsAsync(year);

        var viewModel = new StatisticsViewModel
        {
            Year = year ?? DateTime.Now.Year,
            ShipStatistics = shipStats,
            SupplierStatistics = supplierStats,
            DiscrepancyStatistics = discrepancyStats,
            SettlementStatistics = settlementStats
        };

        return View(viewModel);
    }
}
