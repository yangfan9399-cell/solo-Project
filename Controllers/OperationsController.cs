using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SurgicalInstrumentTracking.Data;
using SurgicalInstrumentTracking.Models;
using SurgicalInstrumentTracking.ViewModels;

namespace SurgicalInstrumentTracking.Controllers;

public class OperationsController : Controller
{
    private readonly AppDbContext _context;

    public OperationsController(AppDbContext context)
    {
        _context = context;
    }

    public IActionResult Pack()
    {
        var viewModel = new PackSetViewModel
        {
            SetType = "普外科",
            Items = _context.Instruments
                .OrderBy(i => i.Name)
                .Select(i => new InstrumentItemViewModel
                {
                    InstrumentId = i.Id,
                    InstrumentName = i.Name + " - " + (i.Specification ?? ""),
                    ExpectedQuantity = 2,
                    ActualQuantity = 2
                })
                .ToList()
        };

        ViewData["Departments"] = _context.Departments.OrderBy(d => d.Name).ToList();
        ViewData["SupplyStaff"] = _context.Users
            .Where(u => u.Role == UserRole.SupplyStaff)
            .OrderBy(u => u.Name)
            .ToList();

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Pack(PackSetViewModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewData["Departments"] = _context.Departments.OrderBy(d => d.Name).ToList();
            ViewData["SupplyStaff"] = _context.Users
                .Where(u => u.Role == UserRole.SupplyStaff)
                .OrderBy(u => u.Name)
                .ToList();
            return View(model);
        }

        var now = DateTime.Now;

        var instrumentSet = new InstrumentSet
        {
            SetCode = model.SetCode,
            Name = model.Name,
            Description = model.Description,
            SetType = model.SetType,
            Status = InstrumentSetStatus.Packed,
            DepartmentId = model.DepartmentId,
            CreatedAt = now,
            UpdatedAt = now
        };

        foreach (var item in model.Items.Where(i => i.ExpectedQuantity > 0))
        {
            instrumentSet.Items.Add(new InstrumentSetItem
            {
                InstrumentId = item.InstrumentId,
                ExpectedQuantity = item.ExpectedQuantity,
                ActualQuantity = item.ActualQuantity
            });
        }

        _context.InstrumentSets.Add(instrumentSet);
        _context.SaveChanges();

        var trackingRecord = new TrackingRecord
        {
            InstrumentSetId = instrumentSet.Id,
            Action = TrackingAction.Packed,
            UserId = model.PackedByUserId,
            ActionTime = now,
            Remarks = "器械打包完成",
            FromStatus = null,
            ToStatus = InstrumentSetStatus.Packed
        };
        _context.TrackingRecords.Add(trackingRecord);
        _context.SaveChanges();

        return RedirectToAction(nameof(InstrumentSetsController.Details), "InstrumentSets", new { id = instrumentSet.Id });
    }

