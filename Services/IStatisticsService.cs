namespace FuelManagementSystem.Services;

public interface IStatisticsService
{
    Task<List<ShipStatisticsDto>> GetShipStatisticsAsync(int? year = null);
    Task<List<SupplierStatisticsDto>> GetSupplierStatisticsAsync(int? year = null);
    Task<List<DiscrepancyStatisticsDto>> GetDiscrepancyStatisticsAsync(int? year = null);
    Task<List<SettlementStatisticsDto>> GetSettlementStatisticsAsync(int? year = null);
}
