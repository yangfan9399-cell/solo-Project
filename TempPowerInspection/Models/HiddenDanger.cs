using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TempPowerInspection.Models;

public enum DangerLevel
{
    轻微 = 1,
    一般 = 2,
    严重 = 3
}

public enum DangerStatus
{
    待整改 = 0,
    整改中 = 1,
    待复检 = 2,
    已通过 = 3,
    已送电 = 4,
    退回 = 5
}

public class HiddenDanger
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string DistributionBoxName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string BuildingName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string TeamName { get; set; } = string.Empty;

    public DangerLevel DangerLevel { get; set; }

    [Required]
    [MaxLength(50)]
    public string DangerType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? InspectionPhotos { get; set; }

    public DangerStatus Status { get; set; } = DangerStatus.待整改;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public Rectification? Rectification { get; set; }
    public PowerApproval? PowerApproval { get; set; }
    public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();

    [NotMapped]
    public string DangerLevelName => DangerLevel switch
    {
        DangerLevel.轻微 => "轻微",
        DangerLevel.一般 => "一般",
        DangerLevel.严重 => "严重",
        _ => "未知"
    };

    [NotMapped]
    public string StatusName => Status switch
    {
        DangerStatus.待整改 => "待整改",
        DangerStatus.整改中 => "整改中",
        DangerStatus.待复检 => "待复检",
        DangerStatus.已通过 => "已通过",
        DangerStatus.已送电 => "已送电",
        DangerStatus.退回 => "退回",
        _ => "未知"
    };

    [NotMapped]
    public string DangerLevelCssClass => DangerLevel switch
    {
        DangerLevel.轻微 => "bg-success",
        DangerLevel.一般 => "bg-warning",
        DangerLevel.严重 => "bg-danger",
        _ => "bg-secondary"
    };

    [NotMapped]
    public string StatusCssClass => Status switch
    {
        DangerStatus.待整改 => "bg-secondary",
        DangerStatus.整改中 => "bg-primary",
        DangerStatus.待复检 => "bg-info",
        DangerStatus.已通过 => "bg-success",
        DangerStatus.已送电 => "bg-dark",
        DangerStatus.退回 => "bg-danger",
        _ => "bg-secondary"
    };
}
