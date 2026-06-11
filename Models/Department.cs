using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SealManagementSystem.Models
{
    public class Department
    {
        public int DepartmentId { get; set; }

        [Required]
        [MaxLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Description { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Seal> Seals { get; set; } = new List<Seal>();
    }
}
