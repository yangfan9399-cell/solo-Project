using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public class PatrolService : IPatrolService
{
    private readonly ApplicationDbContext _context;

    public PatrolService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RecordWaterQualityViewModel> GetRecordViewModelAsync(int cageId)
    {
        var cage = await _context.Cages.FindAsync(cageId);
        if (cage == null) throw new KeyNotFoundException("网箱不存在");

        var inspectors = await _context.Users
            .Where(u => u.Role == UserRole.PatrolInspector)
            .ToListAsync();

        var latest = await _context.WaterQualityRecords
            .Where(w => w.CageId == cageId)
            .OrderByDescending(w => w.RecordedAt)
            .FirstOrDefaultAsync();

        return new RecordWaterQualityViewModel
        {
            CageId = cageId,
            CageCode = cage.Code,
            InspectorId = inspectors.FirstOrDefault()?.Id ?? 0,
            Temperature = latest?.Temperature ?? 22m,
            DissolvedOxygen = latest?.DissolvedOxygen ?? 6m,
            Ph = latest?.Ph ?? 7.8m,
            Salinity = latest?.Salinity ?? 31m,
            Turbidity = latest?.Turbidity ?? 4m,
            Remarks = null,
            Inspectors = inspectors
        };
    }

    public async Task<bool> RecordWaterQualityAsync(RecordWaterQualityViewModel model)
    {
        var cage = await _context.Cages.FindAsync(model.CageId);
        if (cage == null) return false;

        var species = await _context.FishSpecies.FindAsync(cage.FishSpeciesId);
        var anomalyType = AnomalyType.None;
        var isAnomaly = false;

        if (species != null && model.DissolvedOxygen < species.OptimalMinDissolvedOxygen)
        {
            anomalyType = AnomalyType.LowDissolvedOxygen;
            isAnomaly = true;
        }

        var record = new WaterQualityRecord
        {
            CageId = model.CageId,
            InspectorId = model.InspectorId,
            RecordedAt = DateTime.UtcNow,
            Temperature = model.Temperature,
            DissolvedOxygen = model.DissolvedOxygen,
            Ph = model.Ph,
            Salinity = model.Salinity,
            Turbidity = model.Turbidity,
            AnomalyType = anomalyType,
            Remarks = model.Remarks,
            IsHandled = !isAnomaly
        };

        _context.WaterQualityRecords.Add(record);

        if (isAnomaly)
        {
            cage.CurrentAnomaly = anomalyType;
            cage.CurrentStatus = DisposalStatus.Pending;
            cage.CurrentAnomalyNote = model.Remarks ?? $"溶氧异常：{model.DissolvedOxygen}mg/L";
            cage.AnomalyReportedAt = DateTime.UtcNow;
        }
        else if (cage.CurrentAnomaly == AnomalyType.LowDissolvedOxygen)
        {
            if (species != null && model.DissolvedOxygen >= species.OptimalMinDissolvedOxygen)
            {
                var allHandled = !await _context.WaterQualityRecords
                    .AnyAsync(w => w.CageId == model.CageId
                        && w.AnomalyType == AnomalyType.LowDissolvedOxygen
                        && !w.IsHandled);

                if (allHandled)
                {
                    cage.CurrentAnomaly = AnomalyType.None;
                }
            }
        }

        var node = new WorkflowNode
        {
            CageId = model.CageId,
            OperatorId = model.InspectorId,
            NodeType = isAnomaly ? "水质巡检-异常" : "水质巡检",
            Timestamp = DateTime.UtcNow,
            Description = isAnomaly
                ? $"检测到异常：溶氧{model.DissolvedOxygen}mg/L，低于阈值{species?.OptimalMinDissolvedOxygen ?? 5}mg/L"
                : "水质正常，溶氧" + model.DissolvedOxygen + "mg/L",
            RelatedAnomaly = anomalyType,
            StatusAfter = cage.CurrentStatus,
            RelatedRecordId = record.Id,
            RelatedRecordType = "WaterQuality"
        };

        _context.WorkflowNodes.Add(node);
        await _context.SaveChangesAsync();
        return true;
    }
}