    public IActionResult Sterilize(int? id)
    {
        var packedSets = _context.InstrumentSets
            .Include(s => s.Department)
            .Where(s => s.Status == InstrumentSetStatus.Packed)
            .OrderBy(s => s.CreatedAt)
            .ToList();

        ViewData["PackedSets"] = packedSets;
        ViewData["SupplyStaff"] = _context.Users
            .Where(u => u.Role == UserRole.SupplyStaff)
            .OrderBy(u => u.Name)
            .ToList();

        var viewModel = new SterilizeSetViewModel
        {
            SterilizationDate = DateTime.Now,
            ExpirationDate = DateTime.Now.AddDays(30),
            SterilizationMethod = "高压蒸汽灭菌"
        };

        if (id.HasValue)
        {
            var set = _context.InstrumentSets.Find(id.Value);
            if (set != null)
            {
                viewModel.InstrumentSetId = set.Id;
                viewModel.SetCode = set.SetCode;
                viewModel.SetName = set.Name;
            }
        }

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Sterilize(SterilizeSetViewModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewData["PackedSets"] = _context.InstrumentSets
                .Include(s => s.Department)
                .Where(s => s.Status == InstrumentSetStatus.Packed)
                .ToList();
            ViewData["SupplyStaff"] = _context.Users
                .Where(u => u.Role == UserRole.SupplyStaff)
                .OrderBy(u => u.Name)
                .ToList();
            return View(model);
        }

        var batch = new SterilizationBatch
        {
            BatchNumber = model.BatchNumber,
            SterilizationDate = model.SterilizationDate,
            ExpirationDate = model.ExpirationDate,
            SterilizerCode = model.SterilizerCode,
            SterilizationMethod = model.SterilizationMethod,
            PackedByUserId = model.PackedByUserId
        };
        _context.SterilizationBatches.Add(batch);
        _context.SaveChanges();

        var set = _context.InstrumentSets.Find(model.InstrumentSetId);
        if (set == null)
        {
            return NotFound();
        }

        var oldStatus = set.Status;
        set.SterilizationBatchId = batch.Id;
        set.Status = InstrumentSetStatus.Sterilized;
        set.UpdatedAt = DateTime.Now;

        var trackingRecord = new TrackingRecord
        {
            InstrumentSetId = set.Id,
            Action = TrackingAction.Sterilized,
            UserId = model.PackedByUserId,
            ActionTime = DateTime.Now,
            Remarks = $"灭菌完成，批次号: {model.BatchNumber}",
            FromStatus = oldStatus,
            ToStatus = InstrumentSetStatus.Sterilized
        };
        _context.TrackingRecords.Add(trackingRecord);
        _context.SaveChanges();

        return RedirectToAction(nameof(InstrumentSetsController.Details), "InstrumentSets", new { id = set.Id });
    }

