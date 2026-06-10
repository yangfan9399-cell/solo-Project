using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public interface IApprovalService
{
    Task<IEnumerable<PowerApproval>> GetAllAsync();
    Task<PowerApproval?> GetByIdAsync(int id);
    Task<PowerApproval?> GetByHiddenDangerIdAsync(int hiddenDangerId);
    Task<PowerApproval> CreateAsync(PowerApproval approval);
    Task<PowerApproval> UpdateAsync(PowerApproval approval);
    Task<bool> DeleteAsync(int id);
    Task<bool> CanPowerOnAsync(int hiddenDangerId);
}
