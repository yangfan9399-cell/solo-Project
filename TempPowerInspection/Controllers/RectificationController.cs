using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TempPowerInspection.Data;
using TempPowerInspection.Models;
using TempPowerInspection.Services;

namespace TempPowerInspection.Controllers;

public class RectificationController : Controller
{
    private readonly IRectificationService _rectificationService;
    private readonly IHiddenDangerService _hiddenDangerService;
    private readonly ApplicationDbContext _context;

    public RectificationController(
        IRectificationService rectificationService,
        IHiddenDangerService hiddenDangerService,
        ApplicationDbContext context)
    {
        _rectificationService = rectificationService;
        _hiddenDangerService = hiddenDangerService;
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var rectifications = await _rectificationService.GetAllAsync();
        return View(rectifications);
    }

    public async Task<IActionResult> Details(int id)
    {
        var rectification = await _rectificationService.GetByIdAsync(id);
        if (rectification == null)
        {
            return NotFound();
        }
        return View(rectification);
    }

    public async Task<IActionResult> Create(int? hiddenDangerId)
    {
        if (hiddenDangerId.HasValue)
        {
            var danger = await _hiddenDangerService.GetByIdAsync(hiddenDangerId.Value);
            if (danger == null) return NotFound();

            ViewBag.HiddenDanger = danger;
        }

        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("HiddenDangerId,Requirement,RectificationPhotos,Feedback,CreatedBy")] Rectification rectification)
    {
        if (ModelState.IsValid)
        {
            rectification.Status = RectificationStatus.待整改;
            await _rectificationService.CreateAsync(rectification);

            var danger = await _hiddenDangerService.GetByIdAsync(rectification.HiddenDangerId);
            if (danger != null)
            {
                danger.Status = DangerStatus.整改中;
                await _hiddenDangerService.UpdateAsync(danger);
            }

            return RedirectToAction(nameof(Details), new { id = rectification.Id });
        }

        return View(rectification);
    }

    public async Task<IActionResult> Edit(int id)
    {
        var rectification = await _rectificationService.GetByIdAsync(id);
        if (rectification == null)
        {
            return NotFound();
        }
        return View(rectification);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,HiddenDangerId,Requirement,RectificationPhotos,Feedback,Status,CreatedBy")] Rectification rectification)
    {
        if (id != rectification.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            await _rectificationService.UpdateAsync(rectification);
            return RedirectToAction(nameof(Index));
        }
        return View(rectification);
    }

    [HttpPost]
    public async Task<IActionResult> SubmitRectification(int id, [Bind("Feedback,RectificationPhotos")] Rectification rectification)
    {
        var existingRect = await _rectificationService.GetByIdAsync(id);
        if (existingRect == null) return NotFound();

        existingRect.Feedback = rectification.Feedback;
        existingRect.RectificationPhotos = rectification.RectificationPhotos;
        existingRect.CompletedAt = DateTime.Now;
        existingRect.Status = RectificationStatus.待复检;

        await _rectificationService.UpdateAsync(existingRect);

        var danger = await _hiddenDangerService.GetByIdAsync(existingRect.HiddenDangerId);
        if (danger != null)
        {
            danger.Status = DangerStatus.待复检;
            await _hiddenDangerService.UpdateAsync(danger);
        }

        // Add status history
        _context.StatusHistories.Add(new StatusHistory
        {
            HiddenDangerId = existingRect.HiddenDangerId,
            Status = DangerStatus.待复检,
            Operator = "施工班组",
            Remark = "整改完成，申请复检",
            OperatedAt = DateTime.Now
        });
        await _context.SaveChangesAsync();

        return RedirectToAction("Details", "HiddenDanger", new { id = existingRect.HiddenDangerId });
    }
}
