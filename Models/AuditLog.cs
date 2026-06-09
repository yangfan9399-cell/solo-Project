namespace FuelManagementSystem.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int FuelApplicationId { get; set; }
    public FuelApplication? FuelApplication { get; set; }
    public ApplicationStatus FromStatus { get; set; }
    public ApplicationStatus ToStatus { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public string? OperatorRole { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
