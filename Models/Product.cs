namespace LiquorCreditSystem.Models;

public class Product
{
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Sku { get; set; } = string.Empty;

    public decimal StandardPrice { get; set; }

    public int Stock { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public ICollection<ProductPricePolicy> ProductPricePolicies { get; set; } = new List<ProductPricePolicy>();

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
