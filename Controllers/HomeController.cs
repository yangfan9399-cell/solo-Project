using FuelManagementSystem.Data;
using FuelManagementSystem.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _context;

    public HomeController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var totalApplications = await _context.FuelApplications.CountAsync();
        var pendingApproval = await _context.FuelApplications.CountAsync(a => a.Status == ApplicationStatus.PendingApproval);
        var bunkeringInProgress = await _context.FuelApplications.CountAsync(a => a.Status == ApplicationStatus.BunkeringInProgress);
        var samplePending = await _context.FuelApplications.CountAsync(a => a.Status == ApplicationStatus.SamplePending);
        var settlementPending = await _context.FuelApplications.CountAsync(a => a.Status == ApplicationStatus.SettlementPending);
        var settled = await _context.FuelApplications.CountAsync(a => a.Status == ApplicationStatus.Settled);

        var totalAmount = await _context.FuelApplications
            .Where(a => a.Status == ApplicationStatus.Settled)
            .SumAsync(a => a.TotalAmount ?? 0);

        var recentApplications = await _context.FuelApplications
            .Include(a => a.Ship)
            .Include(a => a.Supplier)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .ToListAsync();

        var unsealedCount = await _context.FuelApplications
            .CountAsync(a => !a.IsSampleSealed && a.Status >= ApplicationStatus.BunkeringCompleted);

        ViewData["TotalApplications"] = totalApplications;
        ViewData["PendingApproval"] = pendingApproval;
        ViewData["BunkeringInProgress"] = bunkeringInProgress;
        ViewData["SamplePending"] = samplePending;
        ViewData["SettlementPending"] = settlementPending;
        ViewData["Settled"] = settled;
        ViewData["TotalAmount"] = totalAmount;
        ViewData["UnsealedCount"] = unsealedCount;

        return View(recentApplications);
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = System.Diagnostics.Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
