using WaterQuotaSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace WaterQuotaSystem.Data;

public static class SeedData
{
    public static void Configure(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 6, 1, 9, 0, 0);

        var apps = new List<WaterQuotaApplication>
        {
            new()
            {
                Id = 1,
                ApplicationNo = "WQ-2026-001",
                ParkName = "滨江科技园",
                ApplicantName = "张明",
                ApplicantDepartment = "园区运营部",
                Source = "线上申报系统",
                SampleType = SampleType.NormalPass,
                Status = ApplicationStatus.Archived,
                CurrentResponsiblePerson = "李主管",
                CurrentRole = RoleType.Reviewer,
                AppliedQuota = 5000m,
                ApprovedQuota = 5000m,
                QuotaLimit = 8000m,
                QuotaUnit = "吨/月",
                KeyObject = "园区A栋办公楼用水指标",
                Basis = "《城市供水管理条例》第12条；园区年度用水计划配额标准",
                Summary = "正常申请，指标在限额内，予以放行",
                Conclusion = "审批通过，指标未超限，正常放行",
                BusinessRecord = "A栋办公楼日常运营用水，符合园区用水规划",
                FieldDescription = "现场核实水表读数正常，管道无泄漏",
                BlockingReason = "",
                DifferentialFields = "",
                RemediationPath = "",
                ApplicationDate = now,
                Deadline = now.AddDays(5),
                ProcessedDate = now.AddDays(1),
                ReviewedDate = now.AddDays(2),
                ArchivedDate = now.AddDays(3),
                IsReadOnly = true,
                CreatedAt = now,
                UpdatedAt = now.AddDays(3)
            },
            new()
            {
                Id = 2,
                ApplicationNo = "WQ-2026-002",
                ParkName = "临港产业园",
                ApplicantName = "王强",
                ApplicantDepartment = "生产保障部",
                Source = "线下窗口提交",
                SampleType = SampleType.OverLimit,
                Status = ApplicationStatus.Blocked,
                CurrentResponsiblePerson = "赵现场",
                CurrentRole = RoleType.FieldPersonnel,
                AppliedQuota = 15000m,
                ApprovedQuota = 0m,
                QuotaLimit = 8000m,
                QuotaUnit = "吨/月",
                KeyObject = "B区生产车间用水指标",
                Basis = "《城市供水管理条例》第12条；园区年度用水计划配额标准",
                Summary = "申请指标15000吨/月，超出限额8000吨/月，超限87.5%，予以阻断",
                Conclusion = "指标超限阻断：申请量超出限额87.5%",
                BusinessRecord = "B区新增生产线需增加用水量",
                FieldDescription = "现场确认新产线已投产，用水量确实增加",
                BlockingReason = "申请用水指标(15000吨/月)超出园区限额(8000吨/月)，超限87.5%，不符合《城市供水管理条例》第12条规定",
                DifferentialFields = "申请指标:15000吨/月 vs 限额:8000吨/月 | 差异:+7000吨/月(+87.5%)",
                RemediationPath = "1.重新核算实际用水需求，分阶段申请增量；2.提交节水改造方案，降低单耗后重新申报；3.如确需超限用水，需向市水务局申请特殊配额审批",
                ApplicationDate = now.AddDays(2),
                Deadline = now.AddDays(7),
                ProcessedDate = now.AddDays(3),
                ReviewedDate = null,
                ArchivedDate = null,
                IsReadOnly = false,
                CreatedAt = now.AddDays(2),
                UpdatedAt = now.AddDays(3)
            },
            new()
            {
                Id = 3,
                ApplicationNo = "WQ-2026-003",
                ParkName = "高新区创新园",
                ApplicantName = "刘芳",
                ApplicantDepartment = "物业管理部",
                Source = "线上申报系统",
                SampleType = SampleType.MissingEvidence,
                Status = ApplicationStatus.ReturnedForEvidence,
                CurrentResponsiblePerson = "陈现场",
                CurrentRole = RoleType.FieldPersonnel,
                AppliedQuota = 6000m,
                ApprovedQuota = 0m,
                QuotaLimit = 8000m,
                QuotaUnit = "吨/月",
                KeyObject = "C栋实验室用水指标",
                Basis = "《城市供水管理条例》第12条；实验室特殊用水审批办法第5条",
                Summary = "申请指标在限额内，但现场证据缺失，退回补证",
                Conclusion = "退回补证：现场勘验记录和水质检测报告缺失",
                BusinessRecord = "C栋新增化学实验室，需特殊水质处理用水",
                FieldDescription = "",
                BlockingReason = "缺少必要现场证据：(1)现场勘验记录未提交；(2)水质检测报告未提供；(3)实验室环评批复文件缺失",
                DifferentialFields = "现场说明:空 vs 要求:需完整现场勘验记录 | 证据附件:0份 vs 要求:至少3份(勘验记录、水质报告、环评批复)",
                RemediationPath = "1.补充现场勘验记录，包含水表位置、管道走向、用水设备清单；2.提交第三方水质检测报告（须CMA认证）；3.提供实验室环评批复文件；4.以上材料补齐后重新提交审核",
                ApplicationDate = now.AddDays(1),
                Deadline = now.AddDays(6),
                ProcessedDate = now.AddDays(2),
                ReviewedDate = now.AddDays(3),
                ArchivedDate = null,
                IsReadOnly = false,
                CreatedAt = now.AddDays(1),
                UpdatedAt = now.AddDays(3)
            },
            new()
            {
                Id = 4,
                ApplicationNo = "WQ-2026-004",
                ParkName = "经开工业区",
                ApplicantName = "孙磊",
                ApplicantDepartment = "基建管理部",
                Source = "线下窗口提交",
                SampleType = SampleType.ApprovalTimeout,
                Status = ApplicationStatus.Timeout,
                CurrentResponsiblePerson = "周主管",
                CurrentRole = RoleType.Reviewer,
                AppliedQuota = 7500m,
                ApprovedQuota = 0m,
                QuotaLimit = 8000m,
                QuotaUnit = "吨/月",
                KeyObject = "D区仓储中心用水指标",
                Basis = "《城市供水管理条例》第12条；审批时效管理办法第8条",
                Summary = "审批超时：受理后超过5个工作日未完成审批，系统自动标记超时",
                Conclusion = "审批超时：受理日期2026-06-03，截止2026-06-10已超7个工作日未完成审批",
                BusinessRecord = "D区新建仓储中心，日常消防及保洁用水",
                FieldDescription = "现场已核实，仓储中心消防设施和保洁用水需求合理",
                BlockingReason = "审批流程超时：根据《审批时效管理办法》第8条，用水指标申请应在5个工作日内完成审批，本申请已超7个工作日，系统自动阻断",
                DifferentialFields = "审批时限:5个工作日 vs 实际用时:7个工作日 | 超时:+2个工作日",
                RemediationPath = "1.主管复核人须在24小时内完成超时说明；2.补充超时原因书面记录；3.重新发起审批流程，系统将优先处理超时补审案件；4.如需延期审批，须提前提交延期申请并获上级批准",
                ApplicationDate = now.AddDays(3),
                Deadline = now.AddDays(8),
                ProcessedDate = null,
                ReviewedDate = null,
                ArchivedDate = null,
                IsReadOnly = false,
                CreatedAt = now.AddDays(3),
                UpdatedAt = now.AddDays(10)
            }
        };

