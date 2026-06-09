using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Data;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Controllers;

public class WarehouseController : Controller
{
    private readonly AppDbContext _context;

    public WarehouseController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var orders = await _context.Orders
            .Include(o => o.Dealer)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Where(o => o.Status == OrderStatus.CreditFrozen)
            .OrderBy(o => o.CreditFrozenAt)
            .ToListAsync();

        return View(orders);
    }

    [HttpPost]
    public async Task<IActionResult> ConfirmShip(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null || order.Status != OrderStatus.CreditFrozen)
        {
            return NotFound();
        }

        var creditLimit = order.Dealer.CreditLimit;

        if (creditLimit.FrozenCredit < order.CreditFrozen)
        {
            ModelState.AddModelError("", "冻结额度不足，请联系财务");
            return RedirectToAction(nameof(Details), "Orders", new { id });
        }

        foreach (var item in order.Items)
        {
            if (item.Product.Stock < item.Quantity)
            {
                ModelState.AddModelError("", $"商品{item.Product.Name}库存不足，现有库存{item.Product.Stock}，需要{item.Quantity}");
                return RedirectToAction(nameof(Details), "Orders", new { id });
            }
        }

        foreach (var item in order.Items)
        {
            item.Product.Stock -= item.Quantity;
        }

        creditLimit.FrozenCredit -= order.CreditFrozen;
        creditLimit.UsedCredit += order.CreditFrozen;

        order.CreditUsed = order.CreditFrozen;
        order.CreditFrozen = 0;
        order.Status = OrderStatus.Shipped;
        order.WarehouseOperator = "仓管员A";
        order.ShippedAt = DateTime.Now;

        var history = new OrderHistory
        {
            OrderId = order.Id,
            FromStatus = OrderStatus.CreditFrozen,
            ToStatus = OrderStatus.Shipped,
            OperationRole = OperationRole.Warehouse,
            Operator = "仓管员A",
            Remark = "仓库确认发货，冻结额度转为已用额度",
            OperatedAt = DateTime.Now
        };
        _context.OrderHistories.Add(history);

        var debt = new Debt
        {
            DealerId = order.DealerId,
            Amount = order.FinalAmount,
            DueDate = DateTime.Today.AddDays(order.Dealer.CreditLimit.PaymentDays),
            IsPaid = false,
            Description = $"订单{order.OrderNo}发货产生应收账款",
            RelatedOrderId = order.Id
        };
        _context.Debts.Add(debt);

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), "Orders", new { id });
    }

    [HttpPost]
    public async Task<IActionResult> CompleteOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Dealer)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null || order.Status != OrderStatus.Shipped)
        {
            return NotFound();
        }

        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.Now;

        var history = new OrderHistory
        {
            OrderId = order.Id,
            FromStatus = OrderStatus.Shipped,
            ToStatus = OrderStatus.Completed,
            OperationRole = OperationRole.Warehouse,
            Operator = "仓管员A",
            Remark = "订单完成",
            OperatedAt = DateTime.Now
        };
        _context.OrderHistories.Add(history);

        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), "Orders", new { id });
    }

    public async Task<IActionResult> BlockedOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Where(o => o.Status == OrderStatus.Exception && o.ExceptionType == ExceptionType.InsufficientCredit)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return View(orders);
    }
}
