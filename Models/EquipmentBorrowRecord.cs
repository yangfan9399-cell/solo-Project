using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MeetingRoomEquipment.Models;

[Table("EquipmentBorrowRecords")]
public class EquipmentBorrowRecord
{
    [Key]
    public int Id { get; set; }

    [MaxLength(30)]
    public string RecordNo { get; set; } = string.Empty;

    public SampleCategory SampleCategory { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(100)]
    public string SourceSystem { get; set; } = string.Empty;

    [MaxLength(100)]
    public string BorrowerName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string BorrowerDept { get; set; } = string.Empty;

    [MaxLength(20)]
    public string BorrowerPhone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string EquipmentName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string EquipmentCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string MeetingRoom { get; set; } = string.Empty;

    public DateTime BorrowDate { get; set; }

    public DateTime DueReturnDate { get; set; }

    public DateTime? ActualReturnDate { get; set; }

    public bool HasDamage { get; set; }

    [MaxLength(500)]
    public string DamageDescription { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal OriginalValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CompensationAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? ActualCompensation { get; set; }

    [MaxLength(500)]
    public string FieldDescription { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Conclusion { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Basis { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? BlockingReason { get; set; }

    [MaxLength(500)]
    public string? RemedyPath { get; set; }

    [MaxLength(200)]
    public string? DiffFields { get; set; }

    public RecordStatus Status { get; set; }

    [MaxLength(20)]
    public string CurrentResponsibleId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CurrentResponsibleName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? CreatedById { get; set; }

    [MaxLength(50)]
    public string? CreatedByName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [MaxLength(20)]
    public string? LastUpdatedById { get; set; }

    [MaxLength(50)]
    public string? LastUpdatedByName { get; set; }

    public DateTime? LastUpdatedAt { get; set; }

    public bool IsArchived { get; set; }

    public DateTime? ArchivedAt { get; set; }

    public virtual ICollection<RecordNode> Nodes { get; set; } = new List<RecordNode>();

    public virtual ICollection<EvidenceAttachment> Evidences { get; set; } = new List<EvidenceAttachment>();

    public virtual ICollection<FieldSnapshot> Snapshots { get; set; } = new List<FieldSnapshot>();
}
