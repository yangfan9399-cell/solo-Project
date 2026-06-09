using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BridgeInspection.Data;
using BridgeInspection.Models;
using BridgeInspection.ViewModels;

namespace BridgeInspection.Controllers;

public class DefectController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public DefectController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<IActionResult> Index(
        DefectStatus? status = null,
        DefectSeverity? severity = null,
        int? bridgeId = null,
        string? searchString = null,
        int page = 1,
        int pageSize = 20)
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

        var query = _context.Defects
            .Include(d => d.Bridge)
            .Include(d => d.Reporter)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(d => d.Status == status.Value);
        }

        if (severity.HasValue)
        {
            query = query.Where(d => d.Severity == severity.Value);
        }

        if (bridgeId.HasValue)
        {
            query = query.Where(d => d.BridgeId == bridgeId.Value);
        }

        if (!string.IsNullOrEmpty(searchString))
        {
            query = query.Where(d => d.Title.Contains(searchString) ||
                                     d.Description!.Contains(searchString) ||
                                     d.Bridge!.Name.Contains(searchString));
        }

        var totalCount = await query.CountAsync();
        var defects = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DefectListViewModel
            {
                Id = d.Id,
                BridgeName = d.Bridge!.Name,
                Title = d.Title,
                Severity = d.Severity,
                Status = d.Status,
                ReporterName = d.Reporter!.FullName,
                ReportedAt = d.ReportedAt,
                LocationOnBridge = d.LocationOnBridge,
                IsUpgraded = d.IsUpgraded,
                RequiresStructuralReview = d.RequiresStructuralReview
            })
            .ToListAsync();

        ViewBag.Status = status;
        ViewBag.Severity = severity;
        ViewBag.BridgeId = bridgeId;
        ViewBag.SearchString = searchString;
        ViewBag.TotalCount = totalCount;
        ViewBag.Page = page;
        ViewBag.PageSize = pageSize;
        ViewBag.TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        ViewBag.Bridges = await _context.Bridges.OrderBy(b => b.Name).ToListAsync();

        return View(defects);
    }

    public async Task<IActionResult> Details(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var defect = await _context.Defects
            .Include(d => d.Bridge)
            .Include(d => d.Reporter)
            .Include(d => d.Assessor)
            .Include(d => d.MaintenanceUnit)
            .Include(d => d.Acceptor)
            .Include(d => d.Histories)
                .ThenInclude(h => h.Operator)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defect == null)
        {
            return NotFound();
        }

        var sensors = await _context.Sensors
            .Where(s => s.BridgeId == defect.BridgeId)
            .ToListAsync();

        var sensorReadings = await _context.SensorReadings
            .Where(sr => sr.DefectId == defect.Id || sr.Sensor.BridgeId == defect.BridgeId)
            .Include(sr => sr.Sensor)
            .OrderByDescending(sr => sr.ReadingTime)
            .Take(50)
            .ToListAsync();

        var histories = defect.Histories
            .OrderBy(h => h.OperatedAt)
            .ToList();

        var viewModel = new DefectDetailViewModel
        {
            Defect = defect,
            Bridge = defect.Bridge!,
            Histories = histories,
            SensorReadings = sensorReadings,
            Sensors = sensors
        };

        return View(viewModel);
    }

    [Authorize(Policy = "InspectorPolicy")]
    public async Task<IActionResult> Create()
    {
        var bridges = await _context.Bridges
            .OrderBy(b => b.Name)
            .ToListAsync();

        var viewModel = new DefectReportViewModel
        {
            AvailableBridges = bridges
        };

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "InspectorPolicy")]
    public async Task<IActionResult> Create(DefectReportViewModel viewModel)
    {
        if (ModelState.IsValid)
        {
            var user = await _userManager.GetUserAsync(User);

            var defect = new Defect
            {
                BridgeId = viewModel.BridgeId,
                Title = viewModel.Title,
                Description = viewModel.Description,
                LocationOnBridge = viewModel.LocationOnBridge,
                CrackLength = viewModel.CrackLength,
                CrackWidth = viewModel.CrackWidth,
                CrackDepth = viewModel.CrackDepth,
                CrackDirection = viewModel.CrackDirection,
                Status = DefectStatus.PendingAssessment,
                ReporterId = user!.Id,
                ReportedAt = DateTime.Now
            };

            _context.Add(defect);
            await _context.SaveChangesAsync();

            var history = new DefectHistory
            {
                DefectId = defect.Id,
                ActionType = DefectStatus.PendingAssessment,
                Description = $"巡检员登记病害：{defect.Title}",
                OperatorId = user.Id,
                OperatedAt = DateTime.Now,
                Remark = "病害登记"
            };

            _context.DefectHistories.Add(history);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Details), new { id = defect.Id });
        }

        viewModel.AvailableBridges = await _context.Bridges
            .OrderBy(b => b.Name)
            .ToListAsync();

        return View(viewModel);
    }

    [Authorize(Policy = "EngineerPolicy")]
    public async Task<IActionResult> Assess(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var defect = await _context.Defects
            .Include(d => d.Bridge)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.PendingAssessment &&
            defect.Status != DefectStatus.Assessing)
        {
            return BadRequest("当前状态不允许评定");
        }

        var maintenanceUnits = await _userManager.GetUsersInRoleAsync("MaintenanceUnit");

        var viewModel = new DefectAssessmentViewModel
        {
            DefectId = defect.Id,
            Severity = defect.Severity ?? DefectSeverity.Slight,
            AssessmentComment = defect.AssessmentComment,
            IsUpgraded = defect.IsUpgraded,
            MaintenanceUnitId = defect.MaintenanceUnitId,
            MaintenanceUnits = maintenanceUnits.ToList()
        };

        ViewBag.Defect = defect;
        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "EngineerPolicy")]
    public async Task<IActionResult> Assess(int id, DefectAssessmentViewModel viewModel)
    {
        if (id != viewModel.DefectId)
        {
            return NotFound();
        }

        var defect = await _context.Defects.FindAsync(id);
        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.PendingAssessment &&
            defect.Status != DefectStatus.Assessing)
        {
            return BadRequest("当前状态不允许评定");
        }

        if (ModelState.IsValid)
        {
            var user = await _userManager.GetUserAsync(User);
            var isStructural = viewModel.Severity == DefectSeverity.Structural || viewModel.IsUpgraded;

            defect.Severity = viewModel.Severity;
            defect.AssessmentComment = viewModel.AssessmentComment;
            defect.AssessorId = user!.Id;
            defect.AssessedAt = DateTime.Now;
            defect.IsUpgraded = viewModel.IsUpgraded || isStructural;
            defect.RequiresStructuralReview = isStructural;
            defect.MaintenanceUnitId = viewModel.MaintenanceUnitId;
            defect.Status = DefectStatus.PendingMaintenance;
            defect.UpdatedAt = DateTime.Now;

            if (!string.IsNullOrEmpty(viewModel.MaintenanceUnitId))
            {
                defect.Status = DefectStatus.PendingMaintenance;
            }

            _context.Update(defect);

            var history = new DefectHistory
            {
                DefectId = defect.Id,
                ActionType = DefectStatus.PendingMaintenance,
                Description = $"工程师评定为{GetSeverityName(viewModel.Severity)}等级。{viewModel.AssessmentComment}",
                OperatorId = user.Id,
                OperatedAt = DateTime.Now,
                Remark = isStructural ? "已升级/结构性病害" : "正常评定"
            };

            _context.DefectHistories.Add(history);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Details), new { id = defect.Id });
        }

        var defectWithBridge = await _context.Defects
            .Include(d => d.Bridge)
            .FirstOrDefaultAsync(d => d.Id == id);
        ViewBag.Defect = defectWithBridge;

        var maintenanceUnits = await _userManager.GetUsersInRoleAsync("MaintenanceUnit");
        viewModel.MaintenanceUnits = maintenanceUnits.ToList();

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "MaintenancePolicy")]
    public async Task<IActionResult> StartMaintenance(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var defect = await _context.Defects.FindAsync(id);
        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.PendingMaintenance)
        {
            return BadRequest("当前状态不允许开始维修");
        }

        var user = await _userManager.GetUserAsync(User);

        defect.Status = DefectStatus.MaintenanceInProgress;
        defect.MaintenanceUnitId = user!.Id;
        defect.MaintenanceStartedAt = DateTime.Now;
        defect.UpdatedAt = DateTime.Now;

        _context.Update(defect);

        var history = new DefectHistory
        {
            DefectId = defect.Id,
            ActionType = DefectStatus.MaintenanceInProgress,
            Description = "养护单位开始维修作业",
            OperatorId = user.Id,
            OperatedAt = DateTime.Now,
            Remark = "维修开始"
        };

        _context.DefectHistories.Add(history);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), new { id = defect.Id });
    }

    [Authorize(Policy = "MaintenancePolicy")]
    public async Task<IActionResult> SubmitMaintenance(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var defect = await _context.Defects
            .Include(d => d.Bridge)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.MaintenanceInProgress &&
            defect.Status != DefectStatus.Returned)
        {
            return BadRequest("当前状态不允许提交维修结果");
        }

        var viewModel = new MaintenanceSubmitViewModel
        {
            DefectId = defect.Id,
            MaintenancePlan = defect.MaintenancePlan,
            MaintenanceResult = defect.MaintenanceResult ?? string.Empty,
            MaintenanceStartedAt = defect.MaintenanceStartedAt,
            MaintenanceCompletedAt = DateTime.Now,
            MaintenanceDurationHours = defect.MaintenanceDurationHours
        };

        ViewBag.Defect = defect;
        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "MaintenancePolicy")]
    public async Task<IActionResult> SubmitMaintenance(int id, MaintenanceSubmitViewModel viewModel)
    {
        if (id != viewModel.DefectId)
        {
            return NotFound();
        }

        var defect = await _context.Defects.FindAsync(id);
        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.MaintenanceInProgress &&
            defect.Status != DefectStatus.Returned)
        {
            return BadRequest("当前状态不允许提交维修结果");
        }

        if (ModelState.IsValid)
        {
            var user = await _userManager.GetUserAsync(User);

            defect.MaintenancePlan = viewModel.MaintenancePlan;
            defect.MaintenanceResult = viewModel.MaintenanceResult;
            defect.MaintenanceCompletedAt = viewModel.MaintenanceCompletedAt ?? DateTime.Now;
            
            if (viewModel.MaintenanceDurationHours.HasValue)
            {
                defect.MaintenanceDurationHours = viewModel.MaintenanceDurationHours;
            }
            else if (defect.MaintenanceStartedAt.HasValue && defect.MaintenanceCompletedAt.HasValue)
            {
                defect.MaintenanceDurationHours = (int)Math.Ceiling(
                    (defect.MaintenanceCompletedAt.Value - defect.MaintenanceStartedAt.Value).TotalHours);
            }

            defect.Status = DefectStatus.PendingAcceptance;
            defect.UpdatedAt = DateTime.Now;

            _context.Update(defect);

            var history = new DefectHistory
            {
                DefectId = defect.Id,
                ActionType = DefectStatus.PendingAcceptance,
                Description = $"养护单位提交维修结果：{viewModel.MaintenanceResult}",
                OperatorId = user!.Id,
                OperatedAt = DateTime.Now,
                Remark = $"维修用时{defect.MaintenanceDurationHours}小时"
            };

            _context.DefectHistories.Add(history);
            await _context.SaveChangesAsync();

            return RedirectToAction(nameof(Details), new { id = defect.Id });
        }

        var defectWithBridge = await _context.Defects
            .Include(d => d.Bridge)
            .FirstOrDefaultAsync(d => d.Id == id);
        ViewBag.Defect = defectWithBridge;

        return View(viewModel);
    }

    [Authorize(Policy = "AcceptorPolicy")]
    public async Task<IActionResult> Accept(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var defect = await _context.Defects
            .Include(d => d.Bridge)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.PendingAcceptance)
        {
            return BadRequest("当前状态不允许验收");
        }

        var viewModel = new AcceptanceViewModel
        {
            DefectId = defect.Id,
            IsApproved = true
        };

        ViewBag.Defect = defect;
        ViewBag.IsStructural = defect.RequiresStructuralReview || defect.Severity == DefectSeverity.Structural;
        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "AcceptorPolicy")]
    public async Task<IActionResult> Accept(int id, AcceptanceViewModel viewModel)
    {
        if (id != viewModel.DefectId)
        {
            return NotFound();
        }

        var defect = await _context.Defects.FindAsync(id);
        if (defect == null)
        {
            return NotFound();
        }

        if (defect.Status != DefectStatus.PendingAcceptance)
        {
            return BadRequest("当前状态不允许验收");
        }

        if (defect.RequiresStructuralReview && !User.IsInRole("Engineer") && !User.IsInRole("Admin"))
        {
            ModelState.AddModelError(string.Empty, "结构性病害必须由工程师或以上级别人员验收销项");
        }

        if (ModelState.IsValid)
        {
            var user = await _userManager.GetUserAsync(User);

            if (viewModel.IsApproved)
            {
                defect.Status = DefectStatus.Closed;
                defect.AcceptorId = user!.Id;
                defect.AcceptedAt = DateTime.Now;
                defect.AcceptanceComment = viewModel.AcceptanceComment;
                defect.UpdatedAt = DateTime.Now;

                _context.Update(defect);

                var history = new DefectHistory
                {
                    DefectId = defect.Id,
                    ActionType = DefectStatus.Closed,
                    Description = $"验收通过：{viewModel.AcceptanceComment}",
                    OperatorId = user.Id,
                    OperatedAt = DateTime.Now,
                    Remark = "病害销项"
                };

                _context.DefectHistories.Add(history);
            }
            else
            {
                defect.Status = DefectStatus.Returned;
                defect.AcceptorId = user!.Id;
                defect.AcceptedAt = DateTime.Now;
                defect.AcceptanceComment = viewModel.AcceptanceComment;
                defect.UpdatedAt = DateTime.Now;

                _context.Update(defect);

                var history = new DefectHistory
                {
                    DefectId = defect.Id,
                    ActionType = DefectStatus.Returned,
                    Description = $"验收退回：{viewModel.AcceptanceComment}",
                    OperatorId = user.Id,
                    OperatedAt = DateTime.Now,
                    Remark = "退回重维"
                };

                _context.DefectHistories.Add(history);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = defect.Id });
        }

        var defectWithBridge = await _context.Defects
            .Include(d => d.Bridge)
            .FirstOrDefaultAsync(d => d.Id == id);
        ViewBag.Defect = defectWithBridge;
        ViewBag.IsStructural = defect.RequiresStructuralReview || defect.Severity == DefectSeverity.Structural;

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "EngineerPolicy")]
    public async Task<IActionResult> Upgrade(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var defect = await _context.Defects.FindAsync(id);
        if (defect == null)
        {
            return NotFound();
        }

        if (defect.IsUpgraded || defect.RequiresStructuralReview)
        {
            return BadRequest("病害已是升级状态，无需重复升级");
        }

        if (!defect.Severity.HasValue)
        {
            return BadRequest("未评定的病害无法升级，请先进行评定");
        }

        if (defect.Status == DefectStatus.Closed)
        {
            return BadRequest("已销项的病害无法升级");
        }

        var user = await _userManager.GetUserAsync(User);

        defect.IsUpgraded = true;
        defect.RequiresStructuralReview = true;
        if (defect.Severity < DefectSeverity.Structural)
        {
            defect.Severity = DefectSeverity.Structural;
        }
        defect.UpdatedAt = DateTime.Now;

        _context.Update(defect);

        var history = new DefectHistory
        {
            DefectId = defect.Id,
            ActionType = defect.Status,
            Description = "病害升级为结构性病害，需重点关注和处理",
            OperatorId = user!.Id,
            OperatedAt = DateTime.Now,
            Remark = "病害升级"
        };

        _context.DefectHistories.Add(history);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), new { id = defect.Id });
    }

    private static string GetSeverityName(DefectSeverity severity)
    {
        return severity switch
        {
            DefectSeverity.Slight => "轻微",
            DefectSeverity.Moderate => "一般",
            DefectSeverity.Severe => "严重",
            DefectSeverity.Structural => "结构性",
            _ => "未知"
        };
    }
}
