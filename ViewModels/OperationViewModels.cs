using System.ComponentModel.DataAnnotations;

namespace SurgicalInstrumentTracking.ViewModels;

public class PackSetViewModel
{
    [Required]
    [MaxLength(50)]
    public string SetCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    [Required]
    public string SetType { get; set; } = string.Empty;

    [Required]
    public int DepartmentId { get; set; }

    public List<InstrumentItemViewModel> Items { get; set; } = new();

    [Required]
    public int PackedByUserId { get; set; }
}

public class InstrumentItemViewModel
{
    public int InstrumentId { get; set; }
    public string InstrumentName { get; set; } = string.Empty;
    public int ExpectedQuantity { get; set; }
    public int ActualQuantity { get; set; }
}

public class SterilizeSetViewModel
{
    public int InstrumentSetId { get; set; }
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string BatchNumber { get; set; } = string.Empty;

    [Required]
    public DateTime SterilizationDate { get; set; }

    [Required]
    public DateTime ExpirationDate { get; set; }

    [MaxLength(100)]
    public string? SterilizerCode { get; set; }

    [MaxLength(50)]
    public string? SterilizationMethod { get; set; }

    public int PackedByUserId { get; set; }
}

public class ReceiveSetViewModel
{
    public int InstrumentSetId { get; set; }
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string? BatchNumber { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public bool IsExpired { get; set; }

    [Required]
    public int ReceivedByUserId { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public List<InstrumentItemViewModel> Items { get; set; } = new();

    public bool HasMissingItems { get; set; }
    public bool WrongDepartment { get; set; }
}

public class QualityReviewViewModel
{
    public int InstrumentSetId { get; set; }
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public InstrumentSetStatus CurrentStatus { get; set; }

    [Required]
    public int ReviewerId { get; set; }

    [Required]
    public string Decision { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public List<InstrumentItemViewModel>? Items { get; set; }
}

public class AnomalyReportViewModel
{
    public int InstrumentSetId { get; set; }
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;

    [Required]
    public AnomalyType AnomalyType { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int ReportedByUserId { get; set; }
}

public class CompleteReplenishmentViewModel
{
    public int InstrumentSetId { get; set; }
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;

    public List<InstrumentItemViewModel> MissingItems { get; set; } = new();

    public int TotalMissingCount { get; set; }

    public DateTime ReportedAt { get; set; }

    [Required]
    public int CompletedByUserId { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [MaxLength(500)]
    public string? ResolutionNotes { get; set; }

    public List<User>? SupplyStaff { get; set; }
}
