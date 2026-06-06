using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SurgicalInstrumentTracking.Data;
using SurgicalInstrumentTracking.Models;
using SurgicalInstrumentTracking.ViewModels;

namespace SurgicalInstrumentTracking.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _context;

    public HomeController(AppDbContext context)
    {
        _context = context;
    }

    public IActionResult Index()
    {
        var allSets = _context.InstrumentSets
            .Include(s => s.Department)
            .Include(s => s.SterilizationBatch)
            .Include(s => s.Items)
                .ThenInclude(i => i.Instrument)
            .ToList();

        var viewModel = new DashboardViewModel
        {
            TotalSets = allSets.Count,
            ReadyForUseCount = allSets.Count(s => s.Status == InstrumentSetStatus.ReadyForUse),
            InUseCount = allSets.Count(s => s.Status == InstrumentSetStatus.InUse),
            MissingItemsCount = allSets.Count(s => s.Status == InstrumentSetStatus.MissingItems),
            ExpiredCount = allSets.Count(s => s.Status == InstrumentSetStatus.Expired ||
                (s.SterilizationBatch != null && s.SterilizationBatch.IsExpired && s.Status == InstrumentSetStatus.ReadyForUse)),
            WrongDepartmentCount = allSets.Count(s => s.Status == InstrumentSetStatus.WrongDepartment),

            DepartmentStats = allSets
                .GroupBy(s => s.Department.Name)
                .Select(g => new DepartmentStatsViewModel
                {
                    DepartmentName = g.Key,
                    TotalSets = g.Count(),
                    ReadyCount = g.Count(s => s.Status == InstrumentSetStatus.ReadyForUse),
                    InUseCount = g.Count(s => s.Status == InstrumentSetStatus.InUse),
                    AnomalyCount = g.Count(s => s.Status == InstrumentSetStatus.MissingItems ||
                        s.Status == InstrumentSetStatus.Expired ||
                        s.Status == InstrumentSetStatus.WrongDepartment)
                })
                .OrderByDescending(x => x.AnomalyCount)
                .ToList(),

            SetTypeStats = allSets
                .Where(s => !string.IsNullOrEmpty(s.SetType))
                .GroupBy(s => s.SetType!)
                .Select(g => new SetTypeStatsViewModel
                {
                    SetType = g.Key,
                    Count = g.Count(),
                    AnomalyCount = g.Count(s => s.Status == InstrumentSetStatus.MissingItems ||
                        s.Status == InstrumentSetStatus.Expired ||
                        s.Status == InstrumentSetStatus.WrongDepartment)
                })
                .OrderByDescending(x => x.AnomalyCount)
                .ToList()
        };

        var missingItemsData = allSets
            .SelectMany(s => s.Items.Where(i => i.ActualQuantity < i.ExpectedQuantity))
            .GroupBy(i => i.Instrument.Name)
            .Select(g => new MissingItemStatsViewModel
            {
                InstrumentName = g.Key,
                MissingCount = g.Sum(i => i.ExpectedQuantity - i.ActualQuantity)
            })
            .OrderByDescending(x => x.MissingCount)
            .Take(10)
            .ToList();
        viewModel.MissingItemStats = missingItemsData;

        var completedAnomalies = _context.AnomalyRecords
            .Include(a => a.InstrumentSet)
            .Where(a => a.Resolved && a.ReplenishmentDurationMinutes.HasValue)
            .OrderByDescending(a => a.ResolvedAt)
            .Take(10)
            .ToList();

        viewModel.ReplenishmentStats = completedAnomalies
            .Select(a => new ReplenishmentStatsViewModel
            {
                SetCode = a.InstrumentSet.SetCode,
                SetName = a.InstrumentSet.Name,
                DurationMinutes = a.ReplenishmentDurationMinutes ?? 0,
                CompletedAt = a.ResolvedAt ?? DateTime.Now
            })
            .ToList();

        viewModel.RecentAnomalies = allSets
            .Where(s => s.Status == InstrumentSetStatus.MissingItems ||
                s.Status == InstrumentSetStatus.Expired ||
                s.Status == InstrumentSetStatus.WrongDepartment)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(5)
            .ToList();

        return View(viewModel);
    }

    public IActionResult Error()
    {
        return View();
    }
}
