using Microsoft.EntityFrameworkCore;
using WaterQuotaSystem.Data;
using WaterQuotaSystem.Models;
using WaterQuotaSystem.ViewModels;

namespace WaterQuotaSystem.Services;

public class WorkflowService : IWorkflowService
{
    private readonly WaterQuotaDbContext _context;

    public WorkflowService(WaterQuotaDbContext context)
    {
        _context = context;
    }

    public ApplicationListViewModel GetApplicationList(ApplicationStatus? statusFilter = null, SampleType? sampleTypeFilter = null, string? keyword = null)
    {
        var query = _context.Applications.AsQueryable();

        if (statusFilter.HasValue)
            query = query.Where(a => a.Status == statusFilter.Value);

        if (sampleTypeFilter.HasValue)
            query = query.Where(a => a.SampleType == sampleTypeFilter.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(a => a.ApplicationNo.Contains(keyword) || a.ParkName.Contains(keyword) || a.ApplicantName.Contains(keyword));

        var applications = query.OrderByDescending(a => a.UpdatedAt).ToList();
        var allApps = _context.Applications.ToList();

        var vm = new ApplicationListViewModel
        {
            Applications = applications,
            StatusFilter = statusFilter,
            SampleTypeFilter = sampleTypeFilter,
            SearchKeyword = keyword,
            TotalCount = allApps.Count,
            NormalCount = allApps.Count(a => a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Archived),
            BlockedCount = allApps.Count(a => a.Status == ApplicationStatus.Blocked),
            ReturnedCount = allApps.Count(a => a.Status == ApplicationStatus.ReturnedForEvidence),
            TimeoutCount = allApps.Count(a => a.Status == ApplicationStatus.Timeout),
            ArchivedCount = allApps.Count(a => a.Status == ApplicationStatus.Archived)
        };

        return vm;
    }

    public ApplicationDetailViewModel GetApplicationDetail(int id)
    {
        var app = _context.Applications
            .Include(a => a.ProcessingNodes)
            .Include(a => a.FieldChanges)
            .Include(a => a.EvidenceAttachments)
            .FirstOrDefault(a => a.Id == id);

        if (app == null) throw new KeyNotFoundException($"Application {id} not found");

        var keyFieldDiffs = app.FieldChanges
            .Where(c => c.IsKeyChange)
            .Select(c => new FieldDiffItem
            {
                FieldName = c.FieldName,
                FieldDisplayName = c.FieldDisplayName,
                OldValue = c.OldValue,
                NewValue = c.NewValue,
                ChangedBy = c.ChangedBy,
                ChangedAt = c.ChangedAt
            }).ToList();

        return new ApplicationDetailViewModel
        {
            Application = app,
            HistoryNodes = app.ProcessingNodes.OrderBy(n => n.OperatedAt).ToList(),
            FieldChanges = app.FieldChanges.OrderBy(c => c.ChangedAt).ToList(),
            Attachments = app.EvidenceAttachments.ToList(),
            KeyFieldDiffs = keyFieldDiffs
        };
    }

    public ProcessingDeskViewModel GetProcessingDesk(int id, RoleType currentRole)
    {
        var app = _context.Applications
            .Include(a => a.ProcessingNodes)
            .Include(a => a.EvidenceAttachments)
            .FirstOrDefault(a => a.Id == id);

        if (app == null) throw new KeyNotFoundException($"Application {id} not found");

        var canEdit = !app.IsReadOnly && (
            (currentRole == RoleType.FieldPersonnel && app.Status is ApplicationStatus.Processing or ApplicationStatus.ReturnedForEvidence or ApplicationStatus.Blocked) ||
            (currentRole == RoleType.FieldPersonnel && app.Status == ApplicationStatus.Accepted));

        var canReview = !app.IsReadOnly && currentRole == RoleType.Reviewer && app.Status == ApplicationStatus.Reviewing;
        var canReturnForEvidence = !app.IsReadOnly && currentRole == RoleType.Reviewer && app.Status == ApplicationStatus.Reviewing;
        var canArchive = !app.IsReadOnly && currentRole == RoleType.Reviewer && app.Status == ApplicationStatus.Approved;

        return new ProcessingDeskViewModel
        {
            Application = app,
            HistoryNodes = app.ProcessingNodes.OrderBy(n => n.OperatedAt).ToList(),
            Attachments = app.EvidenceAttachments.ToList(),
            CurrentUserRole = currentRole,
            CanEdit = canEdit,
            CanReview = canReview,
            CanArchive = canArchive,
            CanReturnForEvidence = canReturnForEvidence,
            IsFieldPersonnel = currentRole == RoleType.FieldPersonnel,
            IsReviewer = currentRole == RoleType.Reviewer
        };
    }

    public DashboardViewModel GetDashboard(string? drillDownFilter = null)
    {
        var allApps = _context.Applications.ToList();

        var vm = new DashboardViewModel
        {
            TotalApplications = allApps.Count,
            NormalCount = allApps.Count(a => a.SampleType == SampleType.NormalPass),
            OverLimitCount = allApps.Count(a => a.SampleType == SampleType.OverLimit),
            MissingEvidenceCount = allApps.Count(a => a.SampleType == SampleType.MissingEvidence),
            TimeoutCount = allApps.Count(a => a.SampleType == SampleType.ApprovalTimeout),
            ArchivedCount = allApps.Count(a => a.Status == ApplicationStatus.Archived),
            ActiveCount = allApps.Count(a => a.Status != ApplicationStatus.Archived),
            TotalAppliedQuota = allApps.Sum(a => a.AppliedQuota),
            TotalApprovedQuota = allApps.Where(a => a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Archived).Sum(a => a.ApprovedQuota),
            AverageProcessingDays = allApps.Where(a => a.ProcessedDate.HasValue).Select(a => (a.ProcessedDate!.Value - a.ApplicationDate).TotalDays).DefaultIfEmpty(0).Average()
        };

        var statusGroups = allApps.GroupBy(a => a.Status).Select(g => new StatusDistributionItem
        {
            Status = g.Key,
            StatusName = GetStatusDisplayName(g.Key),
            Count = g.Count(),
            Percentage = allApps.Count > 0 ? Math.Round((double)g.Count() / allApps.Count * 100, 1) : 0
        }).ToList();

        vm.StatusDistribution = statusGroups;

        var sampleTypeGroups = allApps.GroupBy(a => a.SampleType).Select(g => new SampleTypeDistributionItem
        {
            SampleType = g.Key,
            TypeName = GetSampleTypeDisplayName(g.Key),
            Count = g.Count(),
            Percentage = allApps.Count > 0 ? Math.Round((double)g.Count() / allApps.Count * 100, 1) : 0
        }).ToList();

        vm.SampleTypeDistribution = sampleTypeGroups;

        var monthlyGroups = allApps.GroupBy(a => a.ApplicationDate.ToString("yyyy-MM")).Select(g => new MonthlyTrendItem
        {
            Month = g.Key,
            Count = g.Count(),
            TotalQuota = g.Sum(a => a.AppliedQuota)
        }).OrderBy(m => m.Month).ToList();

        vm.MonthlyTrend = monthlyGroups;

        if (!string.IsNullOrWhiteSpace(drillDownFilter))
        {
            vm.DrillDownFilter = drillDownFilter;
            vm.DrillDownRecords = drillDownFilter switch
            {
                "overlimit" => allApps.Where(a => a.SampleType == SampleType.OverLimit).ToList(),
                "missingevidence" => allApps.Where(a => a.SampleType == SampleType.MissingEvidence).ToList(),
                "timeout" => allApps.Where(a => a.SampleType == SampleType.ApprovalTimeout).ToList(),
                "normal" => allApps.Where(a => a.SampleType == SampleType.NormalPass).ToList(),
                "archived" => allApps.Where(a => a.Status == ApplicationStatus.Archived).ToList(),
                "active" => allApps.Where(a => a.Status != ApplicationStatus.Archived).ToList(),
                _ => allApps
            };
        }

        return vm;
    }

    public WaterQuotaApplication ProcessAction(ProcessActionInput input)
    {
        var app = _context.Applications
            .Include(a => a.ProcessingNodes)
            .Include(a => a.FieldChanges)
            .Include(a => a.EvidenceAttachments)
            .FirstOrDefault(a => a.Id == input.ApplicationId);

        if (app == null) throw new KeyNotFoundException($"Application {input.ApplicationId} not found");
        if (app.IsReadOnly) throw new InvalidOperationException("Application is archived and read-only");

        var previousStatus = app.Status;
        var previousResponsible = app.CurrentResponsiblePerson;
        var node = new ProcessingNode
        {
            ApplicationId = app.Id,
            FromStatus = previousStatus,
            ToStatus = previousStatus,
            Action = input.Action,
            OperatorName = input.OperatorName,
            OperatorRole = input.CurrentUserRole,
            Comment = input.Comment,
            Conclusion = input.Conclusion,
            ResponsiblePersonBefore = previousResponsible,
            ResponsiblePersonAfter = previousResponsible,
            OperatedAt = DateTime.Now
        };

        var keyChanges = new List<FieldChangeRecord>();

        switch (input.Action)
        {
            case "start_processing":
                app.Status = ApplicationStatus.Processing;
                app.CurrentResponsiblePerson = input.OperatorName;
                app.CurrentRole = RoleType.FieldPersonnel;
                node.ToStatus = ApplicationStatus.Processing;
                node.ResponsiblePersonAfter = input.OperatorName;
                break;

            case "submit_for_review":
                app.Status = ApplicationStatus.Reviewing;
                app.CurrentResponsiblePerson = "待分配主管";
                app.CurrentRole = RoleType.Reviewer;
                app.ProcessedDate = DateTime.Now;
                if (!string.IsNullOrWhiteSpace(input.BusinessRecord)) app.BusinessRecord = input.BusinessRecord;
                if (!string.IsNullOrWhiteSpace(input.FieldDescription)) app.FieldDescription = input.FieldDescription;
                node.ToStatus = ApplicationStatus.Reviewing;
                node.ResponsiblePersonAfter = "待分配主管";
                break;

            case "block_overlimit":
                app.Status = ApplicationStatus.Blocked;
                app.CurrentResponsiblePerson = input.OperatorName;
                app.CurrentRole = RoleType.FieldPersonnel;
                app.ProcessedDate = DateTime.Now;
                app.BlockingReason = $"申请用水指标({app.AppliedQuota}吨/月)超出园区限额({app.QuotaLimit}吨/月)，超限{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%，不符合规定";
                app.DifferentialFields = $"申请指标:{app.AppliedQuota}吨/月 vs 限额:{app.QuotaLimit}吨/月 | 差异:+{app.AppliedQuota - app.QuotaLimit}吨/月(+{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%)";
                app.RemediationPath = "1.重新核算实际用水需求，分阶段申请增量；2.提交节水改造方案，降低单耗后重新申报；3.如确需超限用水，需向市水务局申请特殊配额审批";
                app.Conclusion = $"指标超限阻断：申请量超出限额{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%";
                node.ToStatus = ApplicationStatus.Blocked;
                node.ResponsiblePersonAfter = input.OperatorName;
                AddKeyChange(keyChanges, app.Id, "Status", "状态", GetStatusDisplayName(previousStatus), "已阻断", input.OperatorName);
                AddKeyChange(keyChanges, app.Id, "AppliedQuota", "申请指标", app.AppliedQuota.ToString(), $"{app.AppliedQuota}(超限)", input.OperatorName);
                break;

            case "review_approve":
                app.Status = ApplicationStatus.Approved;
                app.CurrentRole = RoleType.Reviewer;
                app.ReviewedDate = DateTime.Now;
                if (input.ApprovedQuota.HasValue)
                {
                    var oldQuota = app.ApprovedQuota;
                    app.ApprovedQuota = input.ApprovedQuota.Value;
                    if (oldQuota != input.ApprovedQuota.Value)
                        AddKeyChange(keyChanges, app.Id, "ApprovedQuota", "审批指标", oldQuota.ToString(), input.ApprovedQuota.Value.ToString(), input.OperatorName);
                }
                app.Conclusion = input.Conclusion;
                if (!string.IsNullOrWhiteSpace(input.Conclusion))
                    AddKeyChange(keyChanges, app.Id, "Conclusion", "结论", app.Conclusion, input.Conclusion, input.OperatorName);
                node.ToStatus = ApplicationStatus.Approved;
                node.Conclusion = input.Conclusion;
                break;

            case "return_for_evidence":
                app.Status = ApplicationStatus.ReturnedForEvidence;
                app.CurrentResponsiblePerson = input.OperatorName;
                app.CurrentRole = RoleType.FieldPersonnel;
                app.BlockingReason = "缺少必要现场证据：" + input.Comment;
                app.RemediationPath = "1.补充现场勘验记录；2.提交必要的检测报告和批复文件；3.以上材料补齐后重新提交审核";
                app.Conclusion = "退回补证：" + input.Comment;
                node.ToStatus = ApplicationStatus.ReturnedForEvidence;
                node.ResponsiblePersonAfter = input.OperatorName;
                AddKeyChange(keyChanges, app.Id, "Status", "状态", GetStatusDisplayName(previousStatus), "退回补证", input.OperatorName);
                AddKeyChange(keyChanges, app.Id, "CurrentResponsiblePerson", "当前责任人", previousResponsible, input.OperatorName, input.OperatorName);
                break;

            case "archive":
                app.Status = ApplicationStatus.Archived;
                app.IsReadOnly = true;
                app.ArchivedDate = DateTime.Now;
                app.CurrentResponsiblePerson = "";
                node.ToStatus = ApplicationStatus.Archived;
                node.ResponsiblePersonAfter = "";
                break;

            case "supplement_evidence":
                if (input.CurrentUserRole == RoleType.FieldPersonnel)
                {
                    if (!string.IsNullOrWhiteSpace(input.BusinessRecord)) app.BusinessRecord = input.BusinessRecord;
                    if (!string.IsNullOrWhiteSpace(input.FieldDescription)) app.FieldDescription = input.FieldDescription;
                }
                break;

            case "resubmit_after_evidence":
                app.Status = ApplicationStatus.Processing;
                app.CurrentResponsiblePerson = input.OperatorName;
                app.CurrentRole = RoleType.FieldPersonnel;
                app.BlockingReason = "";
                app.RemediationPath = "";
                node.ToStatus = ApplicationStatus.Processing;
                node.ResponsiblePersonAfter = input.OperatorName;
                AddKeyChange(keyChanges, app.Id, "Status", "状态", "退回补证", "处理中", input.OperatorName);
                break;

            case "reprocess":
                app.Status = ApplicationStatus.Accepted;
                app.CurrentResponsiblePerson = "";
                app.IsReadOnly = false;
                node.ToStatus = ApplicationStatus.Accepted;
                node.ResponsiblePersonAfter = "";
                AddKeyChange(keyChanges, app.Id, "Status", "状态", GetStatusDisplayName(previousStatus), "已受理(重新处理)", input.OperatorName);
                break;
        }

        app.UpdatedAt = DateTime.Now;
        SyncSummaryAndConclusionInternal(app);

        _context.ProcessingNodes.Add(node);
        _context.SaveChanges();

        foreach (var change in keyChanges)
        {
            change.ProcessingNodeId = node.Id;
            _context.FieldChanges.Add(change);
        }
        _context.SaveChanges();

        return app;
    }

    public WaterQuotaApplication CreateNewApplication(WaterQuotaApplication application)
    {
        application.ApplicationNo = $"WQ-{DateTime.Now:yyyy}-{_context.Applications.Count() + 1:D3}";
        application.Status = ApplicationStatus.Accepted;
        application.CurrentRole = RoleType.FieldPersonnel;
        application.CreatedAt = DateTime.Now;
        application.UpdatedAt = DateTime.Now;
        application.IsReadOnly = false;

        _context.Applications.Add(application);
        _context.SaveChanges();

        var node = new ProcessingNode
        {
            ApplicationId = application.Id,
            FromStatus = ApplicationStatus.Accepted,
            ToStatus = ApplicationStatus.Accepted,
            Action = "新建申请",
            OperatorName = application.ApplicantName,
            OperatorRole = RoleType.FieldPersonnel,
            Comment = "提交用水指标申请",
            Conclusion = "已受理",
            ResponsiblePersonBefore = "",
            ResponsiblePersonAfter = "",
            OperatedAt = DateTime.Now
        };
        _context.ProcessingNodes.Add(node);
        _context.SaveChanges();

        return application;
    }

    public void SyncSummaryAndConclusion(int applicationId)
    {
        var app = _context.Applications.FirstOrDefault(a => a.Id == applicationId);
        if (app == null) return;
        SyncSummaryAndConclusionInternal(app);
        _context.SaveChanges();
    }

    private void SyncSummaryAndConclusionInternal(WaterQuotaApplication app)
    {
        var statusText = GetStatusDisplayName(app.Status);
        var sampleText = GetSampleTypeDisplayName(app.SampleType);
        var quotaInfo = app.AppliedQuota > app.QuotaLimit
            ? $"超限{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%"
            : "限额内";

        app.Summary = $"[{sampleText}]{app.ParkName}-{app.KeyObject} | 申请:{app.AppliedQuota}{app.QuotaUnit} | {quotaInfo} | {statusText}";
    }

    private static void AddKeyChange(List<FieldChangeRecord> changes, int appId, string fieldName, string displayName, string oldValue, string newValue, string changedBy)
    {
        changes.Add(new FieldChangeRecord
        {
            ApplicationId = appId,
            FieldName = fieldName,
            FieldDisplayName = displayName,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedBy = changedBy,
            ChangedAt = DateTime.Now,
            IsKeyChange = true
        });
    }

    public static string GetStatusDisplayName(ApplicationStatus status) => status switch
    {
        ApplicationStatus.Accepted => "已受理",
        ApplicationStatus.Processing => "处理中",
        ApplicationStatus.Reviewing => "复核中",
        ApplicationStatus.Approved => "已审批",
        ApplicationStatus.Blocked => "已阻断",
        ApplicationStatus.ReturnedForEvidence => "退回补证",
        ApplicationStatus.Archived => "已归档",
        ApplicationStatus.Timeout => "审批超时",
        _ => status.ToString()
    };

    public static string GetSampleTypeDisplayName(SampleType type) => type switch
    {
        SampleType.NormalPass => "正常放行",
        SampleType.OverLimit => "指标超限",
        SampleType.MissingEvidence => "证据缺失",
        SampleType.ApprovalTimeout => "审批超时",
        _ => type.ToString()
    };

    public static string GetStatusCssClass(ApplicationStatus status) => status switch
    {
        ApplicationStatus.Accepted => "bg-info",
        ApplicationStatus.Processing => "bg-primary",
        ApplicationStatus.Reviewing => "bg-warning",
        ApplicationStatus.Approved => "bg-success",
        ApplicationStatus.Blocked => "bg-danger",
        ApplicationStatus.ReturnedForEvidence => "bg-warning",
        ApplicationStatus.Archived => "bg-secondary",
        ApplicationStatus.Timeout => "bg-danger",
        _ => "bg-secondary"
    };

    public static string GetSampleTypeCssClass(SampleType type) => type switch
    {
        SampleType.NormalPass => "bg-success",
        SampleType.OverLimit => "bg-danger",
        SampleType.MissingEvidence => "bg-warning",
        SampleType.ApprovalTimeout => "bg-danger",
        _ => "bg-secondary"
    };
}
