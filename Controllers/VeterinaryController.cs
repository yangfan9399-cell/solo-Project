using Microsoft.AspNetCore.Mvc;
using OceanFarm.Services;
using OceanFarm.ViewModels;

namespace OceanFarm.Controllers;

public class VeterinaryController : Controller
{
    private readonly IVeterinaryService _veterinaryService;

    public VeterinaryController(IVeterinaryService veterinaryService)
    {
        _veterinaryService = veterinaryService;
    }

    public async Task<IActionResult> Index()
    {
        var pending = await _veterinaryService.GetPendingReviewsAsync();
        return View(pending);
    }

    [HttpGet]
    public async Task<IActionResult> Review(int id)
    {
        var model = await _veterinaryService.GetReviewViewModelAsync(id);
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Review(VeterinaryReviewViewModel model)
    {
        if (!ModelState.IsValid)
        {
            var refresh = await _veterinaryService.GetReviewViewModelAsync(model.DiseaseReportId);
            model.Veterinarians = refresh.Veterinarians;
            model.CageCode = refresh.CageCode;
            return View(model);
        }

        var result = await _veterinaryService.ReviewDiseaseAsync(model);
        if (result)
        {
            return RedirectToAction("Details", "Cage", new { id = model.CageId });
        }

        ModelState.AddModelError("", "复核失败");
        return View(model);
    }
}
