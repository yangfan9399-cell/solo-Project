using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingRoomEquipment.Models;

[Table("RecordNodes")]
public class RecordNode
{
    [Key]
    public int Id { get; set; }

    public int RecordId { get; set; }

    public NodeType NodeType { get; set; }

    [MaxLength(100)]
    public string NodeTitle { get; set; } = string.Empty;

    public RecordStatus? FromStatus { get; set; }

    public RecordStatus? ToStatus { get; set; }

    [MaxLength(500)]
    public string Remark { get; set; } = string.Empty;

    [MaxLength(20)]
    public string OperatorId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string OperatorName { get; set; } = string.Empty;

    public UserRole OperatorRole { get; set; }

    public DateTime OperatedAt { get; set; } = DateTime.Now;

    [MaxLength(200)]
    public string? ChangedFields { get; set; }

    public int? ParentNodeId { get; set; }

    public int Sequence { get; set; }

    [ForeignKey("RecordId")]
    public virtual EquipmentBorrowRecord Record { get; set; } = null!;
}
