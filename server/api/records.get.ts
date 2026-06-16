import type { GameRecord } from '~/types/game'

const STORAGE_KEY = 'game_records'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const playerId = query.playerId as string

  const storage = useStorage('game-data')

  return storage.getItem(STORAGE_KEY).then((data) => {
    if (!data) {
      return { records: [] }
    }
    let records = data as GameRecord[]

    if (playerId) {
      records = records.filter((r) => r.playerId === playerId)
    }

    records = records.sort((a, b) => b.endTime - a.endTime).slice(0, 20)

    return { records }
  }).catch(() => {
    return { records: [] }
  })
})
