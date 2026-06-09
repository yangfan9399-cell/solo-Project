using FuelManagementSystem.Data;
using FuelManagementSystem.Models;
using FuelManagementSystem.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.Controllers;

public class FuelApplicationsController : Controller
{
    private readonly IFuelApplicationService _service;
    private readonly AppDbContext _context;

    public FuelApplicationsController(IFuelApplicationService service, AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    public async Task<IActionResult> Index(ApplicationStatus? status)
    {
        var applications = await _service.GetAllAsync(status);
        ViewData["CurrentStatus"] = status;
        return View(applications);
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var application = await _service.GetByIdAsync(id.Value);
        if (application == null)
        {
            return NotFound();
        }

        var canSettle = await _service.CanSettleAsync(id.Value);
        ViewData["CanSettle"] = canSettle;

        return View(application);
    }

    public async Task<IActionResult> Create()
    {
        ViewData["ShipId"] = new SelectList(await _context.Ships.Where(s => s.IsActive).ToListAsync(), "Id", "Name");
        ViewData["SupplierId"] = new SelectList(await _context.Suppliers.Where(s => s.IsActive).ToListAsync(), "Id", "Name");
        ViewData["FuelTypes"] = new SelectList(Enum.GetValues(typeof(FuelType)).Cast<FuelType>().Select(v => new { Value = v, Text = v.ToString() }), "Value", "Text");
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([Bind("ShipId,SupplierId,FuelType,PlannedQuantity,UnitPrice,Port,PlannedBunkeringDate,Remarks")] FuelApplication application)
    {
        if (ModelState.IsValid)
        {
            var applicantName = "船务经办人";
            await _service.CreateAsync(application, applicantName);
            return RedirectToAction(nameof(Index));
        }
        ViewData["ShipId"] = new SelectList(await _context.Ships.Where(s => s.IsActive).ToListAsync(), "Id", "Name", application.ShipId);
        ViewData["SupplierId"] = new SelectList(await _context.Suppliers.Where(s => s.IsActive).ToListAsync(), "Id", "Name", application.SupplierId);
        ViewData["FuelTypes"] = new SelectList(Enum.GetValues(typeof(FuelType)).Cast<FuelType>().Select(v => new { Value = v, Text = v.ToString() }), "Value", "Text", application.FuelType);
        return View(application);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Approve(int id)
    {
        var result = await _service.ApproveAsync(id, "审批主管");
        if (result == null)
        {
            return NotFound();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reject(int id, string reason)
    {
        var result = await _service.RejectAsync(id, "审批主管", reason);
        if (result == null)
        {
            return NotFound();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    public async Task<IActionResult> StartBunkering(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var application = await _service.GetByIdAsync(id.Value);
        if (application == null || application.Status != ApplicationStatus.Approved)
        {
            return NotFound();
        }

        return View(application);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> StartBunkering(int id, string operatorName)
    {
        var result = await _service.StartBunkeringAsync(id, operatorName);
        if (result == null)
        {
            return NotFound();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    public async Task<IActionResult> CompleteBunkering(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var application = await _service.GetByIdAsync(id.Value);
        if (application == null || application.Status != ApplicationStatus.BunkeringInProgress)
        {
            return NotFound();
        }

        ViewData["DiscrepancyReasons"] = new SelectList(Enum.GetValues(typeof(DiscrepancyReason)).Cast<DiscrepancyReason>().Select(v => new { Value = v, Text = GetDiscrepancyReasonDisplay(v) }), "Value", "Text");
        return View(application);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CompleteBunkering(int id, string operatorName, double actualQuantity, DiscrepancyReason discrepancyReason, string? remarks)
    {
        var result = await _service.CompleteBunkeringAsync(id, operatorName, actualQuantity, discrepancyReason, remarks);
        if (result == null)
        {
            return NotFound();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    public async Task<IActionResult> ConfirmSample(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var application = await _service.GetByIdAsync(id.Value);
        if (application == null || application.Status != ApplicationStatus.SamplePending)
        {
            return NotFound();
        }

        return View(application);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ConfirmSample(int id, string chiefEngineerName, string sampleNumber)
    {
        var result = await _service.ConfirmSampleAsync(id, chiefEngineerName, sampleNumber);
        if (result == null)
        {
            return NotFound();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    public async Task<IActionResult> Settle(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var application = await _service.GetByIdAsync(id.Value);
        if (application == null)
        {
            return NotFound();
        }

        var canSettle = await _service.CanSettleAsync(id.Value);
        if (!canSettle)
        {
            ModelState.AddModelError("", "油样未封存，禁止结算");
        }

        return View(application);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Settle(int id, string financeVerifierName)
    {
        var canSettle = await _service.CanSettleAsync(id);
        if (!canSettle)
        {
            var application = await _service.GetByIdAsync(id);
            ModelState.AddModelError("", "油样未封存，禁止结算");
            return View(application);
        }

        var result = await _service.SettleAsync(id, financeVerifierName);
        if (result == null)
        {
            return NotFound();
        }
        return RedirectToAction(nameof(Details), new { id });
    }

    private string GetDiscrepancyReasonDisplay(DiscrepancyReason reason)
    {
        return reason switch
        {
            DiscrepancyReason.None => "无差异",
            DiscrepancyReason.TemperatureDifference => "温度差异",
            DiscrepancyReason.MeasurementError => "计量误差",
            DiscrepancyReason.SupplyShortage => "供油短缺",
            DiscrepancyReason.Leakage => "泄漏损耗",
            DiscrepancyReason.Other => "其他原因",
            _ => reason.ToString()
        };
    }
}
