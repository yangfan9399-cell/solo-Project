using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Data;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Controllers;

public class ReportsController : Controller
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var allOrders = await _context.Orders
            .Include(o => o.Dealer)
            .Include(o => o.ReviewRecord)
            .Include(o => o.CreditFreezeRecords)
            .ToListAsync();

        var exceptionOrders = allOrders.Where(o => o.Status == OrderStatus.Exception).ToList();
        var frozenOrders = allOrders.Where(o => o.CreditFrozen > 0).ToList();

        var byRegion = allOrders
            .Where(o => o.Status == OrderStatus.Exception)
            .GroupBy(o => o.Dealer.Region)
            .Select(g => new RegionSummary
            {
                Region = g.Key,
                ExceptionCount = g.Count(),
                TotalAmount = g.Sum(o => o.FinalAmount),
                FrozenAmount = g.Sum(o => o.CreditFrozen),
                AvgAmount = g.Count() > 0 ? g.Sum(o => o.FinalAmount) / g.Count() : 0,
                InsufficientCreditCount = g.Count(o => o.ExceptionType == ExceptionType.InsufficientCredit),
                OverdueDebtCount = g.Count(o => o.ExceptionType == ExceptionType.OverdueDebt),
                PricePolicyConflictCount = g.Count(o => o.ExceptionType == ExceptionType.PricePolicyConflict)
            })
            .OrderByDescending(x => x.ExceptionCount)
            .ToList();

        var byLevel = allOrders
            .Where(o => o.Status == OrderStatus.Exception)
            .GroupBy(o => o.Dealer.Level)
            .Select(g => new LevelSummary
            {
                Level = g.Key,
                ExceptionCount = g.Count(),
                TotalAmount = g.Sum(o => o.FinalAmount),
                FrozenAmount = g.Sum(o => o.CreditFrozen),
                AvgAmount = g.Count() > 0 ? g.Sum(o => o.FinalAmount) / g.Count() : 0,
                DealerCount = g.Select(o => o.DealerId).Distinct().Count()
            })
            .OrderByDescending(x => x.ExceptionCount)
            .ToList();

        var byExceptionType = allOrders
            .Where(o => o.Status == OrderStatus.Exception)
            .GroupBy(o => o.ExceptionType)
            .Select(g => new ExceptionTypeSummary
            {
                ExceptionType = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(o => o.FinalAmount),
                FrozenAmount = g.Sum(o => o.CreditFrozen),
                AvgAmount = g.Count() > 0 ? g.Sum(o => o.FinalAmount) / g.Count() : 0,
                PendingReviewCount = g.Count(o => o.ReviewRecord != null && o.ReviewRecord.Status == ReviewStatus.Pending),
                ApprovedCount = g.Count(o => o.ReviewRecord != null && o.ReviewRecord.Status == ReviewStatus.Approved),
                RejectedCount = g.Count(o => o.ReviewRecord != null && o.ReviewRecord.Status == ReviewStatus.Rejected)
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var byAmountRange = new List<AmountRangeSummary>
        {
            new AmountRangeSummary {
                Range = "0-10万",
                Count = exceptionOrders.Count(o => o.FinalAmount < 100000),
                TotalAmount = exceptionOrders.Where(o => o.FinalAmount < 100000).Sum(o => o.FinalAmount),
                FrozenAmount = exceptionOrders.Where(o => o.FinalAmount < 100000).Sum(o => o.CreditFrozen)
            },
            new AmountRangeSummary {
                Range = "10-30万",
                Count = exceptionOrders.Count(o => o.FinalAmount >= 100000 && o.FinalAmount < 300000),
                TotalAmount = exceptionOrders.Where(o => o.FinalAmount >= 100000 && o.FinalAmount < 300000).Sum(o => o.FinalAmount),
                FrozenAmount = exceptionOrders.Where(o => o.FinalAmount >= 100000 && o.FinalAmount < 300000).Sum(o => o.CreditFrozen)
            },
            new AmountRangeSummary {
                Range = "30-50万",
                Count = exceptionOrders.Count(o => o.FinalAmount >= 300000 && o.FinalAmount < 500000),
                TotalAmount = exceptionOrders.Where(o => o.FinalAmount >= 300000 && o.FinalAmount < 500000).Sum(o => o.FinalAmount),
                FrozenAmount = exceptionOrders.Where(o => o.FinalAmount >= 300000 && o.FinalAmount < 500000).Sum(o => o.CreditFrozen)
            },
            new AmountRangeSummary {
                Range = "50万以上",
                Count = exceptionOrders.Count(o => o.FinalAmount >= 500000),
                TotalAmount = exceptionOrders.Where(o => o.FinalAmount >= 500000).Sum(o => o.FinalAmount),
                FrozenAmount = exceptionOrders.Where(o => o.FinalAmount >= 500000).Sum(o => o.CreditFrozen)
            }
        };

        var totalExceptionCount = exceptionOrders.Count;
        var totalExceptionAmount = exceptionOrders.Sum(o => o.FinalAmount);
        var totalFrozenAmount = exceptionOrders.Sum(o => o.CreditFrozen);
        var pendingReviewCount = allOrders.Count(o => o.ReviewRecord != null && o.ReviewRecord.Status == ReviewStatus.Pending);

        var totalOrders = allOrders.Count;
        var completedOrders = allOrders.Count(o => o.Status == OrderStatus.Completed);
        var shippedOrders = allOrders.Count(o => o.Status == OrderStatus.Shipped);
        var exceptionRate = totalOrders > 0 ? (double)totalExceptionCount / totalOrders * 100 : 0;

        var totalCredit = await _context.CreditLimits.SumAsync(c => c.TotalCredit);
        var usedCredit = await _context.CreditLimits.SumAsync(c => c.UsedCredit);
        var frozenCredit = await _context.CreditLimits.SumAsync(c => c.FrozenCredit);
        var availableCredit = totalCredit - usedCredit - frozenCredit;

        var totalDebt = await _context.Debts.Where(d => !d.IsPaid).SumAsync(d => d.Amount);
        var overdueDebt = await _context.Debts.Where(d => d.DueDate < DateTime.Today && !d.IsPaid).SumAsync(d => d.Amount);

        ViewBag.TotalExceptionCount = totalExceptionCount;
        ViewBag.TotalExceptionAmount = totalExceptionAmount;
        ViewBag.TotalFrozenAmount = totalFrozenAmount;
        ViewBag.PendingReviewCount = pendingReviewCount;
        ViewBag.TotalOrders = totalOrders;
        ViewBag.CompletedOrders = completedOrders;
        ViewBag.ShippedOrders = shippedOrders;
        ViewBag.ExceptionRate = exceptionRate;
        ViewBag.TotalCredit = totalCredit;
        ViewBag.UsedCredit = usedCredit;
        ViewBag.FrozenCredit = frozenCredit;
        ViewBag.AvailableCredit = availableCredit;
        ViewBag.TotalDebt = totalDebt;
        ViewBag.OverdueDebt = overdueDebt;

        var model = new ReportViewModel
        {
            ByRegion = byRegion,
            ByLevel = byLevel,
            ByExceptionType = byExceptionType,
            ByAmountRange = byAmountRange
        };

        return View(model);
    }
}

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
