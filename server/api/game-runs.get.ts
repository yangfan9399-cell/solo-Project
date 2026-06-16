import { useDb } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const playerId = query.playerId ? Number(query.playerId) : null
  const db = useDb()

  let runs = db.all('gameRuns')
  if (playerId) {
    runs = runs.filter((r: any) => r.playerId === playerId)
  }
  return runs.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 50)
})
