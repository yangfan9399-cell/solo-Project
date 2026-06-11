using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SealManagementSystem.Models
{
    public enum SealType
    {
        [Display(Name = "公章")]
        CompanySeal = 1,
        [Display(Name = "合同专用章")]
        ContractSeal = 2,
        [Display(Name = "财务专用章")]
        FinanceSeal = 3,
        [Display(Name = "法人章")]
        LegalPersonSeal = 4,
        [Display(Name = "发票专用章")]
        InvoiceSeal = 5
    }

    public enum SealStatus
    {
        [Display(Name = "可用")]
        Available = 1,
        [Display(Name = "外借中")]
        Borrowed = 2,
        [Display(Name = "维护中")]
        Maintenance = 3,
        [Display(Name = "停用")]
        Deactivated = 4
    }

    public class Seal
    {
        public int SealId { get; set; }

        [Required]
        [MaxLength(100)]
        public string SealName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string SealCode { get; set; } = string.Empty;

        [Required]
        public SealType SealType { get; set; }

        [Required]
        public SealStatus Status { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        [ForeignKey(nameof(DepartmentId))]
        public Department Department { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<BorrowRequest> BorrowRequests { get; set; } = new List<BorrowRequest>();
    }
}
