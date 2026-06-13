import dataService from '~/server/utils/dataService'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  try {
    const result = await dataService.reprocessRecord(parseInt(id as string), body)
    return result
  } catch (e: any) {
    throw createError({
      statusCode: 400,
      statusMessage: e.message || '操作失败'
    })
  }
})
