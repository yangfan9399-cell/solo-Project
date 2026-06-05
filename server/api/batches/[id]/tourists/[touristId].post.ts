import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const batchId = parseInt(getRouterParam(event, 'id') || '0')
  const touristId = parseInt(getRouterParam(event, 'touristId') || '0')
  const body = await readBody(event)
  const { visaResult, notes } = body

  const touristBatch = await prisma.touristBatch.findUnique({
    where: {
      touristId_batchId: {
        touristId,
        batchId
      }
    }
  })

  if (!touristBatch) {
    throw createError({
      statusCode: 404,
      message: '游客不在此批次中'
    })
  }

  const updated = await prisma.touristBatch.update({
    where: {
      touristId_batchId: {
        touristId,
        batchId
      }
    },
    data: {
      visaResult,
      notes
    }
  })

  return updated
})
