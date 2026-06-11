using Microsoft.AspNetCore.Mvc;
using OceanFarm.Services;
using OceanFarm.ViewModels;

namespace OceanFarm.Controllers;

public class PatrolController : Controller
{
    private readonly IPatrolService _patrolService;

    public PatrolController(IPatrolService patrolService)
    {
        _patrolService = patrolService;
    }

    [HttpGet]
    public async Task<IActionResult> Record(int cageId)
    {
        var model = await _patrolService.GetRecordViewModelAsync(cageId);
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Record(RecordWaterQualityViewModel model)
    {
        if (!ModelState.IsValid)
        {
            var refresh = await _patrolService.GetRecordViewModelAsync(model.CageId);
            model.Inspectors = refresh.Inspectors;
            model.CageCode = refresh.CageCode;
            return View(model);
        }

        var result = await _patrolService.RecordWaterQualityAsync(model);
        if (result)
        {
            return RedirectToAction("Details", "Cage", new { id = model.CageId });
        }

        ModelState.AddModelError("", "记录水质失败");
        return View(model);
    }
}
