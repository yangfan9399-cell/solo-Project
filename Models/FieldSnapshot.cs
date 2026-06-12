using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingRoomEquipment.Models;

[Table("FieldSnapshots")]
public class FieldSnapshot
{
    [Key]
    public int Id { get; set; }

    public int RecordId { get; set; }

    public int NodeId { get; set; }

    [MaxLength(100)]
    public string FieldName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FieldDisplayName { get; set; } = string.Empty;

    public string? BeforeValue { get; set; }

    public string? AfterValue { get; set; }

    [MaxLength(200)]
    public string? ChangeReason { get; set; }

    [MaxLength(20)]
    public string ChangedById { get; set; } = string.Empty;

    [MaxLength(50)]
    public string ChangedByName { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; } = DateTime.Now;

    [ForeignKey("RecordId")]
    public virtual EquipmentBorrowRecord Record { get; set; } = null!;
}
