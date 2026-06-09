namespace LiquorCreditSystem.Models;

public class Debt
{
    public int Id { get; set; }

    public int DealerId { get; set; }

    public decimal Amount { get; set; }

    public DateTime DueDate { get; set; }

    public bool IsOverdue => DueDate < DateTime.Today && !IsPaid;

    public int OverdueDays => IsOverdue ? (DateTime.Today - DueDate).Days : 0;

    public bool IsPaid { get; set; }

    public DateTime? PaidDate { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    public int? RelatedOrderId { get; set; }

    public Order? RelatedOrder { get; set; }

    public Dealer Dealer { get; set; } = null!;
}
