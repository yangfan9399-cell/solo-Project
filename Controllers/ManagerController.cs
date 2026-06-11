using Microsoft.AspNetCore.Mvc;
using OceanFarm.Services;
using OceanFarm.ViewModels;

namespace OceanFarm.Controllers;

public class ManagerController : Controller
{
    private readonly IManagerService _managerService;

    public ManagerController(IManagerService managerService)
    {
        _managerService = managerService;
    }

    public async Task<IActionResult> Index()
    {
        var pending = await _managerService.GetPendingDisposalsAsync();
        return View(pending);
    }

    [HttpGet]
    public async Task<IActionResult> Disposal(int cageId)
    {
        var model = await _managerService.GetDisposalViewModelAsync(cageId);
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Disposal(ManagerDisposalViewModel model)
    {
        if (!ModelState.IsValid)
        {
            var refresh = await _managerService.GetDisposalViewModelAsync(model.CageId);
            model.Managers = refresh.Managers;
            model.CageCode = refresh.CageCode;
            model.CurrentAnomaly = refresh.CurrentAnomaly;
            model.CurrentStatus = refresh.CurrentStatus;
            model.AnomalyNote = refresh.AnomalyNote;
            model.PendingDiseaseReports = refresh.PendingDiseaseReports;
            return View(model);
        }

        var result = await _managerService.ProcessDisposalAsync(model);
        if (result)
        {
            return RedirectToAction("Details", "Cage", new { id = model.CageId });
        }

        ModelState.AddModelError("", "处置失败");
        return View(model);
    }
}