        modelBuilder.Entity<WaterQuotaApplication>().HasData(apps);

        var nodes = new List<ProcessingNode>
        {
            new() { Id = 1, ApplicationId = 1, FromStatus = ApplicationStatus.Accepted, ToStatus = ApplicationStatus.Processing, Action = "受理转入处理", OperatorName = "系统", OperatorRole = RoleType.FieldPersonnel, Comment = "申请材料齐全，予以受理", Conclusion = "受理通过", ResponsiblePersonBefore = "", ResponsiblePersonAfter = "赵现场", OperatedAt = now },
            new() { Id = 2, ApplicationId = 1, FromStatus = ApplicationStatus.Processing, ToStatus = ApplicationStatus.Reviewing, Action = "处理完成提交复核", OperatorName = "赵现场", OperatorRole = RoleType.FieldPersonnel, Comment = "现场核实完毕，指标正常", Conclusion = "现场核实通过，建议放行", ResponsiblePersonBefore = "赵现场", ResponsiblePersonAfter = "李主管", OperatedAt = now.AddDays(1) },
            new() { Id = 3, ApplicationId = 1, FromStatus = ApplicationStatus.Reviewing, ToStatus = ApplicationStatus.Approved, Action = "复核确认通过", OperatorName = "李主管", OperatorRole = RoleType.Reviewer, Comment = "审批通过", Conclusion = "审批通过，正常放行", ResponsiblePersonBefore = "李主管", ResponsiblePersonAfter = "李主管", OperatedAt = now.AddDays(2) },
            new() { Id = 4, ApplicationId = 1, FromStatus = ApplicationStatus.Approved, ToStatus = ApplicationStatus.Archived, Action = "归档", OperatorName = "李主管", OperatorRole = RoleType.Reviewer, Comment = "审批完成，归档", Conclusion = "已归档", ResponsiblePersonBefore = "李主管", ResponsiblePersonAfter = "", OperatedAt = now.AddDays(3) },

            new() { Id = 5, ApplicationId = 2, FromStatus = ApplicationStatus.Accepted, ToStatus = ApplicationStatus.Processing, Action = "受理转入处理", OperatorName = "系统", OperatorRole = RoleType.FieldPersonnel, Comment = "申请已受理，分配现场人员", Conclusion = "受理通过", ResponsiblePersonBefore = "", ResponsiblePersonAfter = "赵现场", OperatedAt = now.AddDays(2) },
            new() { Id = 6, ApplicationId = 2, FromStatus = ApplicationStatus.Processing, ToStatus = ApplicationStatus.Blocked, Action = "指标超限阻断", OperatorName = "赵现场", OperatorRole = RoleType.FieldPersonnel, Comment = "申请指标超限87.5%，自动阻断", Conclusion = "指标超限，予以阻断", ResponsiblePersonBefore = "赵现场", ResponsiblePersonAfter = "赵现场", OperatedAt = now.AddDays(3) },

            new() { Id = 7, ApplicationId = 3, FromStatus = ApplicationStatus.Accepted, ToStatus = ApplicationStatus.Processing, Action = "受理转入处理", OperatorName = "系统", OperatorRole = RoleType.FieldPersonnel, Comment = "申请已受理", Conclusion = "受理通过", ResponsiblePersonBefore = "", ResponsiblePersonAfter = "陈现场", OperatedAt = now.AddDays(1) },
            new() { Id = 8, ApplicationId = 3, FromStatus = ApplicationStatus.Processing, ToStatus = ApplicationStatus.Reviewing, Action = "处理完成提交复核", OperatorName = "陈现场", OperatorRole = RoleType.FieldPersonnel, Comment = "现场核实部分完成，证据不完整", Conclusion = "指标在限额内，但证据不足", ResponsiblePersonBefore = "陈现场", ResponsiblePersonAfter = "周主管", OperatedAt = now.AddDays(2) },
            new() { Id = 9, ApplicationId = 3, FromStatus = ApplicationStatus.Reviewing, ToStatus = ApplicationStatus.ReturnedForEvidence, Action = "退回补证", OperatorName = "周主管", OperatorRole = RoleType.Reviewer, Comment = "缺少勘验记录、水质报告和环评批复，退回补证", Conclusion = "退回补证", ResponsiblePersonBefore = "周主管", ResponsiblePersonAfter = "陈现场", OperatedAt = now.AddDays(3) },

            new() { Id = 10, ApplicationId = 4, FromStatus = ApplicationStatus.Accepted, ToStatus = ApplicationStatus.Timeout, Action = "审批超时自动标记", OperatorName = "系统", OperatorRole = RoleType.Reviewer, Comment = "受理后超过5个工作日未完成审批，系统自动标记超时", Conclusion = "审批超时", ResponsiblePersonBefore = "", ResponsiblePersonAfter = "周主管", OperatedAt = now.AddDays(10) }
        };

