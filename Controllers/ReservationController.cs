using HazardousGoodsYard.Data;
using HazardousGoodsYard.Models;
using HazardousGoodsYard.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HazardousGoodsYard.Controllers;

[Authorize]
public class ReservationController : Controller
{
    private readonly IReservationService _reservationService;
    private readonly IIsolationValidationService _validationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public ReservationController(
        IReservationService reservationService,
        IIsolationValidationService validationService,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        _reservationService = reservationService;
        _validationService = validationService;
        _userManager = userManager;
        _context = context;
    }

    public async Task<IActionResult> Index(string? statusFilter, string? search)
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);

        List<Reservation> reservations;

        if (roles.Contains("Forwarder"))
        {
            reservations = await _reservationService.GetReservationsByUser(user!.Id);
        }
        else
        {
            reservations = await _reservationService.GetAllReservations();
        }

        if (!string.IsNullOrEmpty(statusFilter) && Enum.TryParse<ReservationStatus>(statusFilter, out var status))
        {
            reservations = reservations.Where(r => r.Status == status).ToList();
        }

        if (!string.IsNullOrEmpty(search))
        {
            reservations = reservations.Where(r =>
                r.ReservationNumber.Contains(search) ||
                r.HazardousGood.UNNumber.Contains(search) ||
                r.HazardousGood.ContainerNumber.Contains(search) ||
                r.HazardousGood.GoodsName.Contains(search)).ToList();
        }

        ViewBag.StatusFilter = statusFilter;
        ViewBag.Search = search;
        ViewBag.UserRoles = roles;

        return View(reservations);
    }

    public async Task<IActionResult> Details(int id)
    {
        var reservation = await _reservationService.GetReservationById(id);
        if (reservation == null)
        {
            return NotFound();
        }

        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);

        if (roles.Contains("Forwarder") && reservation.ForwarderUserId != user!.Id)
        {
            return Forbid();
        }

        ViewBag.UserRoles = roles;
        ViewBag.AvailableZones = await _validationService.GetAvailableZonesForHazardClass(reservation.HazardousGood.HazardClass);
        ViewBag.AvailableAreas = await _validationService.GetAvailableAreasForHazardClass(reservation.HazardousGood.HazardClass);

        return View(reservation);
    }

    [Authorize(Roles = "Forwarder")]
    public IActionResult Create()
    {
        var model = new CreateReservationViewModel
        {
            ReservationWindowStart = DateTime.Now,
            ReservationWindowEnd = DateTime.Now.AddHours(8)
        };
        ViewBag.HazardClasses = GetHazardClassSelectList();
        return View(model);
    }

    [HttpPost]
    [Authorize(Roles = "Forwarder")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateReservationViewModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.HazardClasses = GetHazardClassSelectList();
            return View(model);
        }

        if (model.ReservationWindowEnd <= model.ReservationWindowStart)
        {
            ModelState.AddModelError("ReservationWindowEnd", "预约窗口结束时间必须大于开始时间");
            ViewBag.HazardClasses = GetHazardClassSelectList();
            return View(model);
        }

        var user = await _userManager.GetUserAsync(User);
        var reservation = await _reservationService.CreateReservation(model, user!.Id);

        return RedirectToAction(nameof(Details), new { id = reservation.Id });
    }

    [Authorize(Roles = "Dispatcher")]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AssignArea(int reservationId, int yardAreaId, int? isolationZoneId)
    {
        var user = await _userManager.GetUserAsync(User);
        var success = await _reservationService.AssignArea(reservationId, yardAreaId, isolationZoneId, user!.Id);

        if (!success)
        {
            TempData["Error"] = "区域分配失败，可能存在危险等级冲突或容量不足";
        }
        else
        {
            TempData["Success"] = "区域分配成功";
        }

        return RedirectToAction(nameof(Details), new { id = reservationId });
    }

    [Authorize(Roles = "SafetyOfficer")]
    public async Task<IActionResult> VerifyDocuments(int id)
    {
        var reservation = await _reservationService.GetReservationById(id);
        if (reservation == null || reservation.Status != ReservationStatus.AreaAssigned)
        {
            return NotFound();
        }

        return View(reservation);
    }

    [Authorize(Roles = "SafetyOfficer")]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> VerifyDocuments(int reservationId, List<int> approvedDocuments, List<int> rejectedDocuments)
    {
        var user = await _userManager.GetUserAsync(User);
        var success = await _reservationService.VerifyDocuments(reservationId, user!.Id, approvedDocuments, rejectedDocuments);

        if (!success)
        {
            TempData["Error"] = "资料核验失败";
        }
        else
        {
            TempData["Success"] = "资料核验完成";
        }

        return RedirectToAction(nameof(Details), new { id = reservationId });
    }

    [Authorize(Roles = "Reviewer")]
    public async Task<IActionResult> Review(int id)
    {
        var reservation = await _reservationService.GetReservationById(id);
        if (reservation == null || reservation.Status != ReservationStatus.DocumentsVerified)
        {
            return NotFound();
        }

        return View(reservation);
    }

    [Authorize(Roles = "Reviewer")]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Review(int reservationId, bool approve, string? rejectionReason)
    {
        var user = await _userManager.GetUserAsync(User);
        var success = await _reservationService.ReviewReservation(reservationId, user!.Id, approve, rejectionReason);

        if (!success)
        {
            TempData["Error"] = "复核操作失败";
        }
        else
        {
            TempData["Success"] = approve ? "入库确认成功" : "预约已退回";
        }

        return RedirectToAction(nameof(Details), new { id = reservationId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Reject(int reservationId, RejectionReasonType reasonType, string reason)
    {
        var user = await _userManager.GetUserAsync(User);
        var roles = await _userManager.GetRolesAsync(user!);

        if (!roles.Contains("Dispatcher") && !roles.Contains("SafetyOfficer") && !roles.Contains("Reviewer"))
        {
            return Forbid();
        }

        var success = await _reservationService.RejectReservation(reservationId, user!.Id, reasonType, reason);

        if (!success)
        {
            TempData["Error"] = "退回操作失败";
        }
        else
        {
            TempData["Success"] = "预约已退回";
        }

        return RedirectToAction(nameof(Details), new { id = reservationId });
    }

    public async Task<IActionResult> GetAvailableZones(int hazardClassId)
    {
        var hazardClass = (HazardClass)hazardClassId;
        var zones = await _validationService.GetAvailableZonesForHazardClass(hazardClass);
        return Json(zones.Select(z => new { id = z.Id, code = z.ZoneCode, name = z.ZoneName, areaId = z.YardAreaId }));
    }

    public async Task<IActionResult> GetAvailableAreas(int hazardClassId)
    {
        var hazardClass = (HazardClass)hazardClassId;
        var areas = await _validationService.GetAvailableAreasForHazardClass(hazardClass);
        return Json(areas.Select(a => new { id = a.Id, code = a.AreaCode, name = a.AreaName, capacity = a.MaxCapacity - a.CurrentUsage }));
    }

    public async Task<IActionResult> ValidateZone(int zoneId, int reservationId)
    {
        var result = await _validationService.ValidateIsolation(reservationId, zoneId);
        return Json(result);
    }

    private List<SelectListItem> GetHazardClassSelectList()
    {
        return Enum.GetValues(typeof(HazardClass))
            .Cast<HazardClass>()
            .Select(c => new SelectListItem
            {
                Value = ((int)c).ToString(),
                Text = c.GetType().GetField(c.ToString())?.GetCustomAttributes(typeof(System.ComponentModel.DataAnnotations.DisplayAttribute), false).FirstOrDefault() as System.ComponentModel.DataAnnotations.DisplayAttribute?.Name ?? c.ToString()
            })
            .ToList();
    }
}

public class SelectListItem
{
    public string Value { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}