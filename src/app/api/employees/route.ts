import { NextResponse } from 'next/server'
import pool from '@/lib/pg'

export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM "Employee" ORDER BY "createdAt" DESC')
    return NextResponse.json(result.rows)
  } finally {
    client.release()
  }
}