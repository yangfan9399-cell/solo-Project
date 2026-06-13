import dataService from '~/server/utils/dataService'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const record = await dataService.findRecordById(parseInt(id as string))

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: '记录不存在'
    })
  }

  return record
})
