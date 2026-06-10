import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/recalls')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const status = url.searchParams.get('status')

        const where: any = {}
        if (status && status !== 'ALL') {
          where.status = status
        }

        const recalls = await prisma.recall.findMany({
          where,
          include: {
            publisher: {
              select: { name: true, role: true }
            },
            batches: {
              include: {
                drugBatch: {
                  include: {
                    drug: true
                  }
                }
              }
            },
            _count: {
              select: {
                stores: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        const stats = await prisma.recall.groupBy({
          by: ['status'],
          _count: true,
        })

        return Response.json({ recalls, stats })
      },

      POST: async ({ request }) => {
        const body = await request.json()
        const { title, description, reason, level, publisherId, batchIds, storeIds, expectedQuantity } = body

        try {
          const recall = await prisma.recall.create({
            data: {
              title,
              description,
              reason,
              level,
              status: 'PUBLISHED',
              publisherId,
              batches: {
                create: batchIds.map((batchId: string) => ({
                  drugBatchId: batchId,
                  expectedQuantity: expectedQuantity || 0,
                })),
              },
              stores: {
                create: storeIds.map((storeId: string) => ({
                  storeId,
                  status: 'UNREAD',
                })),
              },
              history: {
                create: {
                  action: '发布召回',
                  detail: '质量经办人发布召回通知',
                  actorId: publisherId,
                },
              },
            },
            include: {
              batches: true,
              stores: true,
            },
          })
          return Response.json(recall, { status: 201 })
        } catch (error: any) {
          console.error(error)
          return Response.json({ error: '发布失败' }, { status: 500 })
        }
      },
    },
  },
})
