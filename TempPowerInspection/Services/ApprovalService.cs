using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Data;
using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public class ApprovalService : IApprovalService
{
    private readonly ApplicationDbContext _context;

    public ApprovalService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PowerApproval>> GetAllAsync()
    {
        return await _context.PowerApprovals
            .Include(p => p.HiddenDanger)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<PowerApproval?> GetByIdAsync(int id)
    {
        return await _context.PowerApprovals
            .Include(p => p.HiddenDanger)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PowerApproval?> GetByHiddenDangerIdAsync(int hiddenDangerId)
    {
        return await _context.PowerApprovals
            .Include(p => p.HiddenDanger)
            .FirstOrDefaultAsync(p => p.HiddenDangerId == hiddenDangerId);
    }

    public async Task<PowerApproval> CreateAsync(PowerApproval approval)
    {
        _context.PowerApprovals.Add(approval);
        await _context.SaveChangesAsync();
        return approval;
    }

    public async Task<PowerApproval> UpdateAsync(PowerApproval approval)
    {
        _context.PowerApprovals.Update(approval);
        await _context.SaveChangesAsync();
        return approval;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var approval = await _context.PowerApprovals.FindAsync(id);
        if (approval == null) return false;

        _context.PowerApprovals.Remove(approval);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CanPowerOnAsync(int hiddenDangerId)
    {
        var danger = await _context.HiddenDangers
            .Include(h => h.PowerApproval)
            .FirstOrDefaultAsync(h => h.Id == hiddenDangerId);

        if (danger == null) return false;

        // 复检不通过时禁止送电
        if (danger.Status == DangerStatus.退回) return false;

        // 必须审批通过才能送电
        if (danger.PowerApproval?.ApprovalResult != ApprovalResult.通过) return false;

        return danger.PowerApproval.CanPowerOn;
    }
}
