import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const departments = await prisma.department.createMany({
    data: [
      { name: '研发部', code: 'RD' },
      { name: '市场部', code: 'MK' },
      { name: '财务部', code: 'FN' },
      { name: '人力资源部', code: 'HR' },
    ],
    skipDuplicates: true,
  });

  const employees = await prisma.employee.createMany({
    data: [
      { name: '张三', email: 'zhangsan@company.com', employeeId: 'EMP001', departmentId: 'RD', role: 'EMPLOYEE' },
      { name: '李四', email: 'lisi@company.com', employeeId: 'EMP002', departmentId: 'RD', role: 'DEPARTMENT_HEAD' },
      { name: '王五', email: 'wangwu@company.com', employeeId: 'EMP003', departmentId: 'MK', role: 'EMPLOYEE' },
      { name: '赵六', email: 'zhaoliu@company.com', employeeId: 'EMP004', departmentId: 'MK', role: 'DEPARTMENT_HEAD' },
      { name: '钱七', email: 'qianqi@company.com', employeeId: 'EMP005', departmentId: 'FN', role: 'EMPLOYEE' },
      { name: '孙八', email: 'sunba@company.com', employeeId: 'EMP006', departmentId: 'HR', role: 'IT_ADMIN' },
      { name: '周九', email: 'zhoujiu@company.com', employeeId: 'EMP007', departmentId: 'FN', role: 'AUDITOR' },
      { name: '吴十', email: 'wushi@company.com', employeeId: 'EMP008', departmentId: 'RD', role: 'EMPLOYEE', status: 'RESIGNED' },
    ],
    skipDuplicates: true,
  });

  const softwares = await prisma.software.createMany({
    data: [
      { name: 'JetBrains IntelliJ', vendor: 'JetBrains', description: 'IDE开发工具', totalSeats: 10, usedSeats: 9 },
      { name: 'Adobe Photoshop', vendor: 'Adobe', description: '图像编辑软件', totalSeats: 5, usedSeats: 5 },
      { name: 'Microsoft Office', vendor: 'Microsoft', description: '办公软件套装', totalSeats: 50, usedSeats: 48 },
      { name: 'Visual Studio Code', vendor: 'Microsoft', description: '轻量级代码编辑器', totalSeats: 100, usedSeats: 85 },
    ],
    skipDuplicates: true,
  });

  const licenses = await prisma.license.createMany({
    data: [
      { softwareId: 'JetBrains IntelliJ', licenseKey: 'JB-INT-001', seatCount: 5, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') },
      { softwareId: 'JetBrains IntelliJ', licenseKey: 'JB-INT-002', seatCount: 5, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') },
      { softwareId: 'Adobe Photoshop', licenseKey: 'ADB-PS-001', seatCount: 5, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') },
      { softwareId: 'Microsoft Office', licenseKey: 'MS-OFF-001', seatCount: 50, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') },
      { softwareId: 'Visual Studio Code', licenseKey: 'MS-VSC-001', seatCount: 100, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') },
    ],
    skipDuplicates: true,
  });

  const applications = await prisma.application.createMany({
    data: [
      { employeeId: 'EMP001', softwareId: 'JetBrains IntelliJ', departmentId: 'RD', reason: '开发需求', requestedSeats: 1, useScope: '开发工作', status: 'ASSIGNED' },
      { employeeId: 'EMP003', softwareId: 'Adobe Photoshop', departmentId: 'MK', reason: '设计需求', requestedSeats: 1, useScope: '市场宣传设计', status: 'ASSIGNED' },
      { employeeId: 'EMP005', softwareId: 'Microsoft Office', departmentId: 'FN', reason: '报表制作', requestedSeats: 1, useScope: '财务报表', status: 'ASSIGNED' },
      { employeeId: 'EMP008', softwareId: 'JetBrains IntelliJ', departmentId: 'RD', reason: '开发需求', requestedSeats: 1, useScope: '开发工作', status: 'ASSIGNED' },
      { employeeId: 'EMP001', softwareId: 'Adobe Photoshop', departmentId: 'RD', reason: 'UI设计', requestedSeats: 1, useScope: '前端开发', status: 'PENDING' },
    ],
    skipDuplicates: true,
  });

  const assignments = await prisma.licenseAssignment.createMany({
    data: [
      { licenseId: 'JB-INT-001', employeeId: 'EMP001', applicationId: 'APP001', expiresAt: new Date('2025-12-31') },
      { licenseId: 'ADB-PS-001', employeeId: 'EMP003', applicationId: 'APP002', expiresAt: new Date('2025-12-31') },
      { licenseId: 'MS-OFF-001', employeeId: 'EMP005', applicationId: 'APP003', expiresAt: new Date('2025-12-31') },
      { licenseId: 'JB-INT-002', employeeId: 'EMP008', applicationId: 'APP004', status: 'ACTIVE' },
    ],
    skipDuplicates: true,
  });

  const alerts = await prisma.alert.createMany({
    data: [
      { type: 'LICENSE_SHORTAGE', message: 'Adobe Photoshop 许可证已用尽', severity: 'CRITICAL', relatedId: 'Adobe Photoshop', relatedType: 'SOFTWARE' },
      { type: 'UNRETURNED_LICENSE', message: '员工吴十(EMP008)已离职但许可证未回收', severity: 'WARNING', relatedId: 'EMP008', relatedType: 'EMPLOYEE' },
      { type: 'SCOPE_VIOLATION', message: '张三使用IntelliJ超出授权范围', severity: 'WARNING', relatedId: 'EMP001', relatedType: 'EMPLOYEE' },
      { type: 'EXPIRING_SOON', message: 'Microsoft Office 许可证即将到期', severity: 'INFO', relatedId: 'MS-OFF-001', relatedType: 'LICENSE' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });