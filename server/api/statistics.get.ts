import prisma from '~/server/utils/prisma'
import type { SampleType } from '~/types'

export default defineEventHandler(async () => {
  const [allRecords, countByStatus, countBySampleType, countByStation, amountSum] = await Promise.all([
    prisma.alarmRecord.findMany({ select: { occurrenceTime: true } }),
    prisma.alarmRecord.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.alarmRecord.groupBy({
      by: ['sampleType'],
      _count: { sampleType: true },
      where: { sampleType: { not: null } }
    }),
    prisma.alarmRecord.groupBy({
      by: ['stationId'],
      _count: { stationId: true }
    }),
    prisma.alarmRecord.aggregate({
      _sum: { amount: true }
    })
  ])

  const stations = await prisma.pumpStation.findMany()
  const stationMap: Record<string, string> = {}
  stations.forEach((s: { id: string; name: string }) => { stationMap[s.id] = s.name })

  const statusCounts: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 0,
    REVIEW: 0,
    ARCHIVED: 0,
    REJECTED: 0,
    REOPENED: 0
  }
  countByStatus.forEach((item: { status: string; _count: { status: number } }) => {
    statusCounts[item.status] = item._count.status
  })

  const sampleTypeCounts = countBySampleType.map((item: { sampleType: string | null; _count: { sampleType: number } }) => ({
    type: item.sampleType as SampleType,
    count: item._count.sampleType
  }))

  const stationCounts = countByStation.map((item: { stationId: string; _count: { stationId: number } }) => ({
    stationId: item.stationId,
    stationName: stationMap[item.stationId] || '未知',
    count: item._count.stationId
  }))

  const trendMap: Record<string, number> = {}
  allRecords.forEach((r: { occurrenceTime: Date }) => {
    const date = r.occurrenceTime.toISOString().split('T')[0]
    trendMap[date] = (trendMap[date] || 0) + 1
  })
  const recentTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, count]) => ({ date, count }))

  const result = {
    total: allRecords.length,
    pending: statusCounts.PENDING,
    processing: statusCounts.PROCESSING,
    review: statusCounts.REVIEW,
    archived: statusCounts.ARCHIVED,
    rejected: statusCounts.REJECTED,
    reopened: statusCounts.REOPENED,
    bySampleType: sampleTypeCounts,
    byStation: stationCounts,
    amountTotal: amountSum._sum.amount?.toString() || '0',
    recentTrend
  }

  return { success: true, data: result }
})
