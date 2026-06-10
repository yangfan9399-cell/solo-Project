import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/recalls/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { id } = params

        const recall = await prisma.recall.findUnique({
          where: { id },
          include: {
            publisher: {
              select: { name: true, role: true }
            },
            closer: {
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
            stores: {
              include: {
                store: true,
                confirmedBy: {
                  select: { name: true }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            },
            recoveries: {
              include: {
                store: true,
                batch: true,
                notedBy: {
                  select: { name: true }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            },
            history: {
              include: {
                actor: {
                  select: { name: true, role: true }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            },
          },
        })

        if (!recall) {
          return Response.json({ error: 'Recall not found' }, { status: 404 })
        }

        const stats = {
          totalStores: recall.stores.length,
          unreadCount: recall.stores.filter((s: any) => s.status === 'UNREAD').length,
          readCount: recall.stores.filter((s: any) => s.status === 'READ').length,
          offShelfCount: recall.stores.filter((s: any) => s.status === 'OFF_SHELF').length,
          recoveredCount: recall.stores.filter((s: any) => s.status === 'RECOVERED').length,
          mismatchCount: recall.stores.filter((s: any) => s.status === 'BATCH_MISMATCH').length,
          totalRecoveryExpected: recall.recoveries.reduce((sum: number, r: any) => sum + r.expectedQty, 0),
          totalRecoveryActual: recall.recoveries.reduce((sum: number, r: any) => sum + r.actualQty, 0),
          totalDifference: recall.recoveries.reduce((sum: number, r: any) => sum + r.difference, 0),
        }

        return Response.json({ recall, stats })
      },

      PATCH: async ({ params, request }) => {
        const { id } = params
        const body = await request.json()
        const { status, closerId, closeNote, action, actorId, detail } = body

        try {
          if (status === 'CLOSED' || status === 'INVESTIGATING') {
            const recall = await prisma.recall.findUnique({
              where: { id },
              include: { stores: true },
            })

            if (!recall) {
              return Response.json({ error: 'Recall not found' }, { status: 404 })
            }

            const hasUnread = recall.stores.some((s: any) => s.status === 'UNREAD')
            if (hasUnread) {
              return Response.json({
                error: '门店未读，禁止关闭召回',
                code: 'UNREAD_STORES_EXIST'
              }, { status: 400 })
            }

            const updated = await prisma.recall.update({
              where: { id },
              data: {
                status,
                closedAt: new Date(),
                closerId,
                closeNote,
                history: {
                  create: {
                    action: action || (status === 'CLOSED' ? '关闭召回' : '启动追责'),
                    detail: detail || closeNote || '',
                    actorId: actorId || closerId,
                  },
                },
              },
              include: { history: true },
            })
            return Response.json(updated)
          }

          const updated = await prisma.recall.update({
            where: { id },
            data: { status },
          })
          return Response.json(updated)
        } catch (error: any) {
          console.error(error)
          return Response.json({ error: '更新失败' }, { status: 500 })
        }
      },
    },
  },
})
