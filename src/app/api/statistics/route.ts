import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const byAlertType = await client.query(`
      SELECT type, COUNT(*) as "id"
      FROM "Alert"
      GROUP BY type
    `)

    const softwareStats = await client.query(`
      SELECT s.id, s.name, s."totalSeats", s."usedSeats"
      FROM "Software" s
    `)

    const departments = await client.query(`
      SELECT d.id, d.name
      FROM "Department" d
    `)

    const departmentStats = await Promise.all(
      departments.rows.map(async (dept) => {
        const employees = await client.query(`
          SELECT id, name, "employeeId"
          FROM "Employee"
          WHERE "departmentId" = $1 AND status = 'ACTIVE'
        `, [dept.id])
        
        const applications = await client.query(`
          SELECT id, status
          FROM "Application"
          WHERE "departmentId" = $1
        `, [dept.id])

        return {
          id: dept.id,
          name: dept.name,
          employees: employees.rows,
          applications: applications.rows,
        }
      })
    )

    const alerts = await client.query(`
      SELECT type, COUNT(*) as "id"
      FROM "Alert"
      GROUP BY type
    `)

    const licenseStats = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as "activeAssignments",
        COUNT(*) FILTER (WHERE status = 'RECALLED') as "recalledAssignments",
        COUNT(*) as "totalAssignments"
      FROM "LicenseAssignment"
    `)

    return NextResponse.json({
      byAlertType: alerts.rows.map(row => ({ type: row.type, _count: { id: row.id } })),
      softwareStats: softwareStats.rows,
      departmentStats,
      licenseStats: licenseStats.rows[0],
    })
  } finally {
    client.release()
  }
}