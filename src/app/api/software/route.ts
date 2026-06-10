import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM "LicenseAssignment" la
         JOIN "License" l ON la."licenseId" = l.id
         WHERE l."softwareId" = s.id AND la.status = 'ACTIVE') as "activeAssignments"
      FROM "Software" s
      ORDER BY s."createdAt" DESC
    `)
    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}