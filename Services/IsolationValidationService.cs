using HazardousGoodsYard.Data;
using HazardousGoodsYard.Models;
using Microsoft.EntityFrameworkCore;

namespace HazardousGoodsYard.Services;

public class IsolationValidationService : IIsolationValidationService
{
    private readonly ApplicationDbContext _context;

    public IsolationValidationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ValidateHazardClassConflict(int isolationZoneId, HazardClass hazardClass)
    {
        var zone = await _context.IsolationZones.FindAsync(isolationZoneId);
        if (zone == null || !zone.IsActive)
        {
            return false;
        }

        var allowedClasses = ParseHazardClasses(zone.AllowedHazardClasses);
        if (!allowedClasses.Contains(hazardClass))
        {
            return false;
        }

        var conflictingClasses = ParseHazardClasses(zone.ConflictingHazardClasses);
        var existingReservations = await _context.Reservations
            .Include(r => r.HazardousGood)
            .Where(r => r.IsolationZoneId == isolationZoneId && r.Status != ReservationStatus.Rejected && r.Status != ReservationStatus.Expired)
            .ToListAsync();

        foreach (var reservation in existingReservations)
        {
            var existingClass = reservation.HazardousGood.HazardClass;
            if (conflictingClasses.Contains(existingClass))
            {
                return false;
            }
        }

        return true;
    }

    public async Task<bool> ValidateHazardClassConflictForArea(int yardAreaId, HazardClass hazardClass)
    {
        var area = await _context.YardAreas.FindAsync(yardAreaId);
        if (area == null || !area.IsActive)
        {
            return false;
        }

        var allowedClasses = ParseHazardClasses(area.AllowedHazardClasses);
        if (!allowedClasses.Contains(hazardClass))
        {
            return false;
        }

        var zonesInArea = await _context.IsolationZones
            .Where(z => z.YardAreaId == yardAreaId && z.IsActive)
            .ToListAsync();

        foreach (var zone in zonesInArea)
        {
            var conflictingClasses = ParseHazardClasses(zone.ConflictingHazardClasses);
            var existingReservations = await _context.Reservations
                .Include(r => r.HazardousGood)
                .Where(r => r.IsolationZoneId == zone.Id && r.Status != ReservationStatus.Rejected && r.Status != ReservationStatus.Expired)
                .ToListAsync();

            foreach (var reservation in existingReservations)
            {
                var existingClass = reservation.HazardousGood.HazardClass;
                if (conflictingClasses.Contains(hazardClass) || conflictingClasses.Contains(existingClass))
                {
                    return false;
                }
            }
        }

        return true;
    }

    public async Task<List<HazardClass>> GetConflictingHazardClasses(int isolationZoneId)
    {
        var zone = await _context.IsolationZones.FindAsync(isolationZoneId);
        if (zone == null)
        {
            return new List<HazardClass>();
        }

        return ParseHazardClasses(zone.ConflictingHazardClasses);
    }

    public async Task<List<IsolationZone>> GetAvailableZonesForHazardClass(HazardClass hazardClass)
    {
        var zones = await _context.IsolationZones
            .Include(z => z.YardArea)
            .Where(z => z.IsActive && z.CurrentUsage < z.MaxCapacity)
            .ToListAsync();

        var availableZones = new List<IsolationZone>();
        foreach (var zone in zones)
        {
            var allowedClasses = ParseHazardClasses(zone.AllowedHazardClasses);
            if (allowedClasses.Contains(hazardClass))
            {
                if (await ValidateHazardClassConflict(zone.Id, hazardClass))
                {
                    availableZones.Add(zone);
                }
            }
        }

        return availableZones;
    }

    public async Task<List<YardArea>> GetAvailableAreasForHazardClass(HazardClass hazardClass)
    {
        var areas = await _context.YardAreas
            .Where(a => a.IsActive && a.CurrentUsage < a.MaxCapacity)
            .ToListAsync();

        var availableAreas = new List<YardArea>();
        foreach (var area in areas)
        {
            var allowedClasses = ParseHazardClasses(area.AllowedHazardClasses);
            if (allowedClasses.Contains(hazardClass))
            {
                if (await ValidateHazardClassConflictForArea(area.Id, hazardClass))
                {
                    availableAreas.Add(area);
                }
            }
        }

        return availableAreas;
    }

