using Microsoft.EntityFrameworkCore;
using LiquorCreditSystem.Models;

namespace LiquorCreditSystem.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Dealers.AnyAsync())
        {
            return;
        }

        var dealers = CreateDealers();
        await context.Dealers.AddRangeAsync(dealers);
        await context.SaveChangesAsync();

        var creditLimits = CreateCreditLimits(dealers);
        await context.CreditLimits.AddRangeAsync(creditLimits);
        await context.SaveChangesAsync();

        var debts = CreateDebts(dealers);
        await context.Debts.AddRangeAsync(debts);
        await context.SaveChangesAsync();

        var products = CreateProducts();
        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        var pricePolicies = CreatePricePolicies(products);
        await context.PricePolicies.AddRangeAsync(pricePolicies);
        await context.SaveChangesAsync();

        var productPricePolicies = CreateProductPricePolicies(products, pricePolicies);
        await context.ProductPricePolicies.AddRangeAsync(productPricePolicies);
        await context.SaveChangesAsync();

        var orders = CreateSampleOrders(dealers, products, pricePolicies);
        await context.Orders.AddRangeAsync(orders);
        await context.SaveChangesAsync();
    }

    private static List<Dealer> CreateDealers()
    {
        return new List<Dealer>
        {
            new Dealer
            {
                Name = "华东酒业有限公司",
                ContactPerson = "张三",
                Phone = "13800138001",
                Address = "上海市浦东新区陆家嘴路100号",
                Region = "华东",
                Level = DealerLevel.A
            },
            new Dealer
            {
                Name = "华南商贸集团",
                ContactPerson = "李四",
                Phone = "13800138002",
                Address = "广州市天河区珠江新城200号",
                Region = "华南",
                Level = DealerLevel.B
            },
            new Dealer
            {
                Name = "华北烟酒批发部",
                ContactPerson = "王五",
                Phone = "13800138003",
                Address = "北京市朝阳区建国路300号",
                Region = "华北",
                Level = DealerLevel.A
            },
            new Dealer
            {
                Name = "西南酒业经销处",
                ContactPerson = "赵六",
                Phone = "13800138004",
                Address = "成都市锦江区春熙路400号",
                Region = "西南",
                Level = DealerLevel.C
            },
            new Dealer
            {
                Name = "东北酒类贸易公司",
                ContactPerson = "钱七",
                Phone = "13800138005",
                Address = "沈阳市和平区太原街500号",
                Region = "东北",
                Level = DealerLevel.B
            }
        };
    }

    private static List<CreditLimit> CreateCreditLimits(List<Dealer> dealers)
    {
        return new List<CreditLimit>
        {
            new CreditLimit
            {
                DealerId = dealers[0].Id,
                TotalCredit = 5000000,
                UsedCredit = 1200000,
                FrozenCredit = 482632,
                PaymentDays = 60,
                EffectiveDate = new DateTime(2026, 1, 1),
                ExpiryDate = new DateTime(2026, 12, 31)
            },
            new CreditLimit
            {
                DealerId = dealers[1].Id,
                TotalCredit = 2000000,
                UsedCredit = 1800000,
                FrozenCredit = 0,
                PaymentDays = 45,
                EffectiveDate = new DateTime(2026, 1, 1),
                ExpiryDate = new DateTime(2026, 12, 31)
            },
            new CreditLimit
            {
                DealerId = dealers[2].Id,
                TotalCredit = 3000000,
                UsedCredit = 800000,
                FrozenCredit = 0,
                PaymentDays = 60,
                EffectiveDate = new DateTime(2026, 1, 1),
                ExpiryDate = new DateTime(2026, 12, 31)
            },
            new CreditLimit
            {
                DealerId = dealers[3].Id,
                TotalCredit = 800000,
                UsedCredit = 500000,
                FrozenCredit = 0,
                PaymentDays = 30,
                EffectiveDate = new DateTime(2026, 1, 1),
                ExpiryDate = new DateTime(2026, 12, 31)
            },
            new CreditLimit
            {
                DealerId = dealers[4].Id,
                TotalCredit = 1500000,
                UsedCredit = 700000,
                FrozenCredit = 0,
                PaymentDays = 45,
                EffectiveDate = new DateTime(2026, 1, 1),
                ExpiryDate = new DateTime(2026, 12, 31)
            }
        };
    }

    private static List<Debt> CreateDebts(List<Dealer> dealers)
    {
        return new List<Debt>
        {
            new Debt
            {
                DealerId = dealers[0].Id,
                Amount = 500000,
                DueDate = new DateTime(2026, 7, 15),
                IsPaid = false,
                Description = "2026年5月货款"
            },
            new Debt
            {
                DealerId = dealers[0].Id,
                Amount = 700000,
                DueDate = new DateTime(2026, 8, 20),
                IsPaid = false,
                Description = "2026年6月货款"
            },
            new Debt
            {
                DealerId = dealers[1].Id,
                Amount = 800000,
                DueDate = new DateTime(2026, 4, 10),
                IsPaid = false,
                Description = "2026年3月货款-逾期"
            },
            new Debt
            {
                DealerId = dealers[1].Id,
                Amount = 1000000,
                DueDate = new DateTime(2026, 5, 25),
                IsPaid = false,
                Description = "2026年4月货款-逾期"
            },
            new Debt
            {
                DealerId = dealers[2].Id,
                Amount = 300000,
                DueDate = new DateTime(2026, 7, 30),
                IsPaid = false,
                Description = "2026年5月货款"
            },
            new Debt
            {
                DealerId = dealers[2].Id,
                Amount = 500000,
                DueDate = new DateTime(2026, 8, 15),
                IsPaid = false,
                Description = "2026年6月货款"
            },
            new Debt
            {
                DealerId = dealers[3].Id,
                Amount = 200000,
                DueDate = new DateTime(2026, 3, 1),
                IsPaid = false,
                Description = "2026年2月货款-严重逾期"
            },
            new Debt
            {
                DealerId = dealers[3].Id,
                Amount = 300000,
                DueDate = new DateTime(2026, 7, 1),
                IsPaid = false,
                Description = "2026年5月货款"
            },
            new Debt
            {
                DealerId = dealers[4].Id,
                Amount = 400000,
                DueDate = new DateTime(2026, 7, 20),
                IsPaid = false,
                Description = "2026年5月货款"
            },
            new Debt
            {
                DealerId = dealers[4].Id,
                Amount = 300000,
                DueDate = new DateTime(2026, 8, 5),
                IsPaid = false,
                Description = "2026年6月货款"
            }
        };
    }

    private static List<Product> CreateProducts()
    {
        return new List<Product>
        {
            new Product
            {
                Name = "飞天茅台53度500ml",
                Category = "白酒",
                Sku = "MT-001",
                StandardPrice = 2899,
                Stock = 500,
                Description = "贵州茅台酒，酱香型白酒"
            },
            new Product
            {
                Name = "五粮液52度500ml",
                Category = "白酒",
                Sku = "WLY-001",
                StandardPrice = 1299,
                Stock = 1000,
                Description = "五粮液，浓香型白酒"
            },
            new Product
            {
                Name = "剑南春52度500ml",
                Category = "白酒",
                Sku = "JNC-001",
                StandardPrice = 498,
                Stock = 2000,
                Description = "剑南春，浓香型白酒"
            },
            new Product
            {
                Name = "泸州老窖特曲52度500ml",
                Category = "白酒",
                Sku = "LZ-001",
                StandardPrice = 298,
                Stock = 3000,
                Description = "泸州老窖特曲，浓香型白酒"
            },
            new Product
            {
                Name = "汾酒青花20年53度500ml",
                Category = "白酒",
                Sku = "FJ-001",
                StandardPrice = 398,
                Stock = 1500,
                Description = "山西汾酒，清香型白酒"
            },
            new Product
            {
                Name = "拉菲传奇干红葡萄酒750ml",
                Category = "红酒",
                Sku = "LF-001",
                StandardPrice = 198,
                Stock = 5000,
                Description = "法国波尔多产区红酒"
            }
        };
    }

    private static List<PricePolicy> CreatePricePolicies(List<Product> products)
    {
        return new List<PricePolicy>
        {
            new PricePolicy
            {
                PolicyName = "A级经销商白酒特惠",
                ProductCategory = "白酒",
                MinOrderAmount = 50000,
                DiscountRate = 0.92m,
                MaxDiscountAmount = 50000,
                ApplicableLevel = DealerLevel.A,
                StartDate = new DateTime(2026, 1, 1),
                EndDate = new DateTime(2026, 12, 31)
            },
            new PricePolicy
            {
                PolicyName = "B级经销商季度促销",
                ProductCategory = "白酒",
                MinOrderAmount = 20000,
                DiscountRate = 0.95m,
                MaxDiscountAmount = 20000,
                ApplicableLevel = DealerLevel.B,
                StartDate = new DateTime(2026, 1, 1),
                EndDate = new DateTime(2026, 12, 31)
            },
            new PricePolicy
            {
                PolicyName = "红酒全场9折",
                ProductCategory = "红酒",
                MinOrderAmount = 5000,
                DiscountRate = 0.90m,
                MaxDiscountAmount = 10000,
                ApplicableLevel = DealerLevel.C,
                StartDate = new DateTime(2026, 6, 1),
                EndDate = new DateTime(2026, 9, 30)
            }
        };
    }

    private static List<ProductPricePolicy> CreateProductPricePolicies(List<Product> products, List<PricePolicy> policies)
    {
        return new List<ProductPricePolicy>
        {
            new ProductPricePolicy
            {
                ProductId = products[0].Id,
                PricePolicyId = policies[0].Id,
                SpecialPrice = 2650
            },
            new ProductPricePolicy
            {
                ProductId = products[1].Id,
                PricePolicyId = policies[0].Id,
                SpecialPrice = 1180
            },
            new ProductPricePolicy
            {
                ProductId = products[2].Id,
                PricePolicyId = policies[0].Id,
                SpecialPrice = 450
            },
            new ProductPricePolicy
            {
                ProductId = products[0].Id,
                PricePolicyId = policies[1].Id,
                SpecialPrice = 2750
            },
            new ProductPricePolicy
            {
                ProductId = products[1].Id,
                PricePolicyId = policies[1].Id,
                SpecialPrice = 1230
            },
            new ProductPricePolicy
            {
                ProductId = products[5].Id,
                PricePolicyId = policies[2].Id,
                SpecialPrice = 178
            }
        };
    }

    private static List<Order> CreateSampleOrders(List<Dealer> dealers, List<Product> products, List<PricePolicy> policies)
    {
        var orders = new List<Order>();
        var now = DateTime.Now;

        var order1 = new Order
        {
            OrderNo = "ORD20260601001",
            DealerId = dealers[0].Id,
            Status = OrderStatus.Completed,
            ExceptionType = ExceptionType.None,
            TotalAmount = 304850,
            DiscountAmount = 24388,
            FinalAmount = 280462,
            CreditUsed = 280462,
            CreditFrozen = 0,
            SalesPerson = "销售员A",
            FinanceOperator = "财务员A",
            WarehouseOperator = "仓管员A",
            CreatedAt = now.AddDays(-30),
            SubmittedAt = now.AddDays(-29),
            CreditFrozenAt = now.AddDays(-28),
            ShippedAt = now.AddDays(-25),
            CompletedAt = now.AddDays(-20),
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = products[0].Id,
                    Quantity = 50,
                    UnitPrice = 2899,
                    DiscountPrice = 2650,
                    Amount = 132500,
                    PricePolicyName = "A级经销商白酒特惠"
                },
                new OrderItem
                {
                    ProductId = products[1].Id,
                    Quantity = 100,
                    UnitPrice = 1299,
                    DiscountPrice = 1180,
                    Amount = 118000,
                    PricePolicyName = "A级经销商白酒特惠"
                },
                new OrderItem
                {
                    ProductId = products[2].Id,
                    Quantity = 100,
                    UnitPrice = 498,
                    DiscountPrice = 450,
                    Amount = 45000,
                    PricePolicyName = "A级经销商白酒特惠"
                }
            },
            Histories = new List<OrderHistory>
            {
                new OrderHistory
                {
                    FromStatus = OrderStatus.Draft,
                    ToStatus = OrderStatus.Submitted,
                    OperationRole = OperationRole.Sales,
                    Operator = "销售员A",
                    Remark = "销售提交订单",
                    OperatedAt = now.AddDays(-29)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Submitted,
                    ToStatus = OrderStatus.CreditFrozen,
                    OperationRole = OperationRole.Finance,
                    Operator = "财务员A",
                    Remark = "财务冻结授信额度280462元",
                    OperatedAt = now.AddDays(-28)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.CreditFrozen,
                    ToStatus = OrderStatus.Shipped,
                    OperationRole = OperationRole.Warehouse,
                    Operator = "仓管员A",
                    Remark = "仓库确认发货",
                    OperatedAt = now.AddDays(-25)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Shipped,
                    ToStatus = OrderStatus.Completed,
                    OperationRole = OperationRole.Warehouse,
                    Operator = "仓管员A",
                    Remark = "订单完成，额度转为已用",
                    OperatedAt = now.AddDays(-20)
                }
            }
        };
        orders.Add(order1);

        var order2 = new Order
        {
            OrderNo = "ORD20260615002",
            DealerId = dealers[1].Id,
            Status = OrderStatus.Exception,
            ExceptionType = ExceptionType.InsufficientCredit,
            ExceptionReason = "可用授信额度不足，订单金额320,000元，可用额度仅200,000元",
            TotalAmount = 320000,
            DiscountAmount = 16000,
            FinalAmount = 304000,
            CreditUsed = 0,
            CreditFrozen = 0,
            SalesPerson = "销售员B",
            CreatedAt = now.AddDays(-15),
            SubmittedAt = now.AddDays(-14),
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = products[0].Id,
                    Quantity = 80,
                    UnitPrice = 2899,
                    DiscountPrice = 2750,
                    Amount = 220000,
                    PricePolicyName = "B级经销商季度促销"
                },
                new OrderItem
                {
                    ProductId = products[1].Id,
                    Quantity = 60,
                    UnitPrice = 1299,
                    DiscountPrice = 1230,
                    Amount = 73800,
                    PricePolicyName = "B级经销商季度促销"
                }
            },
            Histories = new List<OrderHistory>
            {
                new OrderHistory
                {
                    FromStatus = OrderStatus.Draft,
                    ToStatus = OrderStatus.Submitted,
                    OperationRole = OperationRole.Sales,
                    Operator = "销售员B",
                    Remark = "销售提交订单",
                    OperatedAt = now.AddDays(-14)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Submitted,
                    ToStatus = OrderStatus.Exception,
                    OperationRole = OperationRole.Finance,
                    Operator = "财务员B",
                    Remark = "授信额度不足，订单挂起",
                    OperatedAt = now.AddDays(-13)
                }
            },
            ReviewRecord = new ReviewRecord
            {
                ExceptionType = ExceptionType.InsufficientCredit,
                Status = ReviewStatus.Pending,
                Reviewer = "",
                ReviewComment = ""
            }
        };
        orders.Add(order2);

        var order3 = new Order
        {
            OrderNo = "ORD20260620003",
            DealerId = dealers[2].Id,
            Status = OrderStatus.Shipped,
            ExceptionType = ExceptionType.None,
            TotalAmount = 199600,
            DiscountAmount = 15968,
            FinalAmount = 183632,
            CreditUsed = 183632,
            CreditFrozen = 0,
            SalesPerson = "销售员C",
            FinanceOperator = "财务员C",
            WarehouseOperator = "仓管员C",
            CreatedAt = now.AddDays(-10),
            SubmittedAt = now.AddDays(-9),
            CreditFrozenAt = now.AddDays(-8),
            ShippedAt = now.AddDays(-5),
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = products[0].Id,
                    Quantity = 30,
                    UnitPrice = 2899,
                    DiscountPrice = 2650,
                    Amount = 79500,
                    PricePolicyName = "A级经销商白酒特惠"
                },
                new OrderItem
                {
                    ProductId = products[2].Id,
                    Quantity = 200,
                    UnitPrice = 498,
                    DiscountPrice = 450,
                    Amount = 90000,
                    PricePolicyName = "A级经销商白酒特惠"
                }
            },
            Histories = new List<OrderHistory>
            {
                new OrderHistory
                {
                    FromStatus = OrderStatus.Draft,
                    ToStatus = OrderStatus.Submitted,
                    OperationRole = OperationRole.Sales,
                    Operator = "销售员C",
                    Remark = "销售提交订单",
                    OperatedAt = now.AddDays(-9)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Submitted,
                    ToStatus = OrderStatus.CreditFrozen,
                    OperationRole = OperationRole.Finance,
                    Operator = "财务员C",
                    Remark = "财务冻结授信额度183632元",
                    OperatedAt = now.AddDays(-8)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.CreditFrozen,
                    ToStatus = OrderStatus.Shipped,
                    OperationRole = OperationRole.Warehouse,
                    Operator = "仓管员C",
                    Remark = "仓库确认发货",
                    OperatedAt = now.AddDays(-5)
                }
            }
        };
        orders.Add(order3);

        var order4 = new Order
        {
            OrderNo = "ORD20260625004",
            DealerId = dealers[3].Id,
            Status = OrderStatus.Exception,
            ExceptionType = ExceptionType.OverdueDebt,
            ExceptionReason = "经销商存在逾期欠款200,000元，逾期天数超过90天",
            TotalAmount = 89500,
            DiscountAmount = 4475,
            FinalAmount = 85025,
            CreditUsed = 0,
            CreditFrozen = 0,
            SalesPerson = "销售员D",
            CreatedAt = now.AddDays(-5),
            SubmittedAt = now.AddDays(-4),
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = products[3].Id,
                    Quantity = 200,
                    UnitPrice = 298,
                    DiscountPrice = 280,
                    Amount = 56000
                },
                new OrderItem
                {
                    ProductId = products[4].Id,
                    Quantity = 100,
                    UnitPrice = 398,
                    DiscountPrice = 335,
                    Amount = 33500
                }
            },
            Histories = new List<OrderHistory>
            {
                new OrderHistory
                {
                    FromStatus = OrderStatus.Draft,
                    ToStatus = OrderStatus.Submitted,
                    OperationRole = OperationRole.Sales,
                    Operator = "销售员D",
                    Remark = "销售提交订单",
                    OperatedAt = now.AddDays(-4)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Submitted,
                    ToStatus = OrderStatus.Exception,
                    OperationRole = OperationRole.Finance,
                    Operator = "财务员D",
                    Remark = "逾期欠款未结清，禁止发货",
                    OperatedAt = now.AddDays(-3)
                }
            },
            ReviewRecord = new ReviewRecord
            {
                ExceptionType = ExceptionType.OverdueDebt,
                Status = ReviewStatus.Pending,
                Reviewer = "",
                ReviewComment = ""
            }
        };
        orders.Add(order4);

        var order5 = new Order
        {
            OrderNo = "ORD20260628005",
            DealerId = dealers[4].Id,
            Status = OrderStatus.Exception,
            ExceptionType = ExceptionType.PricePolicyConflict,
            ExceptionReason = "白酒类商品使用了B级经销商季度促销政策，但该类商品订单金额15,990元未达到政策最低起订金额20,000元",
            TotalAmount = 17970,
            DiscountAmount = 740,
            FinalAmount = 17230,
            CreditUsed = 0,
            CreditFrozen = 0,
            SalesPerson = "销售员E",
            CreatedAt = now.AddDays(-2),
            SubmittedAt = now.AddDays(-1),
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = products[0].Id,
                    Quantity = 5,
                    UnitPrice = 2899,
                    DiscountPrice = 2750,
                    Amount = 13750,
                    PricePolicyName = "B级经销商季度促销"
                },
                new OrderItem
                {
                    ProductId = products[3].Id,
                    Quantity = 15,
                    UnitPrice = 298,
                    DiscountPrice = 298,
                    Amount = 4470
                }
            },
            Histories = new List<OrderHistory>
            {
                new OrderHistory
                {
                    FromStatus = OrderStatus.Draft,
                    ToStatus = OrderStatus.Submitted,
                    OperationRole = OperationRole.Sales,
                    Operator = "销售员E",
                    Remark = "销售提交订单",
                    OperatedAt = now.AddDays(-1)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Submitted,
                    ToStatus = OrderStatus.Exception,
                    OperationRole = OperationRole.Finance,
                    Operator = "财务员E",
                    Remark = "价格政策冲突，白酒类商品不满足B级经销商季度促销政策最低起订金额20,000元",
                    OperatedAt = now.AddDays(-1).AddHours(4)
                }
            },
            ReviewRecord = new ReviewRecord
            {
                ExceptionType = ExceptionType.PricePolicyConflict,
                Status = ReviewStatus.Pending,
                Reviewer = "",
                ReviewComment = ""
            }
        };
        orders.Add(order5);

        var order6 = new Order
        {
            OrderNo = "ORD20260630006",
            DealerId = dealers[0].Id,
            Status = OrderStatus.CreditFrozen,
            ExceptionType = ExceptionType.None,
            TotalAmount = 524600,
            DiscountAmount = 41968,
            FinalAmount = 482632,
            CreditUsed = 0,
            CreditFrozen = 482632,
            SalesPerson = "销售员A",
            FinanceOperator = "财务员A",
            CreatedAt = now.AddDays(-1),
            SubmittedAt = now.AddDays(-1).AddHours(2),
            CreditFrozenAt = now.AddDays(-1).AddHours(5),
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    ProductId = products[0].Id,
                    Quantity = 100,
                    UnitPrice = 2899,
                    DiscountPrice = 2650,
                    Amount = 265000,
                    PricePolicyName = "A级经销商白酒特惠"
                },
                new OrderItem
                {
                    ProductId = products[1].Id,
                    Quantity = 150,
                    UnitPrice = 1299,
                    DiscountPrice = 1180,
                    Amount = 177000,
                    PricePolicyName = "A级经销商白酒特惠"
                },
                new OrderItem
                {
                    ProductId = products[5].Id,
                    Quantity = 200,
                    UnitPrice = 198,
                    DiscountPrice = 180,
                    Amount = 36000
                }
            },
            Histories = new List<OrderHistory>
            {
                new OrderHistory
                {
                    FromStatus = OrderStatus.Draft,
                    ToStatus = OrderStatus.Submitted,
                    OperationRole = OperationRole.Sales,
                    Operator = "销售员A",
                    Remark = "销售提交订单",
                    OperatedAt = now.AddDays(-1).AddHours(2)
                },
                new OrderHistory
                {
                    FromStatus = OrderStatus.Submitted,
                    ToStatus = OrderStatus.CreditFrozen,
                    OperationRole = OperationRole.Finance,
                    Operator = "财务员A",
                    Remark = "财务冻结授信额度482632元",
                    OperatedAt = now.AddDays(-1).AddHours(5)
                }
            }
        };
        orders.Add(order6);

        return orders;
    }
}
