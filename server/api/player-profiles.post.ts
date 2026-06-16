import { useDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name } = body
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '玩家名称不能为空' })
  }
  const db = useDb()
  const now = new Date().toISOString()
  return db.insert('playerProfiles', {
    name,
    totalScore: 0,
    highestLevel: 1,
    completedRuns: 0,
    createdAt: now,
    updatedAt: now,
  })
})
