import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT
        a.*,
        json_build_object('id', e.id, 'name', e.name, 'employeeId', e."employeeId", 'email', e.email) as "employee",
        json_build_object('id', s.id, 'name', s.name, 'vendor', s.vendor, 'description', s.description) as "software",
        json_build_object('id', d.id, 'name', d.name, 'code', d.code) as "department"
      FROM "Application" a
      LEFT JOIN "Employee" e ON a."employeeId" = e.id
      LEFT JOIN "Software" s ON a."softwareId" = s.id
      LEFT JOIN "Department" d ON a."departmentId" = d.id
      WHERE a.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: '申请不存在' }, { status: 404 })
    }

    const approvals = await client.query(`
      SELECT 
        ap.*, 
        json_build_object('id', e.id, 'name', e.name, 'employeeId', e."employeeId") as "approver"
      FROM "Approval" ap
      LEFT JOIN "Employee" e ON ap."approverId" = e.id
      WHERE ap."applicationId" = $1
      ORDER BY ap."createdAt" ASC
    `, [id])

    const assignment = await client.query(`
      SELECT la.*, json_build_object('id', l.id, 'licenseKey', l."licenseKey") as "license"
      FROM "LicenseAssignment" la
      LEFT JOIN "License" l ON la."licenseId" = l.id
      WHERE la."applicationId" = $1
    `, [id])

    return NextResponse.json({
      ...result.rows[0],
      approvals: approvals.rows,
      assignment: assignment.rows[0] || null,
    })
  } finally {
    client.release()
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const client = await pool.connect()
  try {
    const result = await client.query(`
      UPDATE "Application"
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `, [body.status, id])
    return NextResponse.json(result.rows[0])
  } finally {
    client.release()
  }
}