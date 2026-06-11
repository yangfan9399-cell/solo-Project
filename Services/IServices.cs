using SealManagementSystem.Models;
using SealManagementSystem.Models.DTOs;

namespace SealManagementSystem.Services
{
    public interface IBorrowRequestService
    {
        Task<IEnumerable<BorrowRequest>> GetAllRequestsAsync();
        Task<BorrowRequest?> GetRequestByIdAsync(int id);
        Task<BorrowRequestDetailViewModel?> GetRequestDetailAsync(int id);
        Task<CreateBorrowRequestViewModel> GetCreateViewModelAsync();
        Task<(bool Success, string Message, BorrowRequest? Request)> CreateRequestAsync(BorrowRequest request);
    }

    public interface IApprovalService
    {
        Task<(bool Success, string Message)> LegalReviewAsync(int requestId, int operatorId, bool isApproved, string? remark);
        Task<(bool Success, string Message)> AdminHandoverAsync(int requestId, int operatorId);
    }

    public interface IReturnService
    {
        Task<(bool Success, string Message)> RegisterReturnAsync(int requestId, int operatorId, DateTime returnDate, string? remark);
        Task<(bool Success, string Message)> RiskReviewAsync(int requestId, int operatorId, bool hasException, ExceptionReason? reason, string? description, string? remark);
    }

    public interface IDashboardService
    {
        Task<DashboardViewModel> GetDashboardDataAsync();
    }
}
