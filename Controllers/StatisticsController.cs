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

public class StatisticsViewModel
{
    public int Year { get; set; }
    public List<ShipStatisticsDto> ShipStatistics { get; set; } = new();
    public List<SupplierStatisticsDto> SupplierStatistics { get; set; } = new();
    public List<DiscrepancyStatisticsDto> DiscrepancyStatistics { get; set; } = new();
    public List<SettlementStatisticsDto> SettlementStatistics { get; set; } = new();
}
