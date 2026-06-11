using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SealManagementSystem.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DepartmentName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.DepartmentId);
                });

            migrationBuilder.CreateTable(
                name: "Seals",
                columns: table => new
                {
                    SealId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SealName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SealCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SealType = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seals", x => x.SealId);
                    table.ForeignKey(
                        name: "FK_Seals_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EmployeeId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Users_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DepartmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Contracts",
                columns: table => new
                {
                    ContractId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ContractCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ContractParty = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ContractAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ContractSummary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpireDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApplicantId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contracts", x => x.ContractId);
                    table.ForeignKey(
                        name: "FK_Contracts_Users_ApplicantId",
                        column: x => x.ApplicantId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BorrowRequests",
                columns: table => new
                {
                    BorrowRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SealId = table.Column<int>(type: "int", nullable: false),
                    ContractId = table.Column<int>(type: "int", nullable: false),
                    ApplicantId = table.Column<int>(type: "int", nullable: false),
                    UsageScope = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PlannedBorrowDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PlannedReturnDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActualBorrowDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActualReturnDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ExceptionReason = table.Column<int>(type: "int", nullable: false),
                    ExceptionDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RiskReviewRemark = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BorrowRequests", x => x.BorrowRequestId);
                    table.ForeignKey(
                        name: "FK_BorrowRequests_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BorrowRequests_Seals_SealId",
                        column: x => x.SealId,
                        principalTable: "Seals",
                        principalColumn: "SealId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BorrowRequests_Users_ApplicantId",
                        column: x => x.ApplicantId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalNodes",
                columns: table => new
                {
                    ApprovalNodeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BorrowRequestId = table.Column<int>(type: "int", nullable: false),
                    NodeType = table.Column<int>(type: "int", nullable: false),
                    OperatorId = table.Column<int>(type: "int", nullable: true),
                    Result = table.Column<int>(type: "int", nullable: false),
                    Remark = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalNodes", x => x.ApprovalNodeId);
                    table.ForeignKey(
                        name: "FK_ApprovalNodes_BorrowRequests_BorrowRequestId",
                        column: x => x.BorrowRequestId,
                        principalTable: "BorrowRequests",
                        principalColumn: "BorrowRequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApprovalNodes_Users_OperatorId",
                        column: x => x.OperatorId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "DepartmentId", "DepartmentName", "Description" },
                values: new object[,]
                {
                    { 1, "综合管理部", "行政办公综合管理" },
                    { 2, "法务部", "合同审核与法律事务" },
                    { 3, "风控部", "风险控制与合规审查" },
                    { 4, "市场部", "市场拓展与销售" },
                    { 5, "财务部", "财务管理与核算" },
                    { 6, "技术部", "技术研发与产品" }
                });

            migrationBuilder.InsertData(
                table: "Seals",
                columns: new[] { "SealId", "CreatedAt", "DepartmentId", "Description", "SealCode", "SealName", "SealType", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, "公司法人公章", "SEAL-001", "公司公章", 1, 1, null },
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, "用于合同签署", "SEAL-002", "合同专用章", 2, 1, null },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 5, "用于财务票据", "SEAL-003", "财务专用章", 3, 1, null },
                    { 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, "法定代表人签章", "SEAL-004", "法人名章", 4, 1, null },
                    { 5, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 5, "用于发票盖章", "SEAL-005", "发票专用章", 5, 1, null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "DepartmentId", "EmployeeId", "Phone", "Role", "UserName" },
                values: new object[,]
                {
                    { 1, 4, "EMP001", "13800000001", 1, "张三" },
                    { 2, 5, "EMP002", "13800000002", 1, "李四" },
                    { 3, 6, "EMP003", "13800000003", 1, "王五" },
                    { 4, 4, "EMP004", "13800000004", 1, "赵六" },
                    { 5, 2, "EMP005", "13800000005", 2, "陈法务" },
                    { 6, 1, "EMP006", "13800000006", 3, "刘行政" },
                    { 7, 3, "EMP007", "13800000007", 4, "孙风控" }
                });

            migrationBuilder.InsertData(
                table: "Contracts",
                columns: new[] { "ContractId", "ApplicantId", "ContractAmount", "ContractCode", "ContractName", "ContractParty", "ContractSummary", "CreatedAt", "ExpireDate", "SignedDate", "Status", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 1, 280000m, "HT-2024-001", "XX科技软件采购合同", "XX科技有限公司", "ERP系统软件采购及实施服务合同", new DateTime(2024, 3, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 3, 14, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 3, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, null },
                    { 2, 2, 960000m, "HT-2024-002", "YY地产办公场地租赁合同", "YY地产集团", "总部办公楼三年期租赁合同", new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2027, 1, 19, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), 4, null },
                    { 3, 3, 450000m, "HT-2024-003", "ZZ物流运输服务合同", "ZZ物流股份有限公司", "年度货物运输服务框架协议", new DateTime(2024, 4, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), null, null, 5, null },
                    { 4, 4, 180000m, "HT-2024-004", "AA咨询管理咨询服务合同", "AA管理咨询公司", "企业管理咨询及流程优化服务", new DateTime(2024, 4, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 11, 30, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 5, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, null },
                    { 5, 1, 120000m, "HT-2024-005", "BB设备办公设备采购合同", "BB办公设备有限公司", "办公电脑及打印设备采购", new DateTime(2024, 6, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 12, 9, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 6, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, null },
                    { 6, 3, 360000m, "HT-2024-006", "CC云服务云平台服务合同", "CC云计算科技有限公司", "年度云服务器及云存储服务", new DateTime(2024, 1, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 1, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 2, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, null }
                });

            migrationBuilder.InsertData(
                table: "BorrowRequests",
                columns: new[] { "BorrowRequestId", "ActualBorrowDate", "ActualReturnDate", "ApplicantId", "ContractId", "CreatedAt", "ExceptionDescription", "ExceptionReason", "PlannedBorrowDate", "PlannedReturnDate", "RequestCode", "RiskReviewRemark", "SealId", "Status", "UpdatedAt", "UsageScope" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 3, 18, 9, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 3, 20, 16, 0, 0, 0, DateTimeKind.Unspecified), 1, 1, new DateTime(2024, 3, 16, 10, 0, 0, 0, DateTimeKind.Unspecified), null, 0, new DateTime(2024, 3, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 3, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "BR-2024-001", null, 2, 7, new DateTime(2024, 3, 21, 9, 0, 0, 0, DateTimeKind.Unspecified), "XX科技软件采购合同第3、5、7、9页签字盖章处盖章，共4处" },
                    { 2, null, null, 3, 3, new DateTime(2024, 4, 8, 14, 0, 0, 0, DateTimeKind.Unspecified), "法务审核发现合同文件缺失，无法确认合同内容，驳回申请", 1, new DateTime(2024, 4, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 4, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), "BR-2024-002", null, 2, 3, new DateTime(2024, 4, 9, 11, 0, 0, 0, DateTimeKind.Unspecified), "ZZ物流运输服务合同盖章" },
                    { 3, new DateTime(2024, 5, 5, 10, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 5, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), 4, 4, new DateTime(2024, 5, 3, 9, 0, 0, 0, DateTimeKind.Unspecified), "实际归还日期2024-05-20，超过计划归还日期2024-05-08共12天", 2, new DateTime(2024, 5, 5, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 5, 8, 0, 0, 0, 0, DateTimeKind.Unspecified), "BR-2024-003", null, 1, 8, new DateTime(2024, 5, 21, 10, 0, 0, 0, DateTimeKind.Unspecified), "AA咨询管理咨询服务合同盖章" },
                    { 4, new DateTime(2024, 6, 12, 9, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 6, 13, 17, 0, 0, 0, DateTimeKind.Unspecified), 1, 5, new DateTime(2024, 6, 10, 11, 0, 0, 0, DateTimeKind.Unspecified), "风控复核发现申请人除合同正本外，还在2份补充协议和1份授权委托书上盖章，超出申请的用印范围", 3, new DateTime(2024, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 6, 14, 0, 0, 0, 0, DateTimeKind.Unspecified), "BR-2024-004", "超出范围盖章文件已报备，需补充审批流程，警告申请人", 1, 8, new DateTime(2024, 6, 14, 15, 0, 0, 0, DateTimeKind.Unspecified), "BB设备办公设备采购合同正文及附件盖章，仅合同正本1份" },
                    { 5, new DateTime(2024, 6, 15, 10, 30, 0, 0, DateTimeKind.Unspecified), null, 3, 6, new DateTime(2024, 6, 13, 14, 0, 0, 0, DateTimeKind.Unspecified), null, 0, new DateTime(2024, 6, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 6, 17, 0, 0, 0, 0, DateTimeKind.Unspecified), "BR-2024-005", null, 3, 5, new DateTime(2024, 6, 15, 11, 0, 0, 0, DateTimeKind.Unspecified), "CC云服务云平台服务合同盖章，共2份正本" },
                    { 6, null, null, 2, 2, new DateTime(2026, 6, 10, 15, 0, 0, 0, DateTimeKind.Local), null, 0, new DateTime(2026, 6, 13, 0, 0, 0, 0, DateTimeKind.Local), new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Local), "BR-2024-006", null, 2, 1, null, "YY地产办公场地租赁合同补充条款盖章" }
                });

            migrationBuilder.InsertData(
                table: "ApprovalNodes",
                columns: new[] { "ApprovalNodeId", "BorrowRequestId", "CreatedAt", "NodeType", "OperatorId", "ProcessedAt", "Remark", "Result" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2024, 3, 16, 10, 0, 0, 0, DateTimeKind.Unspecified), 1, 1, new DateTime(2024, 3, 16, 10, 0, 0, 0, DateTimeKind.Unspecified), "提交印章外借申请", 1 },
                    { 2, 1, new DateTime(2024, 3, 16, 10, 0, 0, 0, DateTimeKind.Unspecified), 2, 5, new DateTime(2024, 3, 17, 9, 0, 0, 0, DateTimeKind.Unspecified), "合同审核通过，条款完整合规", 1 },
                    { 3, 1, new DateTime(2024, 3, 17, 9, 0, 0, 0, DateTimeKind.Unspecified), 3, 6, new DateTime(2024, 3, 18, 9, 30, 0, 0, DateTimeKind.Unspecified), "印章已交接，签收人：张三", 1 },
                    { 4, 1, new DateTime(2024, 3, 20, 16, 0, 0, 0, DateTimeKind.Unspecified), 4, 6, new DateTime(2024, 3, 20, 16, 0, 0, 0, DateTimeKind.Unspecified), "印章完好归还，归还人：张三", 1 },
                    { 5, 1, new DateTime(2024, 3, 20, 16, 0, 0, 0, DateTimeKind.Unspecified), 5, 7, new DateTime(2024, 3, 21, 9, 0, 0, 0, DateTimeKind.Unspecified), "归还核验通过，无异常", 1 },
                    { 6, 2, new DateTime(2024, 4, 8, 14, 0, 0, 0, DateTimeKind.Unspecified), 1, 3, new DateTime(2024, 4, 8, 14, 0, 0, 0, DateTimeKind.Unspecified), "提交印章外借申请", 1 },
                    { 7, 2, new DateTime(2024, 4, 8, 14, 0, 0, 0, DateTimeKind.Unspecified), 2, 5, new DateTime(2024, 4, 9, 11, 0, 0, 0, DateTimeKind.Unspecified), "合同文件缺失，无法审核，请上传完整合同后重新申请", 2 },
                    { 8, 3, new DateTime(2024, 5, 3, 9, 0, 0, 0, DateTimeKind.Unspecified), 1, 4, new DateTime(2024, 5, 3, 9, 0, 0, 0, DateTimeKind.Unspecified), "提交印章外借申请", 1 },
                    { 9, 3, new DateTime(2024, 5, 3, 9, 0, 0, 0, DateTimeKind.Unspecified), 2, 5, new DateTime(2024, 5, 4, 10, 0, 0, 0, DateTimeKind.Unspecified), "合同审核通过", 1 },
                    { 10, 3, new DateTime(2024, 5, 4, 10, 0, 0, 0, DateTimeKind.Unspecified), 3, 6, new DateTime(2024, 5, 5, 10, 0, 0, 0, DateTimeKind.Unspecified), "印章已交接，签收人：赵六", 1 },
                    { 11, 3, new DateTime(2024, 5, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), 4, 6, new DateTime(2024, 5, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), "印章归还，已超期12天", 1 },
                    { 12, 3, new DateTime(2024, 5, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), 5, 7, new DateTime(2024, 5, 21, 10, 0, 0, 0, DateTimeKind.Unspecified), "超期归还已记录，申请人需书面说明原因，已纳入信用档案", 1 },
                    { 13, 4, new DateTime(2024, 6, 10, 11, 0, 0, 0, DateTimeKind.Unspecified), 1, 1, new DateTime(2024, 6, 10, 11, 0, 0, 0, DateTimeKind.Unspecified), "提交印章外借申请", 1 },
                    { 14, 4, new DateTime(2024, 6, 10, 11, 0, 0, 0, DateTimeKind.Unspecified), 2, 5, new DateTime(2024, 6, 11, 9, 0, 0, 0, DateTimeKind.Unspecified), "合同审核通过", 1 },
                    { 15, 4, new DateTime(2024, 6, 11, 9, 0, 0, 0, DateTimeKind.Unspecified), 3, 6, new DateTime(2024, 6, 12, 9, 0, 0, 0, DateTimeKind.Unspecified), "印章已交接，签收人：张三", 1 },
                    { 16, 4, new DateTime(2024, 6, 13, 17, 0, 0, 0, DateTimeKind.Unspecified), 4, 6, new DateTime(2024, 6, 13, 17, 0, 0, 0, DateTimeKind.Unspecified), "印章归还，归还人报告盖章文件：合同正本1份、补充协议2份、授权委托书1份", 1 },
                    { 17, 4, new DateTime(2024, 6, 13, 17, 0, 0, 0, DateTimeKind.Unspecified), 5, 7, new DateTime(2024, 6, 14, 15, 0, 0, 0, DateTimeKind.Unspecified), "复核发现用印范围不符：申请为合同正本1份，实际加盖补充协议2份和授权委托书1份。已要求补充审批并通报批评。", 1 },
                    { 18, 5, new DateTime(2024, 6, 13, 14, 0, 0, 0, DateTimeKind.Unspecified), 1, 3, new DateTime(2024, 6, 13, 14, 0, 0, 0, DateTimeKind.Unspecified), "提交印章外借申请", 1 },
                    { 19, 5, new DateTime(2024, 6, 13, 14, 0, 0, 0, DateTimeKind.Unspecified), 2, 5, new DateTime(2024, 6, 14, 9, 0, 0, 0, DateTimeKind.Unspecified), "合同审核通过", 1 },
                    { 20, 5, new DateTime(2024, 6, 14, 9, 0, 0, 0, DateTimeKind.Unspecified), 3, 6, new DateTime(2024, 6, 15, 10, 30, 0, 0, DateTimeKind.Unspecified), "财务专用章已交接，签收人：王五", 1 },
                    { 21, 6, new DateTime(2026, 6, 10, 15, 0, 0, 0, DateTimeKind.Local), 1, 2, new DateTime(2026, 6, 10, 15, 0, 0, 0, DateTimeKind.Local), "提交印章外借申请", 1 },
                    { 22, 6, new DateTime(2026, 6, 10, 15, 0, 0, 0, DateTimeKind.Local), 2, null, null, null, 0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalNodes_BorrowRequestId",
                table: "ApprovalNodes",
                column: "BorrowRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalNodes_OperatorId",
                table: "ApprovalNodes",
                column: "OperatorId");

            migrationBuilder.CreateIndex(
                name: "IX_BorrowRequests_ApplicantId",
                table: "BorrowRequests",
                column: "ApplicantId");

            migrationBuilder.CreateIndex(
                name: "IX_BorrowRequests_ContractId",
                table: "BorrowRequests",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_BorrowRequests_SealId",
                table: "BorrowRequests",
                column: "SealId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ApplicantId",
                table: "Contracts",
                column: "ApplicantId");

            migrationBuilder.CreateIndex(
                name: "IX_Seals_DepartmentId",
                table: "Seals",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentId",
                table: "Users",
                column: "DepartmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApprovalNodes");

            migrationBuilder.DropTable(
                name: "BorrowRequests");

            migrationBuilder.DropTable(
                name: "Contracts");

            migrationBuilder.DropTable(
                name: "Seals");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Departments");
        }
    }
}
