import dataService from '~/server/utils/dataService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const status = query.status as string
  const abnormalType = query.abnormalType as string
  const deptName = query.deptName as string
  const isAbnormal = query.isAbnormal as string
  const keyword = query.keyword as string

  const result = await dataService.findRecords({
    page,
    pageSize,
    status,
    abnormalType,
    deptName,
    isAbnormal,
    keyword
  })

  return result
})
