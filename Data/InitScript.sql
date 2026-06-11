-- ============================================================
-- 企业合同印章外借审批与归还核验系统 - 数据库初始化脚本
-- SQL Server 版本
-- ============================================================

-- 注：数据库由 EF Core Migrations 自动创建
-- 本文件供参考和手动部署使用

-- 创建数据库（如需要）
-- CREATE DATABASE [SealManagementDB]
-- GO

-- 部门表
PRINT 'Department data:'
SELECT * FROM Departments
GO

-- 用户表
PRINT 'User data:'
SELECT * FROM Users
GO

-- 印章表
PRINT 'Seal data:'
SELECT * FROM Seals
GO

-- 合同表
PRINT 'Contract data:'
SELECT * FROM Contracts
GO

-- 借用申请表
PRINT 'BorrowRequest data:'
SELECT * FROM BorrowRequests
GO

-- 审批节点表
PRINT 'ApprovalNode data:'
SELECT * FROM ApprovalNodes
GO

-- 异常统计
PRINT 'Exception statistics:'
SELECT 
    ExceptionReason,
    COUNT(*) as Count
FROM BorrowRequests
WHERE ExceptionReason != 0
GROUP BY ExceptionReason
GO
