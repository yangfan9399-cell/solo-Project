using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace BridgeInspection.Models;

public class ApplicationUser : IdentityUser
{
    [Required]
    [StringLength(50)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Department { get; set; }

    [StringLength(20)]
    public string? RoleDisplayName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public bool IsActive { get; set; } = true;

    public ICollection<Defect> ReportedDefects { get; set; } = new List<Defect>();

    public ICollection<Defect> AssessedDefects { get; set; } = new List<Defect>();

    public ICollection<Defect> MaintainedDefects { get; set; } = new List<Defect>();

    public ICollection<Defect> AcceptedDefects { get; set; } = new List<Defect>();

    public ICollection<DefectHistory> OperatedHistories { get; set; } = new List<DefectHistory>();
}
