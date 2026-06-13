using Microsoft.AspNetCore.Mvc;
using WaterQuotaSystem.Models;
using WaterQuotaSystem.Services;
using WaterQuotaSystem.ViewModels;

namespace WaterQuotaSystem.Controllers;

public class ApplicationController : Controller
{
    private readonly IWorkflowService _workflowService;

    public ApplicationController(IWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    public IActionResult Index(ApplicationStatus? statusFilter, SampleType? sampleTypeFilter, string? keyword)
    {
        var vm = _workflowService.GetApplicationList(statusFilter, sampleTypeFilter, keyword);
        return View(vm);
    }

    public IActionResult Detail(int id)
    {
        try
        {
            var vm = _workflowService.GetApplicationDetail(id);
            return View(vm);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    public IActionResult Process(int id, RoleType role = RoleType.FieldPersonnel)
    {
        try
        {
            var vm = _workflowService.GetProcessingDesk(id, role);
            ViewBag.CurrentRole = role;
            return View(vm);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Process(ProcessActionInput input)
    {
        try
        {
            _workflowService.ProcessAction(input);
            return RedirectToAction(nameof(Detail), new { id = input.ApplicationId });
        }
        catch (Exception ex)
        {
            ModelState.AddModelError("", ex.Message);
            var vm = _workflowService.GetProcessingDesk(input.ApplicationId, input.CurrentUserRole);
            return View(vm);
        }
    }

    public IActionResult Dashboard(string? drill)
    {
        var vm = _workflowService.GetDashboard(drill);
        return View(vm);
    }

    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Create(WaterQuotaApplication application)
    {
        if (!ModelState.IsValid) return View(application);

        try
        {
            _workflowService.CreateNewApplication(application);
            return RedirectToAction(nameof(Index));
        }
        catch (Exception ex)
        {
            ModelState.AddModelError("", ex.Message);
            return View(application);
        }
    }
}
