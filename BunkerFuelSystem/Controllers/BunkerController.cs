using BunkerFuelSystem.Data;
using BunkerFuelSystem.Models;
using BunkerFuelSystem.Services;
using Microsoft.AspNetCore.Mvc;

namespace BunkerFuelSystem.Controllers;

public class BunkerController : Controller
{
    private readonly IBunkerService _bunkerService;
    private readonly AppDbContext _dbContext;

    public BunkerController(IBunkerService bunkerService, AppDbContext dbContext)
    {
        _bunkerService = bunkerService;
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Index(string? status, string? category, string? keyword)
    {
        var viewModel = await _bunkerService.GetListAsync(status, category, keyword);
        return View(viewModel);
    }

    [HttpGet("Bunker/Details/{id}")]
    public async Task<IActionResult> Details(int id)
    {
        var viewModel = await _bunkerService.GetDetailAsync(id);
        if (viewModel == null)
        {
            return NotFound();
        }
        return View(viewModel);
    }

    [HttpGet("Bunker/Process/{id}")]
    public async Task<IActionResult> Process(int id, string role = "OnSitePersonnel")
    {
        if (!Enum.TryParse<UserRole>(role, out var userRole))
        {
            userRole = UserRole.OnSitePersonnel;
        }

        var viewModel = await _bunkerService.GetProcessDeskAsync(id, userRole);
        if (viewModel == null)
        {
            return NotFound();
        }
        return View(viewModel);
    }

    [HttpPost("Bunker/ProcessAction")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ProcessAction(
        int id,
        string currentRole,
        string action,
        string? businessRecord,
        string? siteDescription,
        string? comment,
        string? conclusion,
        string operatorName = "当前操作员")
    {
        if (!Enum.TryParse<UserRole>(currentRole, out var userRole))
        {
            TempData["Error"] = "无效的角色参数";
            return RedirectToAction(nameof(Details), new { id });
        }

        var result = await _bunkerService.ProcessActionAsync(
            id, userRole, action, businessRecord, siteDescription, comment, conclusion, operatorName);

        if (result)
        {
            TempData["Success"] = "操作成功";
            return RedirectToAction(nameof(Details), new { id });
        }

        TempData["Error"] = "操作失败，请重试";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost("Bunker/UploadEvidence")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UploadEvidence(
        int id,
        IFormFile file,
        string? description,
        string uploadedBy)
    {
        if (file == null || file.Length == 0)
        {
            TempData["Error"] = "请选择要上传的文件";
            return RedirectToAction(nameof(Process), new { id });
        }

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var extension = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
        var fileType = extension switch
        {
            "pdf" => "application/pdf",
            "jpg" or "jpeg" => "image/jpeg",
            "png" => "image/png",
            "doc" or "docx" => "application/msword",
            _ => "application/octet-stream"
        };

        var attachment = new EvidenceAttachment
        {
            BunkerApplicationId = id,
            FileName = file.FileName,
            FilePath = $"/uploads/{fileName}",
            FileType = fileType,
            Description = description,
            UploadedBy = uploadedBy,
            UploadedAt = DateTime.Now
        };

        _dbContext.EvidenceAttachments.Add(attachment);
        await _dbContext.SaveChangesAsync();

        await _bunkerService.ProcessActionAsync(
            id, UserRole.OnSitePersonnel, "上传证据附件", null, null, null, null, uploadedBy);

        TempData["Success"] = "证据附件上传成功";
        return RedirectToAction(nameof(Process), new { id });
    }
}
