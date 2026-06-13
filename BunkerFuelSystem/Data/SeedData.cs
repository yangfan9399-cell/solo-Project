using BunkerFuelSystem.Models;

namespace BunkerFuelSystem.Data;

public static class SeedData
{
    public static void Initialize(IServiceProvider serviceProvider)
    {
        using var context = serviceProvider.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();

        if (context.BunkerApplications.Any())
            return;

        var now = DateTime.Now;

        var app1 = new BunkerApplication
        {
            ApplicationNo = "BF-2026-001",
            ShipName = "远洋明珠号",
            VoyageNo = "VY-2601",
            FuelType = "VLSFO",
            OrderedQuantity = 500.0000m,
            ActualQuantity = 498.5000m,
            UnitPrice = 580.0000m,
            TotalAmount = 289130.0000m,
            BunkerDate = now.AddDays(-2),
            BunkerPort = "上海洋山港",
            SupplierName = "中船燃油",
            ApplicationSource = "船舶申报",
            Category = ApplicationCategory.NormalPass,
            Status = WorkflowStatus.Processing,
            CurrentResponsiblePerson = "张明",
            CurrentResponsibleRole = UserRole.OnSitePersonnel,
            Conclusion = "计量差异在允许范围内",
            Summary = "实际加注量与申领量偏差0.3%，在允许范围内，建议正常放行。",
            BlockedReason = null,
            RemediationPath = null,
            Basis = null,
            CreatedAt = now.AddDays(-2),
            UpdatedAt = now.AddDays(-1),
            ProcessNodes = new List<ProcessNode>
            {
                new()
                {
                    NodeType = NodeType.Received,
                    OperatorName = "张明",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "受理申请",
                    Comment = "收到船舶加注申请，资料齐全",
                    CreatedAt = now.AddDays(-2)
                },
                new()
                {
                    NodeType = NodeType.Processing,
                    OperatorName = "张明",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "处理中",
                    Comment = "计量数据核实中，偏差0.3%，在允许范围内",
                    CreatedAt = now.AddDays(-1)
                }
            },
            DiscrepancyFields = new List<DiscrepancyField>
            {
                new()
                {
                    FieldName = "ActualQuantity",
                    FieldLabel = "实际加注量",
                    OriginalValue = "500.0000 MT",
                    CurrentValue = "498.5000 MT",
                    ChangedAt = now.AddDays(-1),
                    ChangedBy = "张明",
                    IsKeyField = false
                }
            },
            EvidenceAttachments = new List<EvidenceAttachment>
            {
                new()
                {
                    FileName = "bunker_receipt_BF2026001.pdf",
                    FilePath = "/uploads/BF-2026-001/bunker_receipt.pdf",
                    FileType = "application/pdf",
                    Description = "加油收据",
                    UploadedBy = "张明",
                    UploadedAt = now.AddDays(-1)
                }
            }
        };

        var app2 = new BunkerApplication
        {
            ApplicationNo = "BF-2026-002",
            ShipName = "蓝鲸号",
            VoyageNo = "VY-2602",
            FuelType = "LSMGO",
            OrderedQuantity = 300.0000m,
            ActualQuantity = 285.0000m,
            UnitPrice = 620.0000m,
            TotalAmount = 176700.0000m,
            BunkerDate = now.AddDays(-1),
            BunkerPort = "宁波舟山港",
            SupplierName = "中石化燃油",
            ApplicationSource = "码头申报",
            Category = ApplicationCategory.IndicatorOverLimit,
            Status = WorkflowStatus.Processing,
            CurrentResponsiblePerson = "李伟",
            CurrentResponsibleRole = UserRole.OnSitePersonnel,
            Conclusion = null,
            Summary = "实际加注量偏差达5%，超出允许范围，需供应商出具偏差说明。",
            BlockedReason = "实际加注量偏差超过5%允许范围，计量确认不通过",
            RemediationPath = "需供应商出具补油方案或偏差说明函，经主管复核确认后方可放行",
            Basis = "ISO 8217:2017 燃油规格标准及公司计量管理规程第4.3条",
            CreatedAt = now.AddDays(-1),
            UpdatedAt = now.AddHours(-6),
            ProcessNodes = new List<ProcessNode>
            {
                new()
                {
                    NodeType = NodeType.Received,
                    OperatorName = "李伟",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "受理申请",
                    Comment = "收到码头加注申报，资料齐全",
                    CreatedAt = now.AddDays(-1)
                },
                new()
                {
                    NodeType = NodeType.Processing,
                    OperatorName = "李伟",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "处理中-已阻断",
                    Comment = "加注量偏差5%，超出允许范围，已阻断等待供应商说明",
                    BlockedReason = "实际加注量偏差超过5%允许范围，计量确认不通过",
                    RemediationPath = "需供应商出具补油方案或偏差说明函，经主管复核确认后方可放行",
                    CreatedAt = now.AddHours(-6)
                }
            },
            DiscrepancyFields = new List<DiscrepancyField>
            {
                new()
                {
                    FieldName = "ActualQuantity",
                    FieldLabel = "加注量差异",
                    OriginalValue = "300.0000 MT",
                    CurrentValue = "285.0000 MT",
                    ChangedAt = now.AddHours(-6),
                    ChangedBy = "李伟",
                    IsKeyField = true
                },
                new()
                {
                    FieldName = "TotalAmount",
                    FieldLabel = "金额差异",
                    OriginalValue = "186000.0000",
                    CurrentValue = "176700.0000",
                    ChangedAt = now.AddHours(-6),
                    ChangedBy = "李伟",
                    IsKeyField = true
                }
            },
            EvidenceAttachments = new List<EvidenceAttachment>
            {
                new()
                {
                    FileName = "bunker_receipt_BF2026002.pdf",
                    FilePath = "/uploads/BF-2026-002/bunker_receipt.pdf",
                    FileType = "application/pdf",
                    Description = "加油收据",
                    UploadedBy = "李伟",
                    UploadedAt = now.AddHours(-6)
                },
                new()
                {
                    FileName = "flowmeter_record_BF2026002.xlsx",
                    FilePath = "/uploads/BF-2026-002/flowmeter_record.xlsx",
                    FileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    Description = "流量计记录",
                    UploadedBy = "李伟",
                    UploadedAt = now.AddHours(-6)
                }
            }
        };

        var app3 = new BunkerApplication
        {
            ApplicationNo = "BF-2026-003",
            ShipName = "金海鸥号",
            VoyageNo = "VY-2603",
            FuelType = "HSFO",
            OrderedQuantity = 800.0000m,
            ActualQuantity = 795.2000m,
            UnitPrice = 450.0000m,
            TotalAmount = 357840.0000m,
            BunkerDate = now.AddDays(-3),
            BunkerPort = "广州南沙港",
            SupplierName = "中海油燃油",
            ApplicationSource = "系统自动",
            Category = ApplicationCategory.EvidenceMissing,
            Status = WorkflowStatus.UnderReview,
            CurrentResponsiblePerson = "王建国",
            CurrentResponsibleRole = UserRole.SupervisorReviewer,
            Conclusion = null,
            Summary = "缺少流量计校验证书和加注前后液位测量照片，证据不完整，需补充后复核。",
            BlockedReason = "缺少流量计校验证书和加注前后液位测量照片",
            RemediationPath = "现场人员需补充流量计校验证书、液位测量照片及船方签收单据",
            Basis = null,
            CreatedAt = now.AddDays(-3),
            UpdatedAt = now.AddDays(-1),
            ProcessNodes = new List<ProcessNode>
            {
                new()
                {
                    NodeType = NodeType.Received,
                    OperatorName = "陈志远",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "受理申请",
                    Comment = "系统自动生成加注申报，已受理",
                    CreatedAt = now.AddDays(-3)
                },
                new()
                {
                    NodeType = NodeType.Processing,
                    OperatorName = "陈志远",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "处理中-已阻断",
                    Comment = "证据材料缺失，无法完成计量确认",
                    BlockedReason = "缺少流量计校验证书和加注前后液位测量照片",
                    RemediationPath = "现场人员需补充流量计校验证书、液位测量照片及船方签收单据",
                    CreatedAt = now.AddDays(-2)
                },
                new()
                {
                    NodeType = NodeType.Review,
                    OperatorName = "王建国",
                    OperatorRole = UserRole.SupervisorReviewer,
                    Action = "复核中-等待补充证据",
                    Comment = "已要求现场人员补充证据材料",
                    CreatedAt = now.AddDays(-1)
                }
            },
            DiscrepancyFields = new List<DiscrepancyField>
            {
                new()
                {
                    FieldName = "EvidenceConclusion",
                    FieldLabel = "证据结论",
                    OriginalValue = "齐全",
                    CurrentValue = "缺失",
                    ChangedAt = now.AddDays(-2),
                    ChangedBy = "陈志远",
                    IsKeyField = true
                },
                new()
                {
                    FieldName = "ActualQuantity",
                    FieldLabel = "实际加注量",
                    OriginalValue = "800.0000 MT",
                    CurrentValue = "795.2000 MT",
                    ChangedAt = now.AddDays(-2),
                    ChangedBy = "陈志远",
                    IsKeyField = false
                }
            },
            EvidenceAttachments = new List<EvidenceAttachment>()
        };

        var app4 = new BunkerApplication
        {
            ApplicationNo = "BF-2026-004",
            ShipName = "北极星号",
            VoyageNo = "VY-2604",
            FuelType = "VLSFO",
            OrderedQuantity = 600.0000m,
            ActualQuantity = 598.0000m,
            UnitPrice = 580.0000m,
            TotalAmount = 346840.0000m,
            BunkerDate = now.AddDays(-4),
            BunkerPort = "青岛港",
            SupplierName = "中船燃油",
            ApplicationSource = "船舶申报",
            Category = ApplicationCategory.ApprovalTimeout,
            Status = WorkflowStatus.Received,
            CurrentResponsiblePerson = "赵强",
            CurrentResponsibleRole = UserRole.OnSitePersonnel,
            Conclusion = null,
            Summary = "受理后超过72小时未进入处理环节，系统自动标记超时。",
            BlockedReason = "受理后超过72小时未进入处理环节，系统自动标记超时",
            RemediationPath = "需现场人员确认加注数据有效性并补充超时原因说明，主管复核后方可继续",
            Basis = null,
            CreatedAt = now.AddDays(-4),
            UpdatedAt = now.AddDays(-4),
            ProcessNodes = new List<ProcessNode>
            {
                new()
                {
                    NodeType = NodeType.Received,
                    OperatorName = "赵强",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "受理申请",
                    Comment = "收到船舶加注申请",
                    CreatedAt = now.AddDays(-4)
                }
            },
            DiscrepancyFields = new List<DiscrepancyField>
            {
                new()
                {
                    FieldName = "CriticalTime",
                    FieldLabel = "关键时间",
                    OriginalValue = "受理后72小时内进入处理",
                    CurrentValue = $"已超时{(int)(now - now.AddDays(-4)).TotalHours}小时未处理",
                    ChangedAt = now,
                    ChangedBy = "系统",
                    IsKeyField = true
                }
            },
            EvidenceAttachments = new List<EvidenceAttachment>()
        };

        context.BunkerApplications.AddRange(app1, app2, app3, app4);

        var app5 = new BunkerApplication
        {
            ApplicationNo = "BF-2026-005",
            ShipName = "和平号",
            VoyageNo = "VY-2605",
            FuelType = "VLSFO",
            OrderedQuantity = 450.0000m,
            ActualQuantity = 449.2000m,
            UnitPrice = 575.0000m,
            TotalAmount = 258290.0000m,
            BunkerDate = now.AddDays(-10),
            BunkerPort = "天津港",
            SupplierName = "中石化燃油",
            ApplicationSource = "船舶申报",
            Category = ApplicationCategory.NormalPass,
            Status = WorkflowStatus.Archived,
            CurrentResponsiblePerson = "刘建国",
            CurrentResponsibleRole = UserRole.SupervisorReviewer,
            Conclusion = "计量差异0.18%，在允许范围内，已归档确认。",
            Summary = "实际加注量与申领量偏差0.18%，在允许范围内，已正常归档。",
            BlockedReason = null,
            RemediationPath = null,
            Basis = "ISO 8217:2017 燃油规格标准及公司计量管理规程第4.3条",
            CreatedAt = now.AddDays(-10),
            UpdatedAt = now.AddDays(-7),
            ProcessNodes = new List<ProcessNode>
            {
                new()
                {
                    NodeType = NodeType.Received,
                    OperatorName = "王大海",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "受理申请",
                    Comment = "收到船舶加注申请，资料齐全",
                    CreatedAt = now.AddDays(-10)
                },
                new()
                {
                    NodeType = NodeType.Processing,
                    OperatorName = "王大海",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "提交处理",
                    Comment = "进入处理",
                    CreatedAt = now.AddDays(-9)
                },
                new()
                {
                    NodeType = NodeType.Review,
                    OperatorName = "王大海",
                    OperatorRole = UserRole.OnSitePersonnel,
                    Action = "提交处理",
                    Comment = "提交复核",
                    CreatedAt = now.AddDays(-8)
                },
                new()
                {
                    NodeType = NodeType.Review,
                    OperatorName = "刘建国",
                    OperatorRole = UserRole.SupervisorReviewer,
                    Action = "确认结论",
                    Comment = "计量差异在允许范围内",
                    CreatedAt = now.AddDays(-7)
                },
                new()
                {
                    NodeType = NodeType.Archive,
                    OperatorName = "刘建国",
                    OperatorRole = UserRole.SupervisorReviewer,
                    Action = "只读归档",
                    Comment = "审核通过，归档",
                    CreatedAt = now.AddDays(-7)
                }
            },
            DiscrepancyFields = new List<DiscrepancyField>
            {
                new()
                {
                    FieldName = "ActualQuantity",
                    FieldLabel = "实际加注量",
                    OriginalValue = "450.0000 MT",
                    CurrentValue = "449.2000 MT",
                    ChangedAt = now.AddDays(-9),
                    ChangedBy = "王大海",
                    IsKeyField = false
                }
            },
            EvidenceAttachments = new List<EvidenceAttachment>
            {
                new()
                {
                    FileName = "bunker_receipt_BF2026005.pdf",
                    FilePath = "/uploads/BF-2026-005/bunker_receipt.pdf",
                    FileType = "application/pdf",
                    Description = "加油收据",
                    UploadedBy = "王大海",
                    UploadedAt = now.AddDays(-9)
                }
            }
        };

        context.BunkerApplications.AddRange(app5);
        context.SaveChanges();
    }
}
