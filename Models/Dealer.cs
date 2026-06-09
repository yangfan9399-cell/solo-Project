using System.ComponentModel.DataAnnotations;

namespace LiquorCreditSystem.Models;

public class Dealer
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string ContactPerson { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Region { get; set; } = string.Empty;

    public DealerLevel Level { get; set; }

    public CreditLimit CreditLimit { get; set; } = null!;

    public ICollection<Debt> Debts { get; set; } = new List<Debt>();

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
