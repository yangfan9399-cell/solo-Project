using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingRoomEquipment.Models;

[Table("Users")]
public class User
{
    [Key]
    [MaxLength(20)]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    [MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public bool IsActive { get; set; } = true;
}

public class CurrentUserOptions
{
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
