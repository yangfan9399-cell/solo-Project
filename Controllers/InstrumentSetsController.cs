using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SurgicalInstrumentTracking.Data;
using SurgicalInstrumentTracking.Models;
using SurgicalInstrumentTracking.ViewModels;

namespace SurgicalInstrumentTracking.Controllers;

public class InstrumentSetsController : Controller
{
    private readonly AppDbContext _context;

    public InstrumentSetsController(AppDbContext context)
    {
        _context = context;
    }

    public IActionResult Index(string? statusFilter, string? departmentFilter, string? searchTerm)
    {
        var query = _context.InstrumentSets
            .Include(s => s.Department)
            .Include(s => s.SterilizationBatch)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            var status = Enum.Parse<InstrumentSetStatus>(statusFilter);
            query = query.Where(s => s.Status == status);
        }

        if (!string.IsNullOrEmpty(departmentFilter) && int.TryParse(departmentFilter, out var deptId))
        {
            query = query.Where(s => s.DepartmentId == deptId);
        }

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(s =>
                s.SetCode.Contains(searchTerm) ||
                s.Name.Contains(searchTerm));
        }

        var sets = query.OrderByDescending(s => s.UpdatedAt).ToList();

        var viewModel = new InstrumentSetListViewModel
        {
            InstrumentSets = sets,
            StatusFilter = statusFilter,
            DepartmentFilter = departmentFilter,
            SearchTerm = searchTerm,
            Departments = _context.Departments.OrderBy(d => d.Name).ToList(),
            TotalCount = sets.Count
        };

        return View(viewModel);
    }

    public IActionResult Details(int id)
    {
        var set = _context.InstrumentSets
            .Include(s => s.Department)
            .Include(s => s.SterilizationBatch)
            .Include(s => s.ReceivedByUser)
            .Include(s => s.Items)
                .ThenInclude(i => i.Instrument)
            .Include(s => s.TrackingRecords)
                .ThenInclude(t => t.User)
            .Include(s => s.AnomalyRecords)
                .ThenInclude(a => a.ReportedByUser)
            .FirstOrDefault(s => s.Id == id);

        if (set == null)
        {
            return NotFound();
        }

        var isExpired = set.SterilizationBatch?.IsExpired ?? false;

        var viewModel = new InstrumentSetDetailViewModel
        {
            InstrumentSet = set,
            Items = set.Items.OrderBy(i => i.Instrument.Name).ToList(),
            SterilizationBatch = set.SterilizationBatch,
            Department = set.Department,
            ReceivedByUser = set.ReceivedByUser,
            AnomalyRecords = set.AnomalyRecords.OrderByDescending(a => a.ReportedAt).ToList(),
            TrackingRecords = set.TrackingRecords.OrderBy(t => t.ActionTime).ToList(),
            IsSterilizationExpired = isExpired
        };

        return View(viewModel);
    }
}
