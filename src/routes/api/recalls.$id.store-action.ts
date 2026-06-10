import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/recalls/$id/store-action')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const { id } = params
        const body = await request.json()
        const { storeId, action, confirmedById, offShelfPhoto, mismatchNote } = body

        try {
          const storeRecall = await prisma.storeRecall.findUnique({
            where: {
              recallId_storeId: {
                recallId: id,
                storeId,
              },
            },
          })

          if (!storeRecall) {
            return Response.json({ error: 'Store recall not found' }, { status: 404 })
          }

          let updateData: any = {}

          if (action === 'read') {
            updateData.status = 'READ'
            updateData.readAt = new Date()
            updateData.confirmedById = confirmedById
          } else if (action === 'offShelf') {
            updateData.status = 'OFF_SHELF'
            updateData.offShelfAt = new Date()
            updateData.offShelfPhoto = offShelfPhoto || 'placeholder.jpg'
            updateData.confirmedById = confirmedById
          } else if (action === 'mismatch') {
            updateData.status = 'BATCH_MISMATCH'
            updateData.mismatchNote = mismatchNote
            updateData.confirmedById = confirmedById
          }

          const updated = await prisma.storeRecall.update({
            where: {
              recallId_storeId: {
                recallId: id,
                storeId,
              },
            },
            data: updateData,
            include: { store: true },
          })

          if (action !== 'read') {
            await prisma.recallHistory.create({
              data: {
                recallId: id,
                action: action === 'offShelf' ? '门店下架确认' : '批号不匹配',
                detail: action === 'offShelf'
                  ? `${updated.store.name} 已完成下架`
                  : `${updated.store.name} 批号不匹配：${mismatchNote || ''}`,
                actorId: confirmedById,
              },
            })
          }

          return Response.json(updated)
        } catch (error: any) {
          console.error(error)
          return Response.json({ error: '操作失败' }, { status: 500 })
        }
      },
    },
  },
})
