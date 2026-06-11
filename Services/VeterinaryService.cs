using Microsoft.EntityFrameworkCore;
using OceanFarm.Data;
using OceanFarm.Models;
using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public class VeterinaryService : IVeterinaryService
{
    private readonly ApplicationDbContext _context;

    public VeterinaryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<VeterinaryReviewViewModel> GetReviewViewModelAsync(int diseaseReportId)
    {
        var report = await _context.DiseaseReports
            .Include(d => d.Cage)
            .Include(d => d.Reporter)
            .FirstOrDefaultAsync(d => d.Id == diseaseReportId);
        if (report == null) throw new KeyNotFoundException("病害报告不存在");

        var veterinarians = await _context.Users
            .Where(u => u.Role == UserRole.Veterinarian)
            .ToListAsync();

        return new VeterinaryReviewViewModel
        {
            DiseaseReportId = diseaseReportId,
            CageId = report.CageId,
            CageCode = report.Cage.Code,
            VeterinarianId = veterinarians.FirstOrDefault()?.Id ?? 0,
            Symptoms = report.Symptoms,
            DeadFishCount = report.DeadFishCount,
            AbnormalFishCount = report.AbnormalFishCount,
            PhotoUrl = report.PhotoUrl,
            Status = report.Status,
            VeterinaryOpinion = report.VeterinaryOpinion ?? string.Empty,
            DiagnosedDisease = report.DiagnosedDisease,
            RecommendedTreatment = report.RecommendedTreatment ?? string.Empty,
            IsConfirmed = true,
            Veterinarians = veterinarians
        };
    }

    public async Task<List<CageAnomalyDetail>> GetPendingReviewsAsync()
    {
        var pending = await _context.DiseaseReports
            .Include(d => d.Cage)
            .ThenInclude(c => c.SeaArea)
            .Include(d => d.Cage)
            .ThenInclude(c => c.FishSpecies)
            .Where(d => d.Status == DiseaseStatus.Reported)
            .OrderBy(d => d.ReportedAt)
            .Select(d => new CageAnomalyDetail
            {
                CageId = d.CageId,
                DiseaseReportId = d.Id,
                CageCode = d.Cage.Code,
                SeaAreaName = d.Cage.SeaArea.Name,
                FishSpeciesName = d.Cage.FishSpecies.Name,
                AnomalyType = AnomalyType.DiseaseSuspected,
                Status = d.Cage.CurrentStatus,
                ReportedAt = d.ReportedAt,
                DurationHours = (int)(DateTime.UtcNow - d.ReportedAt).TotalHours,
                Note = d.Symptoms
            })
            .ToListAsync();

        return pending;
    }

    public async Task<bool> ReviewDiseaseAsync(VeterinaryReviewViewModel model)
    {
        var report = await _context.DiseaseReports
            .Include(d => d.Cage)
            .FirstOrDefaultAsync(d => d.Id == model.DiseaseReportId);
        if (report == null) return false;

        report.VeterinarianId = model.VeterinarianId;
        report.ReviewedAt = DateTime.UtcNow;
        report.VeterinaryOpinion = model.VeterinaryOpinion;
        report.DiagnosedDisease = model.DiagnosedDisease;
        report.RecommendedTreatment = model.RecommendedTreatment;
        report.Status = model.IsConfirmed ? DiseaseStatus.Reviewed : DiseaseStatus.Rejected;

        if (model.IsConfirmed)
        {
            report.Cage.CurrentAnomaly = AnomalyType.DiseaseSuspected;
            report.Cage.CurrentStatus = DisposalStatus.Pending;
            report.Cage.CurrentAnomalyNote = $"兽医确诊：{model.DiagnosedDisease ?? "未命名病害"}";
            report.Cage.AnomalyReportedAt = DateTime.UtcNow;
        }
        else
        {
            report.Cage.CurrentAnomaly = AnomalyType.None;
            report.Cage.CurrentStatus = DisposalStatus.Completed;
            report.Cage.CurrentAnomalyNote = null;
            report.Cage.AnomalyReportedAt = null;
        }

        var node = new WorkflowNode
        {
            CageId = model.CageId,
            OperatorId = model.VeterinarianId,
            NodeType = "兽医复核",
            Timestamp = DateTime.UtcNow,
            Description = model.IsConfirmed
                ? $"兽医复核确诊：{model.DiagnosedDisease}，建议：{model.RecommendedTreatment}"
                : $"兽医复核驳回，意见：{model.VeterinaryOpinion}",
            RelatedAnomaly = model.IsConfirmed ? AnomalyType.DiseaseSuspected : AnomalyType.None,
            StatusAfter = report.Cage.CurrentStatus,
            RelatedRecordId = report.Id,
            RelatedRecordType = "DiseaseReport"
        };

        _context.WorkflowNodes.Add(node);
        await _context.SaveChangesAsync();
        return true;
    }
}
