using EquipmentMaintenanceSystem.Data;
using EquipmentMaintenanceSystem.Models;
using EquipmentMaintenanceSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipmentMaintenanceSystem.Controllers
{
    [Authorize]
    public class InspectionController : Controller
    {
        private readonly IInspectionService _inspectionService;
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public InspectionController(IInspectionService inspectionService, ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _inspectionService = inspectionService;
            _context = context;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index(string status = "")
        {
            List<InspectionRecord> inspections;
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<InspectionStatus>(status, out var inspectionStatus))
            {
                inspections = await _inspectionService.GetInspectionsByStatus(inspectionStatus);
            }
            else
            {
                inspections = await _inspectionService.GetAllInspections();
            }
            return View(inspections);
        }

        public async Task<IActionResult> Details(int id)
        {
            var inspection = await _inspectionService.GetInspectionById(id);
            if (inspection == null)
            {
                return NotFound();
            }
            return View(inspection);
        }

        [Authorize(Roles = "Operator")]
        public IActionResult Create()
        {
            ViewBag.Equipments = _context.Equipments.ToList();
            return View();
        }

        [HttpPost]
        [Authorize(Roles = "Operator")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(InspectionRecord inspection)
        {
            if (ModelState.IsValid)
            {
                var user = await _userManager.GetUserAsync(User);
                inspection.ReportedBy = user?.UserName;
                inspection.InspectionTime = DateTime.Now;
                
                await _inspectionService.CreateInspection(inspection);
                return RedirectToAction(nameof(Index));
            }
            ViewBag.Equipments = _context.Equipments.ToList();
            return View(inspection);
        }

        [Authorize(Roles = "TeamLeader")]
        public async Task<IActionResult> Confirm(int id)
        {
            var inspection = await _inspectionService.GetInspectionById(id);
            if (inspection == null || inspection.Status != InspectionStatus.Pending)
            {
                return RedirectToAction(nameof(Index));
            }
            
            var user = await _userManager.GetUserAsync(User);
            await _inspectionService.ConfirmInspection(id, user?.UserName ?? "");
            
            return RedirectToAction(nameof(Details), new { id });
        }

        [Authorize(Roles = "TeamLeader")]
        public async Task<IActionResult> Reject(int id)
        {
            var inspection = await _inspectionService.GetInspectionById(id);
            if (inspection == null || inspection.Status != InspectionStatus.Pending)
            {
                return RedirectToAction(nameof(Index));
            }
            return View(inspection);
        }

        [HttpPost]
        [Authorize(Roles = "TeamLeader")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Reject(int id, string remark)
        {
            var user = await _userManager.GetUserAsync(User);
            await _inspectionService.RejectInspection(id, user?.UserName ?? "", remark);
            return RedirectToAction(nameof(Index));
        }

        [Authorize(Roles = "TeamLeader")]
        public async Task<IActionResult> TransferToMaintenance(int id)
        {
            var inspection = await _inspectionService.GetInspectionById(id);
            if (inspection == null || inspection.Status != InspectionStatus.Confirmed)
            {
                return RedirectToAction(nameof(Index));
            }
            
            var user = await _userManager.GetUserAsync(User);
            await _inspectionService.TransferToMaintenance(id, user?.UserName ?? "");
            
            return RedirectToAction(nameof(Details), new { id });
        }
    }
}