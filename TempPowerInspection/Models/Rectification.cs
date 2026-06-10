using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TempPowerInspection.Models;

public enum RectificationStatus
{
    待整改 = 0,
    整改中 = 1,
    待复检 = 2,
    已通过 = 3
}

public class Rectification
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int HiddenDangerId { get; set; }

    [MaxLength(500)]
    public string? Requirement { get; set; }

    [MaxLength(500)]
    public string? RectificationPhotos { get; set; }

    [MaxLength(500)]
    public string? Feedback { get; set; }

    public DateTime? CompletedAt { get; set; }

    public RectificationStatus Status { get; set; } = RectificationStatus.待整改;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }

    // Navigation property
    [ForeignKey("HiddenDangerId")]
    public HiddenDanger? HiddenDanger { get; set; }

    [NotMapped]
    public string StatusName => Status switch
    {
        RectificationStatus.待整改 => "待整改",
        RectificationStatus.整改中 => "整改中",
        RectificationStatus.待复检 => "待复检",
        RectificationStatus.已通过 => "已通过",
        _ => "未知"
    };
}
