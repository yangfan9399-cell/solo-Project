DELETE FROM "Alert";
DELETE FROM "LicenseAssignment";
DELETE FROM "Approval";
DELETE FROM "Application";
DELETE FROM "License";
DELETE FROM "Software";
DELETE FROM "Employee";
DELETE FROM "Department";

INSERT INTO "Department" ("id", "name", "code", "createdAt", "updatedAt") VALUES
('dept_rd', '研发部', 'RD', NOW(), NOW()),
('dept_mk', '市场部', 'MK', NOW(), NOW()),
('dept_fn', '财务部', 'FN', NOW(), NOW()),
('dept_hr', '人力资源部', 'HR', NOW(), NOW());

INSERT INTO "Employee" ("id", "name", "email", "employeeId", "departmentId", "role", "status", "createdAt", "updatedAt") VALUES
('emp_001', '张三', 'zhangsan@company.com', 'EMP001', 'dept_rd', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
('emp_002', '李四', 'lisi@company.com', 'EMP002', 'dept_rd', 'DEPARTMENT_HEAD', 'ACTIVE', NOW(), NOW()),
('emp_003', '王五', 'wangwu@company.com', 'EMP003', 'dept_mk', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
('emp_004', '赵六', 'zhaoliu@company.com', 'EMP004', 'dept_mk', 'DEPARTMENT_HEAD', 'ACTIVE', NOW(), NOW()),
('emp_005', '钱七', 'qianqi@company.com', 'EMP005', 'dept_fn', 'EMPLOYEE', 'ACTIVE', NOW(), NOW()),
('emp_006', '孙八', 'sunba@company.com', 'EMP006', 'dept_hr', 'IT_ADMIN', 'ACTIVE', NOW(), NOW()),
('emp_007', '周九', 'zhoujiu@company.com', 'EMP007', 'dept_fn', 'AUDITOR', 'ACTIVE', NOW(), NOW()),
('emp_008', '吴十', 'wushi@company.com', 'EMP008', 'dept_rd', 'EMPLOYEE', 'RESIGNED', NOW(), NOW());

INSERT INTO "Software" ("id", "name", "vendor", "description", "totalSeats", "usedSeats", "createdAt", "updatedAt") VALUES
('sw_001', 'JetBrains IntelliJ', 'JetBrains', 'IDE开发工具', 10, 9, NOW(), NOW()),
('sw_002', 'Adobe Photoshop', 'Adobe', '图像编辑软件', 5, 5, NOW(), NOW()),
('sw_003', 'Microsoft Office', 'Microsoft', '办公软件套装', 50, 48, NOW(), NOW()),
('sw_004', 'Visual Studio Code', 'Microsoft', '轻量级代码编辑器', 100, 85, NOW(), NOW());

INSERT INTO "License" ("id", "softwareId", "licenseKey", "seatCount", "startDate", "endDate", "status", "createdAt", "updatedAt") VALUES
('lic_001', 'sw_001', 'JB-INT-001', 5, '2024-01-01', '2025-12-31', 'ACTIVE', NOW(), NOW()),
('lic_002', 'sw_001', 'JB-INT-002', 5, '2024-01-01', '2025-12-31', 'ACTIVE', NOW(), NOW()),
('lic_003', 'sw_002', 'ADB-PS-001', 5, '2024-01-01', '2025-12-31', 'ACTIVE', NOW(), NOW()),
('lic_004', 'sw_003', 'MS-OFF-001', 50, '2024-01-01', '2025-12-31', 'ACTIVE', NOW(), NOW()),
('lic_005', 'sw_004', 'MS-VSC-001', 100, '2024-01-01', '2025-12-31', 'ACTIVE', NOW(), NOW());

INSERT INTO "Application" ("id", "employeeId", "softwareId", "departmentId", "reason", "requestedSeats", "useScope", "status", "createdAt", "updatedAt") VALUES
('app_001', 'emp_001', 'sw_001', 'dept_rd', '开发需求', 1, '开发工作', 'ASSIGNED', NOW(), NOW()),
('app_002', 'emp_003', 'sw_002', 'dept_mk', '设计需求', 1, '市场宣传设计', 'ASSIGNED', NOW(), NOW()),
('app_003', 'emp_005', 'sw_003', 'dept_fn', '报表制作', 1, '财务报表', 'ASSIGNED', NOW(), NOW()),
('app_004', 'emp_008', 'sw_001', 'dept_rd', '开发需求', 1, '开发工作', 'ASSIGNED', NOW(), NOW()),
('app_005', 'emp_001', 'sw_002', 'dept_rd', 'UI设计', 1, '前端开发', 'PENDING', NOW(), NOW()),
('app_006', 'emp_001', 'sw_001', 'dept_rd', '开发需求', 1, '仅限个人开发', 'ASSIGNED', NOW(), NOW());

INSERT INTO "Approval" ("id", "applicationId", "approverId", "role", "status", "comment", "createdAt", "updatedAt") VALUES
('apr_001', 'app_001', 'emp_002', 'DEPARTMENT_HEAD', 'APPROVED', '同意申请', NOW(), NOW()),
('apr_002', 'app_001', 'emp_006', 'IT_ADMIN', 'APPROVED', '已分配许可证', NOW(), NOW()),
('apr_003', 'app_002', 'emp_004', 'DEPARTMENT_HEAD', 'APPROVED', '同意申请', NOW(), NOW()),
('apr_004', 'app_002', 'emp_006', 'IT_ADMIN', 'APPROVED', '已分配许可证', NOW(), NOW()),
('apr_005', 'app_003', 'emp_007', 'DEPARTMENT_HEAD', 'APPROVED', '同意申请', NOW(), NOW()),
('apr_006', 'app_003', 'emp_006', 'IT_ADMIN', 'APPROVED', '已分配许可证', NOW(), NOW()),
('apr_007', 'app_004', 'emp_002', 'DEPARTMENT_HEAD', 'APPROVED', '同意申请', NOW(), NOW()),
('apr_008', 'app_004', 'emp_006', 'IT_ADMIN', 'APPROVED', '已分配许可证', NOW(), NOW()),
('apr_009', 'app_006', 'emp_002', 'DEPARTMENT_HEAD', 'APPROVED', '同意申请', NOW(), NOW()),
('apr_010', 'app_006', 'emp_006', 'IT_ADMIN', 'APPROVED', '已分配许可证', NOW(), NOW());

INSERT INTO "LicenseAssignment" ("id", "licenseId", "employeeId", "applicationId", "assignedAt", "expiresAt", "status", "createdAt", "updatedAt") VALUES
('ass_001', 'lic_001', 'emp_001', 'app_001', NOW(), '2025-12-31', 'ACTIVE', NOW(), NOW()),
('ass_002', 'lic_003', 'emp_003', 'app_002', NOW(), '2025-12-31', 'ACTIVE', NOW(), NOW()),
('ass_003', 'lic_004', 'emp_005', 'app_003', NOW(), '2025-12-31', 'ACTIVE', NOW(), NOW()),
('ass_004', 'lic_002', 'emp_008', 'app_004', NOW(), NULL, 'ACTIVE', NOW(), NOW()),
('ass_005', 'lic_001', 'emp_001', 'app_006', NOW(), '2025-12-31', 'ACTIVE', NOW(), NOW());

INSERT INTO "Alert" ("id", "type", "message", "severity", "relatedId", "relatedType", "resolved", "createdAt", "updatedAt") VALUES
('alert_001', 'LICENSE_SHORTAGE', 'Adobe Photoshop 许可证已用尽', 'CRITICAL', 'sw_002', 'SOFTWARE', false, NOW(), NOW()),
('alert_002', 'UNRETURNED_LICENSE', '员工吴十(EMP008)已离职但许可证未回收', 'WARNING', 'emp_008', 'EMPLOYEE', false, NOW(), NOW()),
('alert_003', 'SCOPE_VIOLATION', '张三使用IntelliJ超出授权范围', 'WARNING', 'emp_001', 'EMPLOYEE', false, NOW(), NOW()),
('alert_004', 'EXPIRING_SOON', 'Microsoft Office 许可证即将到期', 'INFO', 'lic_004', 'LICENSE', false, NOW(), NOW());