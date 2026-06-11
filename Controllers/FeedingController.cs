using Microsoft.AspNetCore.Mvc;
using OceanFarm.Services;
using OceanFarm.ViewModels;

namespace OceanFarm.Controllers;

public class FeedingController : Controller
{
    private readonly IFeedingService _feedingService;

    public FeedingController(IFeedingService feedingService)
    {
        _feedingService = feedingService;
    }

    [HttpGet]
    public async Task<IActionResult> Submit(int cageId)
    {
        var model = await _feedingService.GetSubmitViewModelAsync(cageId);
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Submit(SubmitFeedingViewModel model)
    {
        if (!ModelState.IsValid)
        {
            var refresh = await _feedingService.GetSubmitViewModelAsync(model.CageId);
            model.Operators = refresh.Operators;
            model.CageCode = refresh.CageCode;
            model.HasUnresolvedOxygenAnomaly = refresh.HasUnresolvedOxygenAnomaly;
            model.AnomalyWarning = refresh.AnomalyWarning;
            return View(model);
        }

        var (success, message) = await _feedingService.SubmitFeedingAsync(model);
        if (success)
        {
            return RedirectToAction("Details", "Cage", new { id = model.CageId });
        }

        ModelState.AddModelError("", message);
        var refresh2 = await _feedingService.GetSubmitViewModelAsync(model.CageId);
        model.Operators = refresh2.Operators;
        model.CageCode = refresh2.CageCode;
        model.HasUnresolvedOxygenAnomaly = refresh2.HasUnresolvedOxygenAnomaly;
        model.AnomalyWarning = refresh2.AnomalyWarning;
        return View(model);
    }
}
