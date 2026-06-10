import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT
        a.*,
        e.name as "employeeName",
        e."employeeId" as "employeeCode",
        s.name as "softwareName",
        s.vendor as "softwareVendor",
        d.name as "departmentName"
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
    const result = await client.query(`
      INSERT INTO "Application" ("id", "employeeId", "softwareId", "departmentId", "reason", "requestedSeats", "useScope", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
      RETURNING *
    `, [body.id, body.employeeId, body.softwareId, body.departmentId, body.reason, body.requestedSeats, body.useScope])
    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}