import { useDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const runId = Number(getRouterParam(event, 'id'))
  if (!runId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 run id' })
  }

  const body = await readBody(event)
  const { slotIndex, telescopeId, filterId, skyRegionId } = body

  if (slotIndex === undefined || slotIndex === null) {
    throw createError({ statusCode: 400, statusMessage: '缺少 slotIndex' })
  }

  const db = useDb()
  const now = new Date().toISOString()

  const run = db.find('gameRuns', (r: any) => r.id === runId)
  if (!run || run.status !== 'in_progress') {
    throw createError({ statusCode: 400, statusMessage: '游戏局次不存在或已结束' })
  }

  const slot = db.find('observationSlots', (s: any) => s.runId === runId && s.slotIndex === slotIndex)
  if (!slot) {
    throw createError({ statusCode: 404, statusMessage: '观测时段不存在' })
  }
  if (slot.completed === true || slot.completed === 1) {
    throw createError({ statusCode: 400, statusMessage: '该观测时段已完成' })
  }

  const updates: any = {}
  if (telescopeId !== undefined) {
    updates.telescopeId = telescopeId
    db.insert('actionHistories', {
      runId,
      actionType: 'assign_telescope',
      slotIndex,
      payload: JSON.stringify({ telescopeId }),
      timestamp: now,
    })
  }
  if (filterId !== undefined) {
    updates.filterId = filterId
    db.insert('actionHistories', {
      runId,
      actionType: 'assign_filter',
      slotIndex,
      payload: JSON.stringify({ filterId }),
      timestamp: now,
    })
  }
  if (skyRegionId !== undefined) {
    updates.skyRegionId = skyRegionId
    db.insert('actionHistories', {
      runId,
      actionType: 'assign_skyregion',
      slotIndex,
      payload: JSON.stringify({ skyRegionId }),
      timestamp: now,
    })
  }

  const updatedSlot = db.updateWhere(
    'observationSlots',
    (s: any) => s.runId === runId && s.slotIndex === slotIndex,
    updates,
  )

  const resultSlot = db.find('observationSlots', (s: any) => s.runId === runId && s.slotIndex === slotIndex)
  return {
    ...resultSlot,
    completed: resultSlot.completed === true || resultSlot.completed === 1,
  }
})
