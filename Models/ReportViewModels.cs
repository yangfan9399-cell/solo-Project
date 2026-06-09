namespace LiquorCreditSystem.Models;

public class ReportViewModel
{
    public List<RegionSummary> ByRegion { get; set; } = new();
    public List<LevelSummary> ByLevel { get; set; } = new();
    public List<ExceptionTypeSummary> ByExceptionType { get; set; } = new();
    public List<AmountRangeSummary> ByAmountRange { get; set; } = new();
}

public class RegionSummary
{
    public string Region { get; set; } = string.Empty;
    public int ExceptionCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FrozenAmount { get; set; }
    public decimal AvgAmount { get; set; }
    public int InsufficientCreditCount { get; set; }
    public int OverdueDebtCount { get; set; }
    public int PricePolicyConflictCount { get; set; }
}

public class LevelSummary
{
    public DealerLevel Level { get; set; }
    public int ExceptionCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FrozenAmount { get; set; }
    public decimal AvgAmount { get; set; }
    public int DealerCount { get; set; }
}

public class ExceptionTypeSummary
{
    public ExceptionType ExceptionType { get; set; }
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FrozenAmount { get; set; }
    public decimal AvgAmount { get; set; }
    public int PendingReviewCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
}

public class AmountRangeSummary
{
    public string Range { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FrozenAmount { get; set; }
}
