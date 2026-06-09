using FuelManagementSystem.Services;

namespace FuelManagementSystem.Models;

public class StatisticsViewModel
{
    public int Year { get; set; }
    public List<ShipStatisticsDto> ShipStatistics { get; set; } = new();
    public List<SupplierStatisticsDto> SupplierStatistics { get; set; } = new();
    public List<DiscrepancyStatisticsDto> DiscrepancyStatistics { get; set; } = new();
    public List<SettlementStatisticsDto> SettlementStatistics { get; set; } = new();
}
