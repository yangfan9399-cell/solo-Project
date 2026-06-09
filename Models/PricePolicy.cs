namespace LiquorCreditSystem.Models;

public class PricePolicy
{
    public int Id { get; set; }

    [MaxLength(100)]
    public string PolicyName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string ProductCategory { get; set; } = string.Empty;

    public decimal MinOrderAmount { get; set; }

    public decimal DiscountRate { get; set; }

    public decimal? MaxDiscountAmount { get; set; }

    public DealerLevel ApplicableLevel { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive => StartDate <= DateTime.Today && EndDate >= DateTime.Today;

    public ICollection<ProductPricePolicy> ProductPricePolicies { get; set; } = new List<ProductPricePolicy>();
}

public class ProductPricePolicy
{
    public int Id { get; set; }

    public int PricePolicyId { get; set; }

    public int ProductId { get; set; }

    public decimal SpecialPrice { get; set; }

    public PricePolicy PricePolicy { get; set; } = null!;

    public Product Product { get; set; } = null!;
}
