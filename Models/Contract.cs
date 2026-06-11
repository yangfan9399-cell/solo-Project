using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SealManagementSystem.Models
{
    public enum ContractStatus
    {
        [Display(Name = "草稿")]
        Draft = 1,
        [Display(Name = "待审核")]
        PendingReview = 2,
        [Display(Name = "已审核")]
        Reviewed = 3,
        [Display(Name = "已签署")]
        Signed = 4,
        [Display(Name = "缺失")]
        Missing = 5
    }

    public class Contract
    {
        public int ContractId { get; set; }

        [Required]
        [MaxLength(200)]
        public string ContractName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ContractCode { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? ContractParty { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ContractAmount { get; set; }

        [MaxLength(1000)]
        public string? ContractSummary { get; set; }

        [Required]
        public ContractStatus Status { get; set; }

        public DateTime? SignedDate { get; set; }
        public DateTime? ExpireDate { get; set; }

        [Required]
        public int ApplicantId { get; set; }

        [ForeignKey(nameof(ApplicantId))]
        public User Applicant { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<BorrowRequest> BorrowRequests { get; set; } = new List<BorrowRequest>();
    }
}
