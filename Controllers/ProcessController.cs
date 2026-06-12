using MeetingRoomEquipment.Data;
using MeetingRoomEquipment.Models;
using MeetingRoomEquipment.Services;
using MeetingRoomEquipment.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomEquipment.Controllers;

public class ProcessController : Controller
{
    private readonly IRecordService _svc;
    private readonly ICurrentUserService _user;
    private readonly ApplicationDbContext _ctx;

    public ProcessController(IRecordService svc, ICurrentUserService user, ApplicationDbContext ctx)
    {
        _svc = svc;
        _user = user;
        _ctx = ctx;
    }

    [HttpGet]
    public async Task<IActionResult> Index(int id)
    {
        var vm = await _svc.GetProcessAsync(id);
        if (vm == null) return NotFound();
        ViewData["CurrentUser"] = _user.UserName;
        ViewData["CurrentRole"] = _user.Role;
        ViewData["Reviewers"] = await _ctx.Users.Where(u => u.Role == UserRole.Reviewer).ToListAsync();
        return View(vm);
    }

    [HttpPost]
    public async Task<IActionResult> Supplement(int id, string fieldDescription, string remark, decimal? compensationAmount, DateTime? actualReturnDate)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();

        var diffs = new Dictionary<string, (string Before, string After, string Reason)>();
        if (compensationAmount.HasValue && compensationAmount != r.CompensationAmount)
        {
            diffs["CompensationAmount"] = (r.CompensationAmount?.ToString() ?? "", compensationAmount.Value.ToString("F2"), "赔偿金额更新");
            r.CompensationAmount = compensationAmount;
            await _ctx.SaveChangesAsync();
        }
        if (actualReturnDate.HasValue && actualReturnDate != r.ActualReturnDate)
        {
            diffs["ActualReturnDate"] = (r.ActualReturnDate?.ToString("yyyy-MM-dd") ?? "", actualReturnDate.Value.ToString("yyyy-MM-dd"), "实际归还时间更新");
            r.ActualReturnDate = actualReturnDate;
            await _ctx.SaveChangesAsync();
        }

        await _svc.SupplementAsync(id, fieldDescription, remark, diffs);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Submit(int id, string remark)
    {
        await _svc.SubmitForReviewAsync(id, remark);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Approve(int id, string remark, string? conclusion, string? basis, decimal? actualCompensation)
    {
        await _svc.ReviewAsync(id, ActionType.Approve, remark, conclusion, basis, actualCompensation);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Return(int id, string remark, string blockingReason, string remedyPath, string? conclusion, string? basis)
    {
        var ok = await _svc.ReturnForSupplementAsync(id, remark, blockingReason, remedyPath);
        if (!ok)
        {
            await _svc.ReviewAsync(id, ActionType.Return, remark, conclusion, basis);
        }
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Archive(int id, string remark)
    {
        await _svc.ArchiveAsync(id, remark);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Reopen(int id, string remark)
    {
        await _svc.ReopenAsync(id, remark);
        return RedirectToAction("Detail", "Records", new { id });
    }
}
