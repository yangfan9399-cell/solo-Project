using TempPowerInspection.Models;

namespace TempPowerInspection.Data;

public static class SeedData
{
    public static void Initialize(ApplicationDbContext context)
    {
        if (context.HiddenDangers.Any())
        {
            return;
        }

        // Sample 1: 正常送电案例 - A栋-1#箱
        var danger1 = new HiddenDanger
        {
            DistributionBoxName = "A栋-1#箱",
            BuildingName = "A栋",
            TeamName = "钢筋班组",
            DangerLevel = DangerLevel.一般,
            DangerType = "电线老化",
            Description = "配电箱内部分电线绝缘层老化，需要更换",
            InspectionPhotos = "/images/placeholder.png",
            Status = DangerStatus.已送电,
            CreatedAt = DateTime.Now.AddDays(-5),
            CreatedBy = "张三(电工)"
        };
        context.HiddenDangers.Add(danger1);
        context.SaveChanges();

        // 添加整改记录
        var rect1 = new Rectification
        {
            HiddenDangerId = danger1.Id,
            Requirement = "更换老化电线，确保绝缘性能符合标准",
            RectificationPhotos = "/images/placeholder.png",
            Feedback = "已更换全部老化电线，经检测合格",
            CompletedAt = DateTime.Now.AddDays(-2),
            Status = RectificationStatus.已通过,
            CreatedAt = DateTime.Now.AddDays(-4),
            CreatedBy = "李四(安全员)"
        };
        context.Rectifications.Add(rect1);

        // 添加审批记录
        var approval1 = new PowerApproval
        {
            HiddenDangerId = danger1.Id,
            ApprovedBy = "王五(项目经理)",
            ApprovalResult = ApprovalResult.通过,
            Comment = "整改合格，同意送电",
            ApprovedAt = DateTime.Now.AddDays(-1),
            CanPowerOn = true
        };
        context.PowerApprovals.Add(approval1);

        // 添加历史节点
        context.StatusHistories.AddRange(new[]
        {
            new StatusHistory { HiddenDangerId = danger1.Id, Status = DangerStatus.待整改, Operator = "张三(电工)", Remark = "提交巡检记录", OperatedAt = DateTime.Now.AddDays(-5) },
            new StatusHistory { HiddenDangerId = danger1.Id, Status = DangerStatus.整改中, Operator = "李四(安全员)", Remark = "下发整改要求", OperatedAt = DateTime.Now.AddDays(-4) },
            new StatusHistory { HiddenDangerId = danger1.Id, Status = DangerStatus.待复检, Operator = "李四(安全员)", Remark = "待复检", OperatedAt = DateTime.Now.AddDays(-2) },
            new StatusHistory { HiddenDangerId = danger1.Id, Status = DangerStatus.已通过, Operator = "王五(项目经理)", Remark = "复检通过", OperatedAt = DateTime.Now.AddDays(-1) },
            new StatusHistory { HiddenDangerId = danger1.Id, Status = DangerStatus.已送电, Operator = "王五(项目经理)", Remark = "同意送电", OperatedAt = DateTime.Now.AddDays(-1) }
        });

        // Sample 2: 漏保失效案例 - B栋-2#箱
        var danger2 = new HiddenDanger
        {
            DistributionBoxName = "B栋-2#箱",
            BuildingName = "B栋",
            TeamName = "模板班组",
            DangerLevel = DangerLevel.严重,
            DangerType = "漏保失效",
            Description = "漏电保护器失灵，无法起到漏电保护作用",
            InspectionPhotos = "/images/placeholder.png",
            Status = DangerStatus.已送电,
            CreatedAt = DateTime.Now.AddDays(-7),
            CreatedBy = "赵六(电工)"
        };
        context.HiddenDangers.Add(danger2);
        context.SaveChanges();

        var rect2 = new Rectification
        {
            HiddenDangerId = danger2.Id,
            Requirement = "立即更换漏电保护器，选型符合规范要求",
            RectificationPhotos = "/images/placeholder.png",
            Feedback = "已更换全新的漏电保护器，经测试动作正常",
            CompletedAt = DateTime.Now.AddDays(-4),
            Status = RectificationStatus.已通过,
            CreatedAt = DateTime.Now.AddDays(-6),
            CreatedBy = "孙七(安全员)"
        };
        context.Rectifications.Add(rect2);

        var approval2 = new PowerApproval
        {
            HiddenDangerId = danger2.Id,
            ApprovedBy = "王五(项目经理)",
            ApprovalResult = ApprovalResult.通过,
            Comment = "漏保已更换，测试合格，同意送电",
            ApprovedAt = DateTime.Now.AddDays(-3),
            CanPowerOn = true
        };
        context.PowerApprovals.Add(approval2);

        context.StatusHistories.AddRange(new[]
        {
            new StatusHistory { HiddenDangerId = danger2.Id, Status = DangerStatus.待整改, Operator = "赵六(电工)", Remark = "发现漏保失效隐患", OperatedAt = DateTime.Now.AddDays(-7) },
            new StatusHistory { HiddenDangerId = danger2.Id, Status = DangerStatus.整改中, Operator = "孙七(安全员)", Remark = "要求立即整改", OperatedAt = DateTime.Now.AddDays(-6) },
            new StatusHistory { HiddenDangerId = danger2.Id, Status = DangerStatus.待复检, Operator = "孙七(安全员)", Remark = "整改完成，申请复检", OperatedAt = DateTime.Now.AddDays(-4) },
            new StatusHistory { HiddenDangerId = danger2.Id, Status = DangerStatus.已通过, Operator = "王五(项目经理)", Remark = "复检通过", OperatedAt = DateTime.Now.AddDays(-3) },
            new StatusHistory { HiddenDangerId = danger2.Id, Status = DangerStatus.已送电, Operator = "王五(项目经理)", Remark = "同意送电", OperatedAt = DateTime.Now.AddDays(-3) }
        });

        // Sample 3: 整改照片缺失案例 - C栋-3#箱
        var danger3 = new HiddenDanger
        {
            DistributionBoxName = "C栋-3#箱",
            BuildingName = "C栋",
            TeamName = "混凝土班组",
            DangerLevel = DangerLevel.一般,
            DangerType = "整改照片缺失",
            Description = "上次整改未上传整改照片，需要补充",
            InspectionPhotos = "/images/placeholder.png",
            Status = DangerStatus.已送电,
            CreatedAt = DateTime.Now.AddDays(-10),
            CreatedBy = "周八(电工)"
        };
        context.HiddenDangers.Add(danger3);
        context.SaveChanges();

        var rect3 = new Rectification
        {
            HiddenDangerId = danger3.Id,
            Requirement = "补充上传整改照片，证明整改已完成",
            RectificationPhotos = "/images/placeholder.png",
            Feedback = "已补充上传整改照片",
            CompletedAt = DateTime.Now.AddDays(-6),
            Status = RectificationStatus.已通过,
            CreatedAt = DateTime.Now.AddDays(-8),
            CreatedBy = "吴九(安全员)"
        };
        context.Rectifications.Add(rect3);

        var approval3 = new PowerApproval
        {
            HiddenDangerId = danger3.Id,
            ApprovedBy = "王五(项目经理)",
            ApprovalResult = ApprovalResult.通过,
            Comment = "照片补充完整，同意送电",
            ApprovedAt = DateTime.Now.AddDays(-5),
            CanPowerOn = true
        };
        context.PowerApprovals.Add(approval3);

        context.StatusHistories.AddRange(new[]
        {
            new StatusHistory { HiddenDangerId = danger3.Id, Status = DangerStatus.待整改, Operator = "周八(电工)", Remark = "提交巡检", OperatedAt = DateTime.Now.AddDays(-10) },
            new StatusHistory { HiddenDangerId = danger3.Id, Status = DangerStatus.整改中, Operator = "吴九(安全员)", Remark = "要求补充照片", OperatedAt = DateTime.Now.AddDays(-8) },
            new StatusHistory { HiddenDangerId = danger3.Id, Status = DangerStatus.退回, Operator = "吴九(安全员)", Remark = "照片不完整，退回补充", OperatedAt = DateTime.Now.AddDays(-7) },
            new StatusHistory { HiddenDangerId = danger3.Id, Status = DangerStatus.整改中, Operator = "周八(电工)", Remark = "重新提交", OperatedAt = DateTime.Now.AddDays(-6) },
            new StatusHistory { HiddenDangerId = danger3.Id, Status = DangerStatus.已通过, Operator = "王五(项目经理)", Remark = "复检通过", OperatedAt = DateTime.Now.AddDays(-5) },
            new StatusHistory { HiddenDangerId = danger3.Id, Status = DangerStatus.已送电, Operator = "王五(项目经理)", Remark = "同意送电", OperatedAt = DateTime.Now.AddDays(-5) }
        });

        // Sample 4: 复检不通过案例 - D栋-4#箱
        var danger4 = new HiddenDanger
        {
            DistributionBoxName = "D栋-4#箱",
            BuildingName = "D栋",
            TeamName = "砌筑班组",
            DangerLevel = DangerLevel.严重,
            DangerType = "复检不通过",
            Description = "整改不到位，漏保测试仍未通过",
            InspectionPhotos = "/images/placeholder.png",
            Status = DangerStatus.退回,
            CreatedAt = DateTime.Now.AddDays(-3),
            CreatedBy = "郑十(电工)"
        };
        context.HiddenDangers.Add(danger4);
        context.SaveChanges();

        var rect4 = new Rectification
        {
            HiddenDangerId = danger4.Id,
            Requirement = "重新测试漏保动作电流，确保符合30mA标准",
            RectificationPhotos = "/images/placeholder.png",
            Feedback = "已重新测试，动作电流28mA，符合要求",
            CompletedAt = DateTime.Now.AddDays(-1),
            Status = RectificationStatus.待复检,
            CreatedAt = DateTime.Now.AddDays(-2),
            CreatedBy = "钱十一(安全员)"
        };
        context.Rectifications.Add(rect4);

        context.StatusHistories.AddRange(new[]
        {
            new StatusHistory { HiddenDangerId = danger4.Id, Status = DangerStatus.待整改, Operator = "郑十(电工)", Remark = "提交巡检", OperatedAt = DateTime.Now.AddDays(-3) },
            new StatusHistory { HiddenDangerId = danger4.Id, Status = DangerStatus.整改中, Operator = "钱十一(安全员)", Remark = "下发整改要求", OperatedAt = DateTime.Now.AddDays(-2) },
            new StatusHistory { HiddenDangerId = danger4.Id, Status = DangerStatus.待复检, Operator = "郑十(电工)", Remark = "整改完成，申请复检", OperatedAt = DateTime.Now.AddDays(-1) },
            new StatusHistory { HiddenDangerId = danger4.Id, Status = DangerStatus.退回, Operator = "王五(项目经理)", Remark = "复检不通过，退回重新整改", OperatedAt = DateTime.Now }
        });

        context.SaveChanges();
    }
}
