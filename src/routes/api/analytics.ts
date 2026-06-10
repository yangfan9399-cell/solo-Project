import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/analytics')({
  server: {
    handlers: {
      GET: async () => {
        const recalls = await prisma.recall.findMany({
          where: {
            status: {
              in: ['CLOSED', 'INVESTIGATING', 'RECOVERING', 'IN_PROGRESS', 'PUBLISHED'],
            },
          },
          include: {
            batches: {
              include: {
                drugBatch: {
                  include: { drug: true },
                },
              },
            },
            stores: {
              include: { store: true },
            },
            recoveries: true,
          },
        })

        const summary = {
          total: recalls.length,
          closed: recalls.filter((r: any) => r.status === 'CLOSED').length,
          inProgress: recalls.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'PUBLISHED').length,
          recovering: recalls.filter((r: any) => r.status === 'RECOVERING').length,
          investigating: recalls.filter((r: any) => r.status === 'INVESTIGATING').length,
        }

        const regionMap: Record<string, number> = {}
        recalls.forEach((recall: any) => {
          const regions = new Set(recall.stores.map((s: any) => s.store.region))
          regions.forEach((region: any) => {
            regionMap[region] = (regionMap[region] || 0) + 1
          })
        })
        const byRegion = Object.entries(regionMap).map(([region, count]) => ({ region, count }))

        const categoryMap: Record<string, number> = {}
        recalls.forEach((recall: any) => {
          const categories = new Set(recall.batches.map((b: any) => b.drugBatch.drug.category))
          categories.forEach((cat: any) => {
            categoryMap[cat] = (categoryMap[cat] || 0) + 1
          })
        })
        const byCategory = Object.entries(categoryMap).map(([category, count]) => ({ category, count }))

        const touchHoursList: number[] = []
        recalls.forEach((recall: any) => {
          recall.stores.forEach((storeRecall: any) => {
            if (storeRecall.readAt) {
              const touchHours = (new Date(storeRecall.readAt).getTime() - new Date(recall.createdAt).getTime()) / (1000 * 60 * 60)
              touchHoursList.push(touchHours)
            }
          })
        })

        function bucketTouchHours(hours: number): string {
          if (hours < 1) return '0-1小时'
          if (hours < 4) return '1-4小时'
          if (hours < 12) return '4-12小时'
          if (hours < 24) return '12-24小时'
          if (hours < 48) return '24-48小时'
          return '48小时以上'
        }

        const touchBucketMap: Record<string, number> = {}
        touchHoursList.forEach((h) => {
          const bucket = bucketTouchHours(h)
          touchBucketMap[bucket] = (touchBucketMap[bucket] || 0) + 1
        })
        const touchBuckets = ['0-1小时', '1-4小时', '4-12小时', '12-24小时', '24-48小时', '48小时以上']
        const reachDuration = touchBuckets.map((bucket) => ({
          bucket,
          count: touchBucketMap[bucket] || 0,
        }))

        const avgReachDuration = touchHoursList.length > 0
          ? touchHoursList.reduce((a, b) => a + b, 0) / touchHoursList.length
          : 0

        function bucketDiffQty(diff: number): string {
          const absDiff = Math.abs(diff)
          if (absDiff === 0) return '无差异'
          if (absDiff <= 5) return '轻微差异(1-5盒)'
          if (absDiff <= 20) return '中等差异(6-20盒)'
          return '严重差异(20盒以上)'
        }

        const diffBucketMap: Record<string, number> = {}
        let totalDifference = 0
        recalls.forEach((recall: any) => {
          recall.recoveries.forEach((recovery: any) => {
            const bucket = bucketDiffQty(recovery.difference)
            diffBucketMap[bucket] = (diffBucketMap[bucket] || 0) + 1
            totalDifference += recovery.difference
          })
        })
        const diffBuckets = ['无差异', '轻微差异(1-5盒)', '中等差异(6-20盒)', '严重差异(20盒以上)']
        const quantityDifference = diffBuckets.map((bucket) => ({
          bucket,
          count: diffBucketMap[bucket] || 0,
        }))

        const levelMap: Record<string, number> = {}
        recalls.forEach((recall: any) => {
          levelMap[recall.level] = (levelMap[recall.level] || 0) + 1
        })
        const byLevel = Object.entries(levelMap).map(([level, count]) => ({ level, count }))

        return Response.json({
          summary,
          byRegion,
          byCategory,
          reachDuration,
          quantityDifference,
          byLevel,
          avgReachDuration,
          totalDifference,
        })
      },
    },
  },
})
