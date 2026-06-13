using Microsoft.EntityFrameworkCore;
using BunkerFuelSystem.Data;
using BunkerFuelSystem.Models;
using BunkerFuelSystem.Models.ViewModels;

namespace BunkerFuelSystem.Services;

public class BunkerService : IBunkerService
{
    private readonly AppDbContext _context;

    public BunkerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<BunkerApplicationListViewModel> GetListAsync(string? status, string? category, string? keyword)
    {
        var query = _context.BunkerApplications
            .Include(a => a.ProcessNodes)
            .Include(a => a.DiscrepancyFields)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, out var statusEnum))
            query = query.Where(a => a.Status == statusEnum);

        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<ApplicationCategory>(category, out var categoryEnum))
            query = query.Where(a => a.Category == categoryEnum);

        if (!string.IsNullOrWhiteSpace(keyword))
            query = query.Where(a =>
                a.ApplicationNo.Contains(keyword) ||
                a.ShipName.Contains(keyword) ||
                a.SupplierName.Contains(keyword));

        var applications = await query
            .OrderByDescending(a => a.UpdatedAt)
            .Select(a => new BunkerApplicationListItem
            {
                Id = a.Id,
                ApplicationNo = a.ApplicationNo,
                ShipName = a.ShipName,
                FuelType = a.FuelType,
                OrderedQuantity = a.OrderedQuantity,
                ActualQuantity = a.ActualQuantity,
                Status = a.Status,
                Category = a.Category,
                CurrentResponsiblePerson = a.CurrentResponsiblePerson,
                CurrentResponsibleRole = a.CurrentResponsibleRole,
                Conclusion = a.Conclusion,
                Summary = a.Summary ?? a.Conclusion ?? "",
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                HasDiscrepancy = a.DiscrepancyFields.Any(),
                BlockedReason = a.BlockedReason
            })
            .ToListAsync();

        WorkflowStatus? filterStatus = null;
        ApplicationCategory? filterCategory = null;

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkflowStatus>(status, out var fs))
            filterStatus = fs;
        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<ApplicationCategory>(category, out var fc))
            filterCategory = fc;

        return new BunkerApplicationListViewModel
        {
            Applications = applications,
            FilterStatus = filterStatus,
            FilterCategory = filterCategory,
            SearchKeyword = keyword
        };
    }

    public async Task<BunkerApplicationDetailViewModel?> GetDetailAsync(int id)
    {
        var app = await _context.BunkerApplications
            .Include(a => a.ProcessNodes.OrderBy(p => p.CreatedAt))
            .Include(a => a.DiscrepancyFields)
            .Include(a => a.EvidenceAttachments)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return null;

        return new BunkerApplicationDetailViewModel
        {
            Application = app,
            ProcessNodes = app.ProcessNodes.OrderBy(p => p.CreatedAt).ToList(),
            DiscrepancyFields = app.DiscrepancyFields,
            EvidenceAttachments = app.EvidenceAttachments,
            CanProcess = (app.Status == WorkflowStatus.Received || app.Status == WorkflowStatus.Processing)
                         && app.CurrentResponsibleRole == UserRole.OnSitePersonnel,
            CanReview = app.Status == WorkflowStatus.UnderReview
                        && app.CurrentResponsibleRole == UserRole.SupervisorReviewer,
            CanArchive = app.Status == WorkflowStatus.UnderReview
                         && app.CurrentResponsibleRole == UserRole.SupervisorReviewer,
            IsReadOnly = app.Status == WorkflowStatus.Archived
        };
    }

    public async Task<ProcessDeskViewModel?> GetProcessDeskAsync(int id, UserRole currentRole)
    {
        var app = await _context.BunkerApplications
            .Include(a => a.ProcessNodes)
            .Include(a => a.DiscrepancyFields)
            .Include(a => a.EvidenceAttachments)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return null;

        var availableActions = new List<string>();

        if (currentRole == UserRole.OnSitePersonnel
            && (app.Status == WorkflowStatus.Received || app.Status == WorkflowStatus.Processing))
        {
            availableActions = ["补充业务记录", "补充现场说明", "上传证据附件", "提交处理"];
        }
        else if (currentRole == UserRole.SupervisorReviewer && app.Status == WorkflowStatus.UnderReview)
        {
            availableActions = ["确认结论", "退回补证", "只读归档"];
        }

        return new ProcessDeskViewModel
        {
            Application = app,
            CurrentUserRole = currentRole,
            AvailableActions = availableActions
        };
    }

    public async Task<bool> ProcessActionAsync(int id, UserRole currentRole, string action,
        string? businessRecord, string? siteDescription, string? comment,
        string? conclusion, string? operatorName)
    {
        var app = await _context.BunkerApplications
            .Include(a => a.ProcessNodes)
            .Include(a => a.DiscrepancyFields)
            .Include(a => a.EvidenceAttachments)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return false;

        if (!IsActionAllowed(currentRole, app.Status, action)) return false;

        if (app.Status == WorkflowStatus.Archived) return false;

        var now = DateTime.Now;

        switch (action)
        {
            case "提交处理":
                if (app.Status == WorkflowStatus.Received)
                    app.Status = WorkflowStatus.Processing;
                else if (app.Status == WorkflowStatus.Processing)
                    app.Status = WorkflowStatus.UnderReview;

                app.CurrentResponsibleRole = UserRole.SupervisorReviewer;
                app.CurrentResponsiblePerson = "待指派主管";
                app.BlockedReason = null;

                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Processing,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = comment,
                    CreatedAt = now
                });
                break;

            case "确认结论":
                app.Conclusion = conclusion;
                if (!string.IsNullOrWhiteSpace(conclusion))
                    app.Summary = conclusion;
                app.BlockedReason = null;

                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Review,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = comment,
                    CreatedAt = now
                });
                break;

            case "退回补证":
                app.Status = WorkflowStatus.Processing;
                app.CurrentResponsibleRole = UserRole.OnSitePersonnel;
                app.BlockedReason = "主管退回，需补充证据";

                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Rejection,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = comment,
                    BlockedReason = app.BlockedReason,
                    CreatedAt = now
                });
                break;

            case "只读归档":
                app.Status = WorkflowStatus.Archived;

                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Archive,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = comment,
                    CreatedAt = now
                });
                break;

            case "补充业务记录":
                var brContent = businessRecord ?? comment ?? "";

                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Processing,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = brContent,
                    CreatedAt = now
                });

                DetectAndCreateKeyFieldDiscrepancies(app, brContent, operatorName, now);
                break;

            case "补充现场说明":
                var sdContent = siteDescription ?? comment ?? "";

                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Processing,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = sdContent,
                    CreatedAt = now
                });

                DetectAndCreateKeyFieldDiscrepancies(app, sdContent, operatorName, now);
                break;

            case "上传证据附件":
                _context.ProcessNodes.Add(new ProcessNode
                {
                    BunkerApplicationId = app.Id,
                    NodeType = NodeType.Processing,
                    OperatorName = operatorName ?? "",
                    OperatorRole = currentRole,
                    Action = action,
                    Comment = comment,
                    CreatedAt = now
                });
                break;

            default:
                return false;
        }

        app.UpdatedAt = now;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DashboardViewModel> GetDashboardAsync(string? drillDownFilter)
    {
        var applications = await _context.BunkerApplications
            .Include(a => a.DiscrepancyFields)
            .ToListAsync();

        var statusDistribution = applications
            .GroupBy(a => a.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var categoryDistribution = applications
            .GroupBy(a => a.Category.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var recentItems = applications
            .OrderByDescending(a => a.UpdatedAt)
            .Take(10)
            .Select(MapToListItem)
            .ToList();

        List<BunkerApplicationListItem>? drillDownResults = null;

        if (!string.IsNullOrWhiteSpace(drillDownFilter))
        {
            IEnumerable<BunkerApplication> filtered = applications;

            if (Enum.TryParse<WorkflowStatus>(drillDownFilter, out var filterStatus))
                filtered = filtered.Where(a => a.Status == filterStatus);
            else if (Enum.TryParse<ApplicationCategory>(drillDownFilter, out var filterCategory))
                filtered = filtered.Where(a => a.Category == filterCategory);

            drillDownResults = filtered
                .OrderByDescending(a => a.UpdatedAt)
                .Select(MapToListItem)
                .ToList();
        }

        return new DashboardViewModel
        {
            TotalCount = applications.Count,
            NormalCount = applications.Count(a => a.Category == ApplicationCategory.NormalPass),
            OverLimitCount = applications.Count(a => a.Category == ApplicationCategory.IndicatorOverLimit),
            EvidenceMissingCount = applications.Count(a => a.Category == ApplicationCategory.EvidenceMissing),
            TimeoutCount = applications.Count(a => a.Category == ApplicationCategory.ApprovalTimeout),
            ArchivedCount = applications.Count(a => a.Status == WorkflowStatus.Archived),
            ActiveCount = applications.Count(a => a.Status != WorkflowStatus.Archived),
            StatusDistribution = statusDistribution,
            CategoryDistribution = categoryDistribution,
            RecentItems = recentItems,
            DrillDownResults = drillDownResults,
            DrillDownFilter = drillDownFilter
        };
    }

    public async Task<bool> CanProcessAsync(int id, UserRole role)
    {
        var app = await _context.BunkerApplications.FindAsync(id);
        if (app == null) return false;
        return (app.Status == WorkflowStatus.Received || app.Status == WorkflowStatus.Processing)
               && app.CurrentResponsibleRole == role
               && role == UserRole.OnSitePersonnel;
    }

    public async Task<bool> CanReviewAsync(int id, UserRole role)
    {
        var app = await _context.BunkerApplications.FindAsync(id);
        if (app == null) return false;
        return app.Status == WorkflowStatus.UnderReview
               && app.CurrentResponsibleRole == role
               && role == UserRole.SupervisorReviewer;
    }

    private static bool IsActionAllowed(UserRole role, WorkflowStatus status, string action)
    {
        return role switch
        {
            UserRole.OnSitePersonnel when status is WorkflowStatus.Received or WorkflowStatus.Processing
                => action is "补充业务记录" or "补充现场说明" or "上传证据附件" or "提交处理",
            UserRole.SupervisorReviewer when status is WorkflowStatus.UnderReview
                => action is "确认结论" or "退回补证" or "只读归档",
            _ => false
        };
    }

    private static readonly (string Category, string FieldName, string FieldLabel, string[] Keywords)[] KeyFieldPatterns =
    [
        ("关键时间", "KeyTime", "关键时间", ["时间", "日期", "期", "时效"]),
        ("责任对象", "ResponsibleParty", "责任对象", ["负责人", "供应商", "责任", "操作人"]),
        ("金额数量", "AmountQuantity", "金额数量", ["金额", "数量", "单价", "总价", "费用"]),
        ("证据结论", "EvidenceConclusion", "证据结论", ["证据", "结论", "依据", "证明"])
    ];

    private void DetectAndCreateKeyFieldDiscrepancies(BunkerApplication app, string content,
        string? operatorName, DateTime now)
    {
        if (string.IsNullOrWhiteSpace(content)) return;

        foreach (var pattern in KeyFieldPatterns)
        {
            if (!pattern.Keywords.Any(k => content.Contains(k))) continue;

            _context.DiscrepancyFields.Add(new DiscrepancyField
            {
                BunkerApplicationId = app.Id,
                FieldName = pattern.FieldName,
                FieldLabel = pattern.FieldLabel,
                OriginalValue = "无变更",
                CurrentValue = content.Length > 500 ? content[..500] : content,
                ChangedAt = now,
                ChangedBy = operatorName ?? "",
                IsKeyField = true
            });

            var changeNote = $"涉及{pattern.Category}变更";

            if (string.IsNullOrWhiteSpace(app.Summary) || !app.Summary.Contains(changeNote))
            {
                var newSummary = string.IsNullOrWhiteSpace(app.Summary)
                    ? changeNote
                    : $"{app.Summary}; {changeNote}";

                app.Summary = newSummary.Length > 1000 ? newSummary[..1000] : newSummary;
            }

            if (pattern.Category == "证据结论" && !string.IsNullOrWhiteSpace(content))
            {
                app.Conclusion = content.Length > 500 ? content[..500] : content;
            }
        }
    }

    private static BunkerApplicationListItem MapToListItem(BunkerApplication a) => new()
    {
        Id = a.Id,
        ApplicationNo = a.ApplicationNo,
        ShipName = a.ShipName,
        FuelType = a.FuelType,
        OrderedQuantity = a.OrderedQuantity,
        ActualQuantity = a.ActualQuantity,
        Status = a.Status,
        Category = a.Category,
        CurrentResponsiblePerson = a.CurrentResponsiblePerson,
        CurrentResponsibleRole = a.CurrentResponsibleRole,
        Conclusion = a.Conclusion,
        Summary = a.Summary ?? a.Conclusion ?? "",
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
        HasDiscrepancy = a.DiscrepancyFields.Any(),
        BlockedReason = a.BlockedReason
    };
}