        modelBuilder.Entity<ProcessingNode>().HasData(nodes);

        var changes = new List<FieldChangeRecord>
        {
            new() { Id = 1, ApplicationId = 2, ProcessingNodeId = 6, FieldName = "Status", FieldDisplayName = "状态", OldValue = "处理中", NewValue = "已阻断", ChangedBy = "赵现场", ChangedAt = now.AddDays(3), IsKeyChange = true },
            new() { Id = 2, ApplicationId = 2, ProcessingNodeId = 6, FieldName = "ApprovedQuota", FieldDisplayName = "审批指标", OldValue = "0", NewValue = "0(超限未批)", ChangedBy = "赵现场", ChangedAt = now.AddDays(3), IsKeyChange = true },
            new() { Id = 3, ApplicationId = 3, ProcessingNodeId = 9, FieldName = "Status", FieldDisplayName = "状态", OldValue = "复核中", NewValue = "退回补证", ChangedBy = "周主管", ChangedAt = now.AddDays(3), IsKeyChange = true },
            new() { Id = 4, ApplicationId = 3, ProcessingNodeId = 9, FieldName = "CurrentResponsiblePerson", FieldDisplayName = "当前责任人", OldValue = "周主管", NewValue = "陈现场", ChangedBy = "周主管", ChangedAt = now.AddDays(3), IsKeyChange = true },
            new() { Id = 5, ApplicationId = 4, ProcessingNodeId = 10, FieldName = "Status", FieldDisplayName = "状态", OldValue = "已受理", NewValue = "审批超时", ChangedBy = "系统", ChangedAt = now.AddDays(10), IsKeyChange = true },
            new() { Id = 6, ApplicationId = 4, ProcessingNodeId = 10, FieldName = "Deadline", FieldDisplayName = "截止时间", OldValue = "2026-06-11", NewValue = "已超时", ChangedBy = "系统", ChangedAt = now.AddDays(10), IsKeyChange = true }
        };

