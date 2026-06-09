namespace FuelManagementSystem.Models;

public class Ship
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImoNumber { get; set; } = string.Empty;
    public string Flag { get; set; } = string.Empty;
    public double Deadweight { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<FuelApplication> Applications { get; set; } = new List<FuelApplication>();
}
