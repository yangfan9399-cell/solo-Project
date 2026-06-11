using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SealManagementSystem.Models
{
    public enum UserRole
    {
        [Display(Name = "申请人")]
        Applicant = 1,
        [Display(Name = "法务审核")]
        LegalReviewer = 2,
        [Display(Name = "行政交接")]
        AdminStaff = 3,
        [Display(Name = "风控复核")]
        RiskReviewer = 4
    }

    public class User
    {
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string EmployeeId { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        [ForeignKey(nameof(DepartmentId))]
        public Department Department { get; set; } = null!;

        public ICollection<BorrowRequest> BorrowRequests { get; set; } = new List<BorrowRequest>();
        public ICollection<ApprovalNode> ApprovalNodes { get; set; } = new List<ApprovalNode>();
    }
}
