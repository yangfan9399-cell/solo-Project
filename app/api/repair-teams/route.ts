import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const teams = await db.repairTeam.findMany()
  return NextResponse.json(teams)
}