using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingRoomEquipment.Models;

[Table("EvidenceAttachments")]
public class EvidenceAttachment
{
    [Key]
    public int Id { get; set; }

    public int RecordId { get; set; }

    public EvidenceType EvidenceType { get; set; }

    [MaxLength(200)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [MaxLength(200)]
    public string FileUrl { get; set; } = string.Empty;

    public long FileSize { get; set; }

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(20)]
    public string UploadedById { get; set; } = string.Empty;

    [MaxLength(50)]
    public string UploadedByName { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.Now;

    public bool IsValid { get; set; } = true;

    [MaxLength(200)]
    public string? InvalidReason { get; set; }

    [ForeignKey("RecordId")]
    public virtual EquipmentBorrowRecord Record { get; set; } = null!;
}
