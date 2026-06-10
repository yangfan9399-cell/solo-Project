import { NextResponse } from 'next/server'
import { prisma, initializeDatabase } from '@/lib/db'

export async function GET(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const { id } = paramContext.params
  const order = await prisma.workOrder.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PUT(request: Request, paramContext: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await initializeDatabase()
  const body = await request.json()
  const { id } = paramContext.params
  const order = await prisma.workOrder.update({
    where: { id },
    data: body,
  })
  if (!order) return NextResponse.json({ error: '工单不存在' }, { status: 404 })
  return NextResponse.json(order)
}
