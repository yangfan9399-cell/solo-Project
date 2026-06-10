using System.ComponentModel.DataAnnotations;

namespace HazardousGoodsYard.Models;

public class SafetyDocument
{
    public int Id { get; set; }

    [Display(Name = "预约")]
    public int ReservationId { get; set; }

    [Required(ErrorMessage = "资料类型不能为空")]
    [Display(Name = "资料类型")]
    public DocumentType DocumentType { get; set; }

    [Required(ErrorMessage = "资料名称不能为空")]
    [StringLength(200, ErrorMessage = "资料名称长度不能超过200个字符")]
    [Display(Name = "资料名称")]
    public string DocumentName { get; set; } = string.Empty;

    [Required(ErrorMessage = "文件路径不能为空")]
    [StringLength(500, ErrorMessage = "文件路径长度不能超过500个字符")]
    [Display(Name = "文件路径")]
    public string FilePath { get; set; } = string.Empty;

    [Display(Name = "核验状态")]
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;

    [StringLength(500, ErrorMessage = "核验备注长度不能超过500个字符")]
    [Display(Name = "核验备注")]
    public string? VerificationRemarks { get; set; }

    [Display(Name = "核验人")]
    public string? VerifiedByUserId { get; set; }

    [Display(Name = "核验时间")]
    public DateTime? VerifiedAt { get; set; }

    [Display(Name = "上传时间")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public virtual Reservation Reservation { get; set; } = null!;
    public virtual ApplicationUser? VerifiedByUser { get; set; }
}

public enum DocumentType
{
    [Display(Name = "MSDS")]
    MSDS = 1,
    [Display(Name = "危险品申报单")]
    Declaration = 2,
    [Display(Name = "包装证明")]
    PackagingCertificate = 3,
    [Display(Name = "运输许可证")]
    TransportPermit = 4,
    [Display(Name = "安全承诺书")]
    SafetyCommitment = 5,
    [Display(Name = "其他资料")]
    Other = 99
}

public enum VerificationStatus
{
    [Display(Name = "待核验")]
    Pending = 1,
    [Display(Name = "核验通过")]
    Approved = 2,
    [Display(Name = "核验不通过")]
    Rejected = 3
}