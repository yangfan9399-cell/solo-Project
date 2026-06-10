using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Models;

public class IsolationZone
{
    public int Id { get; set; }

    [Required(ErrorMessage = "隔离区编码不能为空")]
    [StringLength(20, ErrorMessage = "隔离区编码长度不能超过20个字符")]
    [Display(Name = "隔离区编码")]
    public string ZoneCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "隔离区名称不能为空")]
    [StringLength(100, ErrorMessage = "隔离区名称长度不能超过100个字符")]
    [Display(Name = "隔离区名称")]
    public string ZoneName { get; set; } = string.Empty;

    [Display(Name = "所属区域")]
    public int YardAreaId { get; set; }

    [Display(Name = "隔离类型")]
    public IsolationType IsolationType { get; set; }

    [Display(Name = "最大容量")]
    public int MaxCapacity { get; set; }

    [Display(Name = "当前使用量")]
    public int CurrentUsage { get; set; }

    [Display(Name = "允许的危险等级")]
    public string AllowedHazardClasses { get; set; } = string.Empty;

    [Display(Name = "冲突的危险等级")]
    public string ConflictingHazardClasses { get; set; } = string.Empty;

    [Display(Name = "是否启用")]
    public bool IsActive { get; set; } = true;

    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public virtual YardArea YardArea { get; set; } = null!;
    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}

public enum IsolationType
{
    [Display(Name = "普通隔离区")]
    Normal = 1,
    [Display(Name = "特殊隔离区")]
    Special = 2,
    [Display(Name = "高温隔离区")]
    HighTemperature = 3,
    [Display(Name = "低温隔离区")]
    LowTemperature = 4,
    [Display(Name = "放射性隔离区")]
    Radioactive = 5
}