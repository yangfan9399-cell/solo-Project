using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardViewModel> GetDashboardAsync()
    {
        var allCages = await _context.Cages
            .Include(c => c.SeaArea)
            .Include(c => c.FishSpecies)
            .Where(c => c.IsActive)
            .ToListAsync();

        var anomalyCages = allCages.Where(c => c.CurrentAnomaly != AnomalyType.None).ToList();

        var bySeaArea = allCages
            .GroupBy(c => c.SeaArea.Name)
            .Select(g => new SeaAreaGroup
            {
                SeaAreaName = g.Key,
                TotalCages = g.Count(),
                AnomalyCages = g.Count(c => c.CurrentAnomaly != AnomalyType.None),
                AnomalyRate = g.Count() == 0 ? 0 : Math.Round((decimal)g.Count(c => c.CurrentAnomaly != AnomalyType.None) / g.Count() * 100, 1)
            })
            .ToList();

        var byFishSpecies = allCages
            .GroupBy(c => c.FishSpecies.Name)
            .Select(g => new FishSpeciesGroup
            {
                SpeciesName = g.Key,
                TotalCages = g.Count(),
                AnomalyCages = g.Count(c => c.CurrentAnomaly != AnomalyType.None),
                AnomalyRate = g.Count() == 0 ? 0 : Math.Round((decimal)g.Count(c => c.CurrentAnomaly != AnomalyType.None) / g.Count() * 100, 1)
            })
            .ToList();

        var anomalyTypeGroups = anomalyCages
            .GroupBy(c => c.CurrentAnomaly)
            .ToList();

        var byAnomalyType = Enum.GetValues(typeof(AnomalyType))
            .Cast<AnomalyType>()
            .Where(a => a != AnomalyType.None)
            .Select(a =>
            {
                var count = anomalyTypeGroups.FirstOrDefault(g => g.Key == a)?.Count() ?? 0;
                return new AnomalyGroup
                {
                    AnomalyType = a,
                    AnomalyTypeName = GetAnomalyTypeName(a),
                    Count = count,
                    Percentage = anomalyCages.Count == 0 ? 0 : Math.Round((decimal)count / anomalyCages.Count * 100, 1)
                };
            })
            .ToList();

        var now = DateTime.UtcNow;

        var durationGroups = anomalyCages
            .Select(c => new
            {
                Cage = c,
                Hours = c.AnomalyReportedAt.HasValue
                    ? (int)(now - c.AnomalyReportedAt.Value).TotalHours
                    : 0
            })
            .ToList();

        var byDisposalDuration = new List<DisposalDurationGroup>
        {
            new() { DurationRange = "< 6小时", Count = durationGroups.Count(d => d.Hours < 6), Percentage = 0 },
            new() { DurationRange = "6-24小时", Count = durationGroups.Count(d => d.Hours >= 6 && d.Hours < 24), Percentage = 0 },
            new() { DurationRange = "1-3天", Count = durationGroups.Count(d => d.Hours >= 24 && d.Hours < 72), Percentage = 0 },
            new() { DurationRange = "> 3天", Count = durationGroups.Count(d => d.Hours >= 72), Percentage = 0 }
        };

        var totalDuration = durationGroups.Count;
        if (totalDuration > 0)
        {
            foreach (var g in byDisposalDuration)
            {
                g.Percentage = Math.Round((decimal)g.Count / totalDuration * 100, 1);
            }
        }

        var recentAnomalies = anomalyCages
            .OrderByDescending(c => c.AnomalyReportedAt)
            .Take(10)
            .Select(c => new CageAnomalyDetail
            {
                CageId = c.Id,
                CageCode = c.Code,
                SeaAreaName = c.SeaArea.Name,
                FishSpeciesName = c.FishSpecies.Name,
                AnomalyType = c.CurrentAnomaly,
                Status = c.CurrentStatus,
                ReportedAt = c.AnomalyReportedAt,
                DurationHours = c.AnomalyReportedAt.HasValue ? (int)(now - c.AnomalyReportedAt.Value).TotalHours : 0,
                Note = c.CurrentAnomalyNote
            })
            .ToList();

        return new DashboardViewModel
        {
            TotalCages = allCages.Count,
            NormalCages = allCages.Count(c => c.CurrentAnomaly == AnomalyType.None),
            AnomalyCages = anomalyCages.Count,
            PendingDisposal = allCages.Count(c => c.CurrentStatus == DisposalStatus.Pending),
            BySeaArea = bySeaArea,
            ByFishSpecies = byFishSpecies,
            ByAnomalyType = byAnomalyType,
            ByDisposalDuration = byDisposalDuration,
            RecentAnomalies = recentAnomalies
        };
    }

    private string GetAnomalyTypeName(AnomalyType type)
    {
        return type switch
        {
            AnomalyType.LowDissolvedOxygen => "溶氧异常",
            AnomalyType.InsufficientFeed => "饲料不足",
            AnomalyType.DiseaseSuspected => "病害疑似",
            _ => "未知"
        };
    }
}
