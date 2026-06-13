using BunkerFuelSystem.Models;
using BunkerFuelSystem.Models.ViewModels;

namespace BunkerFuelSystem.Services;

public interface IBunkerService
{
    Task<BunkerApplicationListViewModel> GetListAsync(string? status, string? category, string? keyword);
    Task<BunkerApplicationDetailViewModel?> GetDetailAsync(int id);
    Task<ProcessDeskViewModel?> GetProcessDeskAsync(int id, UserRole currentRole);
    Task<bool> ProcessActionAsync(int id, UserRole currentRole, string action, string? businessRecord, string? siteDescription, string? comment, string? conclusion, string? operatorName);
    Task<DashboardViewModel> GetDashboardAsync(string? drillDownFilter);
    Task<bool> CanProcessAsync(int id, UserRole role);
    Task<bool> CanReviewAsync(int id, UserRole role);
}
