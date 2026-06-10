using HazardousGoodsYard.Models;

namespace HazardousGoodsYard.Services;

public interface IIsolationValidationService
{
    Task<bool> ValidateHazardClassConflict(int isolationZoneId, HazardClass hazardClass);
    Task<bool> ValidateHazardClassConflictForArea(int yardAreaId, HazardClass hazardClass);
    Task<List<HazardClass>> GetConflictingHazardClasses(int isolationZoneId);
    Task<List<IsolationZone>> GetAvailableZonesForHazardClass(HazardClass hazardClass);
    Task<List<YardArea>> GetAvailableAreasForHazardClass(HazardClass hazardClass);
    Task<IsolationValidationResult> ValidateIsolation(int reservationId, int isolationZoneId);
    Task<bool> CheckZoneCapacity(int isolationZoneId);
    Task<bool> CheckAreaCapacity(int yardAreaId);
}

public class IsolationValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> Warnings { get; set; } = new List<string>();
    public List<HazardClass> ConflictingClasses { get; set; } = new List<HazardClass>();
}