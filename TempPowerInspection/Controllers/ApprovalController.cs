using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Data;
using TempPowerInspection.Models;
using TempPowerInspection.Services;

namespace TempPowerInspection.Controllers;

public class ApprovalController : Controller
{
    private readonly IApprovalService _approvalService;
    private readonly IHiddenDangerService _hiddenDangerService;
    private readonly ApplicationDbContext _context;

    public ApprovalController(
        IApprovalService approvalService,
        IHiddenDangerService hiddenDangerService,
        ApplicationDbContext context)
    {
        _approvalService = approvalService;
        _hiddenDangerService = hiddenDangerService;
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var approvals = await _approvalService.GetAllAsync();
        return View(approvals);
    }

    public async Task<IActionResult> Details(int id)
    {
        var approval = await _approvalService.GetByIdAsync(id);
        if (approval == null)
        {
            return NotFound();
        }
        return View(approval);
    }

    // GET: Approval/Create - 为待复检隐患创建审批记录
    public async Task<IActionResult> Create(int hiddenDangerId)
    {
        var danger = await _hiddenDangerService.GetByIdAsync(hiddenDangerId);
        if (danger == null)
        {
            return NotFound();
        }

        // 检查是否已有审批记录
        var existingApproval = await _approvalService.GetByHiddenDangerIdAsync(hiddenDangerId);
        if (existingApproval != null)
        {
            // 已有审批记录，跳转到审批页面
            return RedirectToAction(nameof(Approve), new { id = existingApproval.Id });
        }

        ViewBag.HiddenDanger = danger;
        return View();
    }

