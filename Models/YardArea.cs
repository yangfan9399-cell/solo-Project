using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Models;

public class YardArea
{
    public int Id { get; set; }

    [Required(ErrorMessage = "区域编码不能为空")]
    [StringLength(20, ErrorMessage = "区域编码长度不能超过20个字符")]
    [Display(Name = "区域编码")]
    public string AreaCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "区域名称不能为空")]
    [StringLength(100, ErrorMessage = "区域名称长度不能超过100个字符")]
    [Display(Name = "区域名称")]
    public string AreaName { get; set; } = string.Empty;

    [Required(ErrorMessage = "堆场名称不能为空")]
    [StringLength(100, ErrorMessage = "堆场名称长度不能超过100个字符")]
    [Display(Name = "堆场名称")]
    public string YardName { get; set; } = string.Empty;

    [Display(Name = "最大容量")]
    public int MaxCapacity { get; set; }

    [Display(Name = "当前使用量")]
    public int CurrentUsage { get; set; }

    [Display(Name = "允许的危险等级")]
    public string AllowedHazardClasses { get; set; } = string.Empty;

    [Display(Name = "是否启用")]
    public bool IsActive { get; set; } = true;

    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public virtual ICollection<IsolationZone> IsolationZones { get; set; } = new List<IsolationZone>();
    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}