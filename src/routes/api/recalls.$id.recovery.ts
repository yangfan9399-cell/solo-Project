import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/recalls/$id/recovery')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { id } = params
        const body = await request.json()
        const { storeId, batchId, expectedQty, actualQty, notedById, note } = body

        try {
          const difference = actualQty - expectedQty

          const recovery = await prisma.recallRecovery.create({
            data: {
              recallId: id,
              storeId,
              batchId,
              expectedQty,
              actualQty,
              difference,
              notedById,
              note,
            },
            include: {
              store: true,
              batch: {
                include: { drug: true }
              },
            },
          })

          await prisma.storeRecall.update({
            where: {
              recallId_storeId: {
                recallId: id,
                storeId,
              },
            },
            data: { status: 'RECOVERED' },
          })

          await prisma.recallHistory.create({
            data: {
              recallId: id,
              action: '回收登记',
              detail: `${recovery.store.name} 回收 ${recovery.batch.drug.name} ${recovery.batch.batchNumber}：预期${expectedQty}盒，实际${actualQty}盒，差异${difference}盒`,
              actorId: notedById,
            },
          })

          return Response.json(recovery, { status: 201 })
        } catch (error: any) {
          console.error(error)
          return Response.json({ error: '登记失败' }, { status: 500 })
        }
      },
    },
  },
})
