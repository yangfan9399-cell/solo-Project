using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public class FeedingService : IFeedingService
{
    private readonly ApplicationDbContext _context;

    public FeedingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasUnresolvedOxygenAnomalyAsync(int cageId)
    {
        return await _context.WaterQualityRecords
            .AnyAsync(w => w.CageId == cageId
                && w.AnomalyType == AnomalyType.LowDissolvedOxygen
                && !w.IsHandled);
    }

    public async Task<SubmitFeedingViewModel> GetSubmitViewModelAsync(int cageId)
    {
        var cage = await _context.Cages
            .Include(c => c.FishSpecies)
            .FirstOrDefaultAsync(c => c.Id == cageId);
        if (cage == null) throw new KeyNotFoundException("网箱不存在");

        var operators = await _context.Users
            .Where(u => u.Role == UserRole.FeedingOperator)
            .ToListAsync();

        var hasUnresolvedOxygen = await HasUnresolvedOxygenAnomalyAsync(cageId);

        return new SubmitFeedingViewModel
        {
            CageId = cageId,
            CageCode = cage.Code,
            OperatorId = operators.FirstOrDefault()?.Id ?? 0,
            FeedAmountKg = Math.Round(cage.FishCount * cage.AverageWeightKg * (cage.FishSpecies?.DailyFeedRatePerKg ?? 0.03m), 2),
            FeedType = "配合饲料",
            IsNormal = true,
            AnomalyType = null,
            Remarks = null,
            Operators = operators,
            HasUnresolvedOxygenAnomaly = hasUnresolvedOxygen,
            AnomalyWarning = hasUnresolvedOxygen
                ? $"警告：该网箱存在未处理的溶氧异常，禁止确认正常投喂"
                : null
        };
    }

    public async Task<(bool Success, string Message)> SubmitFeedingAsync(SubmitFeedingViewModel model)
    {
        var cage = await _context.Cages
            .Include(c => c.FishSpecies)
            .FirstOrDefaultAsync(c => c.Id == model.CageId);
        if (cage == null) return (false, "网箱不存在");

        model.HasUnresolvedOxygenAnomaly = await HasUnresolvedOxygenAnomalyAsync(model.CageId);

        if (model.HasUnresolvedOxygenAnomaly && model.IsNormal)
        {
            return (false, "存在未处理的溶氧异常，禁止确认正常投喂，请先处理异常或标记为异常投喂");
        }

        var anomalyType = model.IsNormal ? AnomalyType.None : (model.AnomalyType ?? AnomalyType.InsufficientFeed);
        var status = model.IsNormal ? FeedingStatus.Normal : FeedingStatus.Abnormal;

        if (!model.IsNormal && anomalyType == AnomalyType.InsufficientFeed)
        {
            cage.CurrentAnomaly = AnomalyType.InsufficientFeed;
            cage.CurrentStatus = DisposalStatus.Pending;
            cage.CurrentAnomalyNote = model.Remarks ?? "饲料不足";
            cage.AnomalyReportedAt = DateTime.UtcNow;
        }

        var record = new FeedingRecord
        {
            CageId = model.CageId,
            OperatorId = model.OperatorId,
            FeedingTime = DateTime.UtcNow,
            FeedAmountKg = model.FeedAmountKg,
            FeedType = model.FeedType,
            Status = status,
            AnomalyType = anomalyType,
            Remarks = model.Remarks
        };

        _context.FeedingRecords.Add(record);

        var node = new WorkflowNode
        {
            CageId = model.CageId,
            OperatorId = model.OperatorId,
            NodeType = model.IsNormal ? "正常投喂" : "投喂异常",
            Timestamp = DateTime.UtcNow,
            Description = model.IsNormal
                ? $"完成正常投喂 {model.FeedAmountKg}kg {model.FeedType}"
                : $"投喂异常：{anomalyType}，投喂量{model.FeedAmountKg}kg，备注：{model.Remarks}",
            RelatedAnomaly = anomalyType,
            StatusAfter = cage.CurrentStatus,
            RelatedRecordId = record.Id,
            RelatedRecordType = "Feeding"
        };

        _context.WorkflowNodes.Add(node);
        await _context.SaveChangesAsync();

        return (true, "投喂记录已提交");
    }
}
