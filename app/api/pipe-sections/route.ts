import { NextResponse } from 'next/server'
import { prisma, initializeDatabase } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const sections = await prisma.pipeSection.findMany()
  return NextResponse.json(sections)
}
