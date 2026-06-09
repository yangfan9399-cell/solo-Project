namespace FuelManagementSystem.Models;

public class FuelApplication
{
    public int Id { get; set; }
    public string ApplicationNumber { get; set; } = string.Empty;
    public int ShipId { get; set; }
    public Ship? Ship { get; set; }
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public FuelType FuelType { get; set; }
    public double PlannedQuantity { get; set; }
    public double? ActualQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? TotalAmount { get; set; }
    public ApplicationStatus Status { get; set; }
    public string Port { get; set; } = string.Empty;
    public DateTime PlannedBunkeringDate { get; set; }
    public DateTime? ActualBunkeringDate { get; set; }

    public string? ApplicantName { get; set; }
    public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;

    public string? BunkeringOperator { get; set; }
    public DateTime? BunkeringCompleteTime { get; set; }

    public string? ChiefEngineerName { get; set; }
    public DateTime? SampleConfirmTime { get; set; }

    public string? FinanceVerifierName { get; set; }
    public DateTime? SettlementTime { get; set; }

    public DiscrepancyReason DiscrepancyReason { get; set; } = DiscrepancyReason.None;
    public string? Remarks { get; set; }

    public bool IsSampleSealed { get; set; }
    public string? SampleNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
