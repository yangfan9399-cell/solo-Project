namespace LiquorCreditSystem.Models;

public class OrderHistory
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public OrderStatus FromStatus { get; set; }

    public OrderStatus ToStatus { get; set; }

    public OperationRole OperationRole { get; set; }

    [MaxLength(50)]
    public string Operator { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime OperatedAt { get; set; }

    public Order Order { get; set; } = null!;
}

public class CreditFreezeRecord
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int DealerId { get; set; }

    public decimal Amount { get; set; }

    public bool IsFrozen { get; set; }

    [MaxLength(50)]
    public string Operator { get; set; } = string.Empty;

    public DateTime OperatedAt { get; set; }

    [MaxLength(200)]
    public string? Remark { get; set; }

    public Order Order { get; set; } = null!;

    public Dealer Dealer { get; set; } = null!;
}

public class ReviewRecord
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public ExceptionType ExceptionType { get; set; }

    public ReviewStatus Status { get; set; }

    [MaxLength(50)]
    public string Reviewer { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ReviewComment { get; set; }

    public DateTime? ReviewedAt { get; set; }

    [MaxLength(200)]
    public string? Resolution { get; set; }

    public Order Order { get; set; } = null!;
}
