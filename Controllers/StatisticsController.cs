using EquipmentMaintenanceSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipmentMaintenanceSystem.Controllers
{
    [Authorize]
    public class StatisticsController : Controller
    {
        private readonly IStatisticsService _statisticsService;

        public StatisticsController(IStatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        public async Task<IActionResult> Index()
        {
            ViewBag.ByProductionLine = await _statisticsService.GetStatisticsByProductionLine();
            ViewBag.ByEquipmentType = await _statisticsService.GetStatisticsByEquipmentType();
            ViewBag.ByFailureReason = await _statisticsService.GetStatisticsByFailureReason();
            ViewBag.ByDowntimeLoss = await _statisticsService.GetStatisticsByDowntimeLoss();
            return View();
        }

        public async Task<IActionResult> ByProductionLine()
        {
            var statistics = await _statisticsService.GetStatisticsByProductionLine();
            return View(statistics);
        }

        public async Task<IActionResult> ByEquipmentType()
        {
            var statistics = await _statisticsService.GetStatisticsByEquipmentType();
            return View(statistics);
        }

        public async Task<IActionResult> ByFailureReason()
        {
            var statistics = await _statisticsService.GetStatisticsByFailureReason();
            return View(statistics);
        }

        public async Task<IActionResult> ByDowntimeLoss()
        {
            var statistics = await _statisticsService.GetStatisticsByDowntimeLoss();
            return View(statistics);
        }
    }
}