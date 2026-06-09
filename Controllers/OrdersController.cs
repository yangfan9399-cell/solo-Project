using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Data;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Controllers;

public class OrdersController : Controller
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index(
        string? status,
        string? exceptionType,
        string? search,
        int page = 1,
        int pageSize = 10)
    {
        var query = _context.Orders
            .Include(o => o.Dealer)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            if (Enum.TryParse<OrderStatus>(status, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }
        }

        if (!string.IsNullOrEmpty(exceptionType) && exceptionType != "all")
        {
            if (Enum.TryParse<ExceptionType>(exceptionType, out var excType))
            {
                query = query.Where(o => o.ExceptionType == excType);
            }
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(o =>
                o.OrderNo.Contains(search) ||
                o.Dealer.Name.Contains(search));
        }

        var totalCount = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        ViewBag.Status = status ?? "all";
        ViewBag.ExceptionType = exceptionType ?? "all";
        ViewBag.Search = search;
        ViewBag.Page = page;
        ViewBag.PageSize = pageSize;
        ViewBag.TotalCount = totalCount;
        ViewBag.TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var statusItems = new List<SelectListItem>
        {
            new SelectListItem { Text = "全部", Value = "all" }
        };
        foreach (OrderStatus s in Enum.GetValues(typeof(OrderStatus)))
        {
            statusItems.Add(new SelectListItem
            {
                Text = s switch
                {
                    OrderStatus.Draft => "草稿",
                    OrderStatus.Submitted => "已提交",
                    OrderStatus.CreditFrozen => "额度已冻结",
                    OrderStatus.Shipped => "已发货",
                    OrderStatus.Completed => "已完成",
                    OrderStatus.Rejected => "已驳回",
                    OrderStatus.Exception => "异常",
                    _ => s.ToString()
                },
                Value = s.ToString()
            });
        }
        ViewBag.StatusSelectList = new SelectList(statusItems, "Value", "Text", ViewBag.Status);

        var exceptionTypeItems = new List<SelectListItem>
        {
            new SelectListItem { Text = "全部", Value = "all" }
        };
        foreach (ExceptionType e in Enum.GetValues(typeof(ExceptionType)))
        {
            exceptionTypeItems.Add(new SelectListItem
            {
                Text = e switch
                {
                    ExceptionType.None => "无异常",
                    ExceptionType.InsufficientCredit => "额度不足",
                    ExceptionType.OverdueDebt => "逾期欠款",
                    ExceptionType.PricePolicyConflict => "价格政策冲突",
                    _ => e.ToString()
                },
                Value = e.ToString()
            });
        }
        ViewBag.ExceptionTypeSelectList = new SelectList(exceptionTypeItems, "Value", "Text", ViewBag.ExceptionType);

        return View(orders);
    }

    public async Task<IActionResult> Details(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Dealer)
            .ThenInclude(d => d.CreditLimit)
            .Include(o => o.Dealer)
            .ThenInclude(d => d.Debts)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Include(o => o.Histories)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        var applicablePolicies = await _context.PricePolicies
            .Where(p => p.ApplicableLevel == order.Dealer.Level && p.IsActive)
            .ToListAsync();

        var overdueDebts = order.Dealer.Debts
            .Where(d => d.DueDate < DateTime.Today && !d.IsPaid)
            .ToList();

        ViewBag.ApplicablePolicies = applicablePolicies;
        ViewBag.OverdueDebts = overdueDebts;
        ViewBag.TotalOverdueAmount = overdueDebts.Sum(d => d.Amount);

        return View(order);
    }

    public async Task<IActionResult> Create()
    {
        var dealers = await _context.Dealers
            .Include(d => d.CreditLimit)
            .OrderBy(d => d.Name)
            .ToListAsync();

        var products = await _context.Products
            .Where(p => p.Stock > 0)
            .OrderBy(p => p.Name)
            .ToListAsync();

        var pricePolicies = await _context.PricePolicies
            .Where(p => p.IsActive)
            .Include(p => p.ProductPricePolicies)
            .ToListAsync();

        ViewBag.Dealers = dealers;
        ViewBag.Products = products;
        ViewBag.PricePolicies = pricePolicies;

        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(int dealerId, int[] productIds, int[] quantities)
    {
        if (productIds == null || productIds.Length == 0)
        {
            ModelState.AddModelError("", "请至少选择一个商品");
            return RedirectToAction(nameof(Create));
        }

        var dealer = await _context.Dealers
            .Include(d => d.CreditLimit)
            .FirstOrDefaultAsync(d => d.Id == dealerId);

        if (dealer == null)
        {
            return NotFound();
        }

        var pricePolicies = await _context.PricePolicies
            .Where(p => p.ApplicableLevel == dealer.Level && p.IsActive)
            .Include(p => p.ProductPricePolicies)
            .ToListAsync();

        var orderNo = $"ORD{DateTime.Now:yyyyMMdd}{new Random().Next(1000, 9999)}";

        var order = new Order
        {
            OrderNo = orderNo,
            DealerId = dealerId,
            Status = OrderStatus.Draft,
            ExceptionType = ExceptionType.None,
            SalesPerson = "销售员A",
            CreatedAt = DateTime.Now
        };

        var items = new List<OrderItem>();
        decimal totalAmount = 0;
        decimal discountAmount = 0;

        for (int i = 0; i < productIds.Length; i++)
        {
            if (quantities[i] <= 0) continue;

            var product = await _context.Products.FindAsync(productIds[i]);
            if (product == null) continue;

            var applicablePolicy = pricePolicies
                .FirstOrDefault(p => p.ProductCategory == product.Category
                    && p.ProductPricePolicies.Any(pp => pp.ProductId == product.Id));

            decimal unitPrice = product.StandardPrice;
            decimal discountPrice = product.StandardPrice;
            string? policyName = null;

            if (applicablePolicy != null)
            {
                var specialPrice = applicablePolicy.ProductPricePolicies
                    .FirstOrDefault(pp => pp.ProductId == product.Id)?.SpecialPrice;

                if (specialPrice.HasValue)
                {
                    discountPrice = specialPrice.Value;
                    policyName = applicablePolicy.PolicyName;
                }
            }

            var amount = discountPrice * quantities[i];
            totalAmount += unitPrice * quantities[i];
            discountAmount += (unitPrice - discountPrice) * quantities[i];

            items.Add(new OrderItem
            {
                ProductId = productIds[i],
                Quantity = quantities[i],
                UnitPrice = unitPrice,
                DiscountPrice = discountPrice,
                Amount = amount,
                PricePolicyName = policyName
            });
        }

        order.Items = items;
        order.TotalAmount = totalAmount;
        order.DiscountAmount = discountAmount;
        order.FinalAmount = totalAmount - discountAmount;

        order.Status = OrderStatus.Submitted;
        order.SubmittedAt = DateTime.Now;

        var history = new OrderHistory
        {
            FromStatus = OrderStatus.Draft,
            ToStatus = OrderStatus.Submitted,
            OperationRole = OperationRole.Sales,
            Operator = "销售员A",
            Remark = "销售提交订单",
            OperatedAt = DateTime.Now
        };
        order.Histories.Add(history);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return RedirectToAction(nameof(Details), new { id = order.Id });
    }
}
