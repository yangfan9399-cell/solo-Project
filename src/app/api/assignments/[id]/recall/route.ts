import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const assignment = await client.query('SELECT * FROM "LicenseAssignment" WHERE id = $1', [id])
    if (assignment.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: '分配记录不存在' }, { status: 404 })
    }
    const ass = assignment.rows[0]

    await client.query('UPDATE "LicenseAssignment" SET status = $1 WHERE id = $2', ['RECALLED', id])

    const license = await client.query('SELECT * FROM "License" WHERE id = $1', [ass.licenseId])
    if (license.rows.length > 0) {
      await client.query('UPDATE "Software" SET "usedSeats" = "usedSeats" - 1 WHERE id = $1', [license.rows[0].softwareId])
    }

    if (ass.applicationId) {
      await client.query('UPDATE "Application" SET status = $1, "updatedAt" = NOW() WHERE id = $2', ['RECALLED', ass.applicationId])
    }

    await client.query('COMMIT')
    return NextResponse.json({ success: true })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}