using FuelManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.Data;

public static class SeedData
{
    public static void Initialize(IServiceProvider serviceProvider)
    {
        using var context = new AppDbContext(
            serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

        if (!context.Ships.Any())
        {
            context.Ships.AddRange(
                new Ship
                {
                    Name = "海洋之星号",
                    ImoNumber = "IMO9700001",
                    Flag = "巴拿马",
                    Deadweight = 85000
                },
                new Ship
                {
                    Name = "太平洋荣耀号",
                    ImoNumber = "IMO9700002",
                    Flag = "利比里亚",
                    Deadweight = 120000
                },
                new Ship
                {
                    Name = "大西洋先锋号",
                    ImoNumber = "IMO9700003",
                    Flag = "新加坡",
                    Deadweight = 65000
                },
                new Ship
                {
                    Name = "印度洋明珠号",
                    ImoNumber = "IMO9700004",
                    Flag = "中国香港",
                    Deadweight = 95000
                }
            );
        }

        if (!context.Suppliers.Any())
        {
            context.Suppliers.AddRange(
                new Supplier
                {
                    Name = "新加坡港务燃油供应有限公司",
                    ContactPerson = "陈经理",
                    Phone = "+65 6123 4567",
                    Email = "sales@sgbunker.com.sg",
                    Address = "新加坡滨海湾港务大厦18号"
                },
                new Supplier
                {
                    Name = "上海港燃料供应股份有限公司",
                    ContactPerson = "王主管",
                    Phone = "+86 21 5888 6666",
                    Email = "bunker@shfuel.com.cn",
                    Address = "上海市浦东新区港航路1号"
                },
                new Supplier
                {
                    Name = "鹿特丹港燃油服务公司",
                    ContactPerson = "Peter van der Berg",
                    Phone = "+31 10 123 4567",
                    Email = "info@rotterdambunker.nl",
                    Address = "Rotterdam Haven 42, 3000 AA Rotterdam"
                },
                new Supplier
                {
                    Name = "香港华光燃油有限公司",
                    ContactPerson = "李先生",
                    Phone = "+852 2522 8888",
                    Email = "bunker@huaguang.com.hk",
                    Address = "香港中环德辅道中188号"
                }
            );
        }

        context.SaveChanges();

        if (!context.FuelApplications.Any())
        {
            var ships = context.Ships.ToList();
            var suppliers = context.Suppliers.ToList();

            var applications = new List<FuelApplication>();

            var normalApp = new FuelApplication
            {
                ApplicationNumber = "FA-2024-0001",
                ShipId = ships[0].Id,
                SupplierId = suppliers[0].Id,
                FuelType = FuelType.VLSFO,
                PlannedQuantity = 500,
                ActualQuantity = 498.5,
                UnitPrice = 680.50m,
                TotalAmount = 498.5m * 680.50m,
                Status = ApplicationStatus.Settled,
                Port = "新加坡",
                PlannedBunkeringDate = new DateTime(2024, 1, 15, 8, 0, 0, DateTimeKind.Utc),
                ActualBunkeringDate = new DateTime(2024, 1, 15, 9, 30, 0, DateTimeKind.Utc),
                ApplicantName = "张船务",
                ApplicationDate = new DateTime(2024, 1, 10, 14, 0, 0, DateTimeKind.Utc),
                BunkeringOperator = "刘操作员",
                BunkeringCompleteTime = new DateTime(2024, 1, 15, 14, 20, 0, DateTimeKind.Utc),
                ChiefEngineerName = "轮机长王",
                SampleConfirmTime = new DateTime(2024, 1, 15, 15, 0, 0, DateTimeKind.Utc),
                FinanceVerifierName = "财务陈",
                SettlementTime = new DateTime(2024, 1, 20, 10, 0, 0, DateTimeKind.Utc),
                DiscrepancyReason = DiscrepancyReason.TemperatureDifference,
                Remarks = "正常加注完成，油温差异导致少量偏差",
                IsSampleSealed = true,
                SampleNumber = "SMP-20240115-001",
                CreatedAt = new DateTime(2024, 1, 10, 14, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 20, 10, 0, 0, DateTimeKind.Utc)
            };
            applications.Add(normalApp);

            var discrepancyApp = new FuelApplication
            {
                ApplicationNumber = "FA-2024-0002",
                ShipId = ships[1].Id,
                SupplierId = suppliers[1].Id,
                FuelType = FuelType.MGO,
                PlannedQuantity = 300,
                ActualQuantity = 285,
                UnitPrice = 820.00m,
                TotalAmount = 285m * 820.00m,
                Status = ApplicationStatus.Settled,
                Port = "上海",
                PlannedBunkeringDate = new DateTime(2024, 2, 5, 10, 0, 0, DateTimeKind.Utc),
                ActualBunkeringDate = new DateTime(2024, 2, 5, 11, 0, 0, DateTimeKind.Utc),
                ApplicantName = "李船务",
                ApplicationDate = new DateTime(2024, 2, 1, 9, 0, 0, DateTimeKind.Utc),
                BunkeringOperator = "赵操作员",
                BunkeringCompleteTime = new DateTime(2024, 2, 5, 15, 30, 0, DateTimeKind.Utc),
                ChiefEngineerName = "轮机长孙",
                SampleConfirmTime = new DateTime(2024, 2, 5, 16, 0, 0, DateTimeKind.Utc),
                FinanceVerifierName = "财务周",
                SettlementTime = new DateTime(2024, 2, 10, 14, 0, 0, DateTimeKind.Utc),
                DiscrepancyReason = DiscrepancyReason.SupplyShortage,
                Remarks = "供应商供油不足，短缺15吨，已协商按实结算",
                IsSampleSealed = true,
                SampleNumber = "SMP-20240205-002",
                CreatedAt = new DateTime(2024, 2, 1, 9, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 2, 10, 14, 0, 0, DateTimeKind.Utc)
            };
            applications.Add(discrepancyApp);

            var unsealedApp = new FuelApplication
            {
                ApplicationNumber = "FA-2024-0003",
                ShipId = ships[2].Id,
                SupplierId = suppliers[2].Id,
                FuelType = FuelType.HFO,
                PlannedQuantity = 800,
                ActualQuantity = 790,
                UnitPrice = 550.25m,
                TotalAmount = null,
                Status = ApplicationStatus.SamplePending,
                Port = "鹿特丹",
                PlannedBunkeringDate = new DateTime(2024, 3, 20, 6, 0, 0, DateTimeKind.Utc),
                ActualBunkeringDate = new DateTime(2024, 3, 21, 8, 0, 0, DateTimeKind.Utc),
                ApplicantName = "王船务",
                ApplicationDate = new DateTime(2024, 3, 15, 16, 0, 0, DateTimeKind.Utc),
                BunkeringOperator = "Dutch Operator",
                BunkeringCompleteTime = new DateTime(2024, 3, 21, 16, 45, 0, DateTimeKind.Utc),
                ChiefEngineerName = null,
                SampleConfirmTime = null,
                FinanceVerifierName = null,
                SettlementTime = null,
                DiscrepancyReason = DiscrepancyReason.MeasurementError,
                Remarks = "加注已完成，油样待轮机长确认封存",
                IsSampleSealed = false,
                SampleNumber = null,
                CreatedAt = new DateTime(2024, 3, 15, 16, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 21, 16, 45, 0, DateTimeKind.Utc)
            };
            applications.Add(unsealedApp);

            var delayedApp = new FuelApplication
            {
                ApplicationNumber = "FA-2024-0004",
                ShipId = ships[3].Id,
                SupplierId = suppliers[3].Id,
                FuelType = FuelType.LSMGO,
                PlannedQuantity = 250,
                ActualQuantity = null,
                UnitPrice = 850.00m,
                TotalAmount = null,
                Status = ApplicationStatus.BunkeringInProgress,
                Port = "香港",
                PlannedBunkeringDate = new DateTime(2024, 4, 10, 12, 0, 0, DateTimeKind.Utc),
                ActualBunkeringDate = null,
                ApplicantName = "陈船务",
                ApplicationDate = new DateTime(2024, 4, 5, 11, 0, 0, DateTimeKind.Utc),
                BunkeringOperator = null,
                BunkeringCompleteTime = null,
                ChiefEngineerName = null,
                SampleConfirmTime = null,
                FinanceVerifierName = null,
                SettlementTime = null,
                DiscrepancyReason = DiscrepancyReason.None,
                Remarks = "供应商延误，原计划4月10日加注，因天气原因推迟至4月15日",
                IsSampleSealed = false,
                SampleNumber = null,
                CreatedAt = new DateTime(2024, 4, 5, 11, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 4, 12, 9, 0, 0, DateTimeKind.Utc)
            };
            applications.Add(delayedApp);

            var pendingApprovalApp = new FuelApplication
            {
                ApplicationNumber = "FA-2024-0005",
                ShipId = ships[0].Id,
                SupplierId = suppliers[1].Id,
                FuelType = FuelType.VLSFO,
                PlannedQuantity = 600,
                ActualQuantity = null,
                UnitPrice = 675.00m,
                TotalAmount = null,
                Status = ApplicationStatus.PendingApproval,
                Port = "上海",
                PlannedBunkeringDate = new DateTime(2024, 5, 1, 8, 0, 0, DateTimeKind.Utc),
                ActualBunkeringDate = null,
                ApplicantName = "张船务",
                ApplicationDate = new DateTime(2024, 4, 25, 10, 0, 0, DateTimeKind.Utc),
                BunkeringOperator = null,
                BunkeringCompleteTime = null,
                ChiefEngineerName = null,
                SampleConfirmTime = null,
                FinanceVerifierName = null,
                SettlementTime = null,
                DiscrepancyReason = DiscrepancyReason.None,
                Remarks = "待审批",
                IsSampleSealed = false,
                SampleNumber = null,
                CreatedAt = new DateTime(2024, 4, 25, 10, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 4, 25, 10, 0, 0, DateTimeKind.Utc)
            };
            applications.Add(pendingApprovalApp);

            context.FuelApplications.AddRange(applications);
            context.SaveChanges();

            foreach (var app in applications)
            {
                AddAuditLogsForApplication(context, app);
            }

            context.SaveChanges();
        }
    }

    private static void AddAuditLogsForApplication(AppDbContext context, FuelApplication app)
    {
        var logs = new List<AuditLog>();

        logs.Add(new AuditLog
        {
            FuelApplicationId = app.Id,
            FromStatus = ApplicationStatus.PendingApproval,
            ToStatus = ApplicationStatus.PendingApproval,
            OperatorName = app.ApplicantName ?? "系统",
            OperatorRole = "船务经办人",
            Remarks = "提交燃油加注申请",
            CreatedAt = app.ApplicationDate
        });

        if (app.Status == ApplicationStatus.Rejected)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.PendingApproval,
                ToStatus = ApplicationStatus.Rejected,
                OperatorName = "审批人",
                OperatorRole = "审批主管",
                Remarks = "申请被拒绝",
                CreatedAt = app.ApplicationDate.AddHours(24)
            });
            context.AuditLogs.AddRange(logs);
            return;
        }

        if (app.Status >= ApplicationStatus.Approved)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.PendingApproval,
                ToStatus = ApplicationStatus.Approved,
                OperatorName = "审批主管",
                OperatorRole = "审批主管",
                Remarks = "申请审批通过",
                CreatedAt = app.ApplicationDate.AddHours(48)
            });
        }

        if (app.Status >= ApplicationStatus.BunkeringInProgress)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.Approved,
                ToStatus = ApplicationStatus.BunkeringInProgress,
                OperatorName = app.BunkeringOperator ?? "供应商",
                OperatorRole = "港口供应商",
                Remarks = "开始加注作业",
                CreatedAt = (app.ActualBunkeringDate ?? app.PlannedBunkeringDate)
            });
        }

        if (app.Status >= ApplicationStatus.BunkeringCompleted)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.BunkeringInProgress,
                ToStatus = ApplicationStatus.BunkeringCompleted,
                OperatorName = app.BunkeringOperator ?? "供应商",
                OperatorRole = "港口供应商",
                Remarks = $"加注完成，实加量：{app.ActualQuantity}吨",
                CreatedAt = app.BunkeringCompleteTime ?? app.PlannedBunkeringDate.AddHours(6)
            });
        }

        if (app.Status >= ApplicationStatus.SamplePending)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.BunkeringCompleted,
                ToStatus = ApplicationStatus.SamplePending,
                OperatorName = "系统",
                OperatorRole = "系统",
                Remarks = "待油样确认封存",
                CreatedAt = (app.BunkeringCompleteTime ?? app.PlannedBunkeringDate.AddHours(6)).AddMinutes(30)
            });
        }

        if (app.Status >= ApplicationStatus.SampleConfirmed)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.SamplePending,
                ToStatus = ApplicationStatus.SampleConfirmed,
                OperatorName = app.ChiefEngineerName ?? "轮机长",
                OperatorRole = "轮机长",
                Remarks = $"油样已确认封存，油样编号：{app.SampleNumber}",
                CreatedAt = app.SampleConfirmTime ?? app.PlannedBunkeringDate.AddHours(8)
            });
        }

        if (app.Status >= ApplicationStatus.SettlementPending)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.SampleConfirmed,
                ToStatus = ApplicationStatus.SettlementPending,
                OperatorName = "系统",
                OperatorRole = "系统",
                Remarks = "待财务结算",
                CreatedAt = (app.SampleConfirmTime ?? app.PlannedBunkeringDate.AddHours(8)).AddHours(24)
            });
        }

        if (app.Status >= ApplicationStatus.Settled)
        {
            logs.Add(new AuditLog
            {
                FuelApplicationId = app.Id,
                FromStatus = ApplicationStatus.SettlementPending,
                ToStatus = ApplicationStatus.Settled,
                OperatorName = app.FinanceVerifierName ?? "财务",
                OperatorRole = "财务",
                Remarks = $"财务结算完成，总金额：{app.TotalAmount:C}",
                CreatedAt = app.SettlementTime ?? app.PlannedBunkeringDate.AddDays(5)
            });
        }

        context.AuditLogs.AddRange(logs);
    }
}
