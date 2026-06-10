import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const byDepartment = await client.query(`
      SELECT d.name, COUNT(a.id) as count
      FROM "Application" a
      JOIN "Department" d ON a."departmentId" = d.id
      GROUP BY d.id, d.name
    `)

    const bySoftware = await client.query(`
      SELECT s.name, COUNT(la.id) as usage
      FROM "Software" s
      LEFT JOIN "License" l ON l."softwareId" = s.id
      LEFT JOIN "LicenseAssignment" la ON la."licenseId" = l.id AND la.status = 'ACTIVE'
      GROUP BY s.id, s.name
    `)

    const byAlertType = await client.query(`
      SELECT type, COUNT(*) as count
      FROM "Alert"
      GROUP BY type
    `)

    const softwareStats = await client.query(`
      SELECT s.name, s."totalSeats", s."usedSeats",
        ROUND((s."usedSeats"::numeric / NULLIF(s."totalSeats", 0)) * 100, 2) as "usagePercent"
      FROM "Software" s
    `)

    const departmentStats = await client.query(`
      SELECT d.name,
        (SELECT COUNT(*) FROM "Employee" e WHERE e."departmentId" = d.id AND e.status = 'ACTIVE') as "activeEmployees",
        (SELECT COUNT(*) FROM "Application" a WHERE a."departmentId" = d.id) as "totalApplications"
      FROM "Department" d
    `)

    const licenseStats = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as "activeAssignments",
        COUNT(*) FILTER (WHERE status = 'RECALLED') as "recalledAssignments",
        COUNT(*) as "totalAssignments"
      FROM "LicenseAssignment"
    `)

    return NextResponse.json({
      byDepartment: byDepartment.rows,
      bySoftware: bySoftware.rows,
      byAlertType: byAlertType.rows,
      softwareStats: softwareStats.rows,
      departmentStats: departmentStats.rows,
      licenseStats: licenseStats.rows[0],
    })
  } finally {
    client.release()
  }
}