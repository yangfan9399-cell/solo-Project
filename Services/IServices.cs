using OceanFarm.ViewModels;

namespace OceanFarm.Services;

public interface IDataSeeder
{
    Task SeedAsync();
}

public interface IPatrolService
{
    Task<RecordWaterQualityViewModel> GetRecordViewModelAsync(int cageId);
    Task<bool> RecordWaterQualityAsync(RecordWaterQualityViewModel model);
}

public interface IFeedingService
{
    Task<SubmitFeedingViewModel> GetSubmitViewModelAsync(int cageId);
    Task<(bool Success, string Message)> SubmitFeedingAsync(SubmitFeedingViewModel model);
    Task<bool> HasUnresolvedOxygenAnomalyAsync(int cageId);
}

public interface IVeterinaryService
{
    Task<VeterinaryReviewViewModel> GetReviewViewModelAsync(int diseaseReportId);
    Task<List<CageAnomalyDetail>> GetPendingReviewsAsync();
    Task<bool> ReviewDiseaseAsync(VeterinaryReviewViewModel model);
}

public interface IManagerService
{
    Task<ManagerDisposalViewModel> GetDisposalViewModelAsync(int cageId);
    Task<List<CageAnomalyDetail>> GetPendingDisposalsAsync();
    Task<bool> ProcessDisposalAsync(ManagerDisposalViewModel model);
}

public interface IDashboardService
{
    Task<DashboardViewModel> GetDashboardAsync();
}
