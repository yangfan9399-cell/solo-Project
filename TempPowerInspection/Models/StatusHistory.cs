using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TempPowerInspection.Models;

public class StatusHistory
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int HiddenDangerId { get; set; }

    public DangerStatus Status { get; set; }

    [MaxLength(50)]
    public string? Operator { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime OperatedAt { get; set; } = DateTime.Now;

    // Navigation property
    [ForeignKey("HiddenDangerId")]
    public HiddenDanger? HiddenDanger { get; set; }

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
}
