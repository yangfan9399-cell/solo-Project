using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Models;

public class Reservation
{
    public int Id { get; set; }

    [Required(ErrorMessage = "预约编号不能为空")]
    [StringLength(50, ErrorMessage = "预约编号长度不能超过50个字符")]
    [Display(Name = "预约编号")]
    public string ReservationNumber { get; set; } = string.Empty;

    [Display(Name = "危险品")]
    public int HazardousGoodId { get; set; }

    [Display(Name = "堆场区域")]
    public int? YardAreaId { get; set; }

    [Display(Name = "隔离区")]
    public int? IsolationZoneId { get; set; }

    [Display(Name = "预约窗口开始时间")]
    public DateTime ReservationWindowStart { get; set; }

    [Display(Name = "预约窗口结束时间")]
    public DateTime ReservationWindowEnd { get; set; }

    [Display(Name = "预约状态")]
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    [Display(Name = "货代用户")]
    public string ForwarderUserId { get; set; } = string.Empty;

    [Display(Name = "调度员")]
    public string? DispatcherUserId { get; set; }

    [Display(Name = "安全员")]
    public string? SafetyOfficerUserId { get; set; }

    [Display(Name = "复核人")]
    public string? ReviewerUserId { get; set; }

    [Display(Name = "退回原因")]
    public string? RejectionReason { get; set; }

    [Display(Name = "退回原因类型")]
    public RejectionReasonType? RejectionReasonType { get; set; }

    [StringLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    [Display(Name = "备注")]
    public string? Remarks { get; set; }

    [Display(Name = "创建时间")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Display(Name = "更新时间")]
    public DateTime? UpdatedAt { get; set; }

    public virtual HazardousGood HazardousGood { get; set; } = null!;
    public virtual YardArea? YardArea { get; set; }
    public virtual IsolationZone? IsolationZone { get; set; }
    public virtual ApplicationUser ForwarderUser { get; set; } = null!;
    public virtual ApplicationUser? DispatcherUser { get; set; }
    public virtual ApplicationUser? SafetyOfficerUser { get; set; }
    public virtual ApplicationUser? ReviewerUser { get; set; }
    public virtual ICollection<ReservationHistory> Histories { get; set; } = new List<ReservationHistory>();
    public virtual ICollection<SafetyDocument> SafetyDocuments { get; set; } = new List<SafetyDocument>();
}

public enum ReservationStatus
{
    [Display(Name = "待分配")]
    Pending = 1,
    [Display(Name = "已分配区域")]
    AreaAssigned = 2,
    [Display(Name = "待核验资料")]
    PendingVerification = 3,
    [Display(Name = "资料已核验")]
    DocumentsVerified = 4,
    [Display(Name = "待复核")]
    PendingReview = 5,
    [Display(Name = "已入库")]
    Completed = 6,
    [Display(Name = "已退回")]
    Rejected = 7,
    [Display(Name = "预约已过期")]
    Expired = 8
}

public enum RejectionReasonType
{
    [Display(Name = "危险等级冲突")]
    HazardClassConflict = 1,
    [Display(Name = "安全资料缺失")]
    MissingDocuments = 2,
    [Display(Name = "预约窗口过期")]
    ExpiredWindow = 3,
    [Display(Name = "区域容量不足")]
    InsufficientCapacity = 4,
    [Display(Name = "隔离区不匹配")]
    IsolationMismatch = 5,
    [Display(Name = "其他原因")]
    Other = 99
}