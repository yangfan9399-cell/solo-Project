using Microsoft.AspNetCore.Identity;

namespace EquipmentMaintenanceSystem.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? RealName { get; set; }
        public UserRole Role { get; set; }
    }

    public enum UserRole
    {
        Operator = 1,
        TeamLeader = 2,
        Maintenance = 3,
        Engineer = 4
    }
}