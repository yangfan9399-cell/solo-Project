import type { GameRecord } from '~/types/game'
import { generateId } from '~/utils/colorUtils'
import { getLevelById } from '~/data/gameData'

const STORAGE_KEY = 'game_records'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const {
    playerId,
    levelId,
    score,
    goldEarned,
    ordersCompleted,
    ordersFailed,
    ordersCancelled,
    totalColorDiff,
    status,
    dyeingSessions
  } = body as {
    playerId: string
    levelId: number
    score: number
    goldEarned: number
    ordersCompleted: number
    ordersFailed: number
    ordersCancelled?: number
    totalColorDiff: number
    status: 'completed' | 'failed' | 'quit'
    dyeingSessions: any[]
  }

  if (!playerId || !levelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters'
    })
  }

  const level = getLevelById(levelId)
  if (!level) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Level not found'
    })
  }

  const storage = useStorage('game-data')
  let records: GameRecord[] = []

  try {
    const existing = await storage.getItem(STORAGE_KEY)
    if (existing) {
      records = existing as GameRecord[]
    }
  } catch (e) {
    records = []
  }

  const record: GameRecord = {
    id: generateId(),
    playerId,
    levelId,
    score,
    goldEarned,
    ordersCompleted,
    ordersFailed,
    totalColorDiff,
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    status,
    dyeingSessions: dyeingSessions || []
  }

  records.push(record)
  await storage.setItem(STORAGE_KEY, records)

  return { record }
})
