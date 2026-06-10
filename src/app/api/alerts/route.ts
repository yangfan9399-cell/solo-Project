import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM "Alert" ORDER BY "createdAt" DESC')
    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}

export async function PUT(request: Request) {
  const { id, resolved } = await request.json()
  const client = await pool.connect()
  try {
    await client.query('UPDATE "Alert" SET resolved = $1, "updatedAt" = NOW() WHERE id = $2', [resolved, id])
    return NextResponse.json({ success: true })
  } finally {
    client.release()
  }
}