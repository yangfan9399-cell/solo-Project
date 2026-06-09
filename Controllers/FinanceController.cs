using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Data;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Controllers;

public class FinanceController : Controller
{
    private readonly AppDbContext _context;

    public FinanceController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var pendingOrders = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Where(o => o.Status == OrderStatus.Submitted)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync();

        return View(pendingOrders);
    }

    [HttpPost]
    public async Task<IActionResult> FreezeCredit(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Include(o => o.Dealer)
            .ThenInclude(d => d.Debts)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null || order.Status != OrderStatus.Submitted)
        {
            return NotFound();
        }

        var creditLimit = order.Dealer.CreditLimit;
        var availableCredit = creditLimit.TotalCredit - creditLimit.UsedCredit - creditLimit.FrozenCredit;

        var overdueDebts = order.Dealer.Debts
            .Where(d => d.DueDate < DateTime.Today && !d.IsPaid)
            .ToList();

        if (overdueDebts.Any())
        {
            order.Status = OrderStatus.Exception;
            order.ExceptionType = ExceptionType.OverdueDebt;
            order.ExceptionReason = $"经销商存在逾期欠款{overdueDebts.Sum(d => d.Amount):C0}，逾期最长{overdueDebts.Max(d => (DateTime.Today - d.DueDate).Days)}天，禁止占用授信额度";

            var reviewRecord = new ReviewRecord
            {
                OrderId = order.Id,
                ExceptionType = ExceptionType.OverdueDebt,
                Status = ReviewStatus.Pending
            };
            _context.ReviewRecords.Add(reviewRecord);

            var history = new OrderHistory
            {
                OrderId = order.Id,
                FromStatus = OrderStatus.Submitted,
                ToStatus = OrderStatus.Exception,
                OperationRole = OperationRole.Finance,
                Operator = "财务系统",
                Remark = "检测到逾期欠款，订单转为异常",
                OperatedAt = DateTime.Now
            };
            _context.OrderHistories.Add(history);

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), "Orders", new { id });
        }

        if (availableCredit < order.FinalAmount)
        {
            order.Status = OrderStatus.Exception;
            order.ExceptionType = ExceptionType.InsufficientCredit;
            order.ExceptionReason = $"可用授信额度不足。订单金额{order.FinalAmount:C0}，可用额度仅{availableCredit:C0}，差额{(order.FinalAmount - availableCredit):C0}";

            var reviewRecord = new ReviewRecord
            {
                OrderId = order.Id,
                ExceptionType = ExceptionType.InsufficientCredit,
                Status = ReviewStatus.Pending
            };
            _context.ReviewRecords.Add(reviewRecord);

            var history = new OrderHistory
            {
                OrderId = order.Id,
                FromStatus = OrderStatus.Submitted,
                ToStatus = OrderStatus.Exception,
                OperationRole = OperationRole.Finance,
                Operator = "财务系统",
                Remark = "授信额度不足，订单挂起",
                OperatedAt = DateTime.Now
            };
            _context.OrderHistories.Add(history);

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), "Orders", new { id });
        }

        var pricePolicies = await _context.PricePolicies
            .Where(p => p.ApplicableLevel == order.Dealer.Level && p.IsActive)
            .ToListAsync();

        bool hasPriceConflict = false;
        string? conflictReason = null;

        if (order.Items.Any(i => !string.IsNullOrEmpty(i.PricePolicyName)))
        {
            foreach (var item in order.Items.Where(i => !string.IsNullOrEmpty(i.PricePolicyName)))
            {
                var policy = pricePolicies.FirstOrDefault(p => p.PolicyName == item.PricePolicyName);
                if (policy != null)
                {
                    var policyItems = order.Items
                        .Where(i => i.PricePolicyName == policy.PolicyName)
                        .Sum(i => i.Amount);

                    if (policyItems < policy.MinOrderAmount)
                    {
                        hasPriceConflict = true;
                        conflictReason = $"价格政策\"{policy.PolicyName}\"最低起订金额为{policy.MinOrderAmount:C0}，当前该政策下商品金额仅{policyItems:C0}";
                        break;
                    }
                }
            }
        }

        if (hasPriceConflict)
        {
            order.Status = OrderStatus.Exception;
            order.ExceptionType = ExceptionType.PricePolicyConflict;
            order.ExceptionReason = conflictReason;

            var reviewRecord = new ReviewRecord
            {
                OrderId = order.Id,
                ExceptionType = ExceptionType.PricePolicyConflict,
                Status = ReviewStatus.Pending
            };
            _context.ReviewRecords.Add(reviewRecord);

            var history = new OrderHistory
            {
                OrderId = order.Id,
                FromStatus = OrderStatus.Submitted,
                ToStatus = OrderStatus.Exception,
                OperationRole = OperationRole.Finance,
                Operator = "财务系统",
                Remark = "价格政策冲突，订单挂起",
                OperatedAt = DateTime.Now
            };
            _context.OrderHistories.Add(history);

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), "Orders", new { id });
        }

        creditLimit.FrozenCredit += order.FinalAmount;
        order.CreditFrozen = order.FinalAmount;
        order.Status = OrderStatus.CreditFrozen;
        order.FinanceOperator = "财务员A";
        order.CreditFrozenAt = DateTime.Now;

        var freezeRecord = new CreditFreezeRecord
        {
            OrderId = order.Id,
            DealerId = order.DealerId,
            Amount = order.FinalAmount,
            IsFrozen = true,
            Operator = "财务员A",
            OperatedAt = DateTime.Now,
            Remark = "订单授信额度冻结"
        };
        _context.CreditFreezeRecords.Add(freezeRecord);

        var orderHistory = new OrderHistory
        {
            OrderId = order.Id,
            FromStatus = OrderStatus.Submitted,
            ToStatus = OrderStatus.CreditFrozen,
            OperationRole = OperationRole.Finance,
            Operator = "财务员A",
            Remark = $"财务冻结授信额度{order.FinalAmount:C0}",
            OperatedAt = DateTime.Now
        };
        _context.OrderHistories.Add(orderHistory);

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), "Orders", new { id });
    }

    public async Task<IActionResult> CreditLimits()
    {
        var dealers = await _context.Dealers
            .Include(d => d.CreditLimit)
            .Include(d => d.Debts)
            .OrderBy(d => d.Region)
            .ThenByDescending(d => d.Level)
            .ToListAsync();

        return View(dealers);
    }

    public async Task<IActionResult> Debts()
    {
        var debts = await _context.Debts
            .Include(d => d.Dealer)
            .Where(d => !d.IsPaid)
            .OrderByDescending(d => d.DueDate)
            .ToListAsync();

        return View(debts);
    }
}
