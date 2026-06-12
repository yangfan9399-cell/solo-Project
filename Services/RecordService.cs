using MeetingRoomEquipment.Data;
using MeetingRoomEquipment.Models;
using MeetingRoomEquipment.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomEquipment.Services;

public interface IRecordService
{
    Task<List<RecordListViewModel>> GetListAsync(RecordStatus? status = null, SampleCategory? category = null, string? keyword = null, string? department = null);
    Task<RecordDetailViewModel?> GetDetailAsync(int id);
    Task<ProcessViewModel?> GetProcessAsync(int id);
    Task<EquipmentBorrowRecord?> GetByIdAsync(int id);

    Task<bool> SupplementAsync(int id, string fieldDescription, string remark);
    Task<bool> SubmitForReviewAsync(int id, string remark);
    Task<bool> ReviewAsync(int id, ActionType action, string remark, string? conclusion = null, string? basis = null, decimal? actualCompensation = null, DateTime? actualReturnDate = null, decimal? compensationAmount = null, string? nextResponsibleId = null, string? nextResponsibleName = null);
    Task<bool> ArchiveAsync(int id, string remark);
    Task<bool> ReopenAsync(int id, string remark);
    Task<bool> ReturnForSupplementAsync(int id, string remark, string blockingReason, string remedyPath);

    Task<bool> AddEvidenceAsync(int id, EvidenceType evidenceType, string fileName, string fileUrl, string description);
}

public class RecordService : IRecordService
{
    private readonly ApplicationDbContext _ctx;
    private readonly ICurrentUserService _user;
    private readonly IPermissionService _perm;

    public RecordService(ApplicationDbContext ctx, ICurrentUserService user, IPermissionService perm)
    {
        _ctx = ctx;
        _user = user;
        _perm = perm;
    }

    private async Task<int> GetNextSequenceAsync(int recordId)
    {
        var max = await _ctx.RecordNodes
            .Where(n => n.RecordId == recordId)
            .MaxAsync(n => (int?)n.Sequence);
        return (max ?? 0) + 1;
    }

    public async Task<List<RecordListViewModel>> GetListAsync(RecordStatus? status = null, SampleCategory? category = null, string? keyword = null, string? department = null)
    {
        var q = _ctx.EquipmentBorrowRecords.AsQueryable();

        if (status.HasValue) q = q.Where(r => r.Status == status.Value);
        if (category.HasValue) q = q.Where(r => r.SampleCategory == category.Value);
        if (!string.IsNullOrEmpty(department)) q = q.Where(r => r.BorrowerDept == department);
        if (!string.IsNullOrEmpty(keyword))
            q = q.Where(r => r.Title.Contains(keyword) || r.RecordNo.Contains(keyword) || r.EquipmentName.Contains(keyword) || r.BorrowerName.Contains(keyword));

        var records = await q.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return records.Select(ToListVm).ToList();
    }

    public async Task<RecordDetailViewModel?> GetDetailAsync(int id)
    {
        var r = await _ctx.EquipmentBorrowRecords
            .Include(x => x.Nodes)
            .Include(x => x.Evidences)
            .Include(x => x.Snapshots)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return null;

        var nodes = r.Nodes.OrderBy(n => n.Sequence).ToList();
        var diffs = r.Snapshots.OrderByDescending(s => s.ChangedAt).Select(s => new DiffFieldDisplay
        {
            FieldName = s.FieldName,
            FieldDisplayName = s.FieldDisplayName,
            BeforeValue = s.BeforeValue,
            AfterValue = s.AfterValue,
            ChangeReason = s.ChangeReason,
            ChangedByName = s.ChangedByName,
            ChangedAt = s.ChangedAt
        }).ToList();

        return new RecordDetailViewModel
        {
            Record = r,
            Nodes = nodes,
            Evidences = r.Evidences.ToList(),
            Snapshots = r.Snapshots.ToList(),
            StatusText = EnumDisplay.GetStatusText(r.Status),
            CategoryText = EnumDisplay.GetCategoryText(r.SampleCategory),
            StatusBadgeClass = EnumDisplay.GetStatusBadgeClass(r.Status),
            CategoryBadgeClass = EnumDisplay.GetCategoryBadgeClass(r.SampleCategory),
            DiffFields = diffs,
            CanEdit = _perm.CanFieldEdit(r),
            CanReview = _perm.CanReview(r),
            CanArchive = _perm.CanArchive(r),
            IsReadOnly = _perm.IsReadOnly(r)
        };
    }

