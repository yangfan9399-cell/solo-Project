import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const sections = await db.pipeSection.findMany()
  return NextResponse.json(sections)
}