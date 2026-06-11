using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SealManagementSystem.Models
{
    public enum NodeType
    {
        [Display(Name = "提交申请")]
        Submit = 1,
        [Display(Name = "法务审核")]
        LegalReview = 2,
        [Display(Name = "行政交接")]
        AdminHandover = 3,
        [Display(Name = "归还登记")]
        ReturnRegister = 4,
        [Display(Name = "风控复核")]
        RiskReview = 5
    }

    public enum NodeResult
    {
        [Display(Name = "待定")]
        Pending = 0,
        [Display(Name = "通过")]
        Approved = 1,
        [Display(Name = "驳回")]
        Rejected = 2
    }

    public class ApprovalNode
    {
        public int ApprovalNodeId { get; set; }

        [Required]
        public int BorrowRequestId { get; set; }

        [ForeignKey(nameof(BorrowRequestId))]
        public BorrowRequest BorrowRequest { get; set; } = null!;

        [Required]
        public NodeType NodeType { get; set; }

        public int? OperatorId { get; set; }

        [ForeignKey(nameof(OperatorId))]
        public User? Operator { get; set; }

        public NodeResult Result { get; set; } = NodeResult.Pending;

        [MaxLength(1000)]
        public string? Remark { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ProcessedAt { get; set; }
    }
}
