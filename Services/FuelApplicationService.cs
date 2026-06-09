using FuelManagementSystem.Data;
using FuelManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.Services;

public class FuelApplicationService : IFuelApplicationService
{
    private readonly AppDbContext _context;

    public FuelApplicationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FuelApplication>> GetAllAsync(ApplicationStatus? status = null)
    {
        var query = _context.FuelApplications
            .Include(a => a.Ship)
            .Include(a => a.Supplier)
            .Include(a => a.AuditLogs)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<FuelApplication?> GetByIdAsync(int id)
    {
        return await _context.FuelApplications
            .Include(a => a.Ship)
            .Include(a => a.Supplier)
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<FuelApplication> CreateAsync(FuelApplication application, string applicantName)
    {
        application.ApplicationNumber = GenerateApplicationNumber();
        application.Status = ApplicationStatus.PendingApproval;
        application.ApplicantName = applicantName;
        application.ApplicationDate = DateTime.UtcNow;
        application.CreatedAt = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;
        application.IsSampleSealed = false;

        var auditLog = new AuditLog
        {
            FromStatus = ApplicationStatus.PendingApproval,
            ToStatus = ApplicationStatus.PendingApproval,
            OperatorName = applicantName,
            OperatorRole = "船务经办人",
            Remarks = "提交燃油加注申请",
            CreatedAt = DateTime.UtcNow
        };
        application.AuditLogs.Add(auditLog);

        _context.FuelApplications.Add(application);
        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<FuelApplication?> ApproveAsync(int id, string approverName)
    {
        var application = await _context.FuelApplications
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null || application.Status != ApplicationStatus.PendingApproval)
            return null;

        var oldStatus = application.Status;
        application.Status = ApplicationStatus.Approved;
        application.UpdatedAt = DateTime.UtcNow;

        application.AuditLogs.Add(new AuditLog
        {
            FuelApplicationId = id,
            FromStatus = oldStatus,
            ToStatus = ApplicationStatus.Approved,
            OperatorName = approverName,
            OperatorRole = "审批主管",
            Remarks = "申请审批通过",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<FuelApplication?> RejectAsync(int id, string approverName, string reason)
    {
        var application = await _context.FuelApplications
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null || application.Status != ApplicationStatus.PendingApproval)
            return null;

        var oldStatus = application.Status;
        application.Status = ApplicationStatus.Rejected;
        application.Remarks = reason;
        application.UpdatedAt = DateTime.UtcNow;

        application.AuditLogs.Add(new AuditLog
        {
            FuelApplicationId = id,
            FromStatus = oldStatus,
            ToStatus = ApplicationStatus.Rejected,
            OperatorName = approverName,
            OperatorRole = "审批主管",
            Remarks = $"申请被拒绝：{reason}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<FuelApplication?> StartBunkeringAsync(int id, string operatorName)
    {
        var application = await _context.FuelApplications
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null || application.Status != ApplicationStatus.Approved)
            return null;

        var oldStatus = application.Status;
        application.Status = ApplicationStatus.BunkeringInProgress;
        application.ActualBunkeringDate = DateTime.UtcNow;
        application.BunkeringOperator = operatorName;
        application.UpdatedAt = DateTime.UtcNow;

        application.AuditLogs.Add(new AuditLog
        {
            FuelApplicationId = id,
            FromStatus = oldStatus,
            ToStatus = ApplicationStatus.BunkeringInProgress,
            OperatorName = operatorName,
            OperatorRole = "港口供应商",
            Remarks = "开始加注作业",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<FuelApplication?> CompleteBunkeringAsync(int id, string operatorName, double actualQuantity, DiscrepancyReason discrepancyReason, string? remarks)
    {
        var application = await _context.FuelApplications
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null || application.Status != ApplicationStatus.BunkeringInProgress)
            return null;

        var oldStatus = application.Status;
        application.Status = ApplicationStatus.SamplePending;
        application.ActualQuantity = actualQuantity;
        application.DiscrepancyReason = discrepancyReason;
        application.BunkeringCompleteTime = DateTime.UtcNow;
        application.BunkeringOperator = operatorName;
        application.TotalAmount = (decimal)actualQuantity * application.UnitPrice;
        application.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(remarks))
        {
            application.Remarks = remarks;
        }

        application.AuditLogs.Add(new AuditLog
        {
            FuelApplicationId = id,
            FromStatus = oldStatus,
            ToStatus = ApplicationStatus.SamplePending,
            OperatorName = operatorName,
            OperatorRole = "港口供应商",
            Remarks = $"加注完成，实加量：{actualQuantity}吨",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<FuelApplication?> ConfirmSampleAsync(int id, string chiefEngineerName, string sampleNumber)
    {
        var application = await _context.FuelApplications
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null || application.Status != ApplicationStatus.SamplePending)
            return null;

        var oldStatus = application.Status;
        application.Status = ApplicationStatus.SettlementPending;
        application.IsSampleSealed = true;
        application.SampleNumber = sampleNumber;
        application.ChiefEngineerName = chiefEngineerName;
        application.SampleConfirmTime = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;

        application.AuditLogs.Add(new AuditLog
        {
            FuelApplicationId = id,
            FromStatus = oldStatus,
            ToStatus = ApplicationStatus.SettlementPending,
            OperatorName = chiefEngineerName,
            OperatorRole = "轮机长",
            Remarks = $"油样已确认封存，油样编号：{sampleNumber}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<bool> CanSettleAsync(int id)
    {
        var application = await _context.FuelApplications.FindAsync(id);
        if (application == null)
            return false;

        return application.Status == ApplicationStatus.SettlementPending && application.IsSampleSealed;
    }

    public async Task<FuelApplication?> SettleAsync(int id, string financeVerifierName)
    {
        var application = await _context.FuelApplications
            .Include(a => a.AuditLogs)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (application == null || application.Status != ApplicationStatus.SettlementPending || !application.IsSampleSealed)
            return null;

        var oldStatus = application.Status;
        application.Status = ApplicationStatus.Settled;
        application.FinanceVerifierName = financeVerifierName;
        application.SettlementTime = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;

        application.AuditLogs.Add(new AuditLog
        {
            FuelApplicationId = id,
            FromStatus = oldStatus,
            ToStatus = ApplicationStatus.Settled,
            OperatorName = financeVerifierName,
            OperatorRole = "财务",
            Remarks = $"财务结算完成，总金额：{application.TotalAmount:C}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return application;
    }

    private string GenerateApplicationNumber()
    {
        var datePart = DateTime.UtcNow.ToString("yyyyMM");
        var prefix = $"FA-{datePart}-";

        var maxNumber = _context.FuelApplications
            .Where(a => a.ApplicationNumber.StartsWith(prefix))
            .Select(a => a.ApplicationNumber)
            .AsEnumerable()
            .Select(n =>
            {
                var parts = n.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out var num))
                    return num;
                return 0;
            })
            .DefaultIfEmpty(0)
            .Max();

        return $"{prefix}{(maxNumber + 1).ToString("D4")}";
    }
}
