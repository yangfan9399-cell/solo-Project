using Microsoft.AspNetCore.Mvc;
using LiquorCreditSystem.Data;
using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _context;

    public HomeController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var totalOrders = await _context.Orders.CountAsync();
        var pendingOrders = await _context.Orders
            .Where(o => o.Status == OrderStatus.Submitted || o.Status == OrderStatus.CreditFrozen)
            .CountAsync();
        var exceptionOrders = await _context.Orders
            .Where(o => o.Status == OrderStatus.Exception)
            .CountAsync();
        var totalDealers = await _context.Dealers.CountAsync();
        var totalCredit = await _context.CreditLimits.SumAsync(c => c.TotalCredit);
        var usedCredit = await _context.CreditLimits.SumAsync(c => c.UsedCredit + c.FrozenCredit);
        var overdueDebts = await _context.Debts
            .Where(d => d.DueDate < DateTime.Today && !d.IsPaid)
            .SumAsync(d => d.Amount);
        var completedOrders = await _context.Orders
            .Where(o => o.Status == OrderStatus.Completed)
            .CountAsync();
        var pendingReview = await _context.ReviewRecords
            .Where(r => r.Status == ReviewStatus.Pending)
            .CountAsync();

        ViewData["TotalOrders"] = totalOrders;
        ViewData["PendingOrders"] = pendingOrders;
        ViewData["ExceptionOrders"] = exceptionOrders;
        ViewData["TotalDealers"] = totalDealers;
        ViewData["TotalCredit"] = totalCredit;
        ViewData["UsedCredit"] = usedCredit;
        ViewData["OverdueDebts"] = overdueDebts;
        ViewData["CompletedOrders"] = completedOrders;
        ViewData["PendingReview"] = pendingReview;

        var recentOrders = await _context.Orders
            .Include(o => o.Dealer)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .ToListAsync();

        return View(recentOrders);
    }
}
