import dataService from '~/server/utils/dataService'

export default defineEventHandler(async () => {
  return await dataService.getStats()
})