        modelBuilder.Entity<FieldChangeRecord>().HasData(changes);

        var attachments = new List<EvidenceAttachment>
        {
            new() { Id = 1, ApplicationId = 1, FileName = "水表读数照片.jpg", FilePath = "/uploads/wq-001/meter.jpg", FileType = "image/jpeg", Description = "A栋水表读数现场照片", UploadedBy = "赵现场", UploaderRole = RoleType.FieldPersonnel, UploadedAt = now.AddDays(1), IsMissing = false },
            new() { Id = 2, ApplicationId = 1, FileName = "管道巡检记录.pdf", FilePath = "/uploads/wq-001/pipe.pdf", FileType = "application/pdf", Description = "管道巡检报告", UploadedBy = "赵现场", UploaderRole = RoleType.FieldPersonnel, UploadedAt = now.AddDays(1), IsMissing = false },
            new() { Id = 3, ApplicationId = 2, FileName = "新产线用水核算表.xlsx", FilePath = "/uploads/wq-002/usage.xlsx", FileType = "application/vnd.ms-excel", Description = "新增生产线用水量核算", UploadedBy = "赵现场", UploaderRole = RoleType.FieldPersonnel, UploadedAt = now.AddDays(3), IsMissing = false },
            new() { Id = 4, ApplicationId = 3, FileName = "现场勘验记录.pdf", FilePath = "", FileType = "application/pdf", Description = "C栋实验室现场勘验记录（缺失）", UploadedBy = "", UploaderRole = RoleType.FieldPersonnel, UploadedAt = default, IsMissing = true },
            new() { Id = 5, ApplicationId = 3, FileName = "水质检测报告.pdf", FilePath = "", FileType = "application/pdf", Description = "第三方CMA水质检测报告（缺失）", UploadedBy = "", UploaderRole = RoleType.FieldPersonnel, UploadedAt = default, IsMissing = true },
            new() { Id = 6, ApplicationId = 3, FileName = "环评批复文件.pdf", FilePath = "", FileType = "application/pdf", Description = "实验室环评批复文件（缺失）", UploadedBy = "", UploaderRole = RoleType.FieldPersonnel, UploadedAt = default, IsMissing = true },
            new() { Id = 7, ApplicationId = 4, FileName = "消防设施验收报告.pdf", FilePath = "/uploads/wq-004/fire.pdf", FileType = "application/pdf", Description = "仓储中心消防设施验收报告", UploadedBy = "陈现场", UploaderRole = RoleType.FieldPersonnel, UploadedAt = now.AddDays(4), IsMissing = false }
        };

        modelBuilder.Entity<EvidenceAttachment>().HasData(attachments);
    }
}
