using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SealManagementSystem.Models
{
    public enum BorrowStatus
    {
        [Display(Name = "待法务审核")]
        PendingLegal = 1,
        [Display(Name = "法务审核通过")]
        LegalApproved = 2,
        [Display(Name = "法务审核驳回")]
        LegalRejected = 3,
        [Display(Name = "待行政交接")]
        PendingHandover = 4,
        [Display(Name = "外借中")]
        Borrowed = 5,
        [Display(Name = "待风控复核")]
        PendingRiskReview = 6,
        [Display(Name = "已归还")]
        Returned = 7,
        [Display(Name = "归还异常")]
        ReturnException = 8,
        [Display(Name = "已取消")]
        Cancelled = 9
    }

    public enum ExceptionReason
    {
        [Display(Name = "无异常")]
        None = 0,
        [Display(Name = "合同缺失")]
        ContractMissing = 1,
        [Display(Name = "超期未还")]
        Overdue = 2,
        [Display(Name = "用印范围不符")]
        ScopeMismatch = 3,
        [Display(Name = "印章损坏")]
        SealDamaged = 4,
        [Display(Name = "其他")]
        Other = 99
    }

    public class BorrowRequest
    {
        public int BorrowRequestId { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequestCode { get; set; } = string.Empty;

        [Required]
        public int SealId { get; set; }

        [ForeignKey(nameof(SealId))]
        public Seal Seal { get; set; } = null!;

        [Required]
        public int ContractId { get; set; }

        [ForeignKey(nameof(ContractId))]
        public Contract Contract { get; set; } = null!;

        [Required]
        public int ApplicantId { get; set; }

        [ForeignKey(nameof(ApplicantId))]
        public User Applicant { get; set; } = null!;

        [Required]
        [MaxLength(500)]
        public string UsageScope { get; set; } = string.Empty;

        [Required]
        public DateTime PlannedBorrowDate { get; set; }

        [Required]
        public DateTime PlannedReturnDate { get; set; }

        public DateTime? ActualBorrowDate { get; set; }
        public DateTime? ActualReturnDate { get; set; }

        [Required]
        public BorrowStatus Status { get; set; }

        public ExceptionReason ExceptionReason { get; set; } = ExceptionReason.None;

        [MaxLength(1000)]
        public string? ExceptionDescription { get; set; }

        [MaxLength(1000)]
        public string? RiskReviewRemark { get; set; }

        public int BorrowDuration => (int)(ActualReturnDate?.Subtract(ActualBorrowDate ?? PlannedBorrowDate).TotalDays
            ?? DateTime.Now.Subtract(ActualBorrowDate ?? PlannedBorrowDate).TotalDays);

        public bool IsOverdue
        {
            get
            {
                if (Status == BorrowStatus.Returned || Status == BorrowStatus.ReturnException)
                {
                    return (ActualReturnDate ?? DateTime.Now) > PlannedReturnDate;
                }
                return DateTime.Now > PlannedReturnDate;
            }
        }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<ApprovalNode> ApprovalNodes { get; set; } = new List<ApprovalNode>();
    }
}
