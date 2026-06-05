import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const batches = await prisma.visaBatch.findMany({
    include: {
      createdBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
      tourists: {
        include: {
          tourist: {
            include: {
              materials: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return batches.map(batch => {
    const touristCount = batch.tourists.length
    let completeCount = 0
    let issueCount = 0

    batch.tourists.forEach(tb => {
      const materials = tb.tourist.materials
      const allComplete = materials.every(m => m.status === 'COMPLETE')
      const hasIssue = materials.some(m => 
        m.status === 'REJECTED' || m.status === 'EXPIRED' || m.status === 'EXPIRING_SOON'
      )
      if (allComplete) completeCount++
      if (hasIssue) issueCount++
    })

    return {
      id: batch.id,
      batchNo: batch.batchNo,
      country: batch.country,
      status: batch.status,
      submitDate: batch.submitDate,
      createdAt: batch.createdAt,
      createdBy: batch.createdBy,
      reviewedBy: batch.reviewedBy,
      touristCount,
      completeCount,
      issueCount
    }
  })
})
