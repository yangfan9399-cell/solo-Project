using EquipmentMaintenanceSystem.Models;
using EquipmentMaintenanceSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentMaintenanceSystem.Controllers
{
    public class HomeController : Controller
    {
        private readonly IInspectionService _inspectionService;
        private readonly IMaintenanceService _maintenanceService;

        public HomeController(IInspectionService inspectionService, IMaintenanceService maintenanceService)
        {
            _inspectionService = inspectionService;
            _maintenanceService = maintenanceService;
        }

        public async Task<IActionResult> Index()
        {
            var pendingInspections = await _inspectionService.GetInspectionsByStatus(InspectionStatus.Pending);
            var pendingMaintenance = await _maintenanceService.GetMaintenanceOrdersByStatus(MaintenanceStatus.PendingReview);
            
            ViewBag.PendingInspections = pendingInspections.Count;
            ViewBag.PendingMaintenance = pendingMaintenance.Count;
            
            return View();
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}