using WaterQuotaSystem.Models;
using WaterQuotaSystem.ViewModels;

namespace WaterQuotaSystem.Services;

public interface IWorkflowService
{
    ApplicationListViewModel GetApplicationList(ApplicationStatus? statusFilter = null, SampleType? sampleTypeFilter = null, string? keyword = null);
    ApplicationDetailViewModel GetApplicationDetail(int id);
    ProcessingDeskViewModel GetProcessingDesk(int id, RoleType currentRole);
    DashboardViewModel GetDashboard(string? drillDownFilter = null);
    WaterQuotaApplication ProcessAction(ProcessActionInput input);
    WaterQuotaApplication CreateNewApplication(WaterQuotaApplication application);
    void SyncSummaryAndConclusion(int applicationId);
}
