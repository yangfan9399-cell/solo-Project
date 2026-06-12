using MeetingRoomEquipment.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetingRoomEquipment.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        await SeedUsers(context);
        await context.SaveChangesAsync();
        await SeedSampleRecords(context);
    }

    private static async Task SeedUsers(ApplicationDbContext context)
    {
        var users = new List<User>
        {
            new()
            {
                UserId = "U001", UserName = "李娜", Role = UserRole.Admin,
                Department = "信息中心", Phone = "13800000001",
                CreatedAt = new DateTime(2026, 1, 1), IsActive = true
            },
            new()
            {
                UserId = "U002", UserName = "张伟", Role = UserRole.FieldStaff,
                Department = "行政部-运维组", Phone = "13800000002",
                CreatedAt = new DateTime(2026, 1, 2), IsActive = true
            },
            new()
            {
                UserId = "U003", UserName = "王芳", Role = UserRole.FieldStaff,
                Department = "行政部-运维组", Phone = "13800000003",
                CreatedAt = new DateTime(2026, 1, 3), IsActive = true
            },
            new()
            {
                UserId = "U004", UserName = "刘强", Role = UserRole.Reviewer,
                Department = "行政部-资产处", Phone = "13800000004",
                CreatedAt = new DateTime(2026, 1, 4), IsActive = true
            },
            new()
            {
                UserId = "U005", UserName = "陈敏", Role = UserRole.Reviewer,
                Department = "财务部-内控组", Phone = "13800000005",
                CreatedAt = new DateTime(2026, 1, 5), IsActive = true
            }
        };
        await context.Users.AddRangeAsync(users);
    }

    private static async Task SeedSampleRecords(ApplicationDbContext context)
    {
        var now = DateTime.Now;

        var r1 = new EquipmentBorrowRecord
        {
            RecordNo = "MR-2026-0001",
            SampleCategory = SampleCategory.NormalRelease,
            Title = "3楼A会议室投影仪借用归还",
            SourceSystem = "OA会议预约系统",
            BorrowerName = "赵磊", BorrowerDept = "研发部", BorrowerPhone = "13900001001",
            EquipmentName = "EPSON投影仪 CB-2265U", EquipmentCode = "EQ-PROJ-0012",
            MeetingRoom = "3楼A会议室",
            BorrowDate = new DateTime(2026, 6, 1, 9, 0, 0),
            DueReturnDate = new DateTime(2026, 6, 1, 18, 0, 0),
            ActualReturnDate = new DateTime(2026, 6, 1, 17, 30, 0),
            HasDamage = false, DamageDescription = string.Empty,
            OriginalValue = 12800.00m, CompensationAmount = 0m, ActualCompensation = 0m,
            FieldDescription = "设备外观完好，投影画面清晰，遥控器、电源线、HDMI线齐全。开机测试30分钟无异常。",
            Conclusion = "设备完好无损，符合正常归还标准，予以放行。",
            Basis = "《企业会议室设备管理规范》第3.2条：设备完好无损、配件齐全，可直接放行；赔偿阈值 500元以下免赔偿。",
            Status = RecordStatus.Archived,
            CurrentResponsibleId = "U004", CurrentResponsibleName = "刘强",
            CreatedById = "U002", CreatedByName = "张伟",
            CreatedAt = new DateTime(2026, 6, 1, 17, 35, 0),
            LastUpdatedById = "U004", LastUpdatedByName = "刘强",
            LastUpdatedAt = new DateTime(2026, 6, 1, 18, 10, 0),
            IsArchived = true, ArchivedAt = new DateTime(2026, 6, 1, 18, 10, 0)
        };

        var r2 = new EquipmentBorrowRecord
        {
            RecordNo = "MR-2026-0002",
            SampleCategory = SampleCategory.MetricExceeded,
            Title = "5楼多功能厅音响系统损坏赔偿核验",
            SourceSystem = "行政巡检APP",
            BorrowerName = "孙婷", BorrowerDept = "市场部", BorrowerPhone = "13900001002",
            EquipmentName = "JBL专业音响套装", EquipmentCode = "EQ-AUD-0005",
            MeetingRoom = "5楼多功能厅",
            BorrowDate = new DateTime(2026, 6, 2, 13, 0, 0),
            DueReturnDate = new DateTime(2026, 6, 2, 21, 0, 0),
            ActualReturnDate = new DateTime(2026, 6, 2, 20, 45, 0),
            HasDamage = true,
            DamageDescription = "左侧主音箱箱体凹陷约3cm×5cm，高音单元防尘帽破损；经检测频响曲线异常，高频衰减超过6dB。",
            OriginalValue = 35000.00m, CompensationAmount = 3800.00m, ActualCompensation = 3800.00m,
            FieldDescription = "活动结束后发现左音响被搬运工具磕碰。现场拍照5张，当事人已签字确认。维修报价单已附。",
            Conclusion = "损坏金额超过单次赔偿阈值（2000元），且折旧后赔偿比例超出部门年度预算额度，需主管复核并协调赔偿方案。",
            Basis = "《企业设备损坏赔偿管理办法》第7.3条：单次损坏赔偿金额超过2000元须资产处复核；第8.1条：年度部门赔偿预算 10000元，已用 7500元，本次超出 1300元。",
            BlockingReason = "指标超限：赔偿金额3800元超过单次阈值2000元，且超出市场部年度剩余赔偿预算1300元",
            RemedyPath = "① 资产处复核人刘强确认损坏事实与维修报价；② 协调财务部追加预算额度或分摊至下年度；③ 赔偿人可选择一次性支付或分3个月工资扣除；④ 预算追加后自动解除阻断。",
            DiffFields = "CompensationAmount(1200→3800), ActualCompensation(null→3800), Conclusion(待复核→指标超限需复核)",
            Status = RecordStatus.PendingReview,
            CurrentResponsibleId = "U004", CurrentResponsibleName = "刘强",
            CreatedById = "U002", CreatedByName = "张伟",
            CreatedAt = new DateTime(2026, 6, 2, 21, 10, 0),
            LastUpdatedById = "U002", LastUpdatedByName = "张伟",
            LastUpdatedAt = new DateTime(2026, 6, 2, 21, 40, 0)
        };

        var r3 = new EquipmentBorrowRecord
        {
            RecordNo = "MR-2026-0003",
            SampleCategory = SampleCategory.EvidenceMissing,
            Title = "8楼董事会议平板屏幕划痕核验",
            SourceSystem = "工单系统",
            BorrowerName = "周杰", BorrowerDept = "战略规划部", BorrowerPhone = "13900001003",
            EquipmentName = "MAXHUB会议平板 86英寸", EquipmentCode = "EQ-DISP-0003",
            MeetingRoom = "8楼董事会议室",
            BorrowDate = new DateTime(2026, 6, 3, 8, 30, 0),
            DueReturnDate = new DateTime(2026, 6, 3, 17, 0, 0),
            ActualReturnDate = new DateTime(2026, 6, 3, 16, 50, 0),
            HasDamage = true,
            DamageDescription = "屏幕右下角可见约12cm长划痕，深度判定为不可修复，需更换外屏。",
            OriginalValue = 42000.00m, CompensationAmount = 5600.00m, ActualCompensation = null,
            FieldDescription = "归还时发现划痕，借用前检查记录未拍照存档。现场仅有文字描述，缺少关键证据链。",
            Conclusion = "证据链缺失：无借用前设备状态照片，无法确认划痕是否为本次借用期间产生，需退回补充证据。",
            Basis = "《设备核验操作手册》第4.2条：归还核验必须提供借用前、后对比照片各不少于3张，关键部位特写1张；证据不足不得进入复核阶段。",
            BlockingReason = "现场证据缺失：缺少借用前设备完好照片、当事人签字确认书、划痕位置比例尺照片",
            RemedyPath = "① 退回现场人员补充借用前设备检查记录（查找当日监控录像佐证）；② 由借用当事人周杰书面确认划痕存在时间；③ 补充划痕位置含比例尺的高清照片；④ 证据补充完整后可继续流转。",
            DiffFields = "EvidenceCount(0→缺失), BlockingReason(无→证据缺失), Status(Processing→ReturnedForSupplement)",
            Status = RecordStatus.ReturnedForSupplement,
            CurrentResponsibleId = "U003", CurrentResponsibleName = "王芳",
            CreatedById = "U003", CreatedByName = "王芳",
            CreatedAt = new DateTime(2026, 6, 3, 17, 5, 0),
            LastUpdatedById = "U004", LastUpdatedByName = "刘强",
            LastUpdatedAt = new DateTime(2026, 6, 3, 17, 45, 0)
        };

        var r4 = new EquipmentBorrowRecord
        {
            RecordNo = "MR-2026-0004",
            SampleCategory = SampleCategory.ApprovalTimeout,
            Title = "2楼培训室无线麦克风丢失赔偿超时",
            SourceSystem = "资产盘点系统",
            BorrowerName = "吴静", BorrowerDept = "人力资源部", BorrowerPhone = "13900001004",
            EquipmentName = "Shure无线麦克风套装(2支)", EquipmentCode = "EQ-MIC-0008",
            MeetingRoom = "2楼培训室",
            BorrowDate = new DateTime(2026, 5, 20, 9, 0, 0),
            DueReturnDate = new DateTime(2026, 5, 20, 18, 0, 0),
            ActualReturnDate = new DateTime(2026, 5, 22, 10, 0, 0),
            HasDamage = true,
            DamageDescription = "归还时仅1支麦克风，另1支确认丢失，无法找回。",
            OriginalValue = 6800.00m, CompensationAmount = 2800.00m, ActualCompensation = null,
            FieldDescription = "盘点发现缺少1支麦克风，调取培训室监控无法确认具体丢失环节。丢失报告已提交3天，审批仍未完成。",
            Conclusion = "审批超时：本记录提交复核已超过规定的48小时处理时限，系统自动标记超时并升级提醒。",
            Basis = "《审批时效管理规定》第5条：设备损坏赔偿类复核须在受理后48小时内完成；超时自动升级至上一级主管，并在看板中红色预警。",
            BlockingReason = "审批超时：2026-06-03 17:00 提交复核，截至当前已超时 42小时，超出48小时阈值还剩6小时（含缓冲已升级预警）",
            RemedyPath = "① 系统已自动发送短信至复核人刘强及上一级主管；② 复核人须在剩余6小时内完成审批，否则将自动抄送总监；③ 如需延期需提交延期申请并说明理由；④ 超时未处理将计入个人KPI。",
            DiffFields = "Status(PendingReview→PendingReview), OverdueHours(0→42), Reviewer(刘强→刘强+升级)",
            Status = RecordStatus.PendingReview,
            CurrentResponsibleId = "U005", CurrentResponsibleName = "陈敏",
            CreatedById = "U003", CreatedByName = "王芳",
            CreatedAt = new DateTime(2026, 5, 22, 11, 0, 0),
            LastUpdatedById = "U002", LastUpdatedByName = "张伟",
            LastUpdatedAt = now.AddHours(-2)
        };

        await context.EquipmentBorrowRecords.AddRangeAsync(r1, r2, r3, r4);
        await context.SaveChangesAsync();

        var r1Nodes = new Dictionary<int, RecordNode>();
        var r2Nodes = new Dictionary<int, RecordNode>();
        var r3Nodes = new Dictionary<int, RecordNode>();
        var r4Nodes = new Dictionary<int, RecordNode>();

        var r1n1 = new RecordNode
        {
            RecordId = r1.Id, NodeType = NodeType.Acceptance, NodeTitle = "受理登记",
            FromStatus = null, ToStatus = RecordStatus.Processing,
            Remark = "OA系统同步，投影仪归还，现场初步检查无异常。",
            OperatorId = "U002", OperatorName = "张伟", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r1.CreatedAt, ChangedFields = "Status, ActualReturnDate", Sequence = 1
        };
        var r1n2 = new RecordNode
        {
            RecordId = r1.Id, NodeType = NodeType.ProcessUpdate, NodeTitle = "现场核验完成",
            FromStatus = RecordStatus.Processing, ToStatus = RecordStatus.PendingReview,
            Remark = "设备完好，配件齐全，各项指标正常。",
            OperatorId = "U002", OperatorName = "张伟", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r1.CreatedAt.AddMinutes(20),
            ChangedFields = "FieldDescription, Conclusion, Basis", Sequence = 2
        };
        var r1n3 = new RecordNode
        {
            RecordId = r1.Id, NodeType = NodeType.Review, NodeTitle = "复核通过并归档",
            FromStatus = RecordStatus.PendingReview, ToStatus = RecordStatus.Archived,
            Remark = "同意现场核验结论，设备完好，予以放行归档。",
            OperatorId = "U004", OperatorName = "刘强", OperatorRole = UserRole.Reviewer,
            OperatedAt = r1.LastUpdatedAt!.Value,
            ChangedFields = "Status, IsArchived, ArchivedAt", Sequence = 3
        };
        await context.RecordNodes.AddRangeAsync(r1n1, r1n2, r1n3);
        await context.SaveChangesAsync();
        r1n2.ParentNodeId = r1n1.Id;
        r1n3.ParentNodeId = r1n2.Id;
        r1Nodes[1] = r1n1; r1Nodes[2] = r1n2; r1Nodes[3] = r1n3;
        await context.SaveChangesAsync();

        var r2n1 = new RecordNode
        {
            RecordId = r2.Id, NodeType = NodeType.Acceptance, NodeTitle = "受理登记",
            FromStatus = null, ToStatus = RecordStatus.Processing,
            Remark = "行政巡检上报，音响套装有磕碰痕迹。",
            OperatorId = "U002", OperatorName = "张伟", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r2.CreatedAt, ChangedFields = "Status, HasDamage, DamageDescription", Sequence = 1
        };
        var r2n2 = new RecordNode
        {
            RecordId = r2.Id, NodeType = NodeType.ProcessUpdate, NodeTitle = "维修报价更新",
            FromStatus = RecordStatus.Processing, ToStatus = RecordStatus.Processing,
            Remark = "原预估1200元，供应商正式报价维修+配件3800元。触发指标超限。",
            OperatorId = "U002", OperatorName = "张伟", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r2.CreatedAt.AddMinutes(25),
            ChangedFields = "CompensationAmount, Conclusion, BlockingReason, RemedyPath, DiffFields", Sequence = 2
        };
        var r2n3 = new RecordNode
        {
            RecordId = r2.Id, NodeType = NodeType.ProcessUpdate, NodeTitle = "提交复核",
            FromStatus = RecordStatus.Processing, ToStatus = RecordStatus.PendingReview,
            Remark = "指标超限，提交资产处刘强复核。",
            OperatorId = "U002", OperatorName = "张伟", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r2.LastUpdatedAt!.Value,
            ChangedFields = "Status, CurrentResponsibleId, CurrentResponsibleName", Sequence = 3
        };
        await context.RecordNodes.AddRangeAsync(r2n1, r2n2, r2n3);
        await context.SaveChangesAsync();
        r2n2.ParentNodeId = r2n1.Id;
        r2n3.ParentNodeId = r2n2.Id;
        r2Nodes[1] = r2n1; r2Nodes[2] = r2n2; r2Nodes[3] = r2n3;
        await context.SaveChangesAsync();

        var r3n1 = new RecordNode
        {
            RecordId = r3.Id, NodeType = NodeType.Acceptance, NodeTitle = "受理登记",
            FromStatus = null, ToStatus = RecordStatus.Processing,
            Remark = "工单系统同步，会议平板有划痕。",
            OperatorId = "U003", OperatorName = "王芳", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r3.CreatedAt, ChangedFields = "Status, HasDamage, DamageDescription", Sequence = 1
        };
        var r3n2 = new RecordNode
        {
            RecordId = r3.Id, NodeType = NodeType.ProcessUpdate, NodeTitle = "提交复核",
            FromStatus = RecordStatus.Processing, ToStatus = RecordStatus.PendingReview,
            Remark = "已填写损坏描述，提交复核。",
            OperatorId = "U003", OperatorName = "王芳", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r3.CreatedAt.AddMinutes(20), ChangedFields = "Status", Sequence = 2
        };
        var r3n3 = new RecordNode
        {
            RecordId = r3.Id, NodeType = NodeType.ReturnSupplement, NodeTitle = "复核退回补证",
            FromStatus = RecordStatus.PendingReview, ToStatus = RecordStatus.ReturnedForSupplement,
            Remark = "缺少借用前设备状态照片，证据链不完整，退回现场补充。",
            OperatorId = "U004", OperatorName = "刘强", OperatorRole = UserRole.Reviewer,
            OperatedAt = r3.LastUpdatedAt!.Value,
            ChangedFields = "Status, BlockingReason, RemedyPath, DiffFields, CurrentResponsibleId", Sequence = 3
        };
        await context.RecordNodes.AddRangeAsync(r3n1, r3n2, r3n3);
        await context.SaveChangesAsync();
        r3n2.ParentNodeId = r3n1.Id;
        r3n3.ParentNodeId = r3n2.Id;
        r3Nodes[1] = r3n1; r3Nodes[2] = r3n2; r3Nodes[3] = r3n3;
        await context.SaveChangesAsync();

        var r4n1 = new RecordNode
        {
            RecordId = r4.Id, NodeType = NodeType.Acceptance, NodeTitle = "受理登记",
            FromStatus = null, ToStatus = RecordStatus.Processing,
            Remark = "资产盘点发现麦克风丢失1支。",
            OperatorId = "U003", OperatorName = "王芳", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r4.CreatedAt, ChangedFields = "Status, HasDamage, DamageDescription", Sequence = 1
        };
        var r4n2 = new RecordNode
        {
            RecordId = r4.Id, NodeType = NodeType.ProcessUpdate, NodeTitle = "提交复核",
            FromStatus = RecordStatus.Processing, ToStatus = RecordStatus.PendingReview,
            Remark = "丢失确认，赔偿金额2800元，提交复核。",
            OperatorId = "U003", OperatorName = "王芳", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r4.CreatedAt.AddMinutes(30),
            ChangedFields = "Status, CompensationAmount, Conclusion, CurrentResponsibleId", Sequence = 2
        };
        var r4n3 = new RecordNode
        {
            RecordId = r4.Id, NodeType = NodeType.Review, NodeTitle = "审批超时预警",
            FromStatus = RecordStatus.PendingReview, ToStatus = RecordStatus.PendingReview,
            Remark = "系统自动检测到审批超时已42小时，升级至陈敏复核。",
            OperatorId = "U002", OperatorName = "张伟", OperatorRole = UserRole.FieldStaff,
            OperatedAt = r4.LastUpdatedAt!.Value,
            ChangedFields = "BlockingReason, RemedyPath, DiffFields, CurrentResponsibleId", Sequence = 3
        };
        await context.RecordNodes.AddRangeAsync(r4n1, r4n2, r4n3);
        await context.SaveChangesAsync();
        r4n2.ParentNodeId = r4n1.Id;
        r4n3.ParentNodeId = r4n2.Id;
        r4Nodes[1] = r4n1; r4Nodes[2] = r4n2; r4Nodes[3] = r4n3;
        await context.SaveChangesAsync();

        await SeedEvidences(context, r1, r2, r3, r4);

        var snapshots = new List<FieldSnapshot>
        {
            new()
            {
                RecordId = r2.Id, NodeId = r2Nodes[2].Id,
                FieldName = "CompensationAmount", FieldDisplayName = "赔偿金额",
                BeforeValue = "1200.00", AfterValue = "3800.00",
                ChangeReason = "供应商正式维修报价更新",
                ChangedById = "U002", ChangedByName = "张伟",
                ChangedAt = r2.CreatedAt.AddMinutes(25)
            },
            new()
            {
                RecordId = r2.Id, NodeId = r2Nodes[2].Id,
                FieldName = "Conclusion", FieldDisplayName = "处理结论",
                BeforeValue = "待复核：预估维修费1200元",
                AfterValue = "损坏金额超过单次赔偿阈值（2000元），且折旧后赔偿比例超出部门年度预算额度，需主管复核并协调赔偿方案。",
                ChangeReason = "金额更新触发指标超限判定",
                ChangedById = "U002", ChangedByName = "张伟",
                ChangedAt = r2.CreatedAt.AddMinutes(25)
            },
            new()
            {
                RecordId = r2.Id, NodeId = r2Nodes[3].Id,
                FieldName = "Status", FieldDisplayName = "记录状态",
                BeforeValue = "Processing", AfterValue = "PendingReview",
                ChangeReason = "提交复核",
                ChangedById = "U002", ChangedByName = "张伟",
                ChangedAt = r2.LastUpdatedAt!.Value
            },
            new()
            {
                RecordId = r3.Id, NodeId = r3Nodes[3].Id,
                FieldName = "Status", FieldDisplayName = "记录状态",
                BeforeValue = "PendingReview", AfterValue = "ReturnedForSupplement",
                ChangeReason = "证据链缺失，退回补证",
                ChangedById = "U004", ChangedByName = "刘强",
                ChangedAt = r3.LastUpdatedAt!.Value
            },
            new()
            {
                RecordId = r3.Id, NodeId = r3Nodes[3].Id,
                FieldName = "BlockingReason", FieldDisplayName = "阻断原因",
                BeforeValue = "",
                AfterValue = "现场证据缺失：缺少借用前设备完好照片、当事人签字确认书、划痕位置比例尺照片",
                ChangeReason = "复核判定证据不足",
                ChangedById = "U004", ChangedByName = "刘强",
                ChangedAt = r3.LastUpdatedAt!.Value
            },
            new()
            {
                RecordId = r3.Id, NodeId = r3Nodes[3].Id,
                FieldName = "CurrentResponsibleId", FieldDisplayName = "当前责任人",
                BeforeValue = "U004", AfterValue = "U003",
                ChangeReason = "退回现场补证，责任转回现场人员王芳",
                ChangedById = "U004", ChangedByName = "刘强",
                ChangedAt = r3.LastUpdatedAt!.Value
            },
            new()
            {
                RecordId = r4.Id, NodeId = r4Nodes[3].Id,
                FieldName = "CurrentResponsibleId", FieldDisplayName = "当前责任人",
                BeforeValue = "U004", AfterValue = "U005",
                ChangeReason = "审批超时，升级至财务部陈敏复核",
                ChangedById = "U002", ChangedByName = "张伟",
                ChangedAt = r4.LastUpdatedAt!.Value
            },
            new()
            {
                RecordId = r4.Id, NodeId = r4Nodes[3].Id,
                FieldName = "BlockingReason", FieldDisplayName = "阻断原因",
                BeforeValue = "",
                AfterValue = "审批超时：2026-06-03 17:00 提交复核，截至当前已超时 42小时",
                ChangeReason = "系统超时检测自动标记",
                ChangedById = "U002", ChangedByName = "张伟",
                ChangedAt = r4.LastUpdatedAt!.Value
            }
        };
        await context.FieldSnapshots.AddRangeAsync(snapshots);
        await context.SaveChangesAsync();
    }

    private static async Task SeedEvidences(ApplicationDbContext context,
        EquipmentBorrowRecord r1, EquipmentBorrowRecord r2,
        EquipmentBorrowRecord r3, EquipmentBorrowRecord r4)
    {
        var evidences = new List<EvidenceAttachment>
        {
            new() { RecordId = r1.Id, EvidenceType = EvidenceType.Photo, FileName = "投影仪-整体正面.jpg", FilePath = "/evidences/MR-2026-0001/1.jpg", FileUrl = "https://cdn.example.com/ev/MR-2026-0001/1.jpg", FileSize = 2048000, Description = "投影仪整体正面照，外观完好", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r1.CreatedAt.AddMinutes(5), IsValid = true },
            new() { RecordId = r1.Id, EvidenceType = EvidenceType.Photo, FileName = "投影仪-配件齐全.jpg", FilePath = "/evidences/MR-2026-0001/2.jpg", FileUrl = "https://cdn.example.com/ev/MR-2026-0001/2.jpg", FileSize = 1987000, Description = "配件合影：遥控器、电源线、HDMI线", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r1.CreatedAt.AddMinutes(6), IsValid = true },
            new() { RecordId = r1.Id, EvidenceType = EvidenceType.SignForm, FileName = "设备归还确认单.pdf", FilePath = "/evidences/MR-2026-0001/3.pdf", FileUrl = "https://cdn.example.com/ev/MR-2026-0001/3.pdf", FileSize = 320000, Description = "借用双方签字的归还确认单", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r1.CreatedAt.AddMinutes(8), IsValid = true },
            new() { RecordId = r2.Id, EvidenceType = EvidenceType.Photo, FileName = "音箱-凹陷位置.jpg", FilePath = "/evidences/MR-2026-0002/1.jpg", FileUrl = "https://cdn.example.com/ev/MR-2026-0002/1.jpg", FileSize = 3120000, Description = "左侧音箱凹陷位置特写（含比例尺）", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r2.CreatedAt.AddMinutes(10), IsValid = true },
            new() { RecordId = r2.Id, EvidenceType = EvidenceType.Photo, FileName = "音箱-高音单元.jpg", FilePath = "/evidences/MR-2026-0002/2.jpg", FileUrl = "https://cdn.example.com/ev/MR-2026-0002/2.jpg", FileSize = 2870000, Description = "高音单元防尘帽破损特写", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r2.CreatedAt.AddMinutes(11), IsValid = true },
            new() { RecordId = r2.Id, EvidenceType = EvidenceType.Document, FileName = "维修报价单.xlsx", FilePath = "/evidences/MR-2026-0002/3.xlsx", FileUrl = "https://cdn.example.com/ev/MR-2026-0002/3.xlsx", FileSize = 96000, Description = "JBL授权维修站正式报价单：3800元", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r2.CreatedAt.AddMinutes(28), IsValid = true },
            new() { RecordId = r2.Id, EvidenceType = EvidenceType.SignForm, FileName = "损坏确认书.pdf", FilePath = "/evidences/MR-2026-0002/4.pdf", FileUrl = "https://cdn.example.com/ev/MR-2026-0002/4.pdf", FileSize = 410000, Description = "当事人孙婷签字确认损坏事实", UploadedById = "U002", UploadedByName = "张伟", UploadedAt = r2.CreatedAt.AddMinutes(15), IsValid = true },
            new() { RecordId = r3.Id, EvidenceType = EvidenceType.Photo, FileName = "平板-划痕.jpg", FilePath = "/evidences/MR-2026-0003/1.jpg", FileUrl = "https://cdn.example.com/ev/MR-2026-0003/1.jpg", FileSize = 4050000, Description = "屏幕右下角划痕照片（无比例尺）", UploadedById = "U003", UploadedByName = "王芳", UploadedAt = r3.CreatedAt.AddMinutes(10), IsValid = true },
            new() { RecordId = r4.Id, EvidenceType = EvidenceType.Photo, FileName = "麦克风-现存1支.jpg", FilePath = "/evidences/MR-2026-0004/1.jpg", FileUrl = "https://cdn.example.com/ev/MR-2026-0004/1.jpg", FileSize = 1890000, Description = "现存1支麦克风照片", UploadedById = "U003", UploadedByName = "王芳", UploadedAt = r4.CreatedAt.AddMinutes(10), IsValid = true },
            new() { RecordId = r4.Id, EvidenceType = EvidenceType.Document, FileName = "丢失报告.docx", FilePath = "/evidences/MR-2026-0004/2.docx", FileUrl = "https://cdn.example.com/ev/MR-2026-0004/2.docx", FileSize = 145000, Description = "资产丢失书面报告", UploadedById = "U003", UploadedByName = "王芳", UploadedAt = r4.CreatedAt.AddMinutes(15), IsValid = true }
        };
        await context.EvidenceAttachments.AddRangeAsync(evidences);
    }
}
