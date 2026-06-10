import { NextResponse } from 'next/server'
import { db, initSampleData } from '@/lib/db'

let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await initSampleData()
    initialized = true
  }
}

export async function GET() {
  await ensureInitialized()
  const teams = await db.repairTeam.findMany()
  return NextResponse.json(teams)
}