using System.ComponentModel.DataAnnotations;

namespace LiquorCreditSystem.Models;

public class Order
{
    public int Id { get; set; }

    [MaxLength(30)]
    public string OrderNo { get; set; } = string.Empty;

    public int DealerId { get; set; }

    public OrderStatus Status { get; set; }

    public ExceptionType ExceptionType { get; set; }

    [MaxLength(500)]
    public string? ExceptionReason { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal FinalAmount { get; set; }

    public decimal CreditUsed { get; set; }

    public decimal CreditFrozen { get; set; }

    [MaxLength(50)]
    public string? SalesPerson { get; set; }

    [MaxLength(50)]
    public string? FinanceOperator { get; set; }

    [MaxLength(50)]
    public string? WarehouseOperator { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime? CreditFrozenAt { get; set; }

    public DateTime? ShippedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public Dealer Dealer { get; set; } = null!;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public ICollection<OrderHistory> Histories { get; set; } = new List<OrderHistory>();

    public ICollection<CreditFreezeRecord> CreditFreezeRecords { get; set; } = new List<CreditFreezeRecord>();

    public ReviewRecord? ReviewRecord { get; set; }
}

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal DiscountPrice { get; set; }

    public decimal Amount { get; set; }

    public string? PricePolicyName { get; set; }

    public Order Order { get; set; } = null!;

    public Product Product { get; set; } = null!;
}
