import prisma from '~/server/utils/prisma'
import type { RecordStatus, SampleType } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as RecordStatus | undefined
  const sampleType = query.sampleType as SampleType | undefined
  const stationId = query.stationId as string | undefined
  const isArchived = query.isArchived as string | undefined
  const keyword = query.keyword as string | undefined

  const where: any = {}

  if (status) where.status = status
  if (sampleType) where.sampleType = sampleType
  if (stationId) where.stationId = stationId
  if (isArchived !== undefined) where.isArchived = isArchived === 'true'
  if (keyword) {
    where.OR = [
      { recordNo: { contains: keyword } },
      { title: { contains: keyword } },
      { keyObject: { contains: keyword } }
    ]
  }

  const records = await prisma.alarmRecord.findMany({
    where,
    include: {
      station: true,
      currentHandler: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  const handlerMap: Record<string, string> = {}
  const users = await prisma.user.findMany()
  users.forEach((u: { id: string; name: string }) => { handlerMap[u.id] = u.name })

  const result = records.map((record: any) => ({
    id: record.id,
    recordNo: record.recordNo,
    title: record.title,
    status: record.status,
    source: record.source,
    stationName: record.station.name,
    currentHandlerId: record.currentHandlerId,
    keyObject: record.keyObject,
    currentHandlerName: handlerMap[record.currentHandlerId] || '未知',
    occurrenceTime: record.occurrenceTime.toISOString(),
    amount: record.amount.toString(),
    evidenceConclusion: record.evidenceConclusion,
    sampleType: record.sampleType,
    isArchived: record.isArchived,
    updatedAt: record.updatedAt.toISOString()
  }))

  return { success: true, data: result }
})