    // POST: Approval/Create - 创建审批记录并审批通过
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("HiddenDangerId,ApprovedBy,Comment")] PowerApproval approval)
    {
        if (ModelState.IsValid)
        {
            approval.ApprovalResult = ApprovalResult.通过;
            approval.ApprovedAt = DateTime.Now;
            approval.CanPowerOn = true;

            await _approvalService.CreateAsync(approval);

            var danger = await _hiddenDangerService.GetByIdAsync(approval.HiddenDangerId);
            if (danger != null)
            {
                danger.Status = DangerStatus.已通过;
                await _hiddenDangerService.UpdateAsync(danger);

                // Add status history
                _context.StatusHistories.Add(new StatusHistory
                {
                    HiddenDangerId = danger.Id,
                    Status = DangerStatus.已通过,
                    Operator = approval.ApprovedBy ?? "项目经理",
                    Remark = "复检通过",
                    OperatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }

            return RedirectToAction("Details", "HiddenDanger", new { id = approval.HiddenDangerId });
        }

        var danger = await _hiddenDangerService.GetByIdAsync(approval.HiddenDangerId);
        ViewBag.HiddenDanger = danger;
        return View(approval);
    }

    // POST: Approval/CreateAndReject - 创建审批记录并退回
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateAndReject([Bind("HiddenDangerId,ApprovedBy,Comment")] PowerApproval approval)
    {
        if (ModelState.IsValid)
        {
            approval.ApprovalResult = ApprovalResult.退回;
            approval.ApprovedAt = DateTime.Now;
            approval.CanPowerOn = false; // 复检不通过，禁止送电

            await _approvalService.CreateAsync(approval);

            var danger = await _hiddenDangerService.GetByIdAsync(approval.HiddenDangerId);
            if (danger != null)
            {
                danger.Status = DangerStatus.退回;
                await _hiddenDangerService.UpdateAsync(danger);

                // Add status history
                _context.StatusHistories.Add(new StatusHistory
                {
                    HiddenDangerId = danger.Id,
                    Status = DangerStatus.退回,
                    Operator = approval.ApprovedBy ?? "项目经理",
                    Remark = $"复检不通过，退回重新整改: {approval.Comment}",
                    OperatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }

            return RedirectToAction("Details", "HiddenDanger", new { id = approval.HiddenDangerId });
        }

        var dangerForReject = await _hiddenDangerService.GetByIdAsync(approval.HiddenDangerId);
        ViewBag.HiddenDanger = dangerForReject;
        return View("Create", approval);
    }

    public async Task<IActionResult> Approve(int id)
    {
        var approval = await _approvalService.GetByIdAsync(id);
        if (approval == null)
        {
            return NotFound();
        }
        return View(approval);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Approve(int id, [Bind("Comment")] PowerApproval approval)
    {
        var existingApproval = await _approvalService.GetByIdAsync(id);
        if (existingApproval == null) return NotFound();

        existingApproval.ApprovalResult = ApprovalResult.通过;
        existingApproval.Comment = approval.Comment;
        existingApproval.ApprovedAt = DateTime.Now;
        existingApproval.CanPowerOn = true;

        await _approvalService.UpdateAsync(existingApproval);

        var danger = await _hiddenDangerService.GetByIdAsync(existingApproval.HiddenDangerId);
        if (danger != null)
        {
            danger.Status = DangerStatus.已通过;
            await _hiddenDangerService.UpdateAsync(danger);

            // Add status history
            _context.StatusHistories.Add(new StatusHistory
            {
                HiddenDangerId = danger.Id,
                Status = DangerStatus.已通过,
                Operator = existingApproval.ApprovedBy ?? "项目经理",
                Remark = "复检通过",
                OperatedAt = DateTime.Now
            });
            await _context.SaveChangesAsync();
        }

        return RedirectToAction("Details", "HiddenDanger", new { id = existingApproval.HiddenDangerId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reject(int id, [Bind("Comment")] PowerApproval approval)
    {
        var existingApproval = await _approvalService.GetByIdAsync(id);
        if (existingApproval == null) return NotFound();

        existingApproval.ApprovalResult = ApprovalResult.退回;
        existingApproval.Comment = approval.Comment;
        existingApproval.ApprovedAt = DateTime.Now;
        existingApproval.CanPowerOn = false; // 复检不通过，禁止送电

        await _approvalService.UpdateAsync(existingApproval);

        var danger = await _hiddenDangerService.GetByIdAsync(existingApproval.HiddenDangerId);
        if (danger != null)
        {
            danger.Status = DangerStatus.退回;
            await _hiddenDangerService.UpdateAsync(danger);

            // Add status history
            _context.StatusHistories.Add(new StatusHistory
            {
                HiddenDangerId = danger.Id,
                Status = DangerStatus.退回,
                Operator = existingApproval.ApprovedBy ?? "项目经理",
                Remark = $"复检不通过，退回重新整改: {approval.Comment}",
                OperatedAt = DateTime.Now
            });
            await _context.SaveChangesAsync();
        }

        return RedirectToAction("Details", "HiddenDanger", new { id = existingApproval.HiddenDangerId });
    }

    [HttpPost]
    public async Task<IActionResult> PowerOn(int hiddenDangerId)
    {
        var danger = await _hiddenDangerService.GetByIdAsync(hiddenDangerId);
        if (danger == null) return NotFound();

        // 复检不通过时禁止送电
        if (danger.Status == DangerStatus.退回)
        {
            return BadRequest("复检不通过，禁止送电");
        }

        var canPowerOn = await _approvalService.CanPowerOnAsync(hiddenDangerId);
        if (!canPowerOn)
        {
            return BadRequest("未通过审批，禁止送电");
        }

        danger.Status = DangerStatus.已送电;
        await _hiddenDangerService.UpdateAsync(danger);

        // Add status history
        _context.StatusHistories.Add(new StatusHistory
        {
            HiddenDangerId = danger.Id,
            Status = DangerStatus.已送电,
            Operator = "项目经理",
            Remark = "同意送电",
            OperatedAt = DateTime.Now
        });
        await _context.SaveChangesAsync();

        return RedirectToAction("Details", "HiddenDanger", new { id = hiddenDangerId });
    }
}
