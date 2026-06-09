using FuelManagementSystem.Data;
using FuelManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;

    public StatisticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShipStatisticsDto>> GetShipStatisticsAsync(int? year = null)
    {
        var query = _context.FuelApplications
            .Include(a => a.Ship)
            .Where(a => a.Status >= ApplicationStatus.BunkeringCompleted && a.ActualQuantity.HasValue)
            .AsQueryable();

        if (year.HasValue)
        {
            query = query.Where(a => a.ActualBunkeringDate.HasValue && a.ActualBunkeringDate.Value.Year == year.Value);
        }

        var applications = await query.ToListAsync();

        return applications
            .GroupBy(a => new { a.ShipId, ShipName = a.Ship != null ? a.Ship.Name : "Unknown" })
            .Select(g => new ShipStatisticsDto
            {
                ShipId = g.Key.ShipId,
                ShipName = g.Key.ShipName,
                ApplicationCount = g.Count(),
                TotalPlannedQuantity = g.Sum(a => a.PlannedQuantity),
                TotalActualQuantity = g.Sum(a => a.ActualQuantity ?? 0),
                TotalAmount = g.Sum(a => a.TotalAmount ?? 0),
                AverageDiscrepancy = g.Average(a => a.PlannedQuantity - (a.ActualQuantity ?? 0))
            })
            .OrderByDescending(s => s.TotalAmount)
            .ToList();
    }

    public async Task<List<SupplierStatisticsDto>> GetSupplierStatisticsAsync(int? year = null)
    {
        var query = _context.FuelApplications
            .Include(a => a.Supplier)
            .Where(a => a.ActualQuantity.HasValue)
            .AsQueryable();

        if (year.HasValue)
        {
            query = query.Where(a => a.ActualBunkeringDate.HasValue && a.ActualBunkeringDate.Value.Year == year.Value);
        }

        var applications = await query.ToListAsync();

        return applications
            .GroupBy(a => new { a.SupplierId, SupplierName = a.Supplier != null ? a.Supplier.Name : "Unknown" })
            .Select(g => new SupplierStatisticsDto
            {
                SupplierId = g.Key.SupplierId,
                SupplierName = g.Key.SupplierName,
                ApplicationCount = g.Count(),
                TotalActualQuantity = g.Sum(a => a.ActualQuantity ?? 0),
                TotalAmount = g.Sum(a => a.TotalAmount ?? 0),
                DelayedCount = g.Count(a =>
                    a.PlannedBunkeringDate.Date < a.ActualBunkeringDate?.Date ||
                    (a.Status == ApplicationStatus.BunkeringInProgress && DateTime.UtcNow > a.PlannedBunkeringDate))
            })
            .OrderByDescending(s => s.TotalAmount)
            .ToList();
    }

    public async Task<List<DiscrepancyStatisticsDto>> GetDiscrepancyStatisticsAsync(int? year = null)
    {
        var query = _context.FuelApplications
            .Where(a => a.DiscrepancyReason != DiscrepancyReason.None && a.ActualQuantity.HasValue)
            .AsQueryable();

        if (year.HasValue)
        {
            query = query.Where(a => a.ActualBunkeringDate.HasValue && a.ActualBunkeringDate.Value.Year == year.Value);
        }

        var applications = await query.ToListAsync();

        return applications
            .GroupBy(a => a.DiscrepancyReason)
            .Select(g => new DiscrepancyStatisticsDto
            {
                Reason = GetDiscrepancyReasonName(g.Key),
                Count = g.Count(),
                TotalDiscrepancyQuantity = g.Sum(a => Math.Abs(a.PlannedQuantity - (a.ActualQuantity ?? 0))),
                AverageDiscrepancy = g.Average(a => Math.Abs(a.PlannedQuantity - (a.ActualQuantity ?? 0)))
            })
            .OrderByDescending(s => s.Count)
            .ToList();
    }

    public async Task<List<SettlementStatisticsDto>> GetSettlementStatisticsAsync(int? year = null)
    {
        var query = _context.FuelApplications
            .Where(a => a.Status == ApplicationStatus.Settled && a.SettlementTime.HasValue)
            .AsQueryable();

        if (year.HasValue)
        {
            query = query.Where(a => a.SettlementTime.Value.Year == year.Value);
        }

        var applications = await query.ToListAsync();

        return applications
            .GroupBy(a => a.SettlementTime.HasValue ? $"{a.SettlementTime.Value.Year}-{a.SettlementTime.Value.Month:D2}" : "Unknown")
            .Select(g => new SettlementStatisticsDto
            {
                Period = g.Key,
                ApplicationCount = g.Count(),
                TotalQuantity = g.Sum(a => a.ActualQuantity ?? 0),
                TotalAmount = g.Sum(a => a.TotalAmount ?? 0),
                AverageUnitPrice = g.Average(a => a.UnitPrice)
            })
            .OrderBy(s => s.Period)
            .ToList();
    }

    private string GetDiscrepancyReasonName(DiscrepancyReason reason)
    {
        return reason switch
        {
            DiscrepancyReason.TemperatureDifference => "温度差异",
            DiscrepancyReason.MeasurementError => "计量误差",
            DiscrepancyReason.SupplyShortage => "供油短缺",
            DiscrepancyReason.Leakage => "泄漏损耗",
            DiscrepancyReason.Other => "其他原因",
            _ => reason.ToString()
        };
    }
}
