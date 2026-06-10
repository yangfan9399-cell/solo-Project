using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public interface IHiddenDangerService
{
    Task<IEnumerable<HiddenDanger>> GetAllAsync();
    Task<HiddenDanger?> GetByIdAsync(int id);
    Task<HiddenDanger> CreateAsync(HiddenDanger danger);
    Task<HiddenDanger> UpdateAsync(HiddenDanger danger);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<HiddenDanger>> GetByStatusAsync(DangerStatus status);
    Task<IEnumerable<HiddenDanger>> GetByBuildingAsync(string buildingName);
    Task<IEnumerable<HiddenDanger>> GetByTeamAsync(string teamName);
}
