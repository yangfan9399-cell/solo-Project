using EquipmentMaintenanceSystem.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EquipmentMaintenanceSystem.Data
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            await context.Database.EnsureCreatedAsync();

            if (context.Users.Any())
            {
                return;
            }

            string[] roles = { "Operator", "TeamLeader", "Maintenance", "Engineer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            var users = new[]
            {
                new { UserName = "operator", Email = "operator@example.com", RealName = "操作工张三", Role = "Operator" },
                new { UserName = "teamleader", Email = "teamleader@example.com", RealName = "班组长李四", Role = "TeamLeader" },
                new { UserName = "maintenance", Email = "maintenance@example.com", RealName = "维修员王五", Role = "Maintenance" },
                new { UserName = "engineer", Email = "engineer@example.com", RealName = "设备工程师赵六", Role = "Engineer" }
            };

            foreach (var user in users)
            {
                if (await userManager.FindByNameAsync(user.UserName) == null)
                {
                    var appUser = new ApplicationUser
                    {
                        UserName = user.UserName,
                        Email = user.Email,
                        RealName = user.RealName
                    };
                    var result = await userManager.CreateAsync(appUser, "Password123!");
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(appUser, user.Role);
                    }
                }
            }

            if (context.ProductionLines.Any()) return;

            var productionLines = new[]
            {
                new ProductionLine { Name = "A产线", Description = "主要生产A产品", IsActive = true },
                new ProductionLine { Name = "B产线", Description = "主要生产B产品", IsActive = true },
                new ProductionLine { Name = "C产线", Description = "主要生产C产品", IsActive = true }
            };
            context.ProductionLines.AddRange(productionLines);
            await context.SaveChangesAsync();

            var equipmentTypes = new[]
            {
                new EquipmentType { Name = "电机", Description = "电动机设备" },
                new EquipmentType { Name = "泵", Description = "各类泵设备" },
                new EquipmentType { Name = "传送带", Description = "输送设备" },
                new EquipmentType { Name = "压缩机", Description = "压缩设备" }
            };
            context.EquipmentTypes.AddRange(equipmentTypes);
            await context.SaveChangesAsync();

            var equipments = new[]
            {
                new Equipment { Code = "EQ-A001", Name = "A产线主电机", Location = "A区-01", Status = EquipmentStatus.Normal, InstallDate = DateTime.Now.AddYears(-3), LastMaintenanceDate = DateTime.Now.AddMonths(-1), ProductionLineId = 1, EquipmentTypeId = 1 },
                new Equipment { Code = "EQ-A002", Name = "A产线输送泵", Location = "A区-02", Status = EquipmentStatus.Normal, InstallDate = DateTime.Now.AddYears(-2), LastMaintenanceDate = DateTime.Now.AddMonths(-2), ProductionLineId = 1, EquipmentTypeId = 2 },
                new Equipment { Code = "EQ-B001", Name = "B产线压缩机", Location = "B区-01", Status = EquipmentStatus.Normal, InstallDate = DateTime.Now.AddYears(-4), LastMaintenanceDate = DateTime.Now.AddMonths(-1), ProductionLineId = 2, EquipmentTypeId = 4 },
                new Equipment { Code = "EQ-B002", Name = "B产线传送带", Location = "B区-02", Status = EquipmentStatus.Normal, InstallDate = DateTime.Now.AddYears(-1), LastMaintenanceDate = DateTime.Now.AddMonths(-3), ProductionLineId = 2, EquipmentTypeId = 3 },
                new Equipment { Code = "EQ-C001", Name = "C产线主电机", Location = "C区-01", Status = EquipmentStatus.Normal, InstallDate = DateTime.Now.AddYears(-3), LastMaintenanceDate = DateTime.Now.AddMonths(-1), ProductionLineId = 3, EquipmentTypeId = 1 },
                new Equipment { Code = "EQ-C002", Name = "C产线循环泵", Location = "C区-02", Status = EquipmentStatus.Normal, InstallDate = DateTime.Now.AddYears(-2), LastMaintenanceDate = DateTime.Now.AddMonths(-2), ProductionLineId = 3, EquipmentTypeId = 2 }
            };
            context.Equipments.AddRange(equipments);
            await context.SaveChangesAsync();

            var spareParts = new[]
            {
                new SparePart { Code = "SP-001", Name = "电机轴承", Specification = "6205", StockQuantity = 10, SafetyStock = 5, Location = "仓库A-01" },
                new SparePart { Code = "SP-002", Name = "机械密封", Specification = "MG1-25", StockQuantity = 5, SafetyStock = 3, Location = "仓库A-02" },
                new SparePart { Code = "SP-003", Name = "传送带皮带", Specification = "PVC-500", StockQuantity = 3, SafetyStock = 2, Location = "仓库B-01" },
                new SparePart { Code = "SP-004", Name = "压缩机阀片", Specification = "K-12", StockQuantity = 0, SafetyStock = 4, Location = "仓库B-02" },
                new SparePart { Code = "SP-005", Name = "泵叶轮", Specification = "DN80", StockQuantity = 8, SafetyStock = 4, Location = "仓库A-03" }
            };
            context.SpareParts.AddRange(spareParts);
            await context.SaveChangesAsync();

            var maintenanceOrder1 = new MaintenanceOrder
            {
                OrderCode = "WO-20240101-001",
                CreateTime = DateTime.Now.AddDays(-5),
                StopTime = DateTime.Now.AddDays(-5).AddHours(1),
                RepairStartTime = DateTime.Now.AddDays(-5).AddHours(2),
                RepairEndTime = DateTime.Now.AddDays(-5).AddHours(4),
                ResumeTime = DateTime.Now.AddDays(-5).AddHours(5),
                Status = MaintenanceStatus.Resumed,
                FailureReason = "电机轴承磨损",
                RepairContent = "更换电机轴承",
                ConfirmedBy = "teamleader",
                RepairedBy = "maintenance",
                ReviewedBy = "engineer",
                DowntimeLoss = 2400.00m,
                EquipmentId = 1
            };
            context.MaintenanceOrders.Add(maintenanceOrder1);
            await context.SaveChangesAsync();

            var maintenanceOrder2 = new MaintenanceOrder
            {
                OrderCode = "WO-20240102-001",
                CreateTime = DateTime.Now.AddDays(-3),
                StopTime = DateTime.Now.AddDays(-3).AddHours(2),
                RepairStartTime = DateTime.Now.AddDays(-3).AddHours(3),
                RepairEndTime = null,
                ResumeTime = null,
                Status = MaintenanceStatus.Repairing,
                FailureReason = "压缩机阀片损坏",
                RepairContent = "更换阀片（待备件）",
                ConfirmedBy = "teamleader",
                RepairedBy = "maintenance",
                DowntimeLoss = null,
                EquipmentId = 3
            };
            context.MaintenanceOrders.Add(maintenanceOrder2);
            await context.SaveChangesAsync();

            var maintenanceOrder4 = new MaintenanceOrder
            {
                OrderCode = "WO-20240104-001",
                CreateTime = DateTime.Now.AddDays(-1),
                StopTime = DateTime.Now.AddDays(-1).AddHours(1),
                RepairStartTime = DateTime.Now.AddDays(-1).AddHours(2),
                RepairEndTime = DateTime.Now.AddDays(-1).AddHours(4),
                ResumeTime = null,
                Status = MaintenanceStatus.Failed,
                FailureReason = "泵叶轮不平衡",
                RepairContent = "重新平衡叶轮",
                ConfirmedBy = "teamleader",
                RepairedBy = "maintenance",
                ReviewedBy = "engineer",
                DowntimeLoss = null,
                EquipmentId = 6
            };
            context.MaintenanceOrders.Add(maintenanceOrder4);
            await context.SaveChangesAsync();

            var inspection1 = new InspectionRecord
            {
                InspectionCode = "INS-20240101-001",
                InspectionTime = DateTime.Now.AddDays(-5),
                Description = "电机异响",
                Status = InspectionStatus.Completed,
                ReportedBy = "operator",
                ReportedTime = DateTime.Now.AddDays(-5),
                EquipmentId = 1,
                MaintenanceOrderId = maintenanceOrder1.Id
            };
            context.InspectionRecords.Add(inspection1);
            await context.SaveChangesAsync();

            context.InspectionItems.Add(new InspectionItem
            {
                ItemName = "电机运行声音",
                StandardValue = "正常无杂音",
                ActualValue = "有异常异响",
                IsAbnormal = true,
                AbnormalDescription = "电机运行时有明显异响",
                InspectionRecordId = inspection1.Id
            });

            context.InspectionHistories.AddRange(
                new InspectionHistory { InspectionRecordId = inspection1.Id, OperationTime = DateTime.Now.AddDays(-5), Operator = "operator", Action = InspectionAction.Reported, Remark = "提交点检异常" },
                new InspectionHistory { InspectionRecordId = inspection1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(1), Operator = "teamleader", Action = InspectionAction.Confirmed, Remark = "确认停机" },
                new InspectionHistory { InspectionRecordId = inspection1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(2), Operator = "teamleader", Action = InspectionAction.Transferred, Remark = "转维修" }
            );

            context.MaintenanceSpareParts.Add(new MaintenanceSparePart
            {
                MaintenanceOrderId = maintenanceOrder1.Id,
                SparePartId = 1,
                Quantity = 1,
                IsAvailable = true
            });

            context.MaintenanceHistories.AddRange(
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder1.Id, OperationTime = DateTime.Now.AddDays(-5), Operator = "teamleader", Action = MaintenanceAction.Created, Remark = "创建工单" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(1), Operator = "teamleader", Action = MaintenanceAction.StopConfirmed, Remark = "确认停机" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(2), Operator = "maintenance", Action = MaintenanceAction.RepairStarted, Remark = "开始维修" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(4), Operator = "maintenance", Action = MaintenanceAction.RepairCompleted, Remark = "维修完成" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(4).AddMinutes(30), Operator = "engineer", Action = MaintenanceAction.ReviewApproved, Remark = "验收通过" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder1.Id, OperationTime = DateTime.Now.AddDays(-5).AddHours(5), Operator = "engineer", Action = MaintenanceAction.Resumed, Remark = "确认复产" }
            );

            var inspection2 = new InspectionRecord
            {
                InspectionCode = "INS-20240102-001",
                InspectionTime = DateTime.Now.AddDays(-3),
                Description = "压缩机压力不足",
                Status = InspectionStatus.Maintenance,
                ReportedBy = "operator",
                ReportedTime = DateTime.Now.AddDays(-3),
                EquipmentId = 3,
                MaintenanceOrderId = maintenanceOrder2.Id
            };
            context.InspectionRecords.Add(inspection2);
            await context.SaveChangesAsync();

            context.InspectionItems.Add(new InspectionItem
            {
                ItemName = "压缩机排气压力",
                StandardValue = "0.8MPa",
                ActualValue = "0.5MPa",
                IsAbnormal = true,
                AbnormalDescription = "排气压力低于标准值",
                InspectionRecordId = inspection2.Id
            });

            context.InspectionHistories.AddRange(
                new InspectionHistory { InspectionRecordId = inspection2.Id, OperationTime = DateTime.Now.AddDays(-3), Operator = "operator", Action = InspectionAction.Reported, Remark = "提交点检异常" },
                new InspectionHistory { InspectionRecordId = inspection2.Id, OperationTime = DateTime.Now.AddDays(-3).AddHours(2), Operator = "teamleader", Action = InspectionAction.Confirmed, Remark = "确认停机" },
                new InspectionHistory { InspectionRecordId = inspection2.Id, OperationTime = DateTime.Now.AddDays(-3).AddHours(2), Operator = "teamleader", Action = InspectionAction.Transferred, Remark = "转维修" }
            );

            context.MaintenanceSpareParts.Add(new MaintenanceSparePart
            {
                MaintenanceOrderId = maintenanceOrder2.Id,
                SparePartId = 4,
                Quantity = 2,
                IsAvailable = false
            });

            context.MaintenanceHistories.AddRange(
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder2.Id, OperationTime = DateTime.Now.AddDays(-3), Operator = "teamleader", Action = MaintenanceAction.Created, Remark = "创建工单" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder2.Id, OperationTime = DateTime.Now.AddDays(-3).AddHours(2), Operator = "teamleader", Action = MaintenanceAction.StopConfirmed, Remark = "确认停机" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder2.Id, OperationTime = DateTime.Now.AddDays(-3).AddHours(3), Operator = "maintenance", Action = MaintenanceAction.RepairStarted, Remark = "开始维修，发现备件不足" }
            );

            var inspection3 = new InspectionRecord
            {
                InspectionCode = "INS-20240103-001",
                InspectionTime = DateTime.Now.AddDays(-2),
                Description = "传送带偏移",
                Status = InspectionStatus.Rejected,
                ReportedBy = "operator",
                ReportedTime = DateTime.Now.AddDays(-2),
                EquipmentId = 4,
                MaintenanceOrderId = null
            };
            context.InspectionRecords.Add(inspection3);
            await context.SaveChangesAsync();

            context.InspectionItems.Add(new InspectionItem
            {
                ItemName = "传送带位置",
                StandardValue = "居中",
                ActualValue = "轻微偏移",
                IsAbnormal = true,
                AbnormalDescription = "传送带向右偏移约5mm",
                InspectionRecordId = inspection3.Id
            });

            context.InspectionHistories.AddRange(
                new InspectionHistory { InspectionRecordId = inspection3.Id, OperationTime = DateTime.Now.AddDays(-2), Operator = "operator", Action = InspectionAction.Reported, Remark = "提交点检异常" },
                new InspectionHistory { InspectionRecordId = inspection3.Id, OperationTime = DateTime.Now.AddDays(-2).AddMinutes(30), Operator = "teamleader", Action = InspectionAction.Rejected, Remark = "经核实为正常波动，误报" }
            );

            var inspection4 = new InspectionRecord
            {
                InspectionCode = "INS-20240104-001",
                InspectionTime = DateTime.Now.AddDays(-1),
                Description = "泵体振动过大",
                Status = InspectionStatus.Maintenance,
                ReportedBy = "operator",
                ReportedTime = DateTime.Now.AddDays(-1),
                EquipmentId = 6,
                MaintenanceOrderId = maintenanceOrder4.Id
            };
            context.InspectionRecords.Add(inspection4);
            await context.SaveChangesAsync();

            context.InspectionItems.Add(new InspectionItem
            {
                ItemName = "泵体振动",
                StandardValue = "<2.5mm/s",
                ActualValue = "4.2mm/s",
                IsAbnormal = true,
                AbnormalDescription = "振动值超标",
                InspectionRecordId = inspection4.Id
            });

            context.InspectionHistories.AddRange(
                new InspectionHistory { InspectionRecordId = inspection4.Id, OperationTime = DateTime.Now.AddDays(-1), Operator = "operator", Action = InspectionAction.Reported, Remark = "提交点检异常" },
                new InspectionHistory { InspectionRecordId = inspection4.Id, OperationTime = DateTime.Now.AddDays(-1).AddHours(1), Operator = "teamleader", Action = InspectionAction.Confirmed, Remark = "确认停机" },
                new InspectionHistory { InspectionRecordId = inspection4.Id, OperationTime = DateTime.Now.AddDays(-1).AddHours(1), Operator = "teamleader", Action = InspectionAction.Transferred, Remark = "转维修" }
            );

            context.MaintenanceSpareParts.Add(new MaintenanceSparePart
            {
                MaintenanceOrderId = maintenanceOrder4.Id,
                SparePartId = 5,
                Quantity = 1,
                IsAvailable = true
            });

            context.MaintenanceHistories.AddRange(
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder4.Id, OperationTime = DateTime.Now.AddDays(-1), Operator = "teamleader", Action = MaintenanceAction.Created, Remark = "创建工单" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder4.Id, OperationTime = DateTime.Now.AddDays(-1).AddHours(1), Operator = "teamleader", Action = MaintenanceAction.StopConfirmed, Remark = "确认停机" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder4.Id, OperationTime = DateTime.Now.AddDays(-1).AddHours(2), Operator = "maintenance", Action = MaintenanceAction.RepairStarted, Remark = "开始维修" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder4.Id, OperationTime = DateTime.Now.AddDays(-1).AddHours(4), Operator = "maintenance", Action = MaintenanceAction.RepairCompleted, Remark = "维修完成" },
                new MaintenanceHistory { MaintenanceOrderId = maintenanceOrder4.Id, OperationTime = DateTime.Now.AddDays(-1).AddHours(4).AddMinutes(30), Operator = "engineer", Action = MaintenanceAction.ReviewRejected, Remark = "验收未通过，振动仍超标，需重新维修" }
            );

            await context.SaveChangesAsync();
        }
    }
}