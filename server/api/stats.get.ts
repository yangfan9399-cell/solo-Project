import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const batches = await prisma.visaBatch.findMany({
    include: {
      tourists: {
        include: {
          tourist: {
            include: {
              materials: true
            }
          }
        }
      }
    }
  })

  const countryMap = new Map<string, { count: number; approved: number; rejected: number }>()
  const materialIssues: { issue: string; count: number }[] = []
  const processingTimes: number[] = []
  let rejectionCount = 0

  const issueTypes: Record<string, number> = {}

  for (const batch of batches) {
    if (!countryMap.has(batch.country)) {
      countryMap.set(batch.country, { count: 0, approved: 0, rejected: 0 })
    }
    const countryData = countryMap.get(batch.country)!
    countryData.count += batch.tourists.length

    for (const tb of batch.tourists) {
      if (tb.visaResult === 'APPROVED') countryData.approved++
      if (tb.visaResult === 'REJECTED') countryData.rejected++

      for (const material of tb.tourist.materials) {
        if (material.status !== 'COMPLETE') {
          const issueKey = `${material.type}:${material.status}`
          issueTypes[issueKey] = (issueTypes[issueKey] || 0) + 1
        }
      }
    }

    if (batch.submitDate) {
      const processTime = Math.ceil(
        (new Date(batch.updatedAt).getTime() - new Date(batch.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      processingTimes.push(processTime)
    }

    if (batch.status === 'REJECTED') {
      rejectionCount++
    }
  }

  const issueMap: Record<string, string> = {
    '护照:EXPIRED': '护照过期',
    '护照:EXPIRING_SOON': '护照即将过期',
    '护照:PENDING': '护照待提交',
    '照片:REJECTED': '照片规格不符',
    '照片:PENDING': '照片待提交',
    '在职证明:REJECTED': '在职证明不合格',
    '在职证明:PENDING': '在职证明待提交',
    '银行流水:REJECTED': '银行流水不合格',
    '银行流水:PENDING': '银行流水待提交'
  }

  for (const [issue, count] of Object.entries(issueTypes)) {
    materialIssues.push({
      issue: issueMap[issue] || issue,
      count
    })
  }

  materialIssues.sort((a, b) => b.count - a.count)

  const byCountry = Array.from(countryMap.entries()).map(([country, data]) => ({
    country,
    ...data
  }))

  const avgTime = processingTimes.length > 0
    ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0
  const maxTime = processingTimes.length > 0 ? Math.max(...processingTimes) : 0
  const minTime = processingTimes.length > 0 ? Math.min(...processingTimes) : 0

  return {
    byCountry,
    byMaterialIssue: materialIssues,
    processingTime: {
      avg: Math.round(avgTime * 10) / 10,
      max: maxTime,
      min: minTime
    },
    rejectionCount
  }
})
