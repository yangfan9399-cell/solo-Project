using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Data;
using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public class HiddenDangerService : IHiddenDangerService
{
    private readonly ApplicationDbContext _context;

    public HiddenDangerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<HiddenDanger>> GetAllAsync()
    {
        return await _context.HiddenDangers
            .Include(h => h.Rectification)
            .Include(h => h.PowerApproval)
            .Include(h => h.StatusHistories.OrderByDescending(s => s.OperatedAt))
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task<HiddenDanger?> GetByIdAsync(int id)
    {
        return await _context.HiddenDangers
            .Include(h => h.Rectification)
            .Include(h => h.PowerApproval)
            .Include(h => h.StatusHistories.OrderByDescending(s => s.OperatedAt))
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<HiddenDanger> CreateAsync(HiddenDanger danger)
    {
        _context.HiddenDangers.Add(danger);
        await _context.SaveChangesAsync();

        // Add status history
        var history = new StatusHistory
        {
            HiddenDangerId = danger.Id,
            Status = DangerStatus.待整改,
            Operator = danger.CreatedBy,
            Remark = "提交巡检记录",
            OperatedAt = DateTime.Now
        };
        _context.StatusHistories.Add(history);
        await _context.SaveChangesAsync();

        return danger;
    }

    public async Task<HiddenDanger> UpdateAsync(HiddenDanger danger)
    {
        danger.UpdatedAt = DateTime.Now;
        _context.HiddenDangers.Update(danger);
        await _context.SaveChangesAsync();
        return danger;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var danger = await _context.HiddenDangers.FindAsync(id);
        if (danger == null) return false;

        _context.HiddenDangers.Remove(danger);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<HiddenDanger>> GetByStatusAsync(DangerStatus status)
    {
        return await _context.HiddenDangers
            .Include(h => h.Rectification)
            .Include(h => h.PowerApproval)
            .Where(h => h.Status == status)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<HiddenDanger>> GetByBuildingAsync(string buildingName)
    {
        return await _context.HiddenDangers
            .Include(h => h.Rectification)
            .Include(h => h.PowerApproval)
            .Where(h => h.BuildingName == buildingName)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<HiddenDanger>> GetByTeamAsync(string teamName)
    {
        return await _context.HiddenDangers
            .Include(h => h.Rectification)
            .Include(h => h.PowerApproval)
            .Where(h => h.TeamName == teamName)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }
}
