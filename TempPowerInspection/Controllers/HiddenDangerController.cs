using Microsoft.AspNetCore.Mvc;
using TempPowerInspection.Models;
using TempPowerInspection.Services;

namespace TempPowerInspection.Controllers;

public class HiddenDangerController : Controller
{
    private readonly IHiddenDangerService _hiddenDangerService;
    private readonly IRectificationService _rectificationService;

    public HiddenDangerController(
        IHiddenDangerService hiddenDangerService,
        IRectificationService rectificationService)
    {
        _hiddenDangerService = hiddenDangerService;
        _rectificationService = rectificationService;
    }

    public async Task<IActionResult> Index(string? status, string? building, string? team)
    {
        var dangers = await _hiddenDangerService.GetAllAsync();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<DangerStatus>(status, out var statusEnum))
        {
            dangers = dangers.Where(d => d.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(building))
        {
            dangers = dangers.Where(d => d.BuildingName == building);
        }

        if (!string.IsNullOrEmpty(team))
        {
            dangers = dangers.Where(d => d.TeamName == team);
        }

        return View(dangers);
    }

    public async Task<IActionResult> Details(int id)
    {
        var danger = await _hiddenDangerService.GetByIdAsync(id);
        if (danger == null)
        {
            return NotFound();
        }
        return View(danger);
    }

    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("DistributionBoxName,BuildingName,TeamName,DangerLevel,DangerType,Description,InspectionPhotos,CreatedBy")] HiddenDanger danger)
    {
        if (ModelState.IsValid)
        {
            danger.Status = DangerStatus.待整改;
            await _hiddenDangerService.CreateAsync(danger);
            return RedirectToAction(nameof(Index));
        }
        return View(danger);
    }

    public async Task<IActionResult> Edit(int id)
    {
        var danger = await _hiddenDangerService.GetByIdAsync(id);
        if (danger == null)
        {
            return NotFound();
        }
        return View(danger);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, [Bind("Id,DistributionBoxName,BuildingName,TeamName,DangerLevel,DangerType,Description,InspectionPhotos,Status,CreatedBy")] HiddenDanger danger)
    {
        if (id != danger.Id)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            await _hiddenDangerService.UpdateAsync(danger);
            return RedirectToAction(nameof(Index));
        }
        return View(danger);
    }

    public async Task<IActionResult> Delete(int id)
    {
        var danger = await _hiddenDangerService.GetByIdAsync(id);
        if (danger == null)
        {
            return NotFound();
        }
        return View(danger);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        await _hiddenDangerService.DeleteAsync(id);
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> SubmitForRectification(int id)
    {
        var danger = await _hiddenDangerService.GetByIdAsync(id);
        if (danger == null)
        {
            return NotFound();
        }

        if (danger.Status == DangerStatus.待整改)
        {
            danger.Status = DangerStatus.整改中;
            await _hiddenDangerService.UpdateAsync(danger);

            // Add status history
            using var scope = HttpContext.RequestServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<TempPowerInspection.Data.ApplicationDbContext>();
            context.StatusHistories.Add(new StatusHistory
            {
                HiddenDangerId = id,
                Status = DangerStatus.整改中,
                Operator = danger.UpdatedBy ?? "系统",
                Remark = "开始整改",
                OperatedAt = DateTime.Now
            });
            await context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Details), new { id });
    }
}
