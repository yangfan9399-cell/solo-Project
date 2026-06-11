using SealManagementSystem.Models;

namespace SealManagementSystem.Models.DTOs
{
    public class DashboardViewModel
    {
        public int TotalRequests { get; set; }
        public int PendingLegal { get; set; }
        public int Borrowed { get; set; }
        public int PendingRisk { get; set; }
        public int ReturnedNormal { get; set; }
        public int ReturnException { get; set; }
        public int OverdueCount { get; set; }

        public List<DepartmentStats> DepartmentStats { get; set; } = new();
        public List<SealTypeStats> SealTypeStats { get; set; } = new();
        public List<ExceptionStats> ExceptionStats { get; set; } = new();
        public List<DurationStats> DurationStats { get; set; } = new();
        public List<BorrowRequest> RecentRequests { get; set; } = new();
        public List<BorrowRequest> ExceptionRequests { get; set; } = new();
    }

    public class DepartmentStats
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int NormalCount { get; set; }
        public int ExceptionCount { get; set; }
    }

    public class SealTypeStats
    {
        public SealType SealType { get; set; }
        public string SealTypeName { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int Available { get; set; }
        public int Borrowed { get; set; }
    }

    public class ExceptionStats
    {
        public ExceptionReason Reason { get; set; }
        public string ReasonName { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class DurationStats
    {
        public string DurationRange { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class BorrowRequestDetailViewModel
    {
        public BorrowRequest Request { get; set; } = null!;
        public List<ApprovalNode> ApprovalNodes { get; set; } = new();
    }

    public class CreateBorrowRequestViewModel
    {
        public int SealId { get; set; }
        public int ContractId { get; set; }
        public string UsageScope { get; set; } = string.Empty;
        public DateTime PlannedBorrowDate { get; set; } = DateTime.Today;
        public DateTime PlannedReturnDate { get; set; } = DateTime.Today.AddDays(3);

        public List<Seal> AvailableSeals { get; set; } = new();
        public List<Contract> AvailableContracts { get; set; } = new();
    }

    public class ApprovalViewModel
    {
        public int BorrowRequestId { get; set; }
        public bool IsApproved { get; set; }
        public string? Remark { get; set; }
    }

    public class ReturnViewModel
    {
        public int BorrowRequestId { get; set; }
        public DateTime ActualReturnDate { get; set; } = DateTime.Now;
        public ExceptionReason? ExceptionReason { get; set; }
        public string? ExceptionDescription { get; set; }
        public string? ReturnRemark { get; set; }
    }
}
