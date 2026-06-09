using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BridgeInspection.Data;
using BridgeInspection.Models;
using System.Diagnostics;

namespace BridgeInspection.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public HomeController(
        ILogger<HomeController> logger,
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _logger = logger;
        _context = context;
        _userManager = userManager;
    }

    public async Task<IActionResult> Index()
    {
        var totalDefects = await _context.Defects.CountAsync();
        var pendingDefects = await _context.Defects
            .Where(d => d.Status == DefectStatus.PendingAssessment ||
                        d.Status == DefectStatus.Assessing ||
                        d.Status == DefectStatus.PendingMaintenance ||
                        d.Status == DefectStatus.MaintenanceInProgress ||
                        d.Status == DefectStatus.PendingAcceptance)
            .CountAsync();
        var closedDefects = await _context.Defects
            .Where(d => d.Status == DefectStatus.Closed)
            .CountAsync();
        var structuralDefects = await _context.Defects
            .Where(d => d.Severity == DefectSeverity.Structural)
            .CountAsync();

        var totalBridges = await _context.Bridges.CountAsync();
        var offlineSensors = await _context.Sensors
            .Where(s => s.Status == SensorStatus.Offline)
            .CountAsync();

        var recentDefects = await _context.Defects
            .Include(d => d.Bridge)
            .OrderByDescending(d => d.CreatedAt)
            .Take(10)
            .ToListAsync();

        ViewBag.TotalDefects = totalDefects;
        ViewBag.PendingDefects = pendingDefects;
        ViewBag.ClosedDefects = closedDefects;
        ViewBag.StructuralDefects = structuralDefects;
        ViewBag.TotalBridges = totalBridges;
        ViewBag.OfflineSensors = offlineSensors;
        ViewBag.RecentDefects = recentDefects;

        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}

public class ErrorViewModel
{
    public string? RequestId { get; set; }

    public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
}