    public IActionResult Receive(int id)
    {
        var set = _context.InstrumentSets
            .Include(s => s.Department)
            .Include(s => s.SterilizationBatch)
            .Include(s => s.Items)
                .ThenInclude(i => i.Instrument)
            .FirstOrDefault(s => s.Id == id);

        if (set == null)
        {
            return NotFound();
        }

        var isExpired = set.SterilizationBatch?.IsExpired ?? false;

        var viewModel = new ReceiveSetViewModel
        {
            InstrumentSetId = set.Id,
            SetCode = set.SetCode,
            SetName = set.Name,
            DepartmentName = set.Department.Name,
            BatchNumber = set.SterilizationBatch?.BatchNumber,
            ExpirationDate = set.SterilizationBatch?.ExpirationDate,
            IsExpired = isExpired,
            HasMissingItems = set.Items.Any(i => i.ActualQuantity < i.ExpectedQuantity),
            Items = set.Items.Select(i => new InstrumentItemViewModel
            {
                InstrumentId = i.InstrumentId,
                InstrumentName = i.Instrument.Name + " - " + (i.Instrument.Specification ?? ""),
                ExpectedQuantity = i.ExpectedQuantity,
                ActualQuantity = i.ActualQuantity
            }).ToList()
        };

        ViewData["OrNurses"] = _context.Users
            .Where(u => u.Role == UserRole.OperatingRoomNurse)
            .OrderBy(u => u.Name)
            .ToList();

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Receive(ReceiveSetViewModel model)
    {
        var set = _context.InstrumentSets
            .Include(s => s.SterilizationBatch)
            .FirstOrDefault(s => s.Id == model.InstrumentSetId);

        if (set == null)
        {
            return NotFound();
        }

        if (set.SterilizationBatch?.IsExpired ?? false)
        {
            ModelState.AddModelError(string.Empty, "灭菌已过期，无法发放！请重新灭菌后再领用。");
            ViewData["OrNurses"] = _context.Users
                .Where(u => u.Role == UserRole.OperatingRoomNurse)
                .ToList();

            var setDetail = _context.InstrumentSets
                .Include(s => s.Department)
                .Include(s => s.SterilizationBatch)
                .Include(s => s.Items).ThenInclude(i => i.Instrument)
                .First(s => s.Id == model.InstrumentSetId);

            model.SetCode = setDetail.SetCode;
            model.SetName = setDetail.Name;
            model.DepartmentName = setDetail.Department.Name;
            model.BatchNumber = setDetail.SterilizationBatch?.BatchNumber;
            model.ExpirationDate = setDetail.SterilizationBatch?.ExpirationDate;
            model.IsExpired = setDetail.SterilizationBatch?.IsExpired ?? false;
            model.Items = setDetail.Items.Select(i => new InstrumentItemViewModel
            {
                InstrumentId = i.InstrumentId,
                InstrumentName = i.Instrument.Name + " - " + (i.Instrument.Specification ?? ""),
                ExpectedQuantity = i.ExpectedQuantity,
                ActualQuantity = i.ActualQuantity
            }).ToList();

            return View(model);
        }

        var oldStatus = set.Status;
        var now = DateTime.Now;
        set.Status = InstrumentSetStatus.InUse;
        set.ReceivedByUserId = model.ReceivedByUserId;
        set.ReceivedAt = now;
        set.UpdatedAt = now;

        var trackingRecord = new TrackingRecord
        {
            InstrumentSetId = set.Id,
            Action = TrackingAction.Received,
            UserId = model.ReceivedByUserId,
            ActionTime = now,
            Remarks = string.IsNullOrEmpty(model.Remarks) ? "手术室护士确认接收" : model.Remarks,
            FromStatus = oldStatus,
            ToStatus = InstrumentSetStatus.InUse
        };
        _context.TrackingRecords.Add(trackingRecord);
        _context.SaveChanges();

        return RedirectToAction(nameof(InstrumentSetsController.Details), "InstrumentSets", new { id = set.Id });
    }

    public IActionResult QualityReview(int id)
    {
        var set = _context.InstrumentSets
            .Include(s => s.Department)
            .Include(s => s.SterilizationBatch)
            .Include(s => s.Items)
                .ThenInclude(i => i.Instrument)
            .FirstOrDefault(s => s.Id == id);

        if (set == null)
        {
            return NotFound();
        }

        var viewModel = new QualityReviewViewModel
        {
            InstrumentSetId = set.Id,
            SetCode = set.SetCode,
            SetName = set.Name,
            CurrentStatus = set.Status,
            Items = set.Items.Select(i => new InstrumentItemViewModel
            {
                InstrumentId = i.InstrumentId,
                InstrumentName = i.Instrument.Name + " - " + (i.Instrument.Specification ?? ""),
                ExpectedQuantity = i.ExpectedQuantity,
                ActualQuantity = i.ActualQuantity
            }).ToList()
        };

        ViewData["Reviewers"] = _context.Users
            .Where(u => u.Role == UserRole.QualityReviewer)
            .OrderBy(u => u.Name)
            .ToList();

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult QualityReview(QualityReviewViewModel model)
    {
        var set = _context.InstrumentSets.Find(model.InstrumentSetId);
        if (set == null)
        {
            return NotFound();
        }

        var oldStatus = set.Status;
        var now = DateTime.Now;
        set.UpdatedAt = now;

        TrackingRecord trackingRecord;

        switch (model.Decision)
        {
            case "Release":
                set.Status = InstrumentSetStatus.ReadyForUse;
                trackingRecord = new TrackingRecord
                {
                    InstrumentSetId = set.Id,
                    Action = TrackingAction.QualityPassed,
                    UserId = model.ReviewerId,
                    ActionTime = now,
                    Remarks = string.IsNullOrEmpty(model.Remarks) ? "质控复核通过，准予放行" : model.Remarks,
                    FromStatus = oldStatus,
                    ToStatus = InstrumentSetStatus.ReadyForUse
                };
                break;

            case "Replenish":
                set.Status = InstrumentSetStatus.MissingItems;
                trackingRecord = new TrackingRecord
                {
                    InstrumentSetId = set.Id,
                    Action = TrackingAction.ReplenishmentStarted,
                    UserId = model.ReviewerId,
                    ActionTime = now,
                    Remarks = string.IsNullOrEmpty(model.Remarks) ? "质控发现缺件，进入补包流程" : model.Remarks,
                    FromStatus = oldStatus,
                    ToStatus = InstrumentSetStatus.MissingItems
                };

                var anomaly = new AnomalyRecord
                {
                    InstrumentSetId = set.Id,
                    AnomalyType = AnomalyType.MissingItems,
                    Description = string.IsNullOrEmpty(model.Remarks) ? "质控复核发现缺件" : model.Remarks,
                    ReportedByUserId = model.ReviewerId,
                    ReportedAt = now,
                    Resolved = false
                };
                _context.AnomalyRecords.Add(anomaly);
                break;

            case "Return":
                set.Status = InstrumentSetStatus.Returned;
                trackingRecord = new TrackingRecord
                {
                    InstrumentSetId = set.Id,
                    Action = TrackingAction.QualityRejected,
                    UserId = model.ReviewerId,
                    ActionTime = now,
                    Remarks = string.IsNullOrEmpty(model.Remarks) ? "质控复核不通过，退回" : model.Remarks,
                    FromStatus = oldStatus,
                    ToStatus = InstrumentSetStatus.Returned
                };
                break;

            default:
                ModelState.AddModelError(string.Empty, "无效的复核决定");
                ViewData["Reviewers"] = _context.Users
                    .Where(u => u.Role == UserRole.QualityReviewer)
                    .ToList();
                return View(model);
        }

        _context.TrackingRecords.Add(trackingRecord);
        _context.SaveChanges();

        return RedirectToAction(nameof(InstrumentSetsController.Details), "InstrumentSets", new { id = set.Id });
    }

    public IActionResult ReportAnomaly(int id)
    {
        var set = _context.InstrumentSets
            .Include(s => s.Department)
            .FirstOrDefault(s => s.Id == id);

        if (set == null)
        {
            return NotFound();
        }

        var viewModel = new AnomalyReportViewModel
        {
            InstrumentSetId = set.Id,
            SetCode = set.SetCode,
            SetName = set.Name
        };

        ViewData["OrNurses"] = _context.Users
            .Where(u => u.Role == UserRole.OperatingRoomNurse)
            .OrderBy(u => u.Name)
            .ToList();

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult ReportAnomaly(AnomalyReportViewModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewData["OrNurses"] = _context.Users
                .Where(u => u.Role == UserRole.OperatingRoomNurse)
                .ToList();
            return View(model);
        }

        var set = _context.InstrumentSets.Find(model.InstrumentSetId);
        if (set == null)
        {
            return NotFound();
        }

        var oldStatus = set.Status;
        var now = DateTime.Now;

        InstrumentSetStatus newStatus = model.AnomalyType switch
        {
            AnomalyType.MissingItems => InstrumentSetStatus.MissingItems,
            AnomalyType.SterilizationExpired => InstrumentSetStatus.Expired,
            AnomalyType.WrongDepartment => InstrumentSetStatus.WrongDepartment,
            _ => InstrumentSetStatus.Quarantine
        };

        set.Status = newStatus;
        set.UpdatedAt = now;

        var anomaly = new AnomalyRecord
        {
            InstrumentSetId = set.Id,
            AnomalyType = model.AnomalyType,
            Description = model.Description,
            ReportedByUserId = model.ReportedByUserId,
            ReportedAt = now,
            Resolved = false
        };
        _context.AnomalyRecords.Add(anomaly);

        var trackingRecord = new TrackingRecord
        {
            InstrumentSetId = set.Id,
            Action = TrackingAction.AnomalyReported,
            UserId = model.ReportedByUserId,
            ActionTime = now,
            Remarks = $"异常上报: {model.AnomalyType} - {model.Description}",
            FromStatus = oldStatus,
            ToStatus = newStatus
        };
        _context.TrackingRecords.Add(trackingRecord);

        _context.SaveChanges();

        return RedirectToAction(nameof(InstrumentSetsController.Details), "InstrumentSets", new { id = set.Id });
    }

    public IActionResult CompleteReplenishment(int id)
    {
        var set = _context.InstrumentSets
            .Include(s => s.Department)
            .Include(s => s.Items)
                .ThenInclude(i => i.Instrument)
            .Include(s => s.AnomalyRecords)
                .ThenInclude(a => a.ReportedByUser)
            .FirstOrDefault(s => s.Id == id);

        if (set == null)
        {
            return NotFound();
        }

        if (set.Status != InstrumentSetStatus.MissingItems)
        {
            ModelState.AddModelError(string.Empty, "只有缺件状态的器械包才能执行补包完成操作。");
            return View("Error");
        }

        var missingItems = set.Items
            .Where(i => i.ActualQuantity < i.ExpectedQuantity)
            .Select(i => new InstrumentItemViewModel
            {
                InstrumentId = i.InstrumentId,
                InstrumentName = i.Instrument.Name + " - " + (i.Instrument.Specification ?? ""),
                ExpectedQuantity = i.ExpectedQuantity,
                ActualQuantity = i.ActualQuantity
            })
            .ToList();

        var activeAnomaly = set.AnomalyRecords
            .FirstOrDefault(a => !a.Resolved && a.AnomalyType == AnomalyType.MissingItems);

        var viewModel = new CompleteReplenishmentViewModel
        {
            InstrumentSetId = set.Id,
            SetCode = set.SetCode,
            SetName = set.Name,
            DepartmentName = set.Department.Name,
            MissingItems = missingItems,
            TotalMissingCount = missingItems.Sum(i => i.ExpectedQuantity - i.ActualQuantity),
            ReportedAt = activeAnomaly?.ReportedAt ?? set.UpdatedAt,
            SupplyStaff = _context.Users
                .Where(u => u.Role == UserRole.SupplyStaff)
                .OrderBy(u => u.Name)
                .ToList()
        };

        return View(viewModel);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult CompleteReplenishment(CompleteReplenishmentViewModel model)
    {
        var set = _context.InstrumentSets
            .Include(s => s.Items)
            .Include(s => s.AnomalyRecords)
            .FirstOrDefault(s => s.Id == model.InstrumentSetId);

        if (set == null)
        {
            return NotFound();
        }

        if (set.Status != InstrumentSetStatus.MissingItems)
        {
            ModelState.AddModelError(string.Empty, "只有缺件状态的器械包才能执行补包完成操作。");
            model.MissingItems = set.Items
                .Where(i => i.ActualQuantity < i.ExpectedQuantity)
                .Select(i => new InstrumentItemViewModel
                {
                    InstrumentId = i.InstrumentId,
                    InstrumentName = i.Instrument.Name,
                    ExpectedQuantity = i.ExpectedQuantity,
                    ActualQuantity = i.ActualQuantity
                })
                .ToList();
            model.SupplyStaff = _context.Users
                .Where(u => u.Role == UserRole.SupplyStaff)
                .ToList();
            return View(model);
        }

        var now = DateTime.Now;
        var oldStatus = set.Status;

        var missingItemCount = set.Items.Count(i => i.ActualQuantity < i.ExpectedQuantity);
        var totalMissingQuantity = set.Items.Sum(i => i.ExpectedQuantity - i.ActualQuantity);

        foreach (var item in set.Items)
        {
            if (item.ActualQuantity < item.ExpectedQuantity)
            {
                item.ActualQuantity = item.ExpectedQuantity;
            }
        }

        var activeAnomalies = set.AnomalyRecords
            .Where(a => !a.Resolved && a.AnomalyType == AnomalyType.MissingItems)
            .ToList();

        foreach (var anomaly in activeAnomalies)
        {
            var duration = now - anomaly.ReportedAt;
            anomaly.Resolved = true;
            anomaly.ResolvedAt = now;
            anomaly.ResolutionNotes = string.IsNullOrEmpty(model.ResolutionNotes)
                ? "补包完成，所有缺件器械已补齐"
                : model.ResolutionNotes;
            anomaly.ReplenishmentDurationMinutes = (int)Math.Round(duration.TotalMinutes);
        }

        set.Status = InstrumentSetStatus.Replenished;
        set.UpdatedAt = now;

        var trackingRecord = new TrackingRecord
        {
            InstrumentSetId = set.Id,
            Action = TrackingAction.ReplenishmentCompleted,
            UserId = model.CompletedByUserId,
            ActionTime = now,
            Remarks = string.IsNullOrEmpty(model.Remarks)
                ? $"补包完成，共补齐 {missingItemCount} 种器械，合计 {totalMissingQuantity} 件"
                : model.Remarks,
            FromStatus = oldStatus,
            ToStatus = InstrumentSetStatus.Replenished
        };
        _context.TrackingRecords.Add(trackingRecord);

        _context.SaveChanges();

        return RedirectToAction(nameof(InstrumentSetsController.Details), "InstrumentSets", new { id = set.Id });
    }
}
