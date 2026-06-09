using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BridgeInspection.Data;
using BridgeInspection.Models;

namespace BridgeInspection.Controllers;

public class BridgeController : Controller
{
    private readonly ApplicationDbContext _context;

    public BridgeController(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(string? searchString = null, int page = 1, int pageSize = 20)
    {
        if (page < 1)
        {
            page = 1;
        }
        if (pageSize < 1)
        {
            pageSize = 20;
        }
        if (pageSize > 100)
        {
            pageSize = 100;
        }

        var query = _context.Bridges.AsQueryable();

        if (!string.IsNullOrEmpty(searchString))
        {
            query = query.Where(b => b.Name.Contains(searchString) ||
                                     b.RouteName!.Contains(searchString) ||
                                     b.Location!.Contains(searchString));
        }

        var totalCount = await query.CountAsync();
        var bridges = await query
            .OrderBy(b => b.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        ViewBag.SearchString = searchString;
        ViewBag.TotalCount = totalCount;
        ViewBag.Page = page;
        ViewBag.PageSize = pageSize;
        ViewBag.TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return View(bridges);
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var bridge = await _context.Bridges
            .Include(b => b.Defects)
            .Include(b => b.Sensors)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bridge == null)
        {
            return NotFound();
        }

        var defectCount = bridge.Defects.Count;
        var pendingDefects = bridge.Defects
            .Count(d => d.Status != DefectStatus.Closed);
        var structuralDefects = bridge.Defects
            .Count(d => d.Severity == DefectSeverity.Structural);

        ViewBag.DefectCount = defectCount;
        ViewBag.PendingDefects = pendingDefects;
        ViewBag.StructuralDefects = structuralDefects;
        ViewBag.OnlineSensors = bridge.Sensors.Count(s => s.Status == SensorStatus.Online);
        ViewBag.OfflineSensors = bridge.Sensors.Count(s => s.Status == SensorStatus.Offline);

        return View(bridge);
    }
}
