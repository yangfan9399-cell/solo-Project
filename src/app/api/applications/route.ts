import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT
        a.*,
        json_build_object('id', e.id, 'name', e.name, 'employeeId', e."employeeId") as "employee",
        json_build_object('id', s.id, 'name', s.name, 'vendor', s.vendor) as "software",
        json_build_object('id', d.id, 'name', d.name, 'code', d.code) as "department"
      FROM "Application" a
      LEFT JOIN "Employee" e ON a."employeeId" = e.id
      LEFT JOIN "Software" s ON a."softwareId" = s.id
      LEFT JOIN "Department" d ON a."departmentId" = d.id
      ORDER BY a."createdAt" DESC
    `)
    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const client = await pool.connect()
  try {
    const appId = `app_${Date.now()}`
    const result = await client.query(`
      INSERT INTO "Application" ("id", "employeeId", "softwareId", "departmentId", "reason", "requestedSeats", "useScope", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())
      RETURNING *
    `, [appId, body.employeeId, body.softwareId, body.departmentId, body.reason, body.requestedSeats, body.useScope])
    
    const inserted = result.rows[0]
    
    const employee = await client.query('SELECT id, name, "employeeId" FROM "Employee" WHERE id = $1', [body.employeeId])
    const software = await client.query('SELECT id, name, vendor FROM "Software" WHERE id = $1', [body.softwareId])
    const department = await client.query('SELECT id, name, code FROM "Department" WHERE id = $1', [body.departmentId])
    
    return NextResponse.json({
      ...inserted,
      employee: employee.rows[0] || null,
      software: software.rows[0] || null,
      department: department.rows[0] || null,
    })
  } finally {
    client.release()
  }
}