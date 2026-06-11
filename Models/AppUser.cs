using System.ComponentModel.DataAnnotations;

namespace OceanFarm.Models;

public class AppUser
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string FullName { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
