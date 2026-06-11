using Microsoft.EntityFrameworkCore;
using SealManagementSystem.Models;

namespace SealManagementSystem.Data
{
    public static class SeedData
    {
        public static void Seed(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Department>().HasData(
                new Department { DepartmentId = 1, DepartmentName = "综合管理部", Description = "行政办公综合管理" },
                new Department { DepartmentId = 2, DepartmentName = "法务部", Description = "合同审核与法律事务" },
                new Department { DepartmentId = 3, DepartmentName = "风控部", Description = "风险控制与合规审查" },
                new Department { DepartmentId = 4, DepartmentName = "市场部", Description = "市场拓展与销售" },
                new Department { DepartmentId = 5, DepartmentName = "财务部", Description = "财务管理与核算" },
                new Department { DepartmentId = 6, DepartmentName = "技术部", Description = "技术研发与产品" }
            );

            modelBuilder.Entity<User>().HasData(
                new User { UserId = 1, UserName = "张三", EmployeeId = "EMP001", Phone = "13800000001", Role = UserRole.Applicant, DepartmentId = 4 },
                new User { UserId = 2, UserName = "李四", EmployeeId = "EMP002", Phone = "13800000002", Role = UserRole.Applicant, DepartmentId = 5 },
                new User { UserId = 3, UserName = "王五", EmployeeId = "EMP003", Phone = "13800000003", Role = UserRole.Applicant, DepartmentId = 6 },
                new User { UserId = 4, UserName = "赵六", EmployeeId = "EMP004", Phone = "13800000004", Role = UserRole.Applicant, DepartmentId = 4 },
                new User { UserId = 5, UserName = "陈法务", EmployeeId = "EMP005", Phone = "13800000005", Role = UserRole.LegalReviewer, DepartmentId = 2 },
                new User { UserId = 6, UserName = "刘行政", EmployeeId = "EMP006", Phone = "13800000006", Role = UserRole.AdminStaff, DepartmentId = 1 },
                new User { UserId = 7, UserName = "孙风控", EmployeeId = "EMP007", Phone = "13800000007", Role = UserRole.RiskReviewer, DepartmentId = 3 }
            );

            modelBuilder.Entity<Seal>().HasData(
                new Seal { SealId = 1, SealName = "公司公章", SealCode = "SEAL-001", SealType = SealType.CompanySeal, Status = SealStatus.Available, Description = "公司法人公章", DepartmentId = 1, CreatedAt = new DateTime(2024, 1, 1) },
                new Seal { SealId = 2, SealName = "合同专用章", SealCode = "SEAL-002", SealType = SealType.ContractSeal, Status = SealStatus.Available, Description = "用于合同签署", DepartmentId = 1, CreatedAt = new DateTime(2024, 1, 1) },
                new Seal { SealId = 3, SealName = "财务专用章", SealCode = "SEAL-003", SealType = SealType.FinanceSeal, Status = SealStatus.Available, Description = "用于财务票据", DepartmentId = 5, CreatedAt = new DateTime(2024, 1, 1) },
                new Seal { SealId = 4, SealName = "法人名章", SealCode = "SEAL-004", SealType = SealType.LegalPersonSeal, Status = SealStatus.Available, Description = "法定代表人签章", DepartmentId = 1, CreatedAt = new DateTime(2024, 1, 1) },
                new Seal { SealId = 5, SealName = "发票专用章", SealCode = "SEAL-005", SealType = SealType.InvoiceSeal, Status = SealStatus.Available, Description = "用于发票盖章", DepartmentId = 5, CreatedAt = new DateTime(2024, 1, 1) }
            );

            modelBuilder.Entity<Contract>().HasData(
                new Contract { ContractId = 1, ContractName = "XX科技软件采购合同", ContractCode = "HT-2024-001", ContractParty = "XX科技有限公司", ContractAmount = 280000, ContractSummary = "ERP系统软件采购及实施服务合同", Status = ContractStatus.Reviewed, SignedDate = new DateTime(2024, 3, 15), ExpireDate = new DateTime(2025, 3, 14), ApplicantId = 1, CreatedAt = new DateTime(2024, 3, 1) },
                new Contract { ContractId = 2, ContractName = "YY地产办公场地租赁合同", ContractCode = "HT-2024-002", ContractParty = "YY地产集团", ContractAmount = 960000, ContractSummary = "总部办公楼三年期租赁合同", Status = ContractStatus.Signed, SignedDate = new DateTime(2024, 1, 20), ExpireDate = new DateTime(2027, 1, 19), ApplicantId = 2, CreatedAt = new DateTime(2024, 1, 10) },
                new Contract { ContractId = 3, ContractName = "ZZ物流运输服务合同", ContractCode = "HT-2024-003", ContractParty = "ZZ物流股份有限公司", ContractAmount = 450000, ContractSummary = "年度货物运输服务框架协议", Status = ContractStatus.Missing, ApplicantId = 3, CreatedAt = new DateTime(2024, 4, 1) },
                new Contract { ContractId = 4, ContractName = "AA咨询管理咨询服务合同", ContractCode = "HT-2024-004", ContractParty = "AA管理咨询公司", ContractAmount = 180000, ContractSummary = "企业管理咨询及流程优化服务", Status = ContractStatus.Reviewed, SignedDate = new DateTime(2024, 5, 1), ExpireDate = new DateTime(2024, 11, 30), ApplicantId = 4, CreatedAt = new DateTime(2024, 4, 20) },
                new Contract { ContractId = 5, ContractName = "BB设备办公设备采购合同", ContractCode = "HT-2024-005", ContractParty = "BB办公设备有限公司", ContractAmount = 120000, ContractSummary = "办公电脑及打印设备采购", Status = ContractStatus.Reviewed, SignedDate = new DateTime(2024, 6, 10), ExpireDate = new DateTime(2024, 12, 9), ApplicantId = 1, CreatedAt = new DateTime(2024, 6, 1) },
                new Contract { ContractId = 6, ContractName = "CC云服务云平台服务合同", ContractCode = "HT-2024-006", ContractParty = "CC云计算科技有限公司", ContractAmount = 360000, ContractSummary = "年度云服务器及云存储服务", Status = ContractStatus.Reviewed, SignedDate = new DateTime(2024, 2, 1), ExpireDate = new DateTime(2025, 1, 31), ApplicantId = 3, CreatedAt = new DateTime(2024, 1, 20) }
            );

            var baseTime = new DateTime(2024, 6, 1);

            modelBuilder.Entity<BorrowRequest>().HasData(
                new BorrowRequest
                {
                    BorrowRequestId = 1,
                    RequestCode = "BR-2024-001",
                    SealId = 2,
                    ContractId = 1,
                    ApplicantId = 1,
                    UsageScope = "XX科技软件采购合同第3、5、7、9页签字盖章处盖章，共4处",
                    PlannedBorrowDate = new DateTime(2024, 3, 18),
                    PlannedReturnDate = new DateTime(2024, 3, 20),
                    ActualBorrowDate = new DateTime(2024, 3, 18, 9, 30, 0),
                    ActualReturnDate = new DateTime(2024, 3, 20, 16, 0, 0),
                    Status = BorrowStatus.Returned,
                    ExceptionReason = ExceptionReason.None,
                    CreatedAt = new DateTime(2024, 3, 16, 10, 0, 0),
                    UpdatedAt = new DateTime(2024, 3, 21, 9, 0, 0)
                },
                new BorrowRequest
                {
                    BorrowRequestId = 2,
                    RequestCode = "BR-2024-002",
                    SealId = 2,
                    ContractId = 3,
                    ApplicantId = 3,
                    UsageScope = "ZZ物流运输服务合同盖章",
                    PlannedBorrowDate = new DateTime(2024, 4, 10),
                    PlannedReturnDate = new DateTime(2024, 4, 12),
                    Status = BorrowStatus.LegalRejected,
                    ExceptionReason = ExceptionReason.ContractMissing,
                    ExceptionDescription = "法务审核发现合同文件缺失，无法确认合同内容，驳回申请",
                    CreatedAt = new DateTime(2024, 4, 8, 14, 0, 0),
                    UpdatedAt = new DateTime(2024, 4, 9, 11, 0, 0)
                },
                new BorrowRequest
                {
                    BorrowRequestId = 3,
                    RequestCode = "BR-2024-003",
                    SealId = 1,
                    ContractId = 4,
                    ApplicantId = 4,
                    UsageScope = "AA咨询管理咨询服务合同盖章",
                    PlannedBorrowDate = new DateTime(2024, 5, 5),
                    PlannedReturnDate = new DateTime(2024, 5, 8),
                    ActualBorrowDate = new DateTime(2024, 5, 5, 10, 0, 0),
                    ActualReturnDate = new DateTime(2024, 5, 20, 14, 0, 0),
                    Status = BorrowStatus.ReturnException,
                    ExceptionReason = ExceptionReason.Overdue,
                    ExceptionDescription = "实际归还日期2024-05-20，超过计划归还日期2024-05-08共12天",
                    CreatedAt = new DateTime(2024, 5, 3, 9, 0, 0),
                    UpdatedAt = new DateTime(2024, 5, 21, 10, 0, 0)
                },
                new BorrowRequest
                {
                    BorrowRequestId = 4,
                    RequestCode = "BR-2024-004",
                    SealId = 1,
                    ContractId = 5,
                    ApplicantId = 1,
                    UsageScope = "BB设备办公设备采购合同正文及附件盖章，仅合同正本1份",
                    PlannedBorrowDate = new DateTime(2024, 6, 12),
                    PlannedReturnDate = new DateTime(2024, 6, 14),
                    ActualBorrowDate = new DateTime(2024, 6, 12, 9, 0, 0),
                    ActualReturnDate = new DateTime(2024, 6, 13, 17, 0, 0),
                    Status = BorrowStatus.ReturnException,
                    ExceptionReason = ExceptionReason.ScopeMismatch,
                    ExceptionDescription = "风控复核发现申请人除合同正本外，还在2份补充协议和1份授权委托书上盖章，超出申请的用印范围",
                    RiskReviewRemark = "超出范围盖章文件已报备，需补充审批流程，警告申请人",
                    CreatedAt = new DateTime(2024, 6, 10, 11, 0, 0),
                    UpdatedAt = new DateTime(2024, 6, 14, 15, 0, 0)
                },
                new BorrowRequest
                {
                    BorrowRequestId = 5,
                    RequestCode = "BR-2024-005",
                    SealId = 3,
                    ContractId = 6,
                    ApplicantId = 3,
                    UsageScope = "CC云服务云平台服务合同盖章，共2份正本",
                    PlannedBorrowDate = new DateTime(2024, 6, 15),
                    PlannedReturnDate = new DateTime(2024, 6, 17),
                    Status = BorrowStatus.Borrowed,
                    ActualBorrowDate = new DateTime(2024, 6, 15, 10, 30, 0),
                    CreatedAt = new DateTime(2024, 6, 13, 14, 0, 0),
                    UpdatedAt = new DateTime(2024, 6, 15, 11, 0, 0)
                },
                new BorrowRequest
                {
                    BorrowRequestId = 6,
                    RequestCode = "BR-2024-006",
                    SealId = 2,
                    ContractId = 2,
                    ApplicantId = 2,
                    UsageScope = "YY地产办公场地租赁合同补充条款盖章",
                    PlannedBorrowDate = DateTime.Today.AddDays(2),
                    PlannedReturnDate = DateTime.Today.AddDays(4),
                    Status = BorrowStatus.PendingLegal,
                    CreatedAt = DateTime.Today.AddDays(-1).AddHours(15)
                }
            );

            modelBuilder.Entity<ApprovalNode>().HasData(
                // BR-001 正常归还
                new ApprovalNode { ApprovalNodeId = 1, BorrowRequestId = 1, NodeType = NodeType.Submit, OperatorId = 1, Result = NodeResult.Approved, Remark = "提交印章外借申请", CreatedAt = new DateTime(2024, 3, 16, 10, 0, 0), ProcessedAt = new DateTime(2024, 3, 16, 10, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 2, BorrowRequestId = 1, NodeType = NodeType.LegalReview, OperatorId = 5, Result = NodeResult.Approved, Remark = "合同审核通过，条款完整合规", CreatedAt = new DateTime(2024, 3, 16, 10, 0, 0), ProcessedAt = new DateTime(2024, 3, 17, 9, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 3, BorrowRequestId = 1, NodeType = NodeType.AdminHandover, OperatorId = 6, Result = NodeResult.Approved, Remark = "印章已交接，签收人：张三", CreatedAt = new DateTime(2024, 3, 17, 9, 0, 0), ProcessedAt = new DateTime(2024, 3, 18, 9, 30, 0) },
                new ApprovalNode { ApprovalNodeId = 4, BorrowRequestId = 1, NodeType = NodeType.ReturnRegister, OperatorId = 6, Result = NodeResult.Approved, Remark = "印章完好归还，归还人：张三", CreatedAt = new DateTime(2024, 3, 20, 16, 0, 0), ProcessedAt = new DateTime(2024, 3, 20, 16, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 5, BorrowRequestId = 1, NodeType = NodeType.RiskReview, OperatorId = 7, Result = NodeResult.Approved, Remark = "归还核验通过，无异常", CreatedAt = new DateTime(2024, 3, 20, 16, 0, 0), ProcessedAt = new DateTime(2024, 3, 21, 9, 0, 0) },

                // BR-002 合同缺失
                new ApprovalNode { ApprovalNodeId = 6, BorrowRequestId = 2, NodeType = NodeType.Submit, OperatorId = 3, Result = NodeResult.Approved, Remark = "提交印章外借申请", CreatedAt = new DateTime(2024, 4, 8, 14, 0, 0), ProcessedAt = new DateTime(2024, 4, 8, 14, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 7, BorrowRequestId = 2, NodeType = NodeType.LegalReview, OperatorId = 5, Result = NodeResult.Rejected, Remark = "合同文件缺失，无法审核，请上传完整合同后重新申请", CreatedAt = new DateTime(2024, 4, 8, 14, 0, 0), ProcessedAt = new DateTime(2024, 4, 9, 11, 0, 0) },

                // BR-003 超期未还
                new ApprovalNode { ApprovalNodeId = 8, BorrowRequestId = 3, NodeType = NodeType.Submit, OperatorId = 4, Result = NodeResult.Approved, Remark = "提交印章外借申请", CreatedAt = new DateTime(2024, 5, 3, 9, 0, 0), ProcessedAt = new DateTime(2024, 5, 3, 9, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 9, BorrowRequestId = 3, NodeType = NodeType.LegalReview, OperatorId = 5, Result = NodeResult.Approved, Remark = "合同审核通过", CreatedAt = new DateTime(2024, 5, 3, 9, 0, 0), ProcessedAt = new DateTime(2024, 5, 4, 10, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 10, BorrowRequestId = 3, NodeType = NodeType.AdminHandover, OperatorId = 6, Result = NodeResult.Approved, Remark = "印章已交接，签收人：赵六", CreatedAt = new DateTime(2024, 5, 4, 10, 0, 0), ProcessedAt = new DateTime(2024, 5, 5, 10, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 11, BorrowRequestId = 3, NodeType = NodeType.ReturnRegister, OperatorId = 6, Result = NodeResult.Approved, Remark = "印章归还，已超期12天", CreatedAt = new DateTime(2024, 5, 20, 14, 0, 0), ProcessedAt = new DateTime(2024, 5, 20, 14, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 12, BorrowRequestId = 3, NodeType = NodeType.RiskReview, OperatorId = 7, Result = NodeResult.Approved, Remark = "超期归还已记录，申请人需书面说明原因，已纳入信用档案", CreatedAt = new DateTime(2024, 5, 20, 14, 0, 0), ProcessedAt = new DateTime(2024, 5, 21, 10, 0, 0) },

                // BR-004 用印范围不符
                new ApprovalNode { ApprovalNodeId = 13, BorrowRequestId = 4, NodeType = NodeType.Submit, OperatorId = 1, Result = NodeResult.Approved, Remark = "提交印章外借申请", CreatedAt = new DateTime(2024, 6, 10, 11, 0, 0), ProcessedAt = new DateTime(2024, 6, 10, 11, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 14, BorrowRequestId = 4, NodeType = NodeType.LegalReview, OperatorId = 5, Result = NodeResult.Approved, Remark = "合同审核通过", CreatedAt = new DateTime(2024, 6, 10, 11, 0, 0), ProcessedAt = new DateTime(2024, 6, 11, 9, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 15, BorrowRequestId = 4, NodeType = NodeType.AdminHandover, OperatorId = 6, Result = NodeResult.Approved, Remark = "印章已交接，签收人：张三", CreatedAt = new DateTime(2024, 6, 11, 9, 0, 0), ProcessedAt = new DateTime(2024, 6, 12, 9, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 16, BorrowRequestId = 4, NodeType = NodeType.ReturnRegister, OperatorId = 6, Result = NodeResult.Approved, Remark = "印章归还，归还人报告盖章文件：合同正本1份、补充协议2份、授权委托书1份", CreatedAt = new DateTime(2024, 6, 13, 17, 0, 0), ProcessedAt = new DateTime(2024, 6, 13, 17, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 17, BorrowRequestId = 4, NodeType = NodeType.RiskReview, OperatorId = 7, Result = NodeResult.Approved, Remark = "复核发现用印范围不符：申请为合同正本1份，实际加盖补充协议2份和授权委托书1份。已要求补充审批并通报批评。", CreatedAt = new DateTime(2024, 6, 13, 17, 0, 0), ProcessedAt = new DateTime(2024, 6, 14, 15, 0, 0) },

                // BR-005 外借中
                new ApprovalNode { ApprovalNodeId = 18, BorrowRequestId = 5, NodeType = NodeType.Submit, OperatorId = 3, Result = NodeResult.Approved, Remark = "提交印章外借申请", CreatedAt = new DateTime(2024, 6, 13, 14, 0, 0), ProcessedAt = new DateTime(2024, 6, 13, 14, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 19, BorrowRequestId = 5, NodeType = NodeType.LegalReview, OperatorId = 5, Result = NodeResult.Approved, Remark = "合同审核通过", CreatedAt = new DateTime(2024, 6, 13, 14, 0, 0), ProcessedAt = new DateTime(2024, 6, 14, 9, 0, 0) },
                new ApprovalNode { ApprovalNodeId = 20, BorrowRequestId = 5, NodeType = NodeType.AdminHandover, OperatorId = 6, Result = NodeResult.Approved, Remark = "财务专用章已交接，签收人：王五", CreatedAt = new DateTime(2024, 6, 14, 9, 0, 0), ProcessedAt = new DateTime(2024, 6, 15, 10, 30, 0) },

                // BR-006 待法务审核
                new ApprovalNode { ApprovalNodeId = 21, BorrowRequestId = 6, NodeType = NodeType.Submit, OperatorId = 2, Result = NodeResult.Approved, Remark = "提交印章外借申请", CreatedAt = DateTime.Today.AddDays(-1).AddHours(15), ProcessedAt = DateTime.Today.AddDays(-1).AddHours(15) },
                new ApprovalNode { ApprovalNodeId = 22, BorrowRequestId = 6, NodeType = NodeType.LegalReview, Result = NodeResult.Pending, CreatedAt = DateTime.Today.AddDays(-1).AddHours(15) }
            );
        }
    }
}
