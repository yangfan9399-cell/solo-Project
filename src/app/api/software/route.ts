import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const software = await prisma.software.findMany({
    include: {
      licenses: true,
      applications: true,
    },
  })
  return NextResponse.json(software)
}