    public async Task<IsolationValidationResult> ValidateIsolation(int reservationId, int isolationZoneId)
    {
        var result = new IsolationValidationResult { IsValid = true };

        var reservation = await _context.Reservations
            .Include(r => r.HazardousGood)
            .FirstOrDefaultAsync(r => r.Id == reservationId);

        if (reservation == null)
        {
            result.IsValid = false;
            result.ErrorMessage = "预约不存在";
            return result;
        }

        var zone = await _context.IsolationZones.FindAsync(isolationZoneId);
        if (zone == null || !zone.IsActive)
        {
            result.IsValid = false;
            result.ErrorMessage = "隔离区不存在或已禁用";
            return result;
        }

        var hazardClass = reservation.HazardousGood.HazardClass;
        var allowedClasses = ParseHazardClasses(zone.AllowedHazardClasses);
        if (!allowedClasses.Contains(hazardClass))
        {
            result.IsValid = false;
            result.ErrorMessage = $"该隔离区不允许存放 {GetHazardClassName(hazardClass)} 类危险品";
            return result;
        }

        if (zone.CurrentUsage >= zone.MaxCapacity)
        {
            result.IsValid = false;
            result.ErrorMessage = "隔离区容量已满";
            return result;
        }

        var conflictingClasses = ParseHazardClasses(zone.ConflictingHazardClasses);
        var existingReservations = await _context.Reservations
            .Include(r => r.HazardousGood)
            .Where(r => r.IsolationZoneId == isolationZoneId && r.Status != ReservationStatus.Rejected && r.Status != ReservationStatus.Expired)
            .ToListAsync();

        foreach (var existingReservation in existingReservations)
        {
            var existingClass = existingReservation.HazardousGood.HazardClass;
            if (conflictingClasses.Contains(existingClass))
            {
                result.IsValid = false;
                result.ErrorMessage = $"危险等级冲突：隔离区已有 {GetHazardClassName(existingClass)} 类危险品存放，与 {GetHazardClassName(hazardClass)} 类冲突";
                result.ConflictingClasses.Add(existingClass);
                return result;
            }
        }

        if (existingReservations.Any())
        {
            result.Warnings.Add($"隔离区当前有 {existingReservations.Count} 个预约");
        }

        return result;
    }

    public async Task<bool> CheckZoneCapacity(int isolationZoneId)
    {
        var zone = await _context.IsolationZones.FindAsync(isolationZoneId);
        return zone != null && zone.CurrentUsage < zone.MaxCapacity;
    }

    public async Task<bool> CheckAreaCapacity(int yardAreaId)
    {
        var area = await _context.YardAreas.FindAsync(yardAreaId);
        return area != null && area.CurrentUsage < area.MaxCapacity;
    }

    private List<HazardClass> ParseHazardClasses(string classesString)
    {
        if (string.IsNullOrWhiteSpace(classesString))
        {
            return new List<HazardClass>();
        }

        var classes = classesString.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var result = new List<HazardClass>();

        foreach (var classStr in classes)
        {
            if (int.TryParse(classStr.Trim(), out int classValue))
            {
                var hazardClass = ConvertToHazardClass(classValue);
                if (hazardClass.HasValue)
                {
                    result.Add(hazardClass.Value);
                }
            }
        }

        return result;
    }

    private HazardClass? ConvertToHazardClass(int value)
    {
        return value switch
        {
            1 => HazardClass.Class1,
            21 => HazardClass.Class2_1,
            22 => HazardClass.Class2_2,
            23 => HazardClass.Class2_3,
            3 => HazardClass.Class3,
            41 => HazardClass.Class4_1,
            42 => HazardClass.Class4_2,
            43 => HazardClass.Class4_3,
            51 => HazardClass.Class5_1,
            52 => HazardClass.Class5_2,
            61 => HazardClass.Class6_1,
            62 => HazardClass.Class6_2,
            7 => HazardClass.Class7,
            8 => HazardClass.Class8,
            9 => HazardClass.Class9,
            _ => null
        };
    }

    private string GetHazardClassName(HazardClass hazardClass)
    {
        return hazardClass switch
        {
            HazardClass.Class1 => "1类(爆炸品)",
            HazardClass.Class2_1 => "2.1类(易燃气体)",
            HazardClass.Class2_2 => "2.2类(非易燃无毒气体)",
            HazardClass.Class2_3 => "2.3类(毒性气体)",
            HazardClass.Class3 => "3类(易燃液体)",
            HazardClass.Class4_1 => "4.1类(易燃固体)",
            HazardClass.Class4_2 => "4.2类(易自燃物质)",
            HazardClass.Class4_3 => "4.3类(遇水放出易燃气体物质)",
            HazardClass.Class5_1 => "5.1类(氧化性物质)",
            HazardClass.Class5_2 => "5.2类(有机过氧化物)",
            HazardClass.Class6_1 => "6.1类(毒性物质)",
            HazardClass.Class6_2 => "6.2类(感染性物质)",
            HazardClass.Class7 => "7类(放射性物质)",
            HazardClass.Class8 => "8类(腐蚀性物质)",
            HazardClass.Class9 => "9类(杂项危险物质)",
            _ => "未知"
        };
    }
}