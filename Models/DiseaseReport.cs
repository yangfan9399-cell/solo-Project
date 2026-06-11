using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OceanFarm.Models;

public class DiseaseReport
{
    public int Id { get; set; }

    public int CageId { get; set; }

    [ForeignKey(nameof(CageId))]
    public Cage Cage { get; set; } = null!;

    public int ReporterId { get; set; }

    [ForeignKey(nameof(ReporterId))]
    public AppUser Reporter { get; set; } = null!;

    public int? VeterinarianId { get; set; }

    [ForeignKey(nameof(VeterinarianId))]
    public AppUser? Veterinarian { get; set; }

    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReviewedAt { get; set; }

    [Required]
    [MaxLength(200)]
    public string Symptoms { get; set; } = string.Empty;

    public int DeadFishCount { get; set; }

    public int AbnormalFishCount { get; set; }

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    public DiseaseStatus Status { get; set; } = DiseaseStatus.Reported;

    [MaxLength(500)]
    public string? VeterinaryOpinion { get; set; }

    [MaxLength(100)]
    public string? DiagnosedDisease { get; set; }

    [MaxLength(500)]
    public string? RecommendedTreatment { get; set; }

    [MaxLength(500)]
    public string? ManagerNote { get; set; }
}
