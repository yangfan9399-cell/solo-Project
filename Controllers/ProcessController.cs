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
    private readonly IPermissionService _perm;
    private readonly IWebHostEnvironment _env;

    public ProcessController(IRecordService svc, ICurrentUserService user, ApplicationDbContext ctx, IPermissionService perm, IWebHostEnvironment env)
    {
        _svc = svc;
        _user = user;
        _ctx = ctx;
        _perm = perm;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> Index(int id)
    {
        var vm = await _svc.GetProcessAsync(id);
        if (vm == null) return NotFound();
        ViewData["Reviewers"] = await _ctx.Users.Where(u => u.Role == UserRole.Reviewer).ToListAsync();
        return View(vm);
    }

    [HttpPost]
    public async Task<IActionResult> Supplement(int id, string fieldDescription, string remark)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (r.IsArchived)
        {
            ModelState.AddModelError("", "归档记录只读，无法修改。");
            return RedirectToAction("Detail", "Records", new { id });
        }
        if (!_perm.CanFieldEdit(r))
        {
            ModelState.AddModelError("", "当前角色无权限补充此记录。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        await _svc.SupplementAsync(id, fieldDescription, remark);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> UploadEvidence(int id, IFormFile? evidenceFile, EvidenceType evidenceType, string description)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (r.IsArchived)
        {
            ModelState.AddModelError("", "归档记录只读，无法上传证据。");
            return RedirectToAction("Detail", "Records", new { id });
        }
        if (!_perm.CanFieldEdit(r))
        {
            ModelState.AddModelError("", "当前角色无权限上传证据。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        if (evidenceFile == null || evidenceFile.Length == 0)
        {
            ModelState.AddModelError("", "请选择要上传的证据文件。");
            return RedirectToAction("Index", "Process", new { id });
        }

        var uploadDir = Path.Combine(_env.WebRootPath ?? Directory.GetCurrentDirectory(), "uploads", "evidences");
        Directory.CreateDirectory(uploadDir);

        var safeName = $"{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}_{Path.GetFileName(evidenceFile.FileName)}";
        var fullPath = Path.Combine(uploadDir, safeName);
        using (var fs = new FileStream(fullPath, FileMode.Create))
        {
            await evidenceFile.CopyToAsync(fs);
        }

        var fileUrl = $"/uploads/evidences/{safeName}";
        await _svc.AddEvidenceAsync(id, evidenceType, evidenceFile.FileName, fileUrl, description);

        return RedirectToAction("Index", "Process", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Submit(int id, string remark)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (r.IsArchived)
        {
            ModelState.AddModelError("", "归档记录只读。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        await _svc.SubmitForReviewAsync(id, remark);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Approve(int id, string remark, string? conclusion, string? basis,
        decimal? actualCompensation, decimal? compensationAmount, DateTime? actualReturnDate)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (r.IsArchived)
        {
            ModelState.AddModelError("", "归档记录只读。");
            return RedirectToAction("Detail", "Records", new { id });
        }
        if (!_perm.CanReview(r))
        {
            ModelState.AddModelError("", "当前角色无复核权限。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        await _svc.ReviewAsync(id, ActionType.Approve, remark,
            conclusion: conclusion,
            basis: basis,
            actualCompensation: actualCompensation,
            actualReturnDate: actualReturnDate,
            compensationAmount: compensationAmount);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Return(int id, string remark, string blockingReason, string remedyPath,
        string? conclusion, string? basis)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (r.IsArchived)
        {
            ModelState.AddModelError("", "归档记录只读。");
            return RedirectToAction("Detail", "Records", new { id });
        }
        if (!_perm.CanReview(r))
        {
            ModelState.AddModelError("", "当前角色无退回权限。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        if (!string.IsNullOrEmpty(conclusion) || !string.IsNullOrEmpty(basis))
        {
            await _svc.ReviewAsync(id, ActionType.Return, remark,
                conclusion: conclusion, basis: basis);
        }

        await _svc.ReturnForSupplementAsync(id, remark, blockingReason, remedyPath);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Archive(int id, string remark, string? conclusion, string? basis,
        decimal? actualCompensation, decimal? compensationAmount, DateTime? actualReturnDate)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (r.IsArchived)
        {
            ModelState.AddModelError("", "记录已归档。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        if (_perm.CanReview(r))
        {
            await _svc.ReviewAsync(id, ActionType.Approve, remark,
                conclusion: conclusion,
                basis: basis,
                actualCompensation: actualCompensation,
                actualReturnDate: actualReturnDate,
                compensationAmount: compensationAmount);
        }

        if (!_perm.CanArchive(r))
        {
            r = await _svc.GetByIdAsync(id);
            if (r == null || !_perm.CanArchive(r))
            {
                ModelState.AddModelError("", "当前无归档权限（需复核通过状态 + 复核人/管理员身份）。");
                return RedirectToAction("Detail", "Records", new { id });
            }
        }

        await _svc.ArchiveAsync(id, remark);
        return RedirectToAction("Detail", "Records", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Reopen(int id, string remark)
    {
        var r = await _svc.GetByIdAsync(id);
        if (r == null) return NotFound();
        if (!r.IsArchived)
        {
            ModelState.AddModelError("", "仅归档记录可重新处理。");
            return RedirectToAction("Detail", "Records", new { id });
        }
        if (!_perm.CanReopen(r))
        {
            ModelState.AddModelError("", "当前角色无重新处理权限（需复核人/管理员）。");
            return RedirectToAction("Detail", "Records", new { id });
        }

        await _svc.ReopenAsync(id, remark);
        return RedirectToAction("Index", "Process", new { id });
    }
}
