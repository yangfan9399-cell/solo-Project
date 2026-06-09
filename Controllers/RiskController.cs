using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Data;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Controllers;

public class RiskController : Controller
{
    private readonly AppDbContext _context;

    public RiskController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var exceptionOrders = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Include(o => o.ReviewRecord)
            .Where(o => o.Status == OrderStatus.Exception)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return View(exceptionOrders);
    }

    public async Task<IActionResult> Review(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Include(o => o.Dealer)
            .ThenInclude(d => d.Debts)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Include(o => o.ReviewRecord)
            .Include(o => o.Histories)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        return View(order);
    }

    [HttpPost]
    public async Task<IActionResult> Approve(int id, string resolution, string? comment)
    {
        var order = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Include(o => o.Dealer)
            .ThenInclude(d => d.Debts)
            .Include(o => o.Items)
            .Include(o => o.ReviewRecord)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null || order.ReviewRecord == null)
        {
            return NotFound();
        }

        var historyRemark = $"风控复核通过：{resolution}";

        switch (resolution)
        {
            case "临时提额":
                var creditLimit = order.Dealer.CreditLimit;
                var tempIncrease = order.FinalAmount - (creditLimit.TotalCredit - creditLimit.UsedCredit - creditLimit.FrozenCredit);
                if (tempIncrease > 0)
                {
                    creditLimit.TotalCredit += tempIncrease;
                    historyRemark += $"，临时提额{tempIncrease:C0}";
                }
                break;

            case "回款确认":
            case "确认回款":
            case "确认逾期欠款已结清":
                var overdueDebts = order.Dealer.Debts
                    .Where(d => d.DueDate < DateTime.Today && !d.IsPaid)
                    .ToList();
                foreach (var debt in overdueDebts)
                {
                    debt.IsPaid = true;
                    debt.PaidDate = DateTime.Today;
                }
                var overdueAmount = overdueDebts.Sum(d => d.Amount);
                if (overdueDebts.Any())
                {
                    creditLimit = order.Dealer.CreditLimit;
                    creditLimit.UsedCredit -= overdueAmount;
                    historyRemark += $"，结清逾期欠款{overdueAmount:C0}";
                }
                break;

            case "部分回款":
                var partDebts = order.Dealer.Debts
                    .Where(d => d.DueDate < DateTime.Today && !d.IsPaid)
                    .OrderBy(d => d.DueDate)
                    .FirstOrDefault();
                if (partDebts != null)
                {
                    partDebts.IsPaid = true;
                    partDebts.PaidDate = DateTime.Today;
                    creditLimit = order.Dealer.CreditLimit;
                    creditLimit.UsedCredit -= partDebts.Amount;
                    historyRemark += $"，部分回款{partDebts.Amount:C0}";
                }
                break;

            case "按标准价执行":
                foreach (var item in order.Items)
                {
                    if (!string.IsNullOrEmpty(item.PricePolicyName))
                    {
                        item.DiscountPrice = item.UnitPrice;
                        item.Amount = item.UnitPrice * item.Quantity;
                        item.PricePolicyName = null;
                    }
                }
                order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);
                order.DiscountAmount = 0;
                order.FinalAmount = order.TotalAmount;
                historyRemark += $"，按标准价执行，订单金额调整为{order.FinalAmount:C0}";
                break;

            case "缩单调整":
            case "缩单后放行":
                historyRemark += $"，缩单调整后放行";
                break;

            case "政策例外":
            case "价格政策例外审批":
                historyRemark += $"，价格政策例外审批通过";
                break;

            case "特殊审批":
                historyRemark += $"，特殊审批通过";
                break;
        }

        order.ReviewRecord.Status = ReviewStatus.Approved;
        order.ReviewRecord.Reviewer = "风控专员A";
        order.ReviewRecord.ReviewComment = comment;
        order.ReviewRecord.ReviewedAt = DateTime.Now;
        order.ReviewRecord.Resolution = resolution;

        order.Status = OrderStatus.Submitted;
        order.ExceptionType = ExceptionType.None;
        order.ExceptionReason = null;

        var history = new OrderHistory
        {
            OrderId = order.Id,
            FromStatus = OrderStatus.Exception,
            ToStatus = OrderStatus.Submitted,
            OperationRole = OperationRole.RiskControl,
            Operator = "风控专员A",
            Remark = historyRemark,
            OperatedAt = DateTime.Now
        };
        _context.OrderHistories.Add(history);

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), "Orders", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> Reject(int id, string comment)
    {
        var order = await _context.Orders
            .Include(o => o.ReviewRecord)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null || order.ReviewRecord == null)
        {
            return NotFound();
        }

        order.ReviewRecord.Status = ReviewStatus.Rejected;
        order.ReviewRecord.Reviewer = "风控专员A";
        order.ReviewRecord.ReviewComment = comment;
        order.ReviewRecord.ReviewedAt = DateTime.Now;

        order.Status = OrderStatus.Rejected;

        var history = new OrderHistory
        {
            OrderId = order.Id,
            FromStatus = OrderStatus.Exception,
            ToStatus = OrderStatus.Rejected,
            OperationRole = OperationRole.RiskControl,
            Operator = "风控专员A",
            Remark = $"风控复核驳回：{comment}",
            OperatedAt = DateTime.Now
        };
        _context.OrderHistories.Add(history);

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), "Orders", new { id });
    }
}
