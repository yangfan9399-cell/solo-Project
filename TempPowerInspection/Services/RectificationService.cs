using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Data;
using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public class RectificationService : IRectificationService
{
    private readonly ApplicationDbContext _context;

    public RectificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Rectification>> GetAllAsync()
    {
        return await _context.Rectifications
            .Include(r => r.HiddenDanger)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Rectification?> GetByIdAsync(int id)
    {
        return await _context.Rectifications
            .Include(r => r.HiddenDanger)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Rectification?> GetByHiddenDangerIdAsync(int hiddenDangerId)
    {
        return await _context.Rectifications
            .Include(r => r.HiddenDanger)
            .FirstOrDefaultAsync(r => r.HiddenDangerId == hiddenDangerId);
    }

    public async Task<Rectification> CreateAsync(Rectification rectification)
    {
        _context.Rectifications.Add(rectification);
        await _context.SaveChangesAsync();
        return rectification;
    }

    public async Task<Rectification> UpdateAsync(Rectification rectification)
    {
        rectification.UpdatedAt = DateTime.Now;
        _context.Rectifications.Update(rectification);
        await _context.SaveChangesAsync();
        return rectification;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var rectification = await _context.Rectifications.FindAsync(id);
        if (rectification == null) return false;

        _context.Rectifications.Remove(rectification);
        await _context.SaveChangesAsync();
        return true;
    }
}
