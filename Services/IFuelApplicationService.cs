using FuelManagementSystem.Models;

namespace FuelManagementSystem.Services;

public interface IFuelApplicationService
{
    Task<List<FuelApplication>> GetAllAsync(ApplicationStatus? status = null);
    Task<FuelApplication?> GetByIdAsync(int id);
    Task<FuelApplication> CreateAsync(FuelApplication application, string applicantName);
    Task<FuelApplication?> ApproveAsync(int id, string approverName);
    Task<FuelApplication?> RejectAsync(int id, string approverName, string reason);
    Task<FuelApplication?> StartBunkeringAsync(int id, string operatorName);
    Task<FuelApplication?> CompleteBunkeringAsync(int id, string operatorName, double actualQuantity, DiscrepancyReason discrepancyReason, string? remarks);
    Task<FuelApplication?> ConfirmSampleAsync(int id, string chiefEngineerName, string sampleNumber);
    Task<FuelApplication?> SettleAsync(int id, string financeVerifierName);
    Task<bool> CanSettleAsync(int id);
}
