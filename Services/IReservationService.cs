using HazardousGoodsYard.Models;

namespace HazardousGoodsYard.Services;

public interface IReservationService
{
    Task<Reservation?> GetReservationById(int id);
    Task<Reservation?> GetReservationByNumber(string reservationNumber);
    Task<List<Reservation>> GetAllReservations();
    Task<List<Reservation>> GetReservationsByStatus(ReservationStatus status);
    Task<List<Reservation>> GetReservationsByUser(string userId);
    Task<Reservation> CreateReservation(CreateReservationViewModel model, string userId);
    Task<bool> AssignArea(int reservationId, int yardAreaId, int? isolationZoneId, string dispatcherUserId);
    Task<bool> VerifyDocuments(int reservationId, string safetyOfficerUserId, List<int> approvedDocumentIds, List<int> rejectedDocumentIds);
    Task<bool> ReviewReservation(int reservationId, string reviewerUserId, bool approve, string? rejectionReason);
    Task<bool> RejectReservation(int reservationId, string userId, RejectionReasonType reasonType, string reason);
    Task<bool> CheckExpiredReservations();
    Task AddHistory(int reservationId, ReservationAction action, ReservationStatus? fromStatus, ReservationStatus? toStatus, string? description, string? operatorUserId);
}

public class CreateReservationViewModel
{
    public string UNNumber { get; set; } = string.Empty;
    public HazardClass HazardClass { get; set; }
    public string GoodsName { get; set; } = string.Empty;
    public string ContainerNumber { get; set; } = string.Empty;
    public string GoodsCategory { get; set; } = string.Empty;
    public string? SpecialInstructions { get; set; }
    public DateTime ReservationWindowStart { get; set; }
    public DateTime ReservationWindowEnd { get; set; }
    public string? Remarks { get; set; }
}