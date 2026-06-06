using SurgicalInstrumentTracking.Models;

namespace SurgicalInstrumentTracking.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        if (context.Departments.Any())
        {
            return;
        }

        var departments = new List<Department>
        {
            new() { Name = "消毒供应室", Description = "负责器械清洗、打包、灭菌" },
            new() { Name = "普外科", Description = "普通外科手术" },
            new() { Name = "骨科", Description = "骨科手术" },
            new() { Name = "妇产科", Description = "妇产科手术" },
            new() { Name = "心胸外科", Description = "心胸外科手术" },
            new() { Name = "手术室", Description = "综合手术室" }
        };
        context.Departments.AddRange(departments);
        context.SaveChanges();

        var supplyDept = departments.First(d => d.Name == "消毒供应室");
        var orDept = departments.First(d => d.Name == "手术室");
        var generalDept = departments.First(d => d.Name == "普外科");
        var orthoDept = departments.First(d => d.Name == "骨科");

        var users = new List<User>
        {
            new() { Name = "张护士", EmployeeId = "CSSD001", Role = UserRole.SupplyStaff, DepartmentId = supplyDept.Id },
            new() { Name = "李护士", EmployeeId = "CSSD002", Role = UserRole.SupplyStaff, DepartmentId = supplyDept.Id },
            new() { Name = "王护士", EmployeeId = "OR001", Role = UserRole.OperatingRoomNurse, DepartmentId = orDept.Id },
            new() { Name = "赵护士", EmployeeId = "OR002", Role = UserRole.OperatingRoomNurse, DepartmentId = orDept.Id },
            new() { Name = "陈医生", EmployeeId = "QA001", Role = UserRole.QualityReviewer, DepartmentId = supplyDept.Id },
            new() { Name = "刘医生", EmployeeId = "QA002", Role = UserRole.QualityReviewer, DepartmentId = supplyDept.Id }
        };
        context.Users.AddRange(users);
        context.SaveChanges();

        var supplyUser1 = users.First(u => u.EmployeeId == "CSSD001");
        var supplyUser2 = users.First(u => u.EmployeeId == "CSSD002");
        var orNurse1 = users.First(u => u.EmployeeId == "OR001");
        var orNurse2 = users.First(u => u.EmployeeId == "OR002");
        var reviewer1 = users.First(u => u.EmployeeId == "QA001");
        var reviewer2 = users.First(u => u.EmployeeId == "QA002");

        var instruments = new List<Instrument>
        {
            new() { Name = "止血钳", Specification = "直", InstrumentCode = "INS001", Description = "直型止血钳" },
            new() { Name = "止血钳", Specification = "弯", InstrumentCode = "INS002", Description = "弯型止血钳" },
            new() { Name = "手术剪", Specification = "直尖", InstrumentCode = "INS003", Description = "直尖手术剪" },
            new() { Name = "手术剪", Specification = "弯圆", InstrumentCode = "INS004", Description = "弯圆手术剪" },
            new() { Name = "持针器", Specification = "常规", InstrumentCode = "INS005", Description = "持针钳" },
            new() { Name = "组织镊", Specification = "有齿", InstrumentCode = "INS006", Description = "有齿组织镊" },
            new() { Name = "组织镊", Specification = "无齿", InstrumentCode = "INS007", Description = "无齿组织镊" },
            new() { Name = "刀柄", Specification = "3号", InstrumentCode = "INS008", Description = "3号手术刀柄" },
            new() { Name = "刀柄", Specification = "4号", InstrumentCode = "INS009", Description = "4号手术刀柄" },
            new() { Name = "拉钩", Specification = "甲状腺", InstrumentCode = "INS010", Description = "甲状腺拉钩" },
            new() { Name = "拉钩", Specification = "腹腔", InstrumentCode = "INS011", Description = "腹腔拉钩" },
            new() { Name = "骨凿", Specification = "直", InstrumentCode = "INS012", Description = "直型骨凿" },
            new() { Name = "骨锤", Specification = "常规", InstrumentCode = "INS013", Description = "骨科骨锤" },
            new() { Name = "咬骨钳", Specification = "鹰嘴", InstrumentCode = "INS014", Description = "鹰嘴咬骨钳" },
            new() { Name = "巾钳", Specification = "常规", InstrumentCode = "INS015", Description = "手术巾钳" }
        };
        context.Instruments.AddRange(instruments);
        context.SaveChanges();

        var batches = new List<SterilizationBatch>
        {
            new()
            {
                BatchNumber = "BATCH-20260601-001",
                SterilizationDate = DateTime.Now.AddDays(-2),
                ExpirationDate = DateTime.Now.AddDays(28),
                SterilizerCode = "ST-001",
                SterilizationMethod = "高压蒸汽灭菌",
                PackedByUserId = supplyUser1.Id
            },
            new()
            {
                BatchNumber = "BATCH-20260603-002",
                SterilizationDate = DateTime.Now.AddDays(-1),
                ExpirationDate = DateTime.Now.AddDays(29),
                SterilizerCode = "ST-002",
                SterilizationMethod = "高压蒸汽灭菌",
                PackedByUserId = supplyUser2.Id
            },
            new()
            {
                BatchNumber = "BATCH-20260501-003",
                SterilizationDate = DateTime.Now.AddDays(-35),
                ExpirationDate = DateTime.Now.AddDays(-5),
                SterilizerCode = "ST-001",
                SterilizationMethod = "高压蒸汽灭菌",
                PackedByUserId = supplyUser1.Id
            }
        };
        context.SterilizationBatches.AddRange(batches);
        context.SaveChanges();

        var batch001 = batches[0];
        var batch002 = batches[1];
        var batch003 = batches[2];

        var instrumentSets = new List<InstrumentSet>
        {
            new()
            {
                SetCode = "SET-GEN-001",
                Name = "普外科基础器械包",
                Description = "常规普外科手术基础器械",
                SetType = "普外科",
                Status = InstrumentSetStatus.ReadyForUse,
                DepartmentId = generalDept.Id,
                SterilizationBatchId = batch001.Id,
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = DateTime.Now.AddDays(-1)
            },
            new()
            {
                SetCode = "SET-GEN-002",
                Name = "阑尾切除包",
                Description = "阑尾切除手术专用器械包",
                SetType = "普外科",
                Status = InstrumentSetStatus.MissingItems,
                DepartmentId = generalDept.Id,
                SterilizationBatchId = batch002.Id,
                CreatedAt = DateTime.Now.AddDays(-3),
                UpdatedAt = DateTime.Now.AddHours(-5)
            },
            new()
            {
                SetCode = "SET-ORT-001",
                Name = "骨科基础器械包",
                Description = "骨科常规手术器械",
                SetType = "骨科",
                Status = InstrumentSetStatus.Expired,
                DepartmentId = orthoDept.Id,
                SterilizationBatchId = batch003.Id,
                CreatedAt = DateTime.Now.AddDays(-35),
                UpdatedAt = DateTime.Now.AddDays(-30)
            },
            new()
            {
                SetCode = "SET-GEN-003",
                Name = "胆囊切除包",
                Description = "胆囊切除手术专用",
                SetType = "普外科",
                Status = InstrumentSetStatus.WrongDepartment,
                DepartmentId = generalDept.Id,
                SterilizationBatchId = batch002.Id,
                ReceivedByUserId = orNurse1.Id,
                ReceivedAt = DateTime.Now.AddHours(-10),
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = DateTime.Now.AddHours(-8)
            },
            new()
            {
                SetCode = "SET-ORT-002",
                Name = "骨折内固定包",
                Description = "骨折内固定手术器械包",
                SetType = "骨科",
                Status = InstrumentSetStatus.InUse,
                DepartmentId = orthoDept.Id,
                SterilizationBatchId = batch001.Id,
                ReceivedByUserId = orNurse2.Id,
                ReceivedAt = DateTime.Now.AddHours(-3),
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = DateTime.Now.AddHours(-3)
            },
            new()
            {
                SetCode = "SET-GYN-001",
                Name = "妇科基础器械包",
                Description = "妇科常规手术器械包",
                SetType = "妇产科",
                Status = InstrumentSetStatus.ReadyForUse,
                DepartmentId = departments.First(d => d.Name == "妇产科").Id,
                SterilizationBatchId = batch001.Id,
                CreatedAt = DateTime.Now.AddDays(-2),
                UpdatedAt = DateTime.Now.AddDays(-1)
            },
            new()
            {
                SetCode = "SET-CV-001",
                Name = "心胸外科器械包",
                Description = "心胸外科手术器械包",
                SetType = "心胸外科",
                Status = InstrumentSetStatus.Replenished,
                DepartmentId = departments.First(d => d.Name == "心胸外科").Id,
                SterilizationBatchId = batch002.Id,
                CreatedAt = DateTime.Now.AddDays(-4),
                UpdatedAt = DateTime.Now.AddHours(-12)
            },
            new()
            {
                SetCode = "SET-GEN-004",
                Name = "甲状腺手术包",
                Description = "甲状腺手术专用器械包",
                SetType = "普外科",
                Status = InstrumentSetStatus.Packed,
                DepartmentId = generalDept.Id,
                CreatedAt = DateTime.Now.AddHours(-2),
                UpdatedAt = DateTime.Now.AddHours(-2)
            }
        };
        context.InstrumentSets.AddRange(instrumentSets);
        context.SaveChanges();

        var setGen001 = instrumentSets.First(s => s.SetCode == "SET-GEN-001");
        var setGen002 = instrumentSets.First(s => s.SetCode == "SET-GEN-002");
        var setOrt001 = instrumentSets.First(s => s.SetCode == "SET-ORT-001");
        var setGen003 = instrumentSets.First(s => s.SetCode == "SET-GEN-003");
        var setOrt002 = instrumentSets.First(s => s.SetCode == "SET-ORT-002");
        var setGyn001 = instrumentSets.First(s => s.SetCode == "SET-GYN-001");
        var setCv001 = instrumentSets.First(s => s.SetCode == "SET-CV-001");
        var setGen004 = instrumentSets.First(s => s.SetCode == "SET-GEN-004");

        var setItems = new List<InstrumentSetItem>
        {
            // SET-GEN-001 - 完整
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[1].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[2].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[3].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[5].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[6].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[7].Id, ExpectedQuantity = 1, ActualQuantity = 1 },
            new() { InstrumentSetId = setGen001.Id, InstrumentId = instruments[14].Id, ExpectedQuantity = 4, ActualQuantity = 4 },

            // SET-GEN-002 - 缺件
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 6, ActualQuantity = 4 },
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[1].Id, ExpectedQuantity = 6, ActualQuantity = 6 },
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[2].Id, ExpectedQuantity = 3, ActualQuantity = 3 },
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[3].Id, ExpectedQuantity = 2, ActualQuantity = 1 },
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 3, ActualQuantity = 3 },
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[5].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen002.Id, InstrumentId = instruments[10].Id, ExpectedQuantity = 2, ActualQuantity = 2 },

            // SET-ORT-001 - 过期
            new() { InstrumentSetId = setOrt001.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setOrt001.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 3, ActualQuantity = 3 },
            new() { InstrumentSetId = setOrt001.Id, InstrumentId = instruments[11].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setOrt001.Id, InstrumentId = instruments[12].Id, ExpectedQuantity = 1, ActualQuantity = 1 },
            new() { InstrumentSetId = setOrt001.Id, InstrumentId = instruments[13].Id, ExpectedQuantity = 1, ActualQuantity = 1 },
            new() { InstrumentSetId = setOrt001.Id, InstrumentId = instruments[14].Id, ExpectedQuantity = 6, ActualQuantity = 6 },

            // SET-GEN-003 - 科室错领
            new() { InstrumentSetId = setGen003.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 6, ActualQuantity = 6 },
            new() { InstrumentSetId = setGen003.Id, InstrumentId = instruments[1].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGen003.Id, InstrumentId = instruments[2].Id, ExpectedQuantity = 3, ActualQuantity = 3 },
            new() { InstrumentSetId = setGen003.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 3, ActualQuantity = 3 },
            new() { InstrumentSetId = setGen003.Id, InstrumentId = instruments[9].Id, ExpectedQuantity = 2, ActualQuantity = 2 },

            // SET-ORT-002 - 使用中
            new() { InstrumentSetId = setOrt002.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setOrt002.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setOrt002.Id, InstrumentId = instruments[11].Id, ExpectedQuantity = 3, ActualQuantity = 3 },
            new() { InstrumentSetId = setOrt002.Id, InstrumentId = instruments[12].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setOrt002.Id, InstrumentId = instruments[13].Id, ExpectedQuantity = 2, ActualQuantity = 2 },

            // SET-GYN-001 - 妇产科
            new() { InstrumentSetId = setGyn001.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGyn001.Id, InstrumentId = instruments[1].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGyn001.Id, InstrumentId = instruments[2].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGyn001.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGyn001.Id, InstrumentId = instruments[6].Id, ExpectedQuantity = 2, ActualQuantity = 2 },

            // SET-CV-001 - 心胸外科
            new() { InstrumentSetId = setCv001.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 8, ActualQuantity = 8 },
            new() { InstrumentSetId = setCv001.Id, InstrumentId = instruments[1].Id, ExpectedQuantity = 8, ActualQuantity = 8 },
            new() { InstrumentSetId = setCv001.Id, InstrumentId = instruments[2].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setCv001.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setCv001.Id, InstrumentId = instruments[10].Id, ExpectedQuantity = 4, ActualQuantity = 4 },

            // SET-GEN-004 - 刚打包
            new() { InstrumentSetId = setGen004.Id, InstrumentId = instruments[0].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGen004.Id, InstrumentId = instruments[1].Id, ExpectedQuantity = 4, ActualQuantity = 4 },
            new() { InstrumentSetId = setGen004.Id, InstrumentId = instruments[2].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen004.Id, InstrumentId = instruments[4].Id, ExpectedQuantity = 2, ActualQuantity = 2 },
            new() { InstrumentSetId = setGen004.Id, InstrumentId = instruments[9].Id, ExpectedQuantity = 2, ActualQuantity = 2 }
        };
        context.InstrumentSetItems.AddRange(setItems);
        context.SaveChanges();

        var trackingRecords = new List<TrackingRecord>
        {
            // SET-GEN-001 完整
            new() { InstrumentSetId = setGen001.Id, Action = TrackingAction.Packed, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-2), Remarks = "器械清点无误，完成打包", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setGen001.Id, Action = TrackingAction.Sterilized, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-2).AddHours(4), Remarks = "灭菌完成，批次BATCH-20260601-001", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setGen001.Id, Action = TrackingAction.QualityPassed, UserId = reviewer1.Id, ActionTime = DateTime.Now.AddDays(-1), Remarks = "质控复核通过，准予放行", FromStatus = InstrumentSetStatus.Sterilized, ToStatus = InstrumentSetStatus.ReadyForUse },

            // SET-GEN-002 缺件
            new() { InstrumentSetId = setGen002.Id, Action = TrackingAction.Packed, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddDays(-3), Remarks = "打包完成", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setGen002.Id, Action = TrackingAction.Sterilized, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddDays(-1).AddHours(6), Remarks = "灭菌完成", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setGen002.Id, Action = TrackingAction.AnomalyReported, UserId = orNurse1.Id, ActionTime = DateTime.Now.AddHours(-5), Remarks = "清点发现缺件：止血钳少2把，手术剪少1把", FromStatus = InstrumentSetStatus.ReadyForUse, ToStatus = InstrumentSetStatus.MissingItems },

            // SET-ORT-001 过期
            new() { InstrumentSetId = setOrt001.Id, Action = TrackingAction.Packed, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-35), Remarks = "打包完成", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setOrt001.Id, Action = TrackingAction.Sterilized, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-35).AddHours(5), Remarks = "灭菌完成", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setOrt001.Id, Action = TrackingAction.ReadyForRelease, UserId = reviewer1.Id, ActionTime = DateTime.Now.AddDays(-34), Remarks = "质控通过", FromStatus = InstrumentSetStatus.Sterilized, ToStatus = InstrumentSetStatus.ReadyForUse },

            // SET-GEN-003 科室错领
            new() { InstrumentSetId = setGen003.Id, Action = TrackingAction.Packed, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddDays(-2), Remarks = "打包完成", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setGen003.Id, Action = TrackingAction.Sterilized, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddDays(-2).AddHours(6), Remarks = "灭菌完成", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setGen003.Id, Action = TrackingAction.QualityPassed, UserId = reviewer2.Id, ActionTime = DateTime.Now.AddDays(-1), Remarks = "质控通过，放行", FromStatus = InstrumentSetStatus.Sterilized, ToStatus = InstrumentSetStatus.ReadyForUse },
            new() { InstrumentSetId = setGen003.Id, Action = TrackingAction.Released, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddHours(-10), Remarks = "发放给手术室", FromStatus = InstrumentSetStatus.ReadyForUse, ToStatus = InstrumentSetStatus.InUse },
            new() { InstrumentSetId = setGen003.Id, Action = TrackingAction.AnomalyReported, UserId = orNurse1.Id, ActionTime = DateTime.Now.AddHours(-8), Remarks = "科室错领：此包应为普外科，骨科误领", FromStatus = InstrumentSetStatus.InUse, ToStatus = InstrumentSetStatus.WrongDepartment },

            // SET-ORT-002 使用中
            new() { InstrumentSetId = setOrt002.Id, Action = TrackingAction.Packed, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-2), Remarks = "打包完成", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setOrt002.Id, Action = TrackingAction.Sterilized, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-2).AddHours(4), Remarks = "灭菌完成", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setOrt002.Id, Action = TrackingAction.QualityPassed, UserId = reviewer1.Id, ActionTime = DateTime.Now.AddDays(-1), Remarks = "质控通过", FromStatus = InstrumentSetStatus.Sterilized, ToStatus = InstrumentSetStatus.ReadyForUse },
            new() { InstrumentSetId = setOrt002.Id, Action = TrackingAction.Released, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddHours(-3), Remarks = "骨科手术领用", FromStatus = InstrumentSetStatus.ReadyForUse, ToStatus = InstrumentSetStatus.InUse },
            new() { InstrumentSetId = setOrt002.Id, Action = TrackingAction.Received, UserId = orNurse2.Id, ActionTime = DateTime.Now.AddHours(-3), Remarks = "手术室护士确认接收，器械齐全", FromStatus = null, ToStatus = null },

            // SET-GYN-001
            new() { InstrumentSetId = setGyn001.Id, Action = TrackingAction.Packed, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-2), Remarks = "打包完成", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setGyn001.Id, Action = TrackingAction.Sterilized, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-2).AddHours(5), Remarks = "灭菌完成", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setGyn001.Id, Action = TrackingAction.QualityPassed, UserId = reviewer2.Id, ActionTime = DateTime.Now.AddDays(-1), Remarks = "质控通过", FromStatus = InstrumentSetStatus.Sterilized, ToStatus = InstrumentSetStatus.ReadyForUse },

            // SET-CV-001 - 已补包
            new() { InstrumentSetId = setCv001.Id, Action = TrackingAction.Packed, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddDays(-4), Remarks = "打包完成", FromStatus = null, ToStatus = InstrumentSetStatus.Packed },
            new() { InstrumentSetId = setCv001.Id, Action = TrackingAction.Sterilized, UserId = supplyUser2.Id, ActionTime = DateTime.Now.AddDays(-4).AddHours(5), Remarks = "灭菌完成", FromStatus = InstrumentSetStatus.Packed, ToStatus = InstrumentSetStatus.Sterilized },
            new() { InstrumentSetId = setCv001.Id, Action = TrackingAction.QualityPassed, UserId = reviewer1.Id, ActionTime = DateTime.Now.AddDays(-3), Remarks = "质控通过", FromStatus = InstrumentSetStatus.Sterilized, ToStatus = InstrumentSetStatus.ReadyForUse },
            new() { InstrumentSetId = setCv001.Id, Action = TrackingAction.AnomalyReported, UserId = orNurse1.Id, ActionTime = DateTime.Now.AddDays(-1).AddHours(-6), Remarks = "器械数量不符，缺止血钳2把", FromStatus = InstrumentSetStatus.ReadyForUse, ToStatus = InstrumentSetStatus.MissingItems },
            new() { InstrumentSetId = setCv001.Id, Action = TrackingAction.ReplenishmentStarted, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddDays(-1).AddHours(-5), Remarks = "开始补包", FromStatus = InstrumentSetStatus.MissingItems, ToStatus = null },
            new() { InstrumentSetId = setCv001.Id, Action = TrackingAction.ReplenishmentCompleted, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddHours(-12), Remarks = "补包完成，重新灭菌", FromStatus = null, ToStatus = InstrumentSetStatus.Replenished },

            // SET-GEN-004 刚打包
            new() { InstrumentSetId = setGen004.Id, Action = TrackingAction.Packed, UserId = supplyUser1.Id, ActionTime = DateTime.Now.AddHours(-2), Remarks = "打包完成，待灭菌", FromStatus = null, ToStatus = InstrumentSetStatus.Packed }
        };
        context.TrackingRecords.AddRange(trackingRecords);
        context.SaveChanges();

        var anomalyRecords = new List<AnomalyRecord>
        {
            new()
            {
                InstrumentSetId = setGen002.Id,
                AnomalyType = AnomalyType.MissingItems,
                Description = "清点发现缺件：止血钳(直)少2把，手术剪(弯圆)少1把",
                ReportedByUserId = orNurse1.Id,
                ReportedAt = DateTime.Now.AddHours(-5),
                Resolved = false
            },
            new()
            {
                InstrumentSetId = setOrt001.Id,
                AnomalyType = AnomalyType.SterilizationExpired,
                Description = "灭菌批次已过期5天，需重新灭菌",
                ReportedByUserId = reviewer2.Id,
                ReportedAt = DateTime.Now.AddDays(-1),
                Resolved = false
            },
            new()
            {
                InstrumentSetId = setGen003.Id,
                AnomalyType = AnomalyType.WrongDepartment,
                Description = "科室错领：此包为普外科胆囊切除包，骨科误领，请退回",
                ReportedByUserId = orNurse1.Id,
                ReportedAt = DateTime.Now.AddHours(-8),
                Resolved = false
            },
            new()
            {
                InstrumentSetId = setCv001.Id,
                AnomalyType = AnomalyType.MissingItems,
                Description = "止血钳(直)缺2把",
                ReportedByUserId = orNurse1.Id,
                ReportedAt = DateTime.Now.AddDays(-1).AddHours(-6),
                Resolved = true,
                ResolvedAt = DateTime.Now.AddHours(-12),
                ResolutionNotes = "补齐止血钳2把，重新灭菌后放行",
                ReplenishmentDurationMinutes = 360
            }
        };
        context.AnomalyRecords.AddRange(anomalyRecords);
        context.SaveChanges();
    }
}
