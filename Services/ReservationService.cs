using HazardousGoodsYard.Data;
using HazardousGoodsYard.Models;
using Microsoft.EntityFrameworkCore;

namespace HazardousGoodsYard.Services;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _context;
    private readonly IIsolationValidationService _validationService;

    public ReservationService(ApplicationDbContext context, IIsolationValidationService validationService)
    {
        _context = context;
        _validationService = validationService;
    }

    public async Task<Reservation?> GetReservationById(int id)
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .Include(r => r.ForwarderUser)
            .Include(r => r.DispatcherUser)
            .Include(r => r.SafetyOfficerUser)
            .Include(r => r.ReviewerUser)
            .Include(r => r.Histories)
            .Include(r => r.SafetyDocuments)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Reservation?> GetReservationByNumber(string reservationNumber)
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .Include(r => r.ForwarderUser)
            .Include(r => r.DispatcherUser)
            .Include(r => r.SafetyOfficerUser)
            .Include(r => r.ReviewerUser)
            .Include(r => r.Histories)
            .Include(r => r.SafetyDocuments)
            .FirstOrDefaultAsync(r => r.ReservationNumber == reservationNumber);
    }

    public async Task<List<Reservation>> GetAllReservations()
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .Include(r => r.ForwarderUser)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Reservation>> GetReservationsByStatus(ReservationStatus status)
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .Include(r => r.ForwarderUser)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Reservation>> GetReservationsByUser(string userId)
    {
        return await _context.Reservations
            .Include(r => r.HazardousGood)
            .Include(r => r.YardArea)
            .Include(r => r.IsolationZone)
            .Where(r => r.ForwarderUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Reservation> CreateReservation(CreateReservationViewModel model, string userId)
    {
        var hazardousGood = new HazardousGood
        {
            UNNumber = model.UNNumber,
            HazardClass = model.HazardClass,
            GoodsName = model.GoodsName,
            ContainerNumber = model.ContainerNumber,
            GoodsCategory = model.GoodsCategory,
            SpecialInstructions = model.SpecialInstructions
        };
        _context.HazardousGoods.Add(hazardousGood);
        await _context.SaveChangesAsync();

        var now = DateTime.Now;
        var reservationNumber = "RES" + now.ToString("yyyyMMddHHmmss");

        var reservation = new Reservation
        {
            ReservationNumber = reservationNumber,
            HazardousGoodId = hazardousGood.Id,
            ReservationWindowStart = model.ReservationWindowStart,
            ReservationWindowEnd = model.ReservationWindowEnd,
            Status = ReservationStatus.Pending,
            ForwarderUserId = userId,
            Remarks = model.Remarks,
            CreatedAt = now
        };
        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        await AddHistory(reservation.Id, ReservationAction.Created, null, ReservationStatus.Pending, "货代创建预约申请", userId);

        return reservation;
    }

    public async Task<bool> AssignArea(int reservationId, int yardAreaId, int? isolationZoneId, string dispatcherUserId)
    {
        var reservation = await _context.Reservations
            .Include(r => r.HazardousGood)
            .FirstOrDefaultAsync(r => r.Id == reservationId);

        if (reservation == null || reservation.Status != ReservationStatus.Pending)
        {
            return false;
        }

        var hazardClass = reservation.HazardousGood.HazardClass;

        if (isolationZoneId.HasValue)
        {
            var validationResult = await _validationService.ValidateIsolation(reservationId, isolationZoneId.Value);
            if (!validationResult.IsValid)
            {
                await RejectReservation(reservationId, dispatcherUserId, RejectionReasonType.HazardClassConflict, validationResult.ErrorMessage ?? "危险等级冲突");
                return false;
            }
        }

        var yardArea = await _context.YardAreas.FindAsync(yardAreaId);
        if (yardArea == null || !yardArea.IsActive)
        {
            return false;
        }

        if (!await _validationService.ValidateHazardClassConflictForArea(yardAreaId, hazardClass))
        {
            await RejectReservation(reservationId, dispatcherUserId, RejectionReasonType.HazardClassConflict, "该区域已有冲突的危险等级货物存放");
            return false;
        }

        if (!await _validationService.CheckAreaCapacity(yardAreaId))
        {
            await RejectReservation(reservationId, dispatcherUserId, RejectionReasonType.InsufficientCapacity, "区域容量不足");
            return false;
        }

        var oldStatus = reservation.Status;
        reservation.YardAreaId = yardAreaId;
        reservation.IsolationZoneId = isolationZoneId;
        reservation.DispatcherUserId = dispatcherUserId;
        reservation.Status = ReservationStatus.AreaAssigned;
        reservation.UpdatedAt = DateTime.Now;

        yardArea.CurrentUsage++;

        if (isolationZoneId.HasValue)
        {
            var zone = await _context.IsolationZones.FindAsync(isolationZoneId.Value);
            if (zone != null)
            {
                zone.CurrentUsage++;
                await AddHistory(reservationId, ReservationAction.ZoneAssigned, oldStatus, ReservationStatus.AreaAssigned, $"调度员分配区域 {yardArea.AreaName} 和隔离区 {zone.ZoneName}", dispatcherUserId);
            }
        }
        else
        {
            await AddHistory(reservationId, ReservationAction.AreaAssigned, oldStatus, ReservationStatus.AreaAssigned, $"调度员分配区域 {yardArea.AreaName}", dispatcherUserId);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> VerifyDocuments(int reservationId, string safetyOfficerUserId, List<int> approvedDocumentIds, List<int> rejectedDocumentIds)
    {
        var reservation = await _context.Reservations
            .Include(r => r.SafetyDocuments)
            .FirstOrDefaultAsync(r => r.Id == reservationId);

        if (reservation == null || reservation.Status != ReservationStatus.AreaAssigned)
        {
            return false;
        }

        foreach (var doc in reservation.SafetyDocuments)
        {
            if (approvedDocumentIds.Contains(doc.Id))
            {
                doc.VerificationStatus = VerificationStatus.Approved;
                doc.VerifiedByUserId = safetyOfficerUserId;
                doc.VerifiedAt = DateTime.Now;
                doc.VerificationRemarks = "资料核验通过";
            }
            else if (rejectedDocumentIds.Contains(doc.Id))
            {
                doc.VerificationStatus = VerificationStatus.Rejected;
                doc.VerifiedByUserId = safetyOfficerUserId;
                doc.VerifiedAt = DateTime.Now;
                doc.VerificationRemarks = "资料核验不通过";
            }
        }

        var oldStatus = reservation.Status;
        reservation.SafetyOfficerUserId = safetyOfficerUserId;
        reservation.UpdatedAt = DateTime.Now;

        var hasRejected = reservation.SafetyDocuments.Any(d => d.VerificationStatus == VerificationStatus.Rejected);
        var hasPending = reservation.SafetyDocuments.Any(d => d.VerificationStatus == VerificationStatus.Pending);
        var allDocumentsVerified = !hasRejected && !hasPending && reservation.SafetyDocuments.Count > 0;

        if (hasRejected)
        {
            var missingDocs = reservation.SafetyDocuments.Where(d => d.VerificationStatus == VerificationStatus.Rejected).Select(d => d.DocumentType.ToString()).ToList();
            await RejectReservation(reservationId, safetyOfficerUserId, RejectionReasonType.MissingDocuments, $"安全资料不合格：{string.Join(", ", missingDocs)}");
            return false;
        }
        else if (allDocumentsVerified)
        {
            reservation.Status = ReservationStatus.DocumentsVerified;
            await AddHistory(reservationId, ReservationAction.DocumentsVerified, oldStatus, ReservationStatus.DocumentsVerified, "安全员核验资料通过", safetyOfficerUserId);
        }
        else
        {
            reservation.Status = ReservationStatus.PendingVerification;
            var pendingCount = reservation.SafetyDocuments.Count(d => d.VerificationStatus == VerificationStatus.Pending);
            await AddHistory(reservationId, ReservationAction.DocumentsVerified, oldStatus, ReservationStatus.PendingVerification, $"安全员核验资料，{pendingCount}项待补充", safetyOfficerUserId);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReviewReservation(int reservationId, string reviewerUserId, bool approve, string? rejectionReason)
    {
        var reservation = await _context.Reservations.FindAsync(reservationId);

        if (reservation == null || reservation.Status != ReservationStatus.DocumentsVerified)
        {
            return false;
        }

        var oldStatus = reservation.Status;
        reservation.ReviewerUserId = reviewerUserId;
        reservation.UpdatedAt = DateTime.Now;

        if (approve)
        {
            reservation.Status = ReservationStatus.Completed;
            await AddHistory(reservationId, ReservationAction.ReviewApproved, oldStatus, ReservationStatus.Completed, "复核人确认入库", reviewerUserId);
        }
        else
        {
            reservation.Status = ReservationStatus.Rejected;
            reservation.RejectionReasonType = RejectionReasonType.Other;
            reservation.RejectionReason = rejectionReason ?? "复核人退回";
            await AddHistory(reservationId, ReservationAction.ReviewRejected, oldStatus, ReservationStatus.Rejected, rejectionReason ?? "复核人退回", reviewerUserId);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectReservation(int reservationId, string userId, RejectionReasonType reasonType, string reason)
    {
        var reservation = await _context.Reservations.FindAsync(reservationId);

        if (reservation == null)
        {
            return false;
        }

        var oldStatus = reservation.Status;
        reservation.Status = ReservationStatus.Rejected;
        reservation.RejectionReasonType = reasonType;
        reservation.RejectionReason = reason;
        reservation.UpdatedAt = DateTime.Now;

        if (reservation.YardAreaId.HasValue)
        {
            var area = await _context.YardAreas.FindAsync(reservation.YardAreaId.Value);
            if (area != null)
            {
                area.CurrentUsage--;
            }
        }

        if (reservation.IsolationZoneId.HasValue)
        {
            var zone = await _context.IsolationZones.FindAsync(reservation.IsolationZoneId.Value);
            if (zone != null)
            {
                zone.CurrentUsage--;
            }
        }

        await AddHistory(reservationId, ReservationAction.ReviewRejected, oldStatus, ReservationStatus.Rejected, reason, userId);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CheckExpiredReservations()
    {
        var now = DateTime.Now;
        var expiredReservations = await _context.Reservations
            .Where(r => r.Status != ReservationStatus.Completed && r.Status != ReservationStatus.Rejected && r.Status != ReservationStatus.Expired && r.ReservationWindowEnd < now)
            .ToListAsync();

        foreach (var reservation in expiredReservations)
        {
            var oldStatus = reservation.Status;
            reservation.Status = ReservationStatus.Expired;
            reservation.RejectionReasonType = RejectionReasonType.ExpiredWindow;
            reservation.RejectionReason = "预约窗口已过期，请重新预约";
            reservation.UpdatedAt = now;

            if (reservation.YardAreaId.HasValue)
            {
                var area = await _context.YardAreas.FindAsync(reservation.YardAreaId.Value);
                if (area != null)
                {
                    area.CurrentUsage--;
                }
            }

            if (reservation.IsolationZoneId.HasValue)
            {
                var zone = await _context.IsolationZones.FindAsync(reservation.IsolationZoneId.Value);
                if (zone != null)
                {
                    zone.CurrentUsage--;
                }
            }

            await AddHistory(reservation.Id, ReservationAction.Expired, oldStatus, ReservationStatus.Expired, "预约窗口过期", null);
        }

        await _context.SaveChangesAsync();
        return expiredReservations.Any();
    }

    public async Task AddHistory(int reservationId, ReservationAction action, ReservationStatus? fromStatus, ReservationStatus? toStatus, string? description, string? operatorUserId)
    {
        var history = new ReservationHistory
        {
            ReservationId = reservationId,
            Action = action,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            Description = description,
            OperatorUserId = operatorUserId,
            CreatedAt = DateTime.Now
        };
        _context.ReservationHistories.Add(history);
        await _context.SaveChangesAsync();
    }
}