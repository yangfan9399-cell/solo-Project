using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BridgeInspection.Data;
using BridgeInspection.Models;
using BridgeInspection.ViewModels;

namespace BridgeInspection.Controllers;

public class StatisticsController : Controller
{
    private readonly ApplicationDbContext _context;

    public StatisticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var allDefects = await _context.Defects
            .Include(d => d.Bridge)
            .ToListAsync();

        var totalDefects = allDefects.Count;
        var closedDefects = allDefects.Count(d => d.Status == DefectStatus.Closed);
        var pendingDefects = allDefects.Count(d => d.Status != DefectStatus.Closed && d.Status != DefectStatus.Returned);

        var routeStats = allDefects
            .Where(d => d.Bridge != null && !string.IsNullOrEmpty(d.Bridge.RouteName))
            .GroupBy(d => d.Bridge!.RouteName!)
            .Select(g => new RouteStat
            {
                RouteName = g.Key,
                DefectCount = g.Count(),
                ClosedCount = g.Count(d => d.Status == DefectStatus.Closed),
                AverageDurationHours = g.Where(d => d.MaintenanceDurationHours.HasValue)
                    .Average(d => d.MaintenanceDurationHours ?? 0)
            })
            .OrderByDescending(r => r.DefectCount)
            .ToList();

        var bridgeTypeStats = allDefects
            .Where(d => d.Bridge != null)
            .GroupBy(d => d.Bridge!.BridgeType)
            .Select(g => new BridgeTypeStat
            {
                BridgeType = g.Key,
                DefectCount = g.Count(),
                ClosedCount = g.Count(d => d.Status == DefectStatus.Closed)
            })
            .OrderByDescending(b => b.DefectCount)
            .ToList();

        var severityStats = allDefects
            .Where(d => d.Severity.HasValue)
            .GroupBy(d => d.Severity!.Value)
            .Select(g => new SeverityStat
            {
                Severity = g.Key,
                Count = g.Count(),
                CloseRate = g.Count() > 0
                    ? (double)g.Count(d => d.Status == DefectStatus.Closed) / g.Count()
                    : 0
            })
            .OrderBy(s => s.Severity)
            .ToList();

        var durationStats = CalculateDurationStats(allDefects);

        var viewModel = new StatisticsViewModel
        {
            TotalDefects = totalDefects,
            ClosedDefects = closedDefects,
            PendingDefects = pendingDefects,
            RouteStats = routeStats,
            BridgeTypeStats = bridgeTypeStats,
            SeverityStats = severityStats,
            DurationStats = durationStats
        };

        return View(viewModel);
    }

    private static List<DurationStat> CalculateDurationStats(List<Defect> defects)
    {
        var completedDefects = defects
            .Where(d => d.MaintenanceDurationHours.HasValue && d.Status == DefectStatus.Closed)
            .ToList();

        var ranges = new[]
        {
            new { Name = "0-24小时", Min = 0, Max = 24 },
            new { Name = "24-72小时", Min = 24, Max = 72 },
            new { Name = "72-168小时", Min = 72, Max = 168 },
            new { Name = "168-720小时", Min = 168, Max = 720 },
            new { Name = "720小时以上", Min = 720, Max = int.MaxValue }
        };

        return ranges.Select(r => new DurationStat
        {
            DurationRange = r.Name,
            Count = completedDefects.Count(d =>
                d.MaintenanceDurationHours >= r.Min && d.MaintenanceDurationHours < r.Max)
        }).ToList();
    }
}
