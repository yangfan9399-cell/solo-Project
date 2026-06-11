using System.ComponentModel.DataAnnotations;

namespace OceanFarm.Models;

public class SeaArea
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public ICollection<Cage> Cages { get; set; } = new List<Cage>();
}
