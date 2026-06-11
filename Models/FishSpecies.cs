using System.ComponentModel.DataAnnotations;

namespace OceanFarm.Models;

public class FishSpecies
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ScientificName { get; set; }

    public decimal OptimalMinTemperature { get; set; }

    public decimal OptimalMaxTemperature { get; set; }

    public decimal OptimalMinDissolvedOxygen { get; set; }

    public decimal DailyFeedRatePerKg { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public ICollection<Cage> Cages { get; set; } = new List<Cage>();
}
