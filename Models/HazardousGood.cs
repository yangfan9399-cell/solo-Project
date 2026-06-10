using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Models;

public class HazardousGood
{
    public int Id { get; set; }

    [Required(ErrorMessage = "UN编号不能为空")]
    [StringLength(10, ErrorMessage = "UN编号长度不能超过10个字符")]
    [Display(Name = "UN编号")]
    public string UNNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "危险等级不能为空")]
    [Display(Name = "危险等级")]
    public HazardClass HazardClass { get; set; }

    [Required(ErrorMessage = "货物名称不能为空")]
    [StringLength(200, ErrorMessage = "货物名称长度不能超过200个字符")]
    [Display(Name = "货物名称")]
    public string GoodsName { get; set; } = string.Empty;

    [Required(ErrorMessage = "集装箱号不能为空")]
    [StringLength(20, ErrorMessage = "集装箱号长度不能超过20个字符")]
    [Display(Name = "集装箱号")]
    public string ContainerNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "货物类别不能为空")]
    [StringLength(50, ErrorMessage = "货物类别长度不能超过50个字符")]
    [Display(Name = "货物类别")]
    public string GoodsCategory { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "特殊说明长度不能超过500个字符")]
    [Display(Name = "特殊说明")]
    public string? SpecialInstructions { get; set; }

    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}

public enum HazardClass
{
    [Display(Name = "1类 - 爆炸品")]
    Class1 = 1,
    [Display(Name = "2.1类 - 易燃气体")]
    Class2_1 = 21,
    [Display(Name = "2.2类 - 非易燃无毒气体")]
    Class2_2 = 22,
    [Display(Name = "2.3类 - 毒性气体")]
    Class2_3 = 23,
    [Display(Name = "3类 - 易燃液体")]
    Class3 = 3,
    [Display(Name = "4.1类 - 易燃固体")]
    Class4_1 = 41,
    [Display(Name = "4.2类 - 易自燃物质")]
    Class4_2 = 42,
    [Display(Name = "4.3类 - 遇水放出易燃气体物质")]
    Class4_3 = 43,
    [Display(Name = "5.1类 - 氧化性物质")]
    Class5_1 = 51,
    [Display(Name = "5.2类 - 有机过氧化物")]
    Class5_2 = 52,
    [Display(Name = "6.1类 - 毒性物质")]
    Class6_1 = 61,
    [Display(Name = "6.2类 - 感染性物质")]
    Class6_2 = 62,
    [Display(Name = "7类 - 放射性物质")]
    Class7 = 7,
    [Display(Name = "8类 - 腐蚀性物质")]
    Class8 = 8,
    [Display(Name = "9类 - 杂项危险物质")]
    Class9 = 9
}