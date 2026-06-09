using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BridgeInspection.Data;
using BridgeInspection.Models;

namespace BridgeInspection.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        await context.Database.EnsureCreatedAsync();

        string[] roleNames = { "Inspector", "Engineer", "MaintenanceUnit", "Acceptor", "Admin" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        var users = new (string Email, string Password, string FullName, string Role, string Department)[]
        {
            ("inspector1@bridge.com", "Ins@123456", "张巡检", "Inspector", "第一巡检队"),
            ("inspector2@bridge.com", "Ins@123456", "李巡检", "Inspector", "第二巡检队"),
            ("engineer1@bridge.com", "Eng@123456", "王工程师", "Engineer", "技术部"),
            ("engineer2@bridge.com", "Eng@123456", "赵工程师", "Engineer", "技术部"),
            ("maint1@bridge.com", "Mai@123456", "通达养护公司", "MaintenanceUnit", "养护一部"),
            ("maint2@bridge.com", "Mai@123456", "恒信养护公司", "MaintenanceUnit", "养护二部"),
            ("acceptor1@bridge.com", "Acc@123456", "刘验收", "Acceptor", "质量监督部"),
            ("acceptor2@bridge.com", "Acc@123456", "陈验收", "Acceptor", "质量监督部"),
            ("admin@bridge.com", "Adm@123456", "系统管理员", "Admin", "信息中心")
        };

        foreach (var (email, password, fullName, role, department) in users)
        {
            if (await userManager.FindByEmailAsync(email) == null)
            {
                var user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    Department = department,
                    RoleDisplayName = GetRoleDisplayName(role),
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true,
                    IsActive = true
                };

                var result = await userManager.CreateAsync(user, password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }
        }

        if (!await context.Bridges.AnyAsync())
        {
            var bridges = new Bridge[]
            {
                new() { Name = "长江大桥", RouteName = "G104国道", BridgeType = BridgeType.SuspensionBridge,
                    Location = "南京市江宁区", Length = 1250.5, Width = 28.5, BuildYear = 2001,
                    ManagementUnit = "南京桥梁管理处" },
                new() { Name = "黄河二桥", RouteName = "G205国道", BridgeType = BridgeType.BoxGirderBridge,
                    Location = "济南市槐荫区", Length = 850.0, Width = 24.0, BuildYear = 2010,
                    ManagementUnit = "济南桥梁管理处" },
                new() { Name = "珠江大桥", RouteName = "G15高速", BridgeType = BridgeType.CableStayedBridge,
                    Location = "广州市海珠区", Length = 980.8, Width = 32.0, BuildYear = 2005,
                    ManagementUnit = "广州桥梁管理处" },
                new() { Name = "淮河大桥", RouteName = "S312省道", BridgeType = BridgeType.BeamBridge,
                    Location = "蚌埠市禹会区", Length = 320.0, Width = 18.0, BuildYear = 1995,
                    ManagementUnit = "蚌埠桥梁管理处" },
                new() { Name = "松花江大桥", RouteName = "G1京哈高速", BridgeType = BridgeType.ArchBridge,
                    Location = "哈尔滨市道里区", Length = 560.0, Width = 26.0, BuildYear = 1988,
                    ManagementUnit = "哈尔滨桥梁管理处" },
                new() { Name = "澜沧江大桥", RouteName = "G56高速", BridgeType = BridgeType.TrussBridge,
                    Location = "大理市洱源县", Length = 720.0, Width = 22.5, BuildYear = 2015,
                    ManagementUnit = "大理桥梁管理处" }
            };

            await context.Bridges.AddRangeAsync(bridges);
            await context.SaveChangesAsync();
        }

        if (!await context.Sensors.AnyAsync())
        {
            var bridges = await context.Bridges.ToListAsync();
            var sensors = new List<Sensor>();

            foreach (var bridge in bridges)
            {
                sensors.AddRange(new[]
                {
                    new Sensor { BridgeId = bridge.Id, SensorCode = $"{bridge.Id}-ST-001",
                        SensorType = "应变传感器", Location = "主跨L/4截面", Status = SensorStatus.Online },
                    new Sensor { BridgeId = bridge.Id, SensorCode = $"{bridge.Id}-ST-002",
                        SensorType = "应变传感器", Location = "主跨L/2截面", Status = SensorStatus.Online },
                    new Sensor { BridgeId = bridge.Id, SensorCode = $"{bridge.Id}-ST-003",
                        SensorType = "应变传感器", Location = "主跨3L/4截面", Status = SensorStatus.Online },
                    new Sensor { BridgeId = bridge.Id, SensorCode = $"{bridge.Id}-DI-001",
                        SensorType = "位移传感器", Location = "主跨跨中", Status = SensorStatus.Online },
                    new Sensor { BridgeId = bridge.Id, SensorCode = $"{bridge.Id}-CR-001",
                        SensorType = "裂缝计", Location = "北桥台", Status = SensorStatus.Online },
                    new Sensor { BridgeId = bridge.Id, SensorCode = $"{bridge.Id}-CR-002",
                        SensorType = "裂缝计", Location = "南桥台", Status = SensorStatus.Online }
                });
            }

            sensors[5].Status = SensorStatus.Offline;
            sensors[5].LastOnlineTime = DateTime.Now.AddDays(-3);

            await context.Sensors.AddRangeAsync(sensors);
            await context.SaveChangesAsync();
        }

        if (!await context.Defects.AnyAsync())
        {
            var inspector1 = await userManager.FindByEmailAsync("inspector1@bridge.com");
            var inspector2 = await userManager.FindByEmailAsync("inspector2@bridge.com");
            var engineer1 = await userManager.FindByEmailAsync("engineer1@bridge.com");
            var engineer2 = await userManager.FindByEmailAsync("engineer2@bridge.com");
            var maint1 = await userManager.FindByEmailAsync("maint1@bridge.com");
            var maint2 = await userManager.FindByEmailAsync("maint2@bridge.com");
            var acceptor1 = await userManager.FindByEmailAsync("acceptor1@bridge.com");

            var bridge1 = await context.Bridges.FirstOrDefaultAsync(b => b.Name == "长江大桥");
            var bridge2 = await context.Bridges.FirstOrDefaultAsync(b => b.Name == "黄河二桥");
            var bridge3 = await context.Bridges.FirstOrDefaultAsync(b => b.Name == "珠江大桥");
            var bridge4 = await context.Bridges.FirstOrDefaultAsync(b => b.Name == "淮河大桥");

            var defects = new List<Defect>();

            var defect1 = new Defect
            {
                BridgeId = bridge1!.Id,
                Title = "主梁底部轻微裂缝",
                Description = "主跨L/4截面底部发现细微横向裂缝，长度较短，深度较浅",
                LocationOnBridge = "主跨L/4截面底板",
                Severity = DefectSeverity.Slight,
                Status = DefectStatus.Closed,
                CrackLength = 0.25,
                CrackWidth = 0.08,
                CrackDepth = 0.015,
                CrackDirection = "横向",
                ReporterId = inspector1!.Id,
                ReportedAt = DateTime.Now.AddDays(-30),
                AssessorId = engineer1!.Id,
                AssessedAt = DateTime.Now.AddDays(-28),
                AssessmentComment = "轻微表面裂缝，不影响结构安全，建议定期观察",
                MaintenanceUnitId = maint1!.Id,
                MaintenanceStartedAt = DateTime.Now.AddDays(-20),
                MaintenanceCompletedAt = DateTime.Now.AddDays(-18),
                MaintenanceDurationHours = 16,
                MaintenancePlan = "表面封闭处理：1. 清理裂缝表面 2. 涂刷环氧树脂封闭",
                MaintenanceResult = "已完成表面封闭处理，裂缝已被完全覆盖",
                AcceptorId = acceptor1!.Id,
                AcceptedAt = DateTime.Now.AddDays(-15),
                AcceptanceComment = "维修质量合格，同意销项",
                IsUpgraded = false,
                RequiresStructuralReview = false
            };
            defects.Add(defect1);

            var defect2 = new Defect
            {
                BridgeId = bridge2!.Id,
                Title = "腹板结构性裂缝",
                Description = "北桥台附近腹板发现纵向裂缝，长度较长，宽度较大，深度较深，需重点关注",
                LocationOnBridge = "北桥台上游侧腹板",
                Severity = DefectSeverity.Structural,
                Status = DefectStatus.PendingMaintenance,
                CrackLength = 3.5,
                CrackWidth = 1.2,
                CrackDepth = 0.25,
                CrackDirection = "纵向",
                ReporterId = inspector2!.Id,
                ReportedAt = DateTime.Now.AddDays(-10),
                AssessorId = engineer2!.Id,
                AssessedAt = DateTime.Now.AddDays(-7),
                AssessmentComment = "结构性裂缝，存在安全隐患，需立即进行加固处理，已升级处理",
                MaintenanceUnitId = maint2!.Id,
                IsUpgraded = true,
                RequiresStructuralReview = true,
                MaintenancePlan = "待制定详细加固方案"
            };
            defects.Add(defect2);

            var defect3 = new Defect
            {
                BridgeId = bridge3!.Id,
                Title = "桥面板中等裂缝",
                Description = "桥面板发现网状裂缝，分布较广，可能影响耐久性",
                LocationOnBridge = "主跨桥面板中段",
                Severity = DefectSeverity.Moderate,
                Status = DefectStatus.MaintenanceInProgress,
                CrackLength = 1.8,
                CrackWidth = 0.35,
                CrackDepth = 0.08,
                CrackDirection = "网状",
                ReporterId = inspector1.Id,
                ReportedAt = DateTime.Now.AddDays(-15),
                AssessorId = engineer1.Id,
                AssessedAt = DateTime.Now.AddDays(-12),
                AssessmentComment = "中等程度裂缝，需进行修补处理，防止进一步扩展",
                MaintenanceUnitId = maint1.Id,
                MaintenanceStartedAt = DateTime.Now.AddDays(-5),
                IsUpgraded = false,
                RequiresStructuralReview = false,
                MaintenancePlan = "1. 裂缝灌缝处理 2. 表面粘贴碳纤维布加固 3. 防水层修复"
            };
            defects.Add(defect3);

            var defect4 = new Defect
            {
                BridgeId = bridge1.Id,
                Title = "盖梁裂缝病害",
                Description = "北侧盖梁发现斜向裂缝，长度2米左右",
                LocationOnBridge = "北侧盖梁端部",
                Severity = DefectSeverity.Severe,
                Status = DefectStatus.PendingAcceptance,
                CrackLength = 2.0,
                CrackWidth = 0.6,
                CrackDepth = 0.12,
                CrackDirection = "斜向45度",
                ReporterId = inspector2.Id,
                ReportedAt = DateTime.Now.AddDays(-25),
                AssessorId = engineer2.Id,
                AssessedAt = DateTime.Now.AddDays(-22),
                AssessmentComment = "严重裂缝，需进行加固处理，已升级为重点关注病害",
                MaintenanceUnitId = maint2.Id,
                MaintenanceStartedAt = DateTime.Now.AddDays(-18),
                MaintenanceCompletedAt = DateTime.Now.AddDays(-2),
                MaintenanceDurationHours = 120,
                IsUpgraded = true,
                RequiresStructuralReview = true,
                MaintenancePlan = "1. 临时支撑加固 2. 裂缝灌胶封闭 3. 粘贴钢板加固 4. 养护监测",
                MaintenanceResult = "已按方案完成全部加固工作，等待验收。包含临时支撑、灌胶、粘钢等工序"
            };
            defects.Add(defect4);

            var defect5 = new Defect
            {
                BridgeId = bridge4!.Id,
                Title = "桥墩表面微裂缝",
                Description = "桥墩表面发现细微裂缝，疑似温度裂缝",
                LocationOnBridge = "1#桥墩墩身",
                Severity = DefectSeverity.Slight,
                Status = DefectStatus.PendingAssessment,
                CrackLength = 0.8,
                CrackWidth = 0.1,
                CrackDepth = 0.02,
                CrackDirection = "竖向",
                ReporterId = inspector1.Id,
                ReportedAt = DateTime.Now.AddDays(-2),
                IsUpgraded = false,
                RequiresStructuralReview = false
            };
            defects.Add(defect5);

            var defect6 = new Defect
            {
                BridgeId = bridge2.Id,
                Title = "伸缩缝附近裂缝",
                Description = "伸缩缝两侧混凝土出现开裂，需及时处理",
                LocationOnBridge = "南岸伸缩缝处",
                Severity = DefectSeverity.Moderate,
                Status = DefectStatus.Returned,
                CrackLength = 1.2,
                CrackWidth = 0.25,
                CrackDepth = 0.06,
                CrackDirection = "横向",
                ReporterId = inspector2.Id,
                ReportedAt = DateTime.Now.AddDays(-20),
                AssessorId = engineer1.Id,
                AssessedAt = DateTime.Now.AddDays(-17),
                AssessmentComment = "中等裂缝，需进行修补并更换伸缩缝止水带",
                MaintenanceUnitId = maint1.Id,
                MaintenanceStartedAt = DateTime.Now.AddDays(-12),
                MaintenanceCompletedAt = DateTime.Now.AddDays(-8),
                MaintenanceDurationHours = 48,
                MaintenancePlan = "1. 裂缝修补 2. 伸缩缝清理 3. 更换止水带",
                MaintenanceResult = "已完成修补和止水带更换",
                AcceptorId = acceptor1.Id,
                AcceptedAt = DateTime.Now.AddDays(-6),
                AcceptanceComment = "维修质量不达标，裂缝处理不彻底，退回重新维修",
                IsUpgraded = false,
                RequiresStructuralReview = false
            };
            defects.Add(defect6);

            var defect7 = new Defect
            {
                BridgeId = bridge3.Id,
                Title = "主塔底部裂缝",
                Description = "主塔底部发现水平裂缝，需重点监测",
                LocationOnBridge = "南主塔底部",
                Severity = DefectSeverity.Structural,
                Status = DefectStatus.Assessing,
                CrackLength = 2.5,
                CrackWidth = 0.8,
                CrackDepth = 0.18,
                CrackDirection = "水平",
                ReporterId = inspector1.Id,
                ReportedAt = DateTime.Now.AddDays(-5),
                AssessorId = engineer1.Id,
                AssessedAt = null,
                IsUpgraded = true,
                RequiresStructuralReview = true
            };
            defects.Add(defect7);

            await context.Defects.AddRangeAsync(defects);
            await context.SaveChangesAsync();

            var histories = new List<DefectHistory>();

            foreach (var defect in defects)
            {
                histories.Add(new DefectHistory
                {
                    DefectId = defect.Id,
                    ActionType = DefectStatus.PendingAssessment,
                    Description = $"巡检员登记病害：{defect.Title}",
                    OperatorId = defect.ReporterId,
                    OperatedAt = defect.ReportedAt,
                    Remark = "病害登记"
                });

                if (defect.Severity.HasValue && defect.AssessorId != null)
                {
                    histories.Add(new DefectHistory
                    {
                        DefectId = defect.Id,
                        ActionType = DefectStatus.PendingMaintenance,
                        Description = $"工程师评定为{GetSeverityName(defect.Severity.Value)}等级，{defect.AssessmentComment}",
                        OperatorId = defect.AssessorId,
                        OperatedAt = defect.AssessedAt!.Value,
                        Remark = defect.IsUpgraded ? "已升级处理" : "正常评定"
                    });
                }

                if (defect.Status == DefectStatus.MaintenanceInProgress ||
                    defect.Status == DefectStatus.PendingAcceptance ||
                    defect.Status == DefectStatus.Closed ||
                    defect.Status == DefectStatus.Returned)
                {
                    if (defect.MaintenanceStartedAt.HasValue)
                    {
                        histories.Add(new DefectHistory
                        {
                            DefectId = defect.Id,
                            ActionType = DefectStatus.MaintenanceInProgress,
                            Description = "养护单位开始维修作业",
                            OperatorId = defect.MaintenanceUnitId!,
                            OperatedAt = defect.MaintenanceStartedAt.Value,
                            Remark = "维修开始"
                        });
                    }
                }

                if (defect.Status == DefectStatus.PendingAcceptance ||
                    defect.Status == DefectStatus.Closed ||
                    defect.Status == DefectStatus.Returned)
                {
                    if (defect.MaintenanceCompletedAt.HasValue)
                    {
                        histories.Add(new DefectHistory
                        {
                            DefectId = defect.Id,
                            ActionType = DefectStatus.PendingAcceptance,
                            Description = $"养护单位提交维修结果：{defect.MaintenanceResult}",
                            OperatorId = defect.MaintenanceUnitId!,
                            OperatedAt = defect.MaintenanceCompletedAt.Value,
                            Remark = $"维修用时{defect.MaintenanceDurationHours}小时"
                        });
                    }
                }

                if (defect.Status == DefectStatus.Closed)
                {
                    histories.Add(new DefectHistory
                    {
                        DefectId = defect.Id,
                        ActionType = DefectStatus.Closed,
                        Description = $"验收通过：{defect.AcceptanceComment}",
                        OperatorId = defect.AcceptorId!,
                        OperatedAt = defect.AcceptedAt!.Value,
                        Remark = "病害销项"
                    });
                }

                if (defect.Status == DefectStatus.Returned)
                {
                    histories.Add(new DefectHistory
                    {
                        DefectId = defect.Id,
                        ActionType = DefectStatus.Returned,
                        Description = $"验收退回：{defect.AcceptanceComment}",
                        OperatorId = defect.AcceptorId!,
                        OperatedAt = defect.AcceptedAt!.Value,
                        Remark = "退回重维"
                    });
                }
            }

            await context.DefectHistories.AddRangeAsync(histories);
            await context.SaveChangesAsync();

            var sensors = await context.Sensors.ToListAsync();
            var readings = new List<SensorReading>();

            var rnd = new Random(42);
            foreach (var sensor in sensors.Take(10))
            {
                for (int i = 0; i < 20; i++)
                {
                    double baseValue = sensor.SensorType switch
                    {
                        "应变传感器" => 120,
                        "位移传感器" => 15,
                        "裂缝计" => 0.5,
                        _ => 50
                    };

                    readings.Add(new SensorReading
                    {
                        SensorId = sensor.Id,
                        ReadingTime = DateTime.Now.AddDays(-i * 0.5),
                        Value = baseValue + rnd.NextDouble() * baseValue * 0.2 - baseValue * 0.1,
                        Unit = sensor.SensorType switch
                        {
                            "应变传感器" => "με",
                            "位移传感器" => "mm",
                            "裂缝计" => "mm",
                            _ => ""
                        }
                    });
                }
            }

            var defect2Sensor = sensors.FirstOrDefault(s => s.BridgeId == bridge2.Id && s.SensorType == "裂缝计");
            if (defect2Sensor != null)
            {
                var defect2Readings = readings.Where(r => r.SensorId == defect2Sensor.Id).Take(10).ToList();
                foreach (var reading in defect2Readings)
                {
                    reading.DefectId = defect2.Id;
                    reading.Value = 1.0 + rnd.NextDouble() * 0.5;
                }
            }

            await context.SensorReadings.AddRangeAsync(readings);
            await context.SaveChangesAsync();
        }
    }

    private static string GetRoleDisplayName(string role)
    {
        return role switch
        {
            "Inspector" => "巡检员",
            "Engineer" => "工程师",
            "MaintenanceUnit" => "养护单位",
            "Acceptor" => "验收人",
            "Admin" => "管理员",
            _ => role
        };
    }

    private static string GetSeverityName(DefectSeverity severity)
    {
        return severity switch
        {
            DefectSeverity.Slight => "轻微",
            DefectSeverity.Moderate => "一般",
            DefectSeverity.Severe => "严重",
            DefectSeverity.Structural => "结构性",
            _ => "未知"
        };
    }
}
