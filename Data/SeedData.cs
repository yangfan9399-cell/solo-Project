using HazardousGoodsYard.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HazardousGoodsYard.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await context.Database.MigrateAsync();

        var roles = new[] { "Forwarder", "Dispatcher", "SafetyOfficer", "Reviewer", "Admin" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var forwarderUser = await EnsureUser(userManager, "forwarder@yard.com", "Forwarder123!", "张货代", "Forwarder");
        var dispatcherUser = await EnsureUser(userManager, "dispatcher@yard.com", "Dispatcher123!", "李调度", "Dispatcher");
        var safetyUser = await EnsureUser(userManager, "safety@yard.com", "Safety123!", "王安全", "SafetyOfficer");
        var reviewerUser = await EnsureUser(userManager, "reviewer@yard.com", "Reviewer123!", "赵复核", "Reviewer");

        if (!await context.YardAreas.AnyAsync())
        {
            var yardAreas = new[]
            {
                new YardArea
                {
                    AreaCode = "A",
                    AreaName = "东区危险品堆场",
                    YardName = "港区危险品堆场",
                    MaxCapacity = 100,
                    CurrentUsage = 0,
                    AllowedHazardClasses = "1,3,21,22,23,41,42,43,51,52,61,62,7,8,9",
                    IsActive = true
                },
                new YardArea
                {
                    AreaCode = "B",
                    AreaName = "西区危险品堆场",
                    YardName = "港区危险品堆场",
                    MaxCapacity = 80,
                    CurrentUsage = 0,
                    AllowedHazardClasses = "3,8,9",
                    IsActive = true
                },
                new YardArea
                {
                    AreaCode = "C",
                    AreaName = "南区危险品堆场",
                    YardName = "港区危险品堆场",
                    MaxCapacity = 60,
                    CurrentUsage = 0,
                    AllowedHazardClasses = "21,22,23,3,8",
                    IsActive = true
                }
            };
            context.YardAreas.AddRange(yardAreas);
            await context.SaveChangesAsync();
        }

        if (!await context.IsolationZones.AnyAsync())
        {
            var areaA = await context.YardAreas.FirstOrDefaultAsync(a => a.AreaCode == "A");
            var areaB = await context.YardAreas.FirstOrDefaultAsync(a => a.AreaCode == "B");
            var areaC = await context.YardAreas.FirstOrDefaultAsync(a => a.AreaCode == "C");

            if (areaA != null && areaB != null && areaC != null)
            {
                var isolationZones = new[]
                {
                    new IsolationZone
                    {
                        ZoneCode = "A-ISO-01",
                        ZoneName = "东区爆炸品隔离区",
                        YardAreaId = areaA.Id,
                        IsolationType = IsolationType.Special,
                        MaxCapacity = 20,
                        CurrentUsage = 0,
                        AllowedHazardClasses = "1",
                        ConflictingHazardClasses = "1,21,22,23,51,52",
                        IsActive = true
                    },
                    new IsolationZone
                    {
                        ZoneCode = "A-ISO-02",
                        ZoneName = "东区易燃液体隔离区",
                        YardAreaId = areaA.Id,
                        IsolationType = IsolationType.Normal,
                        MaxCapacity = 40,
                        CurrentUsage = 0,
                        AllowedHazardClasses = "3",
                        ConflictingHazardClasses = "1,51,52",
                        IsActive = true
                    },
                    new IsolationZone
                    {
                        ZoneCode = "A-ISO-03",
                        ZoneName = "东区腐蚀品隔离区",
                        YardAreaId = areaA.Id,
                        IsolationType = IsolationType.Normal,
                        MaxCapacity = 30,
                        CurrentUsage = 0,
                        AllowedHazardClasses = "8",
                        ConflictingHazardClasses = "1,7,61,62",
                        IsActive = true
                    },
                    new IsolationZone
                    {
                        ZoneCode = "B-ISO-01",
                        ZoneName = "西区易燃液体隔离区",
                        YardAreaId = areaB.Id,
                        IsolationType = IsolationType.Normal,
                        MaxCapacity = 50,
                        CurrentUsage = 0,
                        AllowedHazardClasses = "3,8,9",
                        ConflictingHazardClasses = "1,7,51,52",
                        IsActive = true
                    },
                    new IsolationZone
                    {
                        ZoneCode = "C-ISO-01",
                        ZoneName = "南区气体隔离区",
                        YardAreaId = areaC.Id,
                        IsolationType = IsolationType.Normal,
                        MaxCapacity = 30,
                        CurrentUsage = 0,
                        AllowedHazardClasses = "21,22,23",
                        ConflictingHazardClasses = "1,7",
                        IsActive = true
                    },
                    new IsolationZone
                    {
                        ZoneCode = "A-ISO-04",
                        ZoneName = "东区放射性隔离区",
                        YardAreaId = areaA.Id,
                        IsolationType = IsolationType.Radioactive,
                        MaxCapacity = 10,
                        CurrentUsage = 0,
                        AllowedHazardClasses = "7",
                        ConflictingHazardClasses = "1,21,22,23,3,41,42,43,51,52,61,62,8,9",
                        IsActive = true
                    }
                };
                context.IsolationZones.AddRange(isolationZones);
                await context.SaveChangesAsync();
            }
        }

        if (!await context.HazardousGoods.AnyAsync())
        {
            var hazardousGoods = new[]
            {
                new HazardousGood
                {
                    UNNumber = "UN1203",
                    HazardClass = HazardClass.Class3,
                    GoodsName = "汽油",
                    ContainerNumber = "CONT001",
                    GoodsCategory = "易燃液体",
                    SpecialInstructions = "需要阴凉通风处存放"
                },
                new HazardousGood
                {
                    UNNumber = "UN1830",
                    HazardClass = HazardClass.Class8,
                    GoodsName = "硫酸",
                    ContainerNumber = "CONT002",
                    GoodsCategory = "腐蚀性物质",
                    SpecialInstructions = "需要防腐蚀容器存放"
                },
                new HazardousGood
                {
                    UNNumber = "UN0006",
                    HazardClass = HazardClass.Class1,
                    GoodsName = "炸药A型",
                    ContainerNumber = "CONT003",
                    GoodsCategory = "爆炸品",
                    SpecialInstructions = "需要特殊隔离区存放，远离其他危险品"
                },
                new HazardousGood
                {
                    UNNumber = "UN1950",
                    HazardClass = HazardClass.Class2_1,
                    GoodsName = "液化石油气",
                    ContainerNumber = "CONT004",
                    GoodsCategory = "易燃气体",
                    SpecialInstructions = "需要通风良好的隔离区存放"
                },
                new HazardousGood
                {
                    UNNumber = "UN2910",
                    HazardClass = HazardClass.Class7,
                    GoodsName = "放射性物质",
                    ContainerNumber = "CONT005",
                    GoodsCategory = "放射性物质",
                    SpecialInstructions = "需要专用放射性隔离区存放"
                }
            };
            context.HazardousGoods.AddRange(hazardousGoods);
            await context.SaveChangesAsync();
        }

        if (!await context.Reservations.AnyAsync())
        {
            var goods = await context.HazardousGoods.ToListAsync();
            var areaA = await context.YardAreas.FirstOrDefaultAsync(a => a.AreaCode == "A");
            var areaB = await context.YardAreas.FirstOrDefaultAsync(a => a.AreaCode == "B");
            var zoneA1 = await context.IsolationZones.FirstOrDefaultAsync(z => z.ZoneCode == "A-ISO-02");
            var zoneB1 = await context.IsolationZones.FirstOrDefaultAsync(z => z.ZoneCode == "B-ISO-01");

            var now = DateTime.Now;

            var reservations = new[]
            {
                new Reservation
                {
                    ReservationNumber = "RES" + now.ToString("yyyyMMdd") + "001",
                    HazardousGoodId = goods[0].Id,
                    YardAreaId = areaA?.Id,
                    IsolationZoneId = zoneA1?.Id,
                    ReservationWindowStart = now.AddHours(-2),
                    ReservationWindowEnd = now.AddHours(6),
                    Status = ReservationStatus.Pending,
                    ForwarderUserId = forwarderUser.Id,
                    CreatedAt = now.AddHours(-2)
                },
                new Reservation
                {
                    ReservationNumber = "RES" + now.ToString("yyyyMMdd") + "002",
                    HazardousGoodId = goods[1].Id,
                    YardAreaId = areaB?.Id,
                    IsolationZoneId = zoneB1?.Id,
                    ReservationWindowStart = now.AddHours(-1),
                    ReservationWindowEnd = now.AddHours(7),
                    Status = ReservationStatus.AreaAssigned,
                    ForwarderUserId = forwarderUser.Id,
                    DispatcherUserId = dispatcherUser.Id,
                    CreatedAt = now.AddHours(-1)
                },
                new Reservation
                {
                    ReservationNumber = "RES" + now.ToString("yyyyMMdd") + "003",
                    HazardousGoodId = goods[2].Id,
                    ReservationWindowStart = now.AddHours(-4),
                    ReservationWindowEnd = now.AddHours(-1),
                    Status = ReservationStatus.Expired,
                    ForwarderUserId = forwarderUser.Id,
                    RejectionReasonType = Models.RejectionReasonType.ExpiredWindow,
                    RejectionReason = "预约窗口已过期，请重新预约",
                    CreatedAt = now.AddHours(-4)
                },
                new Reservation
                {
                    ReservationNumber = "RES" + now.ToString("yyyyMMdd") + "004",
                    HazardousGoodId = goods[3].Id,
                    YardAreaId = areaA?.Id,
                    ReservationWindowStart = now,
                    ReservationWindowEnd = now.AddHours(8),
                    Status = ReservationStatus.Rejected,
                    ForwarderUserId = forwarderUser.Id,
                    DispatcherUserId = dispatcherUser.Id,
                    RejectionReasonType = Models.RejectionReasonType.HazardClassConflict,
                    RejectionReason = "危险等级冲突：该区域已有爆炸品存放，无法分配给易燃气体",
                    CreatedAt = now.AddHours(-3)
                },
                new Reservation
                {
                    ReservationNumber = "RES" + now.ToString("yyyyMMdd") + "005",
                    HazardousGoodId = goods[4].Id,
                    YardAreaId = areaA?.Id,
                    ReservationWindowStart = now,
                    ReservationWindowEnd = now.AddHours(8),
                    Status = ReservationStatus.Rejected,
                    ForwarderUserId = forwarderUser.Id,
                    DispatcherUserId = dispatcherUser.Id,
                    SafetyOfficerUserId = safetyUser.Id,
                    RejectionReasonType = Models.RejectionReasonType.MissingDocuments,
                    RejectionReason = "安全资料缺失：缺少放射性物质运输许可证和MSDS",
                    CreatedAt = now.AddHours(-2)
                },
                new Reservation
                {
                    ReservationNumber = "RES" + now.ToString("yyyyMMdd") + "006",
                    HazardousGoodId = goods[0].Id,
                    YardAreaId = areaB?.Id,
                    IsolationZoneId = zoneB1?.Id,
                    ReservationWindowStart = now.AddHours(-3),
                    ReservationWindowEnd = now.AddHours(5),
                    Status = ReservationStatus.DocumentsVerified,
                    ForwarderUserId = forwarderUser.Id,
                    DispatcherUserId = dispatcherUser.Id,
                    SafetyOfficerUserId = safetyUser.Id,
                    CreatedAt = now.AddHours(-3)
                }
            };

            context.Reservations.AddRange(reservations);
            await context.SaveChangesAsync();

            foreach (var reservation in reservations)
            {
                var history = new ReservationHistory
                {
                    ReservationId = reservation.Id,
                    Action = ReservationAction.Created,
                    FromStatus = null,
                    ToStatus = ReservationStatus.Pending,
                    Description = "货代创建预约申请",
                    OperatorUserId = forwarderUser.Id,
                    CreatedAt = reservation.CreatedAt
                };
                context.ReservationHistories.Add(history);
            }

            var res2 = reservations[1];
            context.ReservationHistories.Add(new ReservationHistory
            {
                ReservationId = res2.Id,
                Action = ReservationAction.AreaAssigned,
                FromStatus = ReservationStatus.Pending,
                ToStatus = ReservationStatus.AreaAssigned,
                Description = "调度员分配区域和隔离区",
                OperatorUserId = dispatcherUser.Id,
                CreatedAt = now.AddMinutes(-30)
            });

            var res4 = reservations[3];
            context.ReservationHistories.Add(new ReservationHistory
            {
                ReservationId = res4.Id,
                Action = ReservationAction.AreaAssigned,
                FromStatus = ReservationStatus.Pending,
                ToStatus = ReservationStatus.AreaAssigned,
                Description = "调度员尝试分配区域",
                OperatorUserId = dispatcherUser.Id,
                CreatedAt = now.AddHours(-2)
            });
            context.ReservationHistories.Add(new ReservationHistory
            {
                ReservationId = res4.Id,
                Action = ReservationAction.ReviewRejected,
                FromStatus = ReservationStatus.AreaAssigned,
                ToStatus = ReservationStatus.Rejected,
                Description = "危险等级冲突，退回预约",
                OperatorUserId = dispatcherUser.Id,
                CreatedAt = now.AddHours(-2)
            });

            var res5 = reservations[4];
            context.ReservationHistories.Add(new ReservationHistory
            {
                ReservationId = res5.Id,
                Action = ReservationAction.AreaAssigned,
                FromStatus = ReservationStatus.Pending,
                ToStatus = ReservationStatus.AreaAssigned,
                Description = "调度员分配区域",
                OperatorUserId = dispatcherUser.Id,
                CreatedAt = now.AddHours(-1).AddMinutes(-30)
            });
            context.ReservationHistories.Add(new ReservationHistory
            {
                ReservationId = res5.Id,
                Action = ReservationAction.DocumentsRejected,
                FromStatus = ReservationStatus.AreaAssigned,
                ToStatus = ReservationStatus.Rejected,
                Description = "安全资料缺失，退回预约",
                OperatorUserId = safetyUser.Id,
                CreatedAt = now.AddHours(-1)
            });

            await context.SaveChangesAsync();
        }

        if (!await context.SafetyDocuments.AnyAsync())
        {
            var reservations = await context.Reservations.ToListAsync();
            var safetyUser = await userManager.FindByEmailAsync("safety@yard.com");

            foreach (var reservation in reservations.Where(r => r.Status != ReservationStatus.Expired && r.Status != ReservationStatus.Rejected))
            {
                var doc1 = new SafetyDocument
                {
                    ReservationId = reservation.Id,
                    DocumentType = DocumentType.MSDS,
                    DocumentName = "MSDS_" + reservation.ReservationNumber + ".pdf",
                    FilePath = "/uploads/msds/" + reservation.ReservationNumber + ".pdf",
                    VerificationStatus = reservation.Status == ReservationStatus.DocumentsVerified ? VerificationStatus.Approved : VerificationStatus.Pending,
                    VerifiedByUserId = reservation.Status == ReservationStatus.DocumentsVerified ? safetyUser?.Id : null,
                    VerifiedAt = reservation.Status == ReservationStatus.DocumentsVerified ? reservation.CreatedAt.AddHours(1) : null,
                    CreatedAt = reservation.CreatedAt
                };
                var doc2 = new SafetyDocument
                {
                    ReservationId = reservation.Id,
                    DocumentType = DocumentType.Declaration,
                    DocumentName = "申报单_" + reservation.ReservationNumber + ".pdf",
                    FilePath = "/uploads/declaration/" + reservation.ReservationNumber + ".pdf",
                    VerificationStatus = reservation.Status == ReservationStatus.DocumentsVerified ? VerificationStatus.Approved : VerificationStatus.Pending,
                    VerifiedByUserId = reservation.Status == ReservationStatus.DocumentsVerified ? safetyUser?.Id : null,
                    VerifiedAt = reservation.Status == ReservationStatus.DocumentsVerified ? reservation.CreatedAt.AddHours(1) : null,
                    CreatedAt = reservation.CreatedAt
                };
                context.SafetyDocuments.AddRange(doc1, doc2);
            }

            await context.SaveChangesAsync();
        }
    }

    private static async Task<ApplicationUser> EnsureUser(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string fullName,
        string role)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                Role = role,
                EmailConfirmed = true,
                IsActive = true
            };
            await userManager.CreateAsync(user, password);
            await userManager.AddToRoleAsync(user, role);
        }
        return user;
    }
}