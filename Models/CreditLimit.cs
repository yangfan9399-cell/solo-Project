namespace LiquorCreditSystem.Models;

public class CreditLimit
{
    public int Id { get; set; }

    public int DealerId { get; set; }

    public decimal TotalCredit { get; set; }

    public decimal UsedCredit { get; set; }

    public decimal FrozenCredit { get; set; }

    public decimal AvailableCredit => TotalCredit - UsedCredit - FrozenCredit;

    public int PaymentDays { get; set; }

    public DateTime EffectiveDate { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public Dealer Dealer { get; set; } = null!;
}
