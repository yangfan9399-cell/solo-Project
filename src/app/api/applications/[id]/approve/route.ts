import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { approverId, role, status, comment } = await request.json()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const appResult = await client.query('SELECT * FROM "Application" WHERE id = $1', [id])
    if (appResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: '申请不存在' }, { status: 404 })
    }
    const application = appResult.rows[0]

    if (role === 'DEPARTMENT_HEAD') {
      await client.query(`
        INSERT INTO "Approval" ("id", "applicationId", "approverId", "role", "status", "comment", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [`apr_${Date.now()}`, id, approverId, role, status, comment])

      const newStatus = status === 'APPROVED' ? 'DEPARTMENT_APPROVED' : 'REJECTED'
      await client.query('UPDATE "Application" SET status = $1, "updatedAt" = NOW() WHERE id = $2', [newStatus, id])

      await client.query('COMMIT')
      
      const emp = await client.query('SELECT id, name, "employeeId" FROM "Employee" WHERE id = $1', [application.employeeId])
      const sw = await client.query('SELECT id, name, vendor FROM "Software" WHERE id = $1', [application.softwareId])
      const dept = await client.query('SELECT id, name, code FROM "Department" WHERE id = $1', [application.departmentId])
      
      return NextResponse.json({
        ...application,
        status: newStatus,
        employee: emp.rows[0] || null,
        software: sw.rows[0] || null,
        department: dept.rows[0] || null,
      })
    } else if (role === 'IT_ADMIN') {
      if (application.status !== 'DEPARTMENT_APPROVED') {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: '需先经部门负责人审批' }, { status: 400 })
      }

      const software = await client.query('SELECT * FROM "Software" WHERE id = $1', [application.softwareId])
      const sw = software.rows[0]

      if (!sw || sw.usedSeats >= sw.totalSeats) {
        const recallCandidates = await client.query(`
          SELECT la.*, 
            json_build_object('id', e.id, 'name', e.name, 'employeeId', e."employeeId") as "employee"
          FROM "LicenseAssignment" la
          LEFT JOIN "Employee" e ON la."employeeId" = e.id
          WHERE la."licenseId" IN (SELECT id FROM "License" WHERE "softwareId" = $1)
          AND la.status = 'ACTIVE'
          ORDER BY la."assignedAt" ASC
        `, [application.softwareId])

        await client.query('ROLLBACK')
        return NextResponse.json({
          error: '许可证不足',
          recallCandidates: recallCandidates.rows,
        }, { status: 400 })
      }

      await client.query(`
        INSERT INTO "Approval" ("id", "applicationId", "approverId", "role", "status", "comment", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [`apr_${Date.now()}`, id, approverId, role, status, comment])

      if (status === 'APPROVED') {
        const license = await client.query('SELECT * FROM "License" WHERE "softwareId" = $1 AND status = $2 LIMIT 1', [application.softwareId, 'ACTIVE'])
        const lic = license.rows[0]

        if (lic) {
          await client.query(`
            INSERT INTO "LicenseAssignment" ("id", "licenseId", "employeeId", "applicationId", "assignedAt", "expiresAt", "status", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), $5, 'ACTIVE', NOW(), NOW())
          `, [`ass_${Date.now()}`, lic.id, application.employeeId, id, lic.endDate])

          await client.query('UPDATE "Software" SET "usedSeats" = "usedSeats" + 1 WHERE id = $1', [application.softwareId])
          await client.query('UPDATE "Application" SET status = $1, "updatedAt" = NOW() WHERE id = $2', ['ASSIGNED', id])
        }
      } else {
        await client.query('UPDATE "Application" SET status = $1, "updatedAt" = NOW() WHERE id = $2', ['REJECTED', id])
      }

      await client.query('COMMIT')
      
      const emp = await client.query('SELECT id, name, "employeeId" FROM "Employee" WHERE id = $1', [application.employeeId])
      const swRes = await client.query('SELECT id, name, vendor FROM "Software" WHERE id = $1', [application.softwareId])
      const dept = await client.query('SELECT id, name, code FROM "Department" WHERE id = $1', [application.departmentId])
      
      return NextResponse.json({
        ...application,
        status: status === 'APPROVED' ? 'ASSIGNED' : 'REJECTED',
        employee: emp.rows[0] || null,
        software: swRes.rows[0] || null,
        department: dept.rows[0] || null,
      })
    }

    await client.query('COMMIT')
    return NextResponse.json(application)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}