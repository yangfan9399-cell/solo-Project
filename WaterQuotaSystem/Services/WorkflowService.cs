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
        var approvedOrArchived = allApps.Where(a => a.Status == ApplicationStatus.Approved || a.Status == ApplicationStatus.Archived).ToList();

        var allFieldChanges = _context.FieldChanges
            .Where(f => f.IsKeyChange)
            .OrderByDescending(f => f.ChangedAt)
            .Take(20)
            .ToList();

        var allAppIds = allFieldChanges.Select(f => f.ApplicationId).Distinct().ToList();
        var changeApps = _context.Applications.Where(a => allAppIds.Contains(a.Id)).ToList();

        var vm = new DashboardViewModel
        {
            TotalApplications = allApps.Count,
            NormalCount = allApps.Count(a => a.SampleType == SampleType.NormalPass),
            OverLimitCount = allApps.Count(a => a.SampleType == SampleType.OverLimit),
            MissingEvidenceCount = allApps.Count(a => a.SampleType == SampleType.MissingEvidence),
            TimeoutCount = allApps.Count(a => a.SampleType == SampleType.ApprovalTimeout),
            ArchivedCount = allApps.Count(a => a.Status == ApplicationStatus.Archived),
            ActiveCount = allApps.Count(a => a.Status != ApplicationStatus.Archived),
            BlockedStatusCount = allApps.Count(a => a.Status == ApplicationStatus.Blocked),
            ReviewingCount = allApps.Count(a => a.Status == ApplicationStatus.Reviewing),
            ProcessingCount = allApps.Count(a => a.Status == ApplicationStatus.Processing),
            TotalAppliedQuota = allApps.Sum(a => a.AppliedQuota),
            TotalApprovedQuota = approvedOrArchived.Sum(a => a.ApprovedQuota),
            QuotaApprovalRate = allApps.Sum(a => a.AppliedQuota) > 0
                ? Math.Round(approvedOrArchived.Sum(a => a.ApprovedQuota) / allApps.Sum(a => a.AppliedQuota) * 100, 1)
                : 0,
            AverageProcessingDays = allApps.Where(a => a.ProcessedDate.HasValue).Select(a => (a.ProcessedDate!.Value - a.ApplicationDate).TotalDays).DefaultIfEmpty(0).Average(),
            PendingTimeoutCount = allApps.Count(a => a.Deadline.HasValue && a.Deadline.Value < DateTime.Now && a.Status != ApplicationStatus.Archived && a.Status != ApplicationStatus.Timeout),
            RecentKeyChanges = allFieldChanges.Select(f =>
            {
                var ca = changeApps.FirstOrDefault(a => a.Id == f.ApplicationId);
                return new RecentKeyChangeItem
                {
                    ApplicationId = f.ApplicationId,
                    ApplicationNo = ca?.ApplicationNo ?? "",
                    ParkName = ca?.ParkName ?? "",
                    FieldDisplayName = f.FieldDisplayName,
                    OldValue = f.OldValue,
                    NewValue = f.NewValue,
                    ChangedBy = f.ChangedBy,
                    ChangedAt = f.ChangedAt
                };
            }).ToList(),
            ResponsiblePersonStats = allApps
                .Where(a => !string.IsNullOrWhiteSpace(a.CurrentResponsiblePerson))
                .GroupBy(a => a.CurrentResponsiblePerson)
                .Select(g => new ResponsiblePersonItem
                {
                    ResponsiblePerson = g.Key,
                    Count = g.Count(),
                    TotalAppliedQuota = g.Sum(a => a.AppliedQuota),
                    LatestConclusion = g.OrderByDescending(a => a.UpdatedAt).First().Conclusion
                }).OrderByDescending(r => r.Count).ToList(),
            WithReviewerCommentCount = allApps.Count(a => !string.IsNullOrWhiteSpace(a.ReviewerComment)),
            ConclusionDistribution = allApps
                .GroupBy(a => GetStatusDisplayName(a.Status))
                .Select(g => new ConclusionDistributionItem
                {
                    ConclusionLabel = g.Key,
                    Count = g.Count(),
                    Percentage = allApps.Count > 0 ? Math.Round((double)g.Count() / allApps.Count * 100, 1) : 0,
                    WithCommentCount = g.Count(a => !string.IsNullOrWhiteSpace(a.ReviewerComment)),
                    SampleComments = g.Where(a => !string.IsNullOrWhiteSpace(a.ReviewerComment))
                        .Select(a => a.ReviewerComment).Take(3).ToList()
                }).OrderByDescending(c => c.Count).ToList()
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
        if (app.IsReadOnly && input.Action != "reprocess")
            throw new InvalidOperationException("Application is archived and read-only, only reprocess action is allowed");

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
                if (!string.IsNullOrWhiteSpace(input.Conclusion))
                {
                    app.ReviewerComment = input.Conclusion;
                    AddKeyChange(keyChanges, app.Id, "ReviewerComment", "复核意见", app.ReviewerComment, input.Conclusion, input.OperatorName);
                }
                node.ToStatus = ApplicationStatus.Approved;
                node.Conclusion = input.Conclusion;
                break;

            case "return_for_evidence":
                app.Status = ApplicationStatus.ReturnedForEvidence;
                app.CurrentResponsiblePerson = input.OperatorName;
                app.CurrentRole = RoleType.FieldPersonnel;
                app.BlockingReason = "缺少必要现场证据：" + input.Comment;
                app.RemediationPath = "1.补充现场勘验记录；2.提交必要的检测报告和批复文件；3.以上材料补齐后重新提交审核";
                if (!string.IsNullOrWhiteSpace(input.Comment))
                {
                    app.ReviewerComment = "退回补证：" + input.Comment;
                }
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
                    var changedFields = new List<string>();
                    if (!string.IsNullOrWhiteSpace(input.BusinessRecord) && input.BusinessRecord != app.BusinessRecord)
                    {
                        AddKeyChange(keyChanges, app.Id, "BusinessRecord", "业务记录", app.BusinessRecord, input.BusinessRecord, input.OperatorName);
                        app.BusinessRecord = input.BusinessRecord;
                    }
                    if (!string.IsNullOrWhiteSpace(input.FieldDescription) && input.FieldDescription != app.FieldDescription)
                    {
                        AddKeyChange(keyChanges, app.Id, "FieldDescription", "现场说明", app.FieldDescription, input.FieldDescription, input.OperatorName);
                        app.FieldDescription = input.FieldDescription;
                    }
                    if (!string.IsNullOrWhiteSpace(input.EvidenceFileName))
                    {
                        var newAtt = new EvidenceAttachment
                        {
                            ApplicationId = app.Id,
                            FileName = input.EvidenceFileName,
                            FilePath = $"/uploads/wq-{app.Id}/{Guid.NewGuid():N}_{input.EvidenceFileName}",
                            FileType = string.IsNullOrWhiteSpace(input.EvidenceFileType) ? "application/octet-stream" : input.EvidenceFileType,
                            Description = input.EvidenceDescription,
                            UploadedBy = input.OperatorName,
                            UploaderRole = RoleType.FieldPersonnel,
                            UploadedAt = DateTime.Now,
                            IsMissing = false
                        };
                        _context.EvidenceAttachments.Add(newAtt);

                        var missingAtt = app.EvidenceAttachments.FirstOrDefault(e => e.IsMissing);
                        if (missingAtt != null)
                        {
                            AddKeyChange(keyChanges, app.Id, "EvidenceAttachment", "证据附件",
                                $"{missingAtt.FileName}(缺失)", $"{input.EvidenceFileName}(已补齐)", input.OperatorName);
                        }
                        else
                        {
                            AddKeyChange(keyChanges, app.Id, "EvidenceAttachment", "证据附件",
                                "无", $"{input.EvidenceFileName}(新增)", input.OperatorName);
                        }
                    }
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

        if (!string.IsNullOrWhiteSpace(input.Conclusion))
        {
            app.ReviewerComment = input.Conclusion;
        }

        app.UpdatedAt = DateTime.Now;
        SyncApplicationDisplay(app);

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
        SyncApplicationDisplay(app);
        _context.SaveChanges();
    }

    public static void SyncApplicationDisplay(WaterQuotaApplication app)
    {
        var statusText = GetStatusDisplayName(app.Status);
        var sampleText = GetSampleTypeDisplayName(app.SampleType);
        var quotaInfo = app.AppliedQuota > app.QuotaLimit
            ? $"超限{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%"
            : "限额内";
        var deadlineInfo = app.Deadline.HasValue ? app.Deadline.Value.ToString("yyyy-MM-dd") : "无截止";
        var responsibleInfo = string.IsNullOrWhiteSpace(app.CurrentResponsiblePerson) ? "未分配" : app.CurrentResponsiblePerson;

        app.Summary = $"[{sampleText}]{app.ParkName}-{app.KeyObject} | 申请:{app.AppliedQuota}{app.QuotaUnit} | 审批:{app.ApprovedQuota}{app.QuotaUnit} | {quotaInfo} | 责任人:{responsibleInfo} | 截止:{deadlineInfo} | {statusText}";

        var standardConclusion = app.Status switch
        {
            ApplicationStatus.Accepted => $"已受理，等待处理 | 申请{app.AppliedQuota}{app.QuotaUnit}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.Processing => $"处理中 | 申请{app.AppliedQuota}{app.QuotaUnit}，审批{app.ApprovedQuota}{app.QuotaUnit}，{quotaInfo}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.Reviewing => $"复核中 | 申请{app.AppliedQuota}{app.QuotaUnit}，审批{app.ApprovedQuota}{app.QuotaUnit}，{quotaInfo}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.Approved => $"审批通过 | 申请{app.AppliedQuota}{app.QuotaUnit}，审批{app.ApprovedQuota}{app.QuotaUnit}，{quotaInfo}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.Blocked => $"指标超限阻断 | 申请{app.AppliedQuota}{app.QuotaUnit}超出限额{app.QuotaLimit}{app.QuotaUnit}，超限{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.ReturnedForEvidence => $"退回补证 | 申请{app.AppliedQuota}{app.QuotaUnit}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.Archived => $"已归档 | 申请{app.AppliedQuota}{app.QuotaUnit}，审批{app.ApprovedQuota}{app.QuotaUnit}，{quotaInfo}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            ApplicationStatus.Timeout => $"审批超时 | 申请{app.AppliedQuota}{app.QuotaUnit}，责任人:{responsibleInfo}，截止:{deadlineInfo}",
            _ => app.Conclusion
        };

        app.Conclusion = string.IsNullOrWhiteSpace(app.ReviewerComment)
            ? standardConclusion
            : $"{standardConclusion} | 复核意见:{app.ReviewerComment}";
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

    public KeyFieldEditViewModel GetKeyFieldEditViewModel(int id)
    {
        var app = _context.Applications
            .Include(a => a.ProcessingNodes)
            .Include(a => a.FieldChanges)
            .FirstOrDefault(a => a.Id == id);

        if (app == null) throw new KeyNotFoundException($"Application {id} not found");

        return new KeyFieldEditViewModel
        {
            Application = app,
            HistoryNodes = app.ProcessingNodes.OrderBy(n => n.OperatedAt).ToList(),
            PreviousKeyChanges = app.FieldChanges.Where(c => c.IsKeyChange).OrderBy(c => c.ChangedAt).ToList()
        };
    }

    public WaterQuotaApplication UpdateKeyFields(KeyFieldEditInput input)
    {
        var app = _context.Applications.FirstOrDefault(a => a.Id == input.ApplicationId);
        if (app == null) throw new KeyNotFoundException($"Application {input.ApplicationId} not found");

        if (app.IsReadOnly)
            throw new InvalidOperationException("已归档记录不可直接修改关键字段，请先重新处理");

        if (string.IsNullOrWhiteSpace(input.OperatorName))
            throw new ArgumentException("必须指定操作人");

        var keyChanges = new List<FieldChangeRecord>();
        var updatedFields = new List<string>();
        var previousStatus = app.Status;

        if (input.NewApplicationDate.HasValue && input.NewApplicationDate.Value.Date != app.ApplicationDate.Date)
        {
            AddKeyChange(keyChanges, app.Id, "ApplicationDate", "申请时间(关键时间)",
                app.ApplicationDate.ToString("yyyy-MM-dd"), input.NewApplicationDate.Value.ToString("yyyy-MM-dd"),
                input.OperatorName);
            app.ApplicationDate = input.NewApplicationDate.Value;
            updatedFields.Add("申请时间");
        }

        if (input.NewDeadline.HasValue &&
            (!app.Deadline.HasValue || input.NewDeadline.Value.Date != app.Deadline.Value.Date))
        {
            AddKeyChange(keyChanges, app.Id, "Deadline", "截止时间(关键时间)",
                app.Deadline.HasValue ? app.Deadline.Value.ToString("yyyy-MM-dd") : "未设置",
                input.NewDeadline.Value.ToString("yyyy-MM-dd"),
                input.OperatorName);
            app.Deadline = input.NewDeadline.Value;
            updatedFields.Add("截止时间");
        }

        if (!string.IsNullOrWhiteSpace(input.NewCurrentResponsiblePerson) &&
            input.NewCurrentResponsiblePerson != app.CurrentResponsiblePerson)
        {
            AddKeyChange(keyChanges, app.Id, "CurrentResponsiblePerson", "当前责任人(责任对象)",
                string.IsNullOrWhiteSpace(app.CurrentResponsiblePerson) ? "未设置" : app.CurrentResponsiblePerson,
                input.NewCurrentResponsiblePerson, input.OperatorName);
            app.CurrentResponsiblePerson = input.NewCurrentResponsiblePerson;
            updatedFields.Add("当前责任人");
        }

        if (!string.IsNullOrWhiteSpace(input.NewApplicantName) &&
            input.NewApplicantName != app.ApplicantName)
        {
            AddKeyChange(keyChanges, app.Id, "ApplicantName", "申请人(责任对象)",
                app.ApplicantName, input.NewApplicantName, input.OperatorName);
            app.ApplicantName = input.NewApplicantName;
            updatedFields.Add("申请人");
        }

        if (input.NewAppliedQuota.HasValue && input.NewAppliedQuota.Value != app.AppliedQuota)
        {
            AddKeyChange(keyChanges, app.Id, "AppliedQuota", "申请指标(金额数量)",
                $"{app.AppliedQuota}{app.QuotaUnit}", $"{input.NewAppliedQuota.Value}{app.QuotaUnit}",
                input.OperatorName);
            app.AppliedQuota = input.NewAppliedQuota.Value;
            updatedFields.Add("申请指标");
        }

        if (input.NewApprovedQuota.HasValue && input.NewApprovedQuota.Value != app.ApprovedQuota)
        {
            AddKeyChange(keyChanges, app.Id, "ApprovedQuota", "审批指标(金额数量)",
                $"{app.ApprovedQuota}{app.QuotaUnit}", $"{input.NewApprovedQuota.Value}{app.QuotaUnit}",
                input.OperatorName);
            app.ApprovedQuota = input.NewApprovedQuota.Value;
            updatedFields.Add("审批指标");
        }

        if (input.NewQuotaLimit.HasValue && input.NewQuotaLimit.Value != app.QuotaLimit)
        {
            AddKeyChange(keyChanges, app.Id, "QuotaLimit", "限额(金额数量)",
                $"{app.QuotaLimit}{app.QuotaUnit}", $"{input.NewQuotaLimit.Value}{app.QuotaUnit}",
                input.OperatorName);
            app.QuotaLimit = input.NewQuotaLimit.Value;
            updatedFields.Add("限额");
        }

        if (!string.IsNullOrWhiteSpace(input.NewConclusion) &&
            input.NewConclusion != app.ReviewerComment)
        {
            AddKeyChange(keyChanges, app.Id, "ReviewerComment", "证据结论",
                string.IsNullOrWhiteSpace(app.ReviewerComment) ? "未设置" : app.ReviewerComment,
                input.NewConclusion, input.OperatorName);
            app.ReviewerComment = input.NewConclusion;
            updatedFields.Add("证据结论");
        }

        if (app.AppliedQuota > app.QuotaLimit && app.Status == ApplicationStatus.Processing)
        {
            app.Status = ApplicationStatus.Blocked;
            app.BlockingReason = $"申请用水指标({app.AppliedQuota}吨/月)超出园区限额({app.QuotaLimit}吨/月)，超限{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%";
            app.DifferentialFields = $"申请指标:{app.AppliedQuota}吨/月 vs 限额:{app.QuotaLimit}吨/月 | 差异:+{app.AppliedQuota - app.QuotaLimit}吨/月(+{Math.Round((app.AppliedQuota - app.QuotaLimit) / app.QuotaLimit * 100, 1)}%)";
            app.RemediationPath = "1.重新核算实际用水需求；2.提交节水改造方案；3.如确需超限用水，需向市水务局申请特殊配额审批";
            AddKeyChange(keyChanges, app.Id, "Status", "状态",
                GetStatusDisplayName(previousStatus), GetStatusDisplayName(ApplicationStatus.Blocked),
                input.OperatorName);
        }
        else if (app.AppliedQuota <= app.QuotaLimit && app.Status == ApplicationStatus.Blocked)
        {
            app.Status = ApplicationStatus.Processing;
            app.BlockingReason = "";
            app.DifferentialFields = "";
            app.RemediationPath = "";
            AddKeyChange(keyChanges, app.Id, "Status", "状态",
                GetStatusDisplayName(previousStatus), GetStatusDisplayName(ApplicationStatus.Processing),
                input.OperatorName);
        }

        app.UpdatedAt = DateTime.Now;
        SyncApplicationDisplay(app);

        var node = new ProcessingNode
        {
            ApplicationId = app.Id,
            FromStatus = previousStatus,
            ToStatus = app.Status,
            Action = $"修改关键字段: {string.Join("、", updatedFields)}",
            OperatorName = input.OperatorName,
            OperatorRole = input.CurrentUserRole,
            Comment = input.ChangeReason,
            Conclusion = $"关键字段变更已同步至列表摘要/详情结论/看板统计",
            ResponsiblePersonBefore = "",
            ResponsiblePersonAfter = "",
            OperatedAt = DateTime.Now
        };
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
}
