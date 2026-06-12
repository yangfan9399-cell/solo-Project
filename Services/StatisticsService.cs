using MeetingRoomEquipment.Data;
using MeetingRoomEquipment.Models;
using MeetingRoomEquipment.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomEquipment.Services;

public interface IStatisticsService
{
    Task<DashboardViewModel> GetDashboardAsync();
    Task<List<RecordListViewModel>> GetByStatusAsync(RecordStatus status);
    Task<List<RecordListViewModel>> GetByCategoryAsync(SampleCategory category);
    Task<List<RecordListViewModel>> GetByDepartmentAsync(string department);
    Task<List<RecordListViewModel>> GetByMonthAsync(int year, int month);
    Task<ReviewViewModel> BuildReviewViewModelAsync();
}

public class StatisticsService : IStatisticsService
{
    private readonly ApplicationDbContext _ctx;
    private readonly IRecordService _recordSvc;

    public StatisticsService(ApplicationDbContext ctx, IRecordService recordSvc)
    {
        _ctx = ctx;
        _recordSvc = recordSvc;
    }

    public async Task<DashboardViewModel> GetDashboardAsync()
    {
        var all = await _ctx.EquipmentBorrowRecords.AsNoTracking().ToListAsync();

        var vm = new DashboardViewModel
        {
            TotalCount = all.Count,
            PendingAcceptance = all.Count(r => r.Status == RecordStatus.PendingAcceptance),
            Processing = all.Count(r => r.Status == RecordStatus.Processing),
            PendingReview = all.Count(r => r.Status == RecordStatus.PendingReview),
            ReturnedForSupplement = all.Count(r => r.Status == RecordStatus.ReturnedForSupplement),
            Archived = all.Count(r => r.Status == RecordStatus.Archived),

            NormalCount = all.Count(r => r.SampleCategory == SampleCategory.NormalRelease),
            MetricExceededCount = all.Count(r => r.SampleCategory == SampleCategory.MetricExceeded),
            EvidenceMissingCount = all.Count(r => r.SampleCategory == SampleCategory.EvidenceMissing),
            ApprovalTimeoutCount = all.Count(r => r.SampleCategory == SampleCategory.ApprovalTimeout),

            TotalCompensation = all.Sum(r => r.CompensationAmount ?? 0),
            ActualCompensationTotal = all.Sum(r => r.ActualCompensation ?? 0),
            BlockedCount = all.Count(r => !string.IsNullOrEmpty(r.BlockingReason)),
            OverdueCount = all.Count(r => r.SampleCategory == SampleCategory.ApprovalTimeout && r.Status != RecordStatus.Archived),

            RecentRecords = all.OrderByDescending(r => r.LastUpdatedAt ?? r.CreatedAt)
                .Take(5)
                .Select(r => new RecordListViewModel
                {
                    Id = r.Id,
                    RecordNo = r.RecordNo,
                    Title = r.Title,
                    SampleCategory = r.SampleCategory,
                    SampleCategoryText = EnumDisplay.GetCategoryText(r.SampleCategory),
                    Status = r.Status,
                    StatusText = EnumDisplay.GetStatusText(r.Status),
                    StatusBadgeClass = EnumDisplay.GetStatusBadgeClass(r.Status),
                    CategoryBadgeClass = EnumDisplay.GetCategoryBadgeClass(r.SampleCategory),
                    EquipmentName = r.EquipmentName,
                    BorrowerName = r.BorrowerName,
                    BorrowerDept = r.BorrowerDept,
                    CurrentResponsibleName = r.CurrentResponsibleName,
                    CompensationAmount = r.CompensationAmount,
                    HasBlocking = !string.IsNullOrEmpty(r.BlockingReason),
                    BlockingReason = r.BlockingReason,
                    CreatedAt = r.CreatedAt,
                    LastUpdatedAt = r.LastUpdatedAt,
                    IsArchived = r.IsArchived
                }).ToList(),

            OverdueRecords = all.Where(r => r.SampleCategory == SampleCategory.ApprovalTimeout && r.Status != RecordStatus.Archived)
                .Select(r => new RecordListViewModel
                {
                    Id = r.Id,
                    RecordNo = r.RecordNo,
                    Title = r.Title,
                    SampleCategory = r.SampleCategory,
                    SampleCategoryText = EnumDisplay.GetCategoryText(r.SampleCategory),
                    Status = r.Status,
                    StatusText = EnumDisplay.GetStatusText(r.Status),
                    StatusBadgeClass = EnumDisplay.GetStatusBadgeClass(r.Status),
                    CategoryBadgeClass = EnumDisplay.GetCategoryBadgeClass(r.SampleCategory),
                    EquipmentName = r.EquipmentName,
                    BorrowerName = r.BorrowerName,
                    BorrowerDept = r.BorrowerDept,
                    CurrentResponsibleName = r.CurrentResponsibleName,
                    CompensationAmount = r.CompensationAmount,
                    HasBlocking = !string.IsNullOrEmpty(r.BlockingReason),
                    BlockingReason = r.BlockingReason,
                    CreatedAt = r.CreatedAt,
                    LastUpdatedAt = r.LastUpdatedAt,
                    IsArchived = r.IsArchived
                }).ToList()
        };

        vm.StatusStats = new List<StatusStatItem>
        {
            new() { Status = RecordStatus.PendingAcceptance, StatusText = "待受理", Count = vm.PendingAcceptance, BadgeClass = "bg-secondary" },
            new() { Status = RecordStatus.Processing, StatusText = "处理中", Count = vm.Processing, BadgeClass = "bg-primary" },
            new() { Status = RecordStatus.PendingReview, StatusText = "待复核", Count = vm.PendingReview, BadgeClass = "bg-warning" },
            new() { Status = RecordStatus.ReturnedForSupplement, StatusText = "退回补证", Count = vm.ReturnedForSupplement, BadgeClass = "bg-danger" },
            new() { Status = RecordStatus.Archived, StatusText = "已归档", Count = vm.Archived, BadgeClass = "bg-success" }
        };

        vm.CategoryStats = new List<CategoryStatItem>
        {
            new() { Category = SampleCategory.NormalRelease, CategoryText = "正常放行", Count = vm.NormalCount, BadgeClass = "bg-success" },
            new() { Category = SampleCategory.MetricExceeded, CategoryText = "指标超限", Count = vm.MetricExceededCount, BadgeClass = "bg-danger" },
            new() { Category = SampleCategory.EvidenceMissing, CategoryText = "证据缺失", Count = vm.EvidenceMissingCount, BadgeClass = "bg-warning" },
            new() { Category = SampleCategory.ApprovalTimeout, CategoryText = "审批超时", Count = vm.ApprovalTimeoutCount, BadgeClass = "bg-orange" }
        };

        vm.DepartmentStats = all
            .GroupBy(r => r.BorrowerDept)
            .Select(g => new DepartmentStatItem
            {
                Department = g.Key,
                Count = g.Count(),
                Compensation = g.Sum(r => r.CompensationAmount ?? 0)
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        vm.MonthlyStats = all
            .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
            .Select(g => new MonthlyStatItem
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                MonthText = $"{g.Key.Year}-{g.Key.Month:D2}",
                Count = g.Count(),
                Compensation = g.Sum(r => r.CompensationAmount ?? 0)
            })
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .Take(6)
            .ToList();

        return vm;
    }

    public Task<List<RecordListViewModel>> GetByStatusAsync(RecordStatus status)
        => _recordSvc.GetListAsync(status: status);

    public Task<List<RecordListViewModel>> GetByCategoryAsync(SampleCategory category)
        => _recordSvc.GetListAsync(category: category);

    public Task<List<RecordListViewModel>> GetByDepartmentAsync(string department)
        => _recordSvc.GetListAsync(department: department);

    public Task<List<RecordListViewModel>> GetByMonthAsync(int year, int month)
    {
        throw new NotImplementedException();
    }

    public Task<ReviewViewModel> BuildReviewViewModelAsync() => Task.FromResult(new ReviewViewModel());
}
