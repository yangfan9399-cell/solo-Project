import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.alert.deleteMany()
    await prisma.licenseAssignment.deleteMany()
    await prisma.approval.deleteMany()
    await prisma.application.deleteMany()
    await prisma.license.deleteMany()
    await prisma.software.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.department.deleteMany()

    const rdDept = await prisma.department.create({ data: { name: '研发部', code: 'RD' } })
    const mkDept = await prisma.department.create({ data: { name: '市场部', code: 'MK' } })
    const fnDept = await prisma.department.create({ data: { name: '财务部', code: 'FN' } })
    const hrDept = await prisma.department.create({ data: { name: '人力资源部', code: 'HR' } })

    const emp1 = await prisma.employee.create({ data: { name: '张三', email: 'zhangsan@company.com', employeeId: 'EMP001', departmentId: rdDept.id, role: 'EMPLOYEE' } })
    const emp2 = await prisma.employee.create({ data: { name: '李四', email: 'lisi@company.com', employeeId: 'EMP002', departmentId: rdDept.id, role: 'DEPARTMENT_HEAD' } })
    const emp3 = await prisma.employee.create({ data: { name: '王五', email: 'wangwu@company.com', employeeId: 'EMP003', departmentId: mkDept.id, role: 'EMPLOYEE' } })
    const emp4 = await prisma.employee.create({ data: { name: '赵六', email: 'zhaoliu@company.com', employeeId: 'EMP004', departmentId: mkDept.id, role: 'DEPARTMENT_HEAD' } })
    const emp5 = await prisma.employee.create({ data: { name: '钱七', email: 'qianqi@company.com', employeeId: 'EMP005', departmentId: fnDept.id, role: 'EMPLOYEE' } })
    const emp6 = await prisma.employee.create({ data: { name: '孙八', email: 'sunba@company.com', employeeId: 'EMP006', departmentId: hrDept.id, role: 'IT_ADMIN' } })
    const emp7 = await prisma.employee.create({ data: { name: '周九', email: 'zhoujiu@company.com', employeeId: 'EMP007', departmentId: fnDept.id, role: 'AUDITOR' } })
    const emp8 = await prisma.employee.create({ data: { name: '吴十', email: 'wushi@company.com', employeeId: 'EMP008', departmentId: rdDept.id, role: 'EMPLOYEE', status: 'RESIGNED' } })

    const sw1 = await prisma.software.create({ data: { name: 'JetBrains IntelliJ', vendor: 'JetBrains', description: 'IDE开发工具', totalSeats: 10, usedSeats: 9 } })
    const sw2 = await prisma.software.create({ data: { name: 'Adobe Photoshop', vendor: 'Adobe', description: '图像编辑软件', totalSeats: 5, usedSeats: 5 } })
    const sw3 = await prisma.software.create({ data: { name: 'Microsoft Office', vendor: 'Microsoft', description: '办公软件套装', totalSeats: 50, usedSeats: 48 } })
    const sw4 = await prisma.software.create({ data: { name: 'Visual Studio Code', vendor: 'Microsoft', description: '轻量级代码编辑器', totalSeats: 100, usedSeats: 85 } })

    const lic1 = await prisma.license.create({ data: { softwareId: sw1.id, licenseKey: 'JB-INT-001', seatCount: 5, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') } })
    const lic2 = await prisma.license.create({ data: { softwareId: sw1.id, licenseKey: 'JB-INT-002', seatCount: 5, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') } })
    const lic3 = await prisma.license.create({ data: { softwareId: sw2.id, licenseKey: 'ADB-PS-001', seatCount: 5, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') } })
    const lic4 = await prisma.license.create({ data: { softwareId: sw3.id, licenseKey: 'MS-OFF-001', seatCount: 50, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') } })
    const lic5 = await prisma.license.create({ data: { softwareId: sw4.id, licenseKey: 'MS-VSC-001', seatCount: 100, startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31') } })

    const app1 = await prisma.application.create({ data: { employeeId: emp1.id, softwareId: sw1.id, departmentId: rdDept.id, reason: '开发需求', requestedSeats: 1, useScope: '开发工作', status: 'ASSIGNED' } })
    const app2 = await prisma.application.create({ data: { employeeId: emp3.id, softwareId: sw2.id, departmentId: mkDept.id, reason: '设计需求', requestedSeats: 1, useScope: '市场宣传设计', status: 'ASSIGNED' } })
    const app3 = await prisma.application.create({ data: { employeeId: emp5.id, softwareId: sw3.id, departmentId: fnDept.id, reason: '报表制作', requestedSeats: 1, useScope: '财务报表', status: 'ASSIGNED' } })
    const app4 = await prisma.application.create({ data: { employeeId: emp8.id, softwareId: sw1.id, departmentId: rdDept.id, reason: '开发需求', requestedSeats: 1, useScope: '开发工作', status: 'ASSIGNED' } })
    const app5 = await prisma.application.create({ data: { employeeId: emp1.id, softwareId: sw2.id, departmentId: rdDept.id, reason: 'UI设计', requestedSeats: 1, useScope: '前端开发', status: 'PENDING' } })
    const app6 = await prisma.application.create({ data: { employeeId: emp1.id, softwareId: sw1.id, departmentId: rdDept.id, reason: '开发需求', requestedSeats: 1, useScope: '仅限个人开发', status: 'ASSIGNED' } })

    await prisma.approval.create({ data: { applicationId: app1.id, approverId: emp2.id, role: 'DEPARTMENT_HEAD', status: 'APPROVED', comment: '同意申请' } })
    await prisma.approval.create({ data: { applicationId: app1.id, approverId: emp6.id, role: 'IT_ADMIN', status: 'APPROVED', comment: '已分配许可证' } })
    await prisma.approval.create({ data: { applicationId: app2.id, approverId: emp4.id, role: 'DEPARTMENT_HEAD', status: 'APPROVED', comment: '同意申请' } })
    await prisma.approval.create({ data: { applicationId: app2.id, approverId: emp6.id, role: 'IT_ADMIN', status: 'APPROVED', comment: '已分配许可证' } })
    await prisma.approval.create({ data: { applicationId: app3.id, approverId: emp7.id, role: 'DEPARTMENT_HEAD', status: 'APPROVED', comment: '同意申请' } })
    await prisma.approval.create({ data: { applicationId: app3.id, approverId: emp6.id, role: 'IT_ADMIN', status: 'APPROVED', comment: '已分配许可证' } })
    await prisma.approval.create({ data: { applicationId: app4.id, approverId: emp2.id, role: 'DEPARTMENT_HEAD', status: 'APPROVED', comment: '同意申请' } })
    await prisma.approval.create({ data: { applicationId: app4.id, approverId: emp6.id, role: 'IT_ADMIN', status: 'APPROVED', comment: '已分配许可证' } })
    await prisma.approval.create({ data: { applicationId: app6.id, approverId: emp2.id, role: 'DEPARTMENT_HEAD', status: 'APPROVED', comment: '同意申请' } })
    await prisma.approval.create({ data: { applicationId: app6.id, approverId: emp6.id, role: 'IT_ADMIN', status: 'APPROVED', comment: '已分配许可证' } })

    await prisma.licenseAssignment.create({ data: { licenseId: lic1.id, employeeId: emp1.id, applicationId: app1.id, expiresAt: new Date('2025-12-31') } })
    await prisma.licenseAssignment.create({ data: { licenseId: lic3.id, employeeId: emp3.id, applicationId: app2.id, expiresAt: new Date('2025-12-31') } })
    await prisma.licenseAssignment.create({ data: { licenseId: lic4.id, employeeId: emp5.id, applicationId: app3.id, expiresAt: new Date('2025-12-31') } })
    await prisma.licenseAssignment.create({ data: { licenseId: lic2.id, employeeId: emp8.id, applicationId: app4.id, status: 'ACTIVE' } })
    await prisma.licenseAssignment.create({ data: { licenseId: lic1.id, employeeId: emp1.id, applicationId: app6.id, expiresAt: new Date('2025-12-31') } })

    await prisma.alert.create({ data: { type: 'LICENSE_SHORTAGE', message: 'Adobe Photoshop 许可证已用尽', severity: 'CRITICAL', relatedId: sw2.id, relatedType: 'SOFTWARE' } })
    await prisma.alert.create({ data: { type: 'UNRETURNED_LICENSE', message: '员工吴十(EMP008)已离职但许可证未回收', severity: 'WARNING', relatedId: emp8.id, relatedType: 'EMPLOYEE' } })
    await prisma.alert.create({ data: { type: 'SCOPE_VIOLATION', message: '张三使用IntelliJ超出授权范围', severity: 'WARNING', relatedId: emp1.id, relatedType: 'EMPLOYEE' } })
    await prisma.alert.create({ data: { type: 'EXPIRING_SOON', message: 'Microsoft Office 许可证即将到期', severity: 'INFO', relatedId: lic4.id, relatedType: 'LICENSE' } })

    return NextResponse.json({ success: true, message: '种子数据已创建' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}