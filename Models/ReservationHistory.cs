using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Models;

public class ReservationHistory
{
    public int Id { get; set; }

    [Display(Name = "预约")]
    public int ReservationId { get; set; }

    [Display(Name = "操作类型")]
    public ReservationAction Action { get; set; }

    [Display(Name = "原状态")]
    public ReservationStatus? FromStatus { get; set; }

    [Display(Name = "新状态")]
    public ReservationStatus? ToStatus { get; set; }

    [StringLength(500, ErrorMessage = "操作说明长度不能超过500个字符")]
    [Display(Name = "操作说明")]
    public string? Description { get; set; }

    [Display(Name = "操作人")]
    public string? OperatorUserId { get; set; }

    [Display(Name = "操作时间")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public virtual Reservation Reservation { get; set; } = null!;
    public virtual ApplicationUser? OperatorUser { get; set; }
}

public enum ReservationAction
{
    [Display(Name = "创建预约")]
    Created = 1,
    [Display(Name = "分配区域")]
    AreaAssigned = 2,
    [Display(Name = "分配隔离区")]
    ZoneAssigned = 3,
    [Display(Name = "提交核验")]
    SubmittedForVerification = 4,
    [Display(Name = "资料核验通过")]
    DocumentsVerified = 5,
    [Display(Name = "资料核验失败")]
    DocumentsRejected = 6,
    [Display(Name = "提交复核")]
    SubmittedForReview = 7,
    [Display(Name = "复核通过")]
    ReviewApproved = 8,
    [Display(Name = "复核退回")]
    ReviewRejected = 9,
    [Display(Name = "入库完成")]
    Completed = 10,
    [Display(Name = "预约过期")]
    Expired = 11,
    [Display(Name = "取消预约")]
    Cancelled = 12
}