using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Data;
using TempPowerInspection.Models;

namespace TempPowerInspection.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardViewModel> GetDashboardDataAsync()
    {
        var dangers = await _context.HiddenDangers
            .Include(h => h.Rectification)
            .ToListAsync();

        var model = new DashboardViewModel
        {
            TotalCount = dangers.Count,
            PendingCount = dangers.Count(d => d.Status == DangerStatus.待整改),
            InProgressCount = dangers.Count(d => d.Status == DangerStatus.整改中),
            PendingReviewCount = dangers.Count(d => d.Status == DangerStatus.待复检),
            PassedCount = dangers.Count(d => d.Status == DangerStatus.已通过),
            PoweredOnCount = dangers.Count(d => d.Status == DangerStatus.已送电),
            ReturnedCount = dangers.Count(d => d.Status == DangerStatus.退回)
        };

        // 按楼栋聚合
        model.BuildingStats = dangers
            .GroupBy(d => d.BuildingName)
            .Select(g => new BuildingStat
            {
                BuildingName = g.Key,
                TotalCount = g.Count(),
                PendingCount = g.Count(d => d.Status == DangerStatus.待整改 || d.Status == DangerStatus.退回),
                InProgressCount = g.Count(d => d.Status == DangerStatus.整改中 || d.Status == DangerStatus.待复检),
                PassedCount = g.Count(d => d.Status == DangerStatus.已通过 || d.Status == DangerStatus.已送电)
            })
            .ToList();

        // 按班组聚合
        model.TeamStats = dangers
            .GroupBy(d => d.TeamName)
            .Select(g => new TeamStat
            {
                TeamName = g.Key,
                TotalCount = g.Count(),
                PendingCount = g.Count(d => d.Status == DangerStatus.待整改 || d.Status == DangerStatus.整改中 || d.Status == DangerStatus.待复检 || d.Status == DangerStatus.退回)
            })
            .ToList();

        // 按隐患类型聚合
        model.DangerTypeStats = dangers
            .GroupBy(d => d.DangerType)
            .Select(g => new DangerTypeStat
            {
                DangerType = g.Key,
                Count = g.Count()
            })
            .ToList();

        // 整改时长统计
        var rectifications = await _context.Rectifications
            .Include(r => r.HiddenDanger)
            .Where(r => r.CompletedAt.HasValue)
            .ToListAsync();

        model.RectificationDurationStats = rectifications
            .Select(r => new RectificationDurationStat
            {
                DistributionBoxName = r.HiddenDanger?.DistributionBoxName ?? "未知",
                DurationDays = r.CompletedAt.HasValue ? (int)(r.CompletedAt.Value - r.HiddenDanger!.CreatedAt).TotalDays : 0,
                IsOverdue = r.CompletedAt.HasValue && (r.CompletedAt.Value - r.HiddenDanger!.CreatedAt).TotalDays > 7
            })
            .OrderByDescending(r => r.DurationDays)
            .Take(10)
            .ToList();

        return model;
    }
}
