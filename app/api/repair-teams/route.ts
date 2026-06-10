import { NextResponse } from 'next/server'
import { prisma, initializeDatabase } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const teams = await prisma.repairTeam.findMany()
  return NextResponse.json(teams)
}
