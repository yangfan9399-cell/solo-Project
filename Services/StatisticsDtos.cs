namespace FuelManagementSystem.Services;

public class ShipStatisticsDto
{
    public int ShipId { get; set; }
    public string ShipName { get; set; } = string.Empty;
    public int ApplicationCount { get; set; }
    public double TotalPlannedQuantity { get; set; }
    public double TotalActualQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public double AverageDiscrepancy { get; set; }
}

public class SupplierStatisticsDto
{
    public int SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int ApplicationCount { get; set; }
    public double TotalActualQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public int DelayedCount { get; set; }
}

public class DiscrepancyStatisticsDto
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
    public double TotalDiscrepancyQuantity { get; set; }
    public double AverageDiscrepancy { get; set; }
}

public class SettlementStatisticsDto
{
    public string Period { get; set; } = string.Empty;
    public int ApplicationCount { get; set; }
    public double TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AverageUnitPrice { get; set; }
}
