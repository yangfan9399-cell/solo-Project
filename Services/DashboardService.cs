using HazardousGoodsYard.Data;
using HazardousGoodsYard.Models;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatistics> GetStatistics()
    {
        var now = DateTime.Now;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);

        var reservations = await _context.Reservations.ToListAsync();

        var pendingReservations = reservations.Where(r => r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.AreaAssigned || r.Status == ReservationStatus.PendingVerification || r.Status == ReservationStatus.DocumentsVerified).ToList();

        var averageWaitingTime = pendingReservations.Any()
            ? pendingReservations.Average(r => (now - r.CreatedAt).TotalHours)
            : 0;

        return new DashboardStatistics
        {
            TotalReservations = reservations.Count,
            PendingReservations = pendingReservations.Count,
            CompletedReservations = reservations.Count(r => r.Status == ReservationStatus.Completed),
            RejectedReservations = reservations.Count(r => r.Status == ReservationStatus.Rejected),
            ExpiredReservations = reservations.Count(r => r.Status == ReservationStatus.Expired),
            TodayReservations = reservations.Count(r => r.CreatedAt >= todayStart && r.CreatedAt < todayEnd),
            AverageWaitingTime = Math.Round(averageWaitingTime, 2)
        };
    }

    public async Task<List<ReservationGroupByGoodsCategory>> GetReservationsByGoodsCategory()
    {
        var reservations = await _context.Reservations
            .Include(r => r.HazardousGood)
            .ToListAsync();

        var groups = reservations
            .GroupBy(r => r.HazardousGood.GoodsCategory)
            .Select(g => new ReservationGroupByGoodsCategory
            {
                GoodsCategory = g.Key,
                Count = g.Count(),
                Statuses = g.Select(r => r.Status).ToList()
            })
            .OrderByDescending(g => g.Count)
            .ToList();

        return groups;
    }

    public async Task<List<ReservationGroupByYard>> GetReservationsByYard()
    {
        var reservations = await _context.Reservations
            .Include(r => r.YardArea)
            .Where(r => r.YardAreaId != null)
            .ToListAsync();

        var yardAreas = await _context.YardAreas.ToListAsync();

        var groups = reservations
            .GroupBy(r => r.YardAreaId)
            .Select(g =>
            {
                var area = yardAreas.FirstOrDefault(a => a.Id == g.Key);
                return new ReservationGroupByYard
                {
                    YardName = area?.YardName ?? "",
                    AreaName = area?.AreaName ?? "",
                    Count = g.Count(),
                    Capacity = area?.MaxCapacity ?? 0,
                    Usage = area?.CurrentUsage ?? 0
                };
            })
            .OrderByDescending(g => g.Count)
            .ToList();

        foreach (var area in yardAreas.Where(a => !groups.Any(g => g.AreaName == a.AreaName)))
        {
            groups.Add(new ReservationGroupByYard
            {
                YardName = area.YardName,
                AreaName = area.AreaName,
                Count = 0,
                Capacity = area.MaxCapacity,
                Usage = area.CurrentUsage
            });
        }

        return groups;
    }

    public async Task<List<ReservationGroupByRejectionReason>> GetReservationsByRejectionReason()
    {
        var rejectedReservations = await _context.Reservations
            .Include(r => r.HazardousGood)
            .Where(r => r.Status == ReservationStatus.Rejected || r.Status == ReservationStatus.Expired)
            .ToListAsync();

        var groups = rejectedReservations
            .GroupBy(r => r.RejectionReasonType ?? RejectionReasonType.Other)
            .Select(g => new ReservationGroupByRejectionReason
            {
                ReasonType = g.Key,
                ReasonTypeName = GetRejectionReasonTypeName(g.Key),
                Count = g.Count(),
                Examples = g.Take(3).Select(r => $"{r.ReservationNumber}: {r.HazardousGood.GoodsName}").ToList()
            })
            .OrderByDescending(g => g.Count)
            .ToList();

        return groups;
    }

    public async Task<List<ReservationGroupByWaitingTime>> GetReservationsByWaitingTime()
    {
        var now = DateTime.Now;
        var pendingReservations = await _context.Reservations
            .Where(r => r.Status == ReservationStatus.Pending || r.Status == ReservationStatus.AreaAssigned || r.Status == ReservationStatus.PendingVerification || r.Status == ReservationStatus.DocumentsVerified)
            .ToListAsync();

        var timeRanges = new[]
        {
            new { Name = "0-2小时", Min = 0, Max = 2 },
            new { Name = "2-4小时", Min = 2, Max = 4 },
            new { Name = "4-8小时", Min = 4, Max = 8 },
            new { Name = "8-24小时", Min = 8, Max = 24 },
            new { Name = "超过24小时", Min = 24, Max = int.MaxValue }
        };

        var groups = timeRanges
            .Select(range =>
            {
                var matching = pendingReservations.Where(r => (now - r.CreatedAt).TotalHours >= range.Min && (now - r.CreatedAt).TotalHours < range.Max).ToList();
                return new ReservationGroupByWaitingTime
                {
                    TimeRange = range.Name,
                    Count = matching.Count,
                    AverageHours = matching.Any() ? Math.Round(matching.Average(r => (now - r.CreatedAt).TotalHours), 2) : 0
                };
            })
            .ToList();

        return groups;
    }

    public async Task<List<Reservation>> GetRecentReservations(int count = 10)
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<Reservation>> GetPendingReservations()
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .Where(r => r.Status == ReservationStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<YardCapacityStatistics> GetYardCapacityStatistics()
    {
        var yardAreas = await _context.YardAreas
            .Where(a => a.IsActive)
            .ToListAsync();

        var totalCapacity = yardAreas.Sum(a => a.MaxCapacity);
        var totalUsage = yardAreas.Sum(a => a.CurrentUsage);

        return new YardCapacityStatistics
        {
            TotalCapacity = totalCapacity,
            TotalUsage = totalUsage,
            UsagePercentage = totalCapacity > 0 ? Math.Round((double)totalUsage / totalCapacity * 100, 2) : 0,
            Areas = yardAreas.Select(a => new YardAreaStatistics
            {
                AreaCode = a.AreaCode,
                AreaName = a.AreaName,
                MaxCapacity = a.MaxCapacity,
                CurrentUsage = a.CurrentUsage,
                UsagePercentage = a.MaxCapacity > 0 ? Math.Round((double)a.CurrentUsage / a.MaxCapacity * 100, 2) : 0
            }).ToList()
        };
    }

    private string GetRejectionReasonTypeName(RejectionReasonType reasonType)
    {
        var displayAttribute = reasonType.GetType()
            .GetField(reasonType.ToString())
            ?.GetCustomAttributes(typeof(DisplayAttribute), false)
            .FirstOrDefault() as DisplayAttribute;

        return displayAttribute?.Name ?? reasonType.ToString();
    }
}