    public async Task<ProcessViewModel?> GetProcessAsync(int id)
    {
        var r = await _ctx.EquipmentBorrowRecords
            .Include(x => x.Evidences)
            .Include(x => x.Snapshots)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return null;

        return new ProcessViewModel
        {
            Id = r.Id,
            RecordNo = r.RecordNo,
            Title = r.Title,
            SampleCategory = r.SampleCategory,
            CategoryText = EnumDisplay.GetCategoryText(r.SampleCategory),
            CategoryBadgeClass = EnumDisplay.GetCategoryBadgeClass(r.SampleCategory),
            Status = r.Status,
            StatusText = EnumDisplay.GetStatusText(r.Status),
            StatusBadgeClass = EnumDisplay.GetStatusBadgeClass(r.Status),
            BorrowerName = r.BorrowerName,
            BorrowerDept = r.BorrowerDept,
            EquipmentName = r.EquipmentName,
            EquipmentCode = r.EquipmentCode,
            MeetingRoom = r.MeetingRoom,
            BorrowDate = r.BorrowDate,
            DueReturnDate = r.DueReturnDate,
            ActualReturnDate = r.ActualReturnDate,
            HasDamage = r.HasDamage,
            DamageDescription = r.DamageDescription,
            OriginalValue = r.OriginalValue,
            CompensationAmount = r.CompensationAmount,
            ActualCompensation = r.ActualCompensation,
            FieldDescription = r.FieldDescription,
            Conclusion = r.Conclusion,
            Basis = r.Basis,
            BlockingReason = r.BlockingReason,
            RemedyPath = r.RemedyPath,
            DiffFields = r.DiffFields,
            CurrentResponsibleId = r.CurrentResponsibleId,
            CurrentResponsibleName = r.CurrentResponsibleName,
            HasBlocking = !string.IsNullOrEmpty(r.BlockingReason),
            IsArchived = r.IsArchived,
            IsReadOnly = _perm.IsReadOnly(r),
            CanFieldEdit = _perm.CanFieldEdit(r),
            CanReview = _perm.CanReview(r),
            Evidences = r.Evidences.ToList(),
            Snapshots = r.Snapshots.ToList()
        };
    }

    public Task<EquipmentBorrowRecord?> GetByIdAsync(int id)
        => _ctx.EquipmentBorrowRecords.FirstOrDefaultAsync(x => x.Id == id);

    public async Task<bool> SupplementAsync(int id, string fieldDescription, string remark)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (r.IsArchived) return false;
        if (!_perm.CanFieldEdit(r)) return false;

        var diffList = new List<string>();
        var snapshots = new List<FieldSnapshot>();
        var seq = await GetNextSequenceAsync(id);

        if (!string.IsNullOrEmpty(fieldDescription) && fieldDescription != r.FieldDescription)
        {
            diffList.Add($"FieldDescription({Truncate(r.FieldDescription, 20)}→{Truncate(fieldDescription, 20)})");
            snapshots.Add(new FieldSnapshot
            {
                RecordId = id,
                FieldName = "FieldDescription",
                FieldDisplayName = "现场说明",
                BeforeValue = r.FieldDescription,
                AfterValue = fieldDescription,
                ChangeReason = "现场补充",
                ChangedById = _user.UserId,
                ChangedByName = _user.UserName,
                ChangedAt = DateTime.Now
            });
            r.FieldDescription = fieldDescription;
        }

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = NodeType.ProcessUpdate,
            NodeTitle = "补充业务记录",
            FromStatus = r.Status,
            ToStatus = r.Status == RecordStatus.ReturnedForSupplement ? RecordStatus.Processing : r.Status,
            Remark = remark,
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = diffList.Any() ? string.Join(", ", diffList) : null,
            Sequence = seq
        };

        if (r.Status == RecordStatus.ReturnedForSupplement)
        {
            r.Status = RecordStatus.Processing;
            r.BlockingReason = null;
            r.RemedyPath = null;
        }

        r.DiffFields = diffList.Any() ? string.Join(", ", diffList) : r.DiffFields;
        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        if (snapshots.Any()) _ctx.FieldSnapshots.AddRange(snapshots);
        _ctx.RecordNodes.Add(node);
        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddEvidenceAsync(int id, EvidenceType evidenceType, string fileName, string fileUrl, string description)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (r.IsArchived) return false;
        if (!_perm.CanFieldEdit(r)) return false;

        var seq = await GetNextSequenceAsync(id);

        var evidence = new EvidenceAttachment
        {
            RecordId = id,
            EvidenceType = evidenceType,
            FileName = fileName,
            FileUrl = fileUrl,
            Description = description,
            IsValid = true,
            UploadedById = _user.UserId,
            UploadedByName = _user.UserName,
            UploadedAt = DateTime.Now
        };
        _ctx.EvidenceAttachments.Add(evidence);

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = NodeType.ProcessUpdate,
            NodeTitle = "补充证据附件",
            FromStatus = r.Status,
            ToStatus = r.Status,
            Remark = $"上传证据：{fileName}",
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = $"新增证据 {EnumDisplay.GetEvidenceTypeText(evidenceType)}: {fileName}",
            Sequence = seq
        };
        _ctx.RecordNodes.Add(node);

        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SubmitForReviewAsync(int id, string remark)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (r.IsArchived) return false;
        if (!_perm.CanFieldEdit(r)) return false;
        if (r.Status is not (RecordStatus.Processing or RecordStatus.PendingAcceptance)) return false;

        var reviewer = await _ctx.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Reviewer);
        var seq = await GetNextSequenceAsync(id);

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = NodeType.ProcessUpdate,
            NodeTitle = "提交复核",
            FromStatus = r.Status,
            ToStatus = RecordStatus.PendingReview,
            Remark = remark,
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = "Status, CurrentResponsibleId, CurrentResponsibleName",
            Sequence = seq
        };

        r.Status = RecordStatus.PendingReview;
        if (reviewer != null)
        {
            r.CurrentResponsibleId = reviewer.UserId;
            r.CurrentResponsibleName = reviewer.UserName;
        }
        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        _ctx.RecordNodes.Add(node);
        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReviewAsync(int id, ActionType action, string remark, string? conclusion = null, string? basis = null, decimal? actualCompensation = null, DateTime? actualReturnDate = null, decimal? compensationAmount = null, string? nextResponsibleId = null, string? nextResponsibleName = null)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (r.IsArchived) return false;
        if (!_perm.CanReview(r)) return false;

        var seq = await GetNextSequenceAsync(id);
        var diffs = new List<string>();
        var snapshots = new List<FieldSnapshot>();

        if (!string.IsNullOrEmpty(conclusion) && conclusion != r.Conclusion)
        {
            diffs.Add($"Conclusion({Truncate(r.Conclusion, 20)}→{Truncate(conclusion, 20)})");
            snapshots.Add(new FieldSnapshot
            {
                RecordId = id, FieldName = "Conclusion", FieldDisplayName = "处理结论",
                BeforeValue = r.Conclusion, AfterValue = conclusion,
                ChangeReason = "复核更新", ChangedById = _user.UserId, ChangedByName = _user.UserName,
                ChangedAt = DateTime.Now
            });
            r.Conclusion = conclusion;
        }

        if (!string.IsNullOrEmpty(basis) && basis != r.Basis)
        {
            diffs.Add($"Basis({Truncate(r.Basis, 20)}→{Truncate(basis, 20)})");
            snapshots.Add(new FieldSnapshot
            {
                RecordId = id, FieldName = "Basis", FieldDisplayName = "采用依据",
                BeforeValue = r.Basis, AfterValue = basis,
                ChangeReason = "复核更新", ChangedById = _user.UserId, ChangedByName = _user.UserName,
                ChangedAt = DateTime.Now
            });
            r.Basis = basis;
        }

        if (actualCompensation.HasValue && actualCompensation != r.ActualCompensation)
        {
            diffs.Add($"ActualCompensation({r.ActualCompensation}→{actualCompensation})");
            snapshots.Add(new FieldSnapshot
            {
                RecordId = id, FieldName = "ActualCompensation", FieldDisplayName = "实际赔偿金额",
                BeforeValue = r.ActualCompensation?.ToString(), AfterValue = actualCompensation.ToString(),
                ChangeReason = "复核确认", ChangedById = _user.UserId, ChangedByName = _user.UserName,
                ChangedAt = DateTime.Now
            });
            r.ActualCompensation = actualCompensation;
        }

        if (compensationAmount.HasValue && compensationAmount != r.CompensationAmount)
        {
            diffs.Add($"CompensationAmount({r.CompensationAmount}→{compensationAmount})");
            snapshots.Add(new FieldSnapshot
            {
                RecordId = id, FieldName = "CompensationAmount", FieldDisplayName = "应赔偿金额",
                BeforeValue = r.CompensationAmount?.ToString(), AfterValue = compensationAmount.ToString(),
                ChangeReason = "复核调整", ChangedById = _user.UserId, ChangedByName = _user.UserName,
                ChangedAt = DateTime.Now
            });
            r.CompensationAmount = compensationAmount;
        }

        if (actualReturnDate.HasValue && actualReturnDate != r.ActualReturnDate)
        {
            diffs.Add($"ActualReturnDate({r.ActualReturnDate:yyyy-MM-dd}→{actualReturnDate:yyyy-MM-dd})");
            snapshots.Add(new FieldSnapshot
            {
                RecordId = id, FieldName = "ActualReturnDate", FieldDisplayName = "实际归还时间",
                BeforeValue = r.ActualReturnDate?.ToString("yyyy-MM-dd"), AfterValue = actualReturnDate.Value.ToString("yyyy-MM-dd"),
                ChangeReason = "复核确认", ChangedById = _user.UserId, ChangedByName = _user.UserName,
                ChangedAt = DateTime.Now
            });
            r.ActualReturnDate = actualReturnDate;
        }

        RecordStatus toStatus;
        NodeType nodeType;
        string nodeTitle;

        if (action == ActionType.Approve)
        {
            toStatus = RecordStatus.PendingReview;
            nodeType = NodeType.Review;
            nodeTitle = "复核通过";
            r.BlockingReason = null;
            r.RemedyPath = null;
        }
        else if (action == ActionType.Return)
        {
            toStatus = RecordStatus.ReturnedForSupplement;
            nodeType = NodeType.ReturnSupplement;
            nodeTitle = "退回补证";
            if (!string.IsNullOrEmpty(nextResponsibleId))
            {
                diffs.Add($"CurrentResponsibleId({r.CurrentResponsibleId}→{nextResponsibleId})");
                r.CurrentResponsibleId = nextResponsibleId;
                r.CurrentResponsibleName = nextResponsibleName ?? string.Empty;
            }
        }
        else
        {
            return false;
        }

        diffs.Add($"Status({r.Status}→{toStatus})");

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = nodeType,
            NodeTitle = nodeTitle,
            FromStatus = r.Status,
            ToStatus = toStatus,
            Remark = remark,
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = diffs.Any() ? string.Join(", ", diffs) : null,
            Sequence = seq
        };

        r.Status = toStatus;
        r.DiffFields = diffs.Any() ? string.Join(", ", diffs) : r.DiffFields;
        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        if (snapshots.Any()) _ctx.FieldSnapshots.AddRange(snapshots);
        _ctx.RecordNodes.Add(node);
        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReturnForSupplementAsync(int id, string remark, string blockingReason, string remedyPath)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (r.IsArchived) return false;
        if (!_perm.CanReview(r)) return false;

        var seq = await GetNextSequenceAsync(id);
        var fieldStaff = await _ctx.Users.FirstOrDefaultAsync(u => u.Role == UserRole.FieldStaff);

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = NodeType.ReturnSupplement,
            NodeTitle = "复核退回补证",
            FromStatus = r.Status,
            ToStatus = RecordStatus.ReturnedForSupplement,
            Remark = remark,
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = "Status, BlockingReason, RemedyPath, CurrentResponsibleId",
            Sequence = seq
        };

        r.Status = RecordStatus.ReturnedForSupplement;
        r.BlockingReason = blockingReason;
        r.RemedyPath = remedyPath;
        if (fieldStaff != null)
        {
            r.CurrentResponsibleId = fieldStaff.UserId;
            r.CurrentResponsibleName = fieldStaff.UserName;
        }
        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        _ctx.RecordNodes.Add(node);
        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ArchiveAsync(int id, string remark)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (r.IsArchived) return false;
        if (!_perm.CanArchive(r)) return false;

        var seq = await GetNextSequenceAsync(id);

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = NodeType.Archive,
            NodeTitle = "归档",
            FromStatus = r.Status,
            ToStatus = RecordStatus.Archived,
            Remark = remark,
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = "Status, IsArchived, ArchivedAt",
            Sequence = seq
        };

        r.Status = RecordStatus.Archived;
        r.IsArchived = true;
        r.ArchivedAt = DateTime.Now;
        r.BlockingReason = null;
        r.RemedyPath = null;
        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        _ctx.RecordNodes.Add(node);
        await _ctx.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReopenAsync(int id, string remark)
    {
        var r = await GetByIdAsync(id);
        if (r == null) return false;
        if (!r.IsArchived) return false;
        if (!_perm.CanReopen(r)) return false;

        var seq = await GetNextSequenceAsync(id);

        var node = new RecordNode
        {
            RecordId = id,
            NodeType = NodeType.Reopen,
            NodeTitle = "重新处理(生成新节点)",
            FromStatus = r.Status,
            ToStatus = RecordStatus.Processing,
            Remark = remark,
            OperatorId = _user.UserId,
            OperatorName = _user.UserName,
            OperatorRole = _user.Role,
            OperatedAt = DateTime.Now,
            ChangedFields = "Status, IsArchived, ArchivedAt",
            Sequence = seq
        };

        r.Status = RecordStatus.Processing;
        r.IsArchived = false;
        r.ArchivedAt = null;
        r.LastUpdatedAt = DateTime.Now;
        r.LastUpdatedById = _user.UserId;
        r.LastUpdatedByName = _user.UserName;

        _ctx.RecordNodes.Add(node);
        await _ctx.SaveChangesAsync();
        return true;
    }

    public Task UpdateKeyFieldAsync(int id, string fieldName, string beforeValue, string afterValue, string reason)
    {
        throw new NotSupportedException("关键字段更新请通过各操作方法（ReviewAsync/SupplementAsync）统一执行，会自动生成快照和节点。");
    }

    private static string Truncate(string? s, int len)
        => string.IsNullOrEmpty(s) ? "" : (s.Length <= len ? s : s[..len] + "…");

    private RecordListViewModel ToListVm(EquipmentBorrowRecord r) => new()
    {
        Id = r.Id,
        RecordNo = r.RecordNo,
        Title = r.Title,
        Status = r.Status,
        StatusText = EnumDisplay.GetStatusText(r.Status),
        StatusBadgeClass = EnumDisplay.GetStatusBadgeClass(r.Status),
        SampleCategory = r.SampleCategory,
        SampleCategoryText = EnumDisplay.GetCategoryText(r.SampleCategory),
        CategoryText = EnumDisplay.GetCategoryText(r.SampleCategory),
        CategoryBadgeClass = EnumDisplay.GetCategoryBadgeClass(r.SampleCategory),
        BorrowerName = r.BorrowerName,
        BorrowerDept = r.BorrowerDept,
        EquipmentName = r.EquipmentName,
        MeetingRoom = r.MeetingRoom,
        CreatedAt = r.CreatedAt,
        HasDamage = r.HasDamage,
        CompensationAmount = r.CompensationAmount,
        ActualCompensation = r.ActualCompensation,
        HasBlocking = !string.IsNullOrEmpty(r.BlockingReason),
        BlockingReason = r.BlockingReason,
        Conclusion = r.Conclusion,
        CurrentResponsibleName = r.CurrentResponsibleName,
        LastUpdatedAt = r.LastUpdatedAt,
        IsArchived = r.IsArchived,
        Summary = BuildSummary(r)
    };

    private static string BuildSummary(EquipmentBorrowRecord r)
    {
        var parts = new List<string> { $"设备：{r.EquipmentName}" };
        if (r.HasDamage) parts.Add($"损坏：{r.DamageDescription}");
        if (r.CompensationAmount.HasValue) parts.Add($"应赔：￥{r.CompensationAmount.Value:F2}");
        if (r.ActualCompensation.HasValue) parts.Add($"实赔：￥{r.ActualCompensation.Value:F2}");
        if (!string.IsNullOrEmpty(r.BlockingReason)) parts.Add($"阻断：{r.BlockingReason}");
        if (!string.IsNullOrEmpty(r.Conclusion)) parts.Add($"结论：{r.Conclusion}");
        return string.Join(" | ", parts);
    }
}
