using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public interface IRectificationService
{
    Task<IEnumerable<Rectification>> GetAllAsync();
    Task<Rectification?> GetByIdAsync(int id);
    Task<Rectification?> GetByHiddenDangerIdAsync(int hiddenDangerId);
    Task<Rectification> CreateAsync(Rectification rectification);
    Task<Rectification> UpdateAsync(Rectification rectification);
    Task<bool> DeleteAsync(int id);
}
