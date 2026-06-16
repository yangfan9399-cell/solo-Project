import { useDb } from '~/server/utils/db'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 run id' })
  }

  const db = useDb()
  const run = db.find('gameRuns', (r: any) => r.id === id)
  if (!run) {
    throw createError({ statusCode: 404, statusMessage: '游戏局次不存在' })
  }

  const slots = db.filter('observationSlots', (s: any) => s.runId === id)
    .sort((a: any, b: any) => a.slotIndex - b.slotIndex)
  const history = db.filter('actionHistories', (h: any) => h.runId === id)
    .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return {
    ...run,
    slots: slots.map((s: any) => ({
      ...s,
      completed: s.completed === true || s.completed === 1,
    })),
    history: history.map((h: any) => ({
      ...h,
      payload: typeof h.payload === 'string' ? JSON.parse(h.payload || '{}') : (h.payload || {}),
    })),
  }
})
