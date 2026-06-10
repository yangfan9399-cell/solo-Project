using EquipmentMaintenanceSystem.Models;
using EquipmentMaintenanceSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentMaintenanceSystem.Controllers
{
    [Authorize]
    public class MaintenanceController : Controller
    {
        private readonly IMaintenanceService _maintenanceService;
        private readonly UserManager<ApplicationUser> _userManager;

        public MaintenanceController(IMaintenanceService maintenanceService, UserManager<ApplicationUser> userManager)
        {
            _maintenanceService = maintenanceService;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index(string status = "")
        {
            List<MaintenanceOrder> orders;
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<MaintenanceStatus>(status, out var maintenanceStatus))
            {
                orders = await _maintenanceService.GetMaintenanceOrdersByStatus(maintenanceStatus);
            }
            else
            {
                orders = await _maintenanceService.GetAllMaintenanceOrders();
            }
            return View(orders);
        }

        public async Task<IActionResult> Details(int id)
        {
            var order = await _maintenanceService.GetMaintenanceOrderById(id);
            if (order == null)
            {
                return NotFound();
            }
            
            ViewBag.CanResume = await _maintenanceService.CanResume(id);
            return View(order);
        }

        [Authorize(Roles = "TeamLeader")]
        public async Task<IActionResult> ConfirmStop(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            await _maintenanceService.ConfirmStop(id, user?.UserName ?? "");
            return RedirectToAction(nameof(Details), new { id });
        }

        [Authorize(Roles = "Maintenance")]
        public async Task<IActionResult> StartRepair(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            await _maintenanceService.StartRepair(id, user?.UserName ?? "");
            return RedirectToAction(nameof(Details), new { id });
        }

        [Authorize(Roles = "Maintenance")]
        public async Task<IActionResult> CompleteRepair(int id)
        {
            var order = await _maintenanceService.GetMaintenanceOrderById(id);
            if (order == null || order.Status != MaintenanceStatus.Repairing)
            {
                return RedirectToAction(nameof(Index));
            }
            return View(order);
        }

        [HttpPost]
        [Authorize(Roles = "Maintenance")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CompleteRepair(int id, string repairContent)
        {
            var user = await _userManager.GetUserAsync(User);
            await _maintenanceService.CompleteRepair(id, user?.UserName ?? "", repairContent, new List<MaintenanceSparePart>());
            return RedirectToAction(nameof(Details), new { id });
        }

        [Authorize(Roles = "Engineer")]
        public async Task<IActionResult> Review(int id)
        {
            var order = await _maintenanceService.GetMaintenanceOrderById(id);
            if (order == null || order.Status != MaintenanceStatus.PendingReview)
            {
                return RedirectToAction(nameof(Index));
            }
            return View(order);
        }

        [HttpPost]
        [Authorize(Roles = "Engineer")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Review(int id, bool approved, string remark)
        {
            var user = await _userManager.GetUserAsync(User);
            await _maintenanceService.ReviewMaintenance(id, user?.UserName ?? "", approved, remark);
            return RedirectToAction(nameof(Details), new { id });
        }

        [Authorize(Roles = "Engineer")]
        public async Task<IActionResult> ConfirmResume(int id)
        {
            var canResume = await _maintenanceService.CanResume(id);
            if (!canResume)
            {
                TempData["ErrorMessage"] = "备件缺料，无法确认复产";
                return RedirectToAction(nameof(Details), new { id });
            }
            
            var user = await _userManager.GetUserAsync(User);
            await _maintenanceService.ConfirmResume(id, user?.UserName ?? "");
            return RedirectToAction(nameof(Details), new { id });
        }
    }
}