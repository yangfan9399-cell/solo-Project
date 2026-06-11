using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Controllers;

public class CageController : Controller
{
    private readonly ApplicationDbContext _context;

    public CageController(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var cages = await _context.Cages
            .Include(c => c.SeaArea)
            .Include(c => c.FishSpecies)
            .Where(c => c.IsActive)
            .OrderBy(c => c.Code)
            .Select(c => new CageListViewModel
            {
                Id = c.Id,
                Code = c.Code,
                SeaAreaName = c.SeaArea.Name,
                FishSpeciesName = c.FishSpecies.Name,
                FishCount = c.FishCount,
                AverageWeightKg = c.AverageWeightKg,
                CurrentAnomaly = c.CurrentAnomaly,
                CurrentStatus = c.CurrentStatus,
                StockingDate = c.StockingDate
            })
            .ToListAsync();

        return View(cages);
    }

    public async Task<IActionResult> Details(int id)
    {
        var cage = await _context.Cages
            .Include(c => c.SeaArea)
            .Include(c => c.FishSpecies)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cage == null) return NotFound();

        var now = DateTime.UtcNow;
        var totalWeight = cage.FishCount * cage.AverageWeightKg;
        var expectedFeed = Math.Round(totalWeight * cage.FishSpecies.DailyFeedRatePerKg, 2);

        var waterQuality = await _context.WaterQualityRecords
            .Include(w => w.Inspector)
            .Where(w => w.CageId == id)
            .OrderByDescending(w => w.RecordedAt)
            .Take(10)
            .Select(w => new WaterQualityRecordViewModel
            {
                Id = w.Id,
                RecordedAt = w.RecordedAt,
                InspectorName = w.Inspector.FullName,
                Temperature = w.Temperature,
                DissolvedOxygen = w.DissolvedOxygen,
                Ph = w.Ph,
                Salinity = w.Salinity,
                Turbidity = w.Turbidity,
                AnomalyType = w.AnomalyType,
                Remarks = w.Remarks,
                IsHandled = w.IsHandled
            })
            .ToListAsync();

        var feedingRecords = await _context.FeedingRecords
            .Include(f => f.Operator)
            .Where(f => f.CageId == id)
            .OrderByDescending(f => f.FeedingTime)
            .Take(10)
            .Select(f => new FeedingRecordViewModel
            {
                Id = f.Id,
                FeedingTime = f.FeedingTime,
                OperatorName = f.Operator.FullName,
                FeedAmountKg = f.FeedAmountKg,
                FeedType = f.FeedType,
                Status = f.Status,
                AnomalyType = f.AnomalyType,
                Remarks = f.Remarks
            })
            .ToListAsync();

        var diseaseReports = await _context.DiseaseReports
            .Include(d => d.Reporter)
            .Include(d => d.Veterinarian)
            .Where(d => d.CageId == id)
            .OrderByDescending(d => d.ReportedAt)
            .Select(d => new DiseaseReportViewModel
            {
                Id = d.Id,
                ReportedAt = d.ReportedAt,
                ReporterName = d.Reporter.FullName,
                VeterinarianName = d.Veterinarian != null ? d.Veterinarian.FullName : null,
                ReviewedAt = d.ReviewedAt,
                Symptoms = d.Symptoms,
                DeadFishCount = d.DeadFishCount,
                AbnormalFishCount = d.AbnormalFishCount,
                PhotoUrl = d.PhotoUrl,
                Status = d.Status,
                VeterinaryOpinion = d.VeterinaryOpinion,
                DiagnosedDisease = d.DiagnosedDisease,
                RecommendedTreatment = d.RecommendedTreatment,
                ManagerNote = d.ManagerNote
            })
            .ToListAsync();

        var workflowHistory = await _context.WorkflowNodes
            .Include(w => w.Operator)
            .Where(w => w.CageId == id)
            .OrderByDescending(w => w.Timestamp)
            .Take(20)
            .Select(w => new WorkflowNodeViewModel
            {
                Id = w.Id,
                NodeType = w.NodeType,
                Timestamp = w.Timestamp,
                OperatorName = w.Operator.FullName,
                Description = w.Description,
                RelatedAnomaly = w.RelatedAnomaly,
                StatusAfter = w.StatusAfter
            })
            .ToListAsync();

        var model = new CageDetailViewModel
        {
            Id = cage.Id,
            Code = cage.Code,
            SeaAreaName = cage.SeaArea.Name,
            FishSpeciesName = cage.FishSpecies.Name,
            FishCount = cage.FishCount,
            AverageWeightKg = cage.AverageWeightKg,
            TotalWeightKg = Math.Round(totalWeight, 2),
            StockingDate = cage.StockingDate,
            StockingDays = (int)(now - cage.StockingDate).TotalDays,
            VolumeCubicMeters = cage.VolumeCubicMeters,
            CurrentAnomaly = cage.CurrentAnomaly,
            CurrentStatus = cage.CurrentStatus,
            CurrentAnomalyNote = cage.CurrentAnomalyNote,
            AnomalyReportedAt = cage.AnomalyReportedAt,
            OptimalMinDissolvedOxygen = cage.FishSpecies.OptimalMinDissolvedOxygen,
            DailyFeedRatePerKg = cage.FishSpecies.DailyFeedRatePerKg,
            ExpectedDailyFeedKg = expectedFeed,
            LatestWaterQuality = waterQuality,
            LatestFeedingRecords = feedingRecords,
            DiseaseReports = diseaseReports,
            WorkflowHistory = workflowHistory
        };

        return View(model);
    }
}
