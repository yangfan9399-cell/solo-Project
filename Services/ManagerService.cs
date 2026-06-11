using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public class ManagerService : IManagerService
{
    private readonly ApplicationDbContext _context;

    public ManagerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ManagerDisposalViewModel> GetDisposalViewModelAsync(int cageId)
    {
        var cage = await _context.Cages
            .Include(c => c.SeaArea)
            .Include(c => c.FishSpecies)
            .FirstOrDefaultAsync(c => c.Id == cageId);
        if (cage == null) throw new KeyNotFoundException("网箱不存在");

        var managers = await _context.Users
            .Where(u => u.Role == UserRole.FarmManager)
            .ToListAsync();

        var pendingDiseaseReports = await _context.DiseaseReports
            .Include(d => d.Reporter)
            .Include(d => d.Veterinarian)
            .Where(d => d.CageId == cageId && (d.Status == DiseaseStatus.Reported || d.Status == DiseaseStatus.Reviewed))
            .Select(d => new DiseaseReportViewModel
            {
                Id = d.Id,
                ReportedAt = d.ReportedAt,
                ReporterName = d.Reporter.FullName,
                VeterinarianName = d.Veterinarian != null ? d.Veterinarian.FullName : null,
                Symptoms = d.Symptoms,
                DeadFishCount = d.DeadFishCount,
                AbnormalFishCount = d.AbnormalFishCount,
                Status = d.Status,
                VeterinaryOpinion = d.VeterinaryOpinion,
                DiagnosedDisease = d.DiagnosedDisease,
                RecommendedTreatment = d.RecommendedTreatment
            })
            .ToListAsync();

        return new ManagerDisposalViewModel
        {
            CageId = cageId,
            CageCode = cage.Code,
            CurrentAnomaly = cage.CurrentAnomaly,
            CurrentStatus = cage.CurrentStatus,
            AnomalyNote = cage.CurrentAnomalyNote,
            ManagerId = managers.FirstOrDefault()?.Id ?? 0,
            ManagerNote = string.Empty,
            IsApproved = true,
            Managers = managers,
            PendingDiseaseReports = pendingDiseaseReports
        };
    }

    public async Task<List<CageAnomalyDetail>> GetPendingDisposalsAsync()
    {
        return await _context.Cages
            .Include(c => c.SeaArea)
            .Include(c => c.FishSpecies)
            .Where(c => c.CurrentAnomaly != AnomalyType.None && c.CurrentStatus == DisposalStatus.Pending)
            .OrderBy(c => c.AnomalyReportedAt)
            .Select(c => new CageAnomalyDetail
            {
                CageId = c.Id,
                CageCode = c.Code,
                SeaAreaName = c.SeaArea.Name,
                FishSpeciesName = c.FishSpecies.Name,
                AnomalyType = c.CurrentAnomaly,
                Status = c.CurrentStatus,
                ReportedAt = c.AnomalyReportedAt,
                DurationHours = c.AnomalyReportedAt.HasValue
                    ? (int)(DateTime.UtcNow - c.AnomalyReportedAt.Value).TotalHours
                    : 0,
                Note = c.CurrentAnomalyNote
            })
            .ToListAsync();
    }

    public async Task<bool> ProcessDisposalAsync(ManagerDisposalViewModel model)
    {
        var cage = await _context.Cages.FindAsync(model.CageId);
        if (cage == null) return false;

        var originalAnomaly = cage.CurrentAnomaly;

        if (model.IsApproved)
        {
            if (cage.CurrentAnomaly == AnomalyType.LowDissolvedOxygen
                || cage.CurrentAnomaly == AnomalyType.InsufficientFeed)
            {
                cage.CurrentStatus = DisposalStatus.Completed;
                cage.CurrentAnomaly = AnomalyType.None;
                cage.CurrentAnomalyNote = null;
                cage.AnomalyReportedAt = null;
            }
            else
            {
                cage.CurrentStatus = DisposalStatus.Approved;
            }
        }
        else
        {
            cage.CurrentStatus = DisposalStatus.Rejected;
            cage.CurrentAnomaly = AnomalyType.None;
            cage.CurrentAnomalyNote = null;
            cage.AnomalyReportedAt = null;
        }

        var diseaseReports = await _context.DiseaseReports
            .Where(d => d.CageId == model.CageId && d.Status == DiseaseStatus.Reviewed)
            .ToListAsync();

        foreach (var dr in diseaseReports)
        {
            dr.ManagerNote = model.ManagerNote;
            if (model.IsApproved)
                dr.Status = DiseaseStatus.Confirmed;
            else
                dr.Status = DiseaseStatus.Rejected;
        }

        var waterRecords = await _context.WaterQualityRecords
            .Where(w => w.CageId == model.CageId && !w.IsHandled)
            .ToListAsync();

        foreach (var wr in waterRecords)
        {
            wr.IsHandled = true;
        }

        var node = new WorkflowNode
        {
            CageId = model.CageId,
            OperatorId = model.ManagerId,
            NodeType = model.IsApproved ? "场长确认处置" : "场长退回",
            Timestamp = DateTime.UtcNow,
            Description = model.IsApproved
                ? (originalAnomaly == AnomalyType.LowDissolvedOxygen || originalAnomaly == AnomalyType.InsufficientFeed
                    ? $"场长确认处置完成：{originalAnomaly}已处理恢复正常，备注：{model.ManagerNote}"
                    : $"场长确认处置：{originalAnomaly}处置方案已批准，备注：{model.ManagerNote}")
                : $"场长退回：{originalAnomaly}，备注：{model.ManagerNote}",
            RelatedAnomaly = originalAnomaly,
            StatusAfter = cage.CurrentStatus,
            RelatedRecordType = "ManagerApproval"
        };

        _context.WorkflowNodes.Add(node);

        if (model.IsApproved && originalAnomaly == AnomalyType.LowDissolvedOxygen)
        {
            var recoveryNode = new WorkflowNode
            {
                CageId = model.CageId,
                OperatorId = model.ManagerId,
                NodeType = "异常恢复",
                Timestamp = DateTime.UtcNow,
                Description = $"溶氧异常已通过场长审批处置，网箱恢复正常生产状态",
                RelatedAnomaly = AnomalyType.None,
                StatusAfter = DisposalStatus.Completed,
                RelatedRecordType = "System"
            };
            _context.WorkflowNodes.Add(recoveryNode);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
