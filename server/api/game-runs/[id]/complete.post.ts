import { useDb } from '~/server/utils/db'
import { calculateObservationScore } from '~/server/api/game-runs.post'

export default defineEventHandler(async (event) => {
  const runId = Number(getRouterParam(event, 'id'))
  if (!runId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 run id' })
  }

  const body = await readBody(event)
  const { slotIndex } = body

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
  if (!slot.telescopeId || !slot.filterId || !slot.skyRegionId) {
    throw createError({ statusCode: 400, statusMessage: '请先分配望远镜、滤镜和天区' })
  }

  const telescope = db.find('telescopes', (t: any) => t.id === slot.telescopeId)
  const filter = db.find('filters', (f: any) => f.id === slot.filterId)
  const skyRegion = db.find('skyRegions', (s: any) => s.id === slot.skyRegionId)

  const allSlots = db.filter('observationSlots', (s: any) => s.runId === runId)
    .sort((a: any, b: any) => a.slotIndex - b.slotIndex)

  let telescopeUsedCount = 0
  for (let i = 0; i < slotIndex; i++) {
    if (allSlots[i].telescopeId === slot.telescopeId
      && (allSlots[i].completed === true || allSlots[i].completed === 1)) {
      telescopeUsedCount++
    }
  }

  if (telescopeUsedCount >= telescope.maxObservationsPerNight) {
    throw createError({ statusCode: 400, statusMessage: `${telescope.name} 今夜已达最大观测次数` })
  }

  let cooldownPenalty = 0
  if (telescope.coolingTime > 0) {
    for (let i = 1; i <= telescope.coolingTime && slotIndex - i >= 0; i++) {
      const prevSlot = allSlots[slotIndex - i]
      if (prevSlot.telescopeId === slot.telescopeId
        && (prevSlot.completed === true || prevSlot.completed === 1)) {
        cooldownPenalty = telescope.coolingTime - i + 1
        break
      }
    }
  }

  const { score, details } = calculateObservationScore({
    basePoints: skyRegion.basePoints,
    difficulty: skyRegion.difficulty,
    aperture: telescope.aperture,
    focalLength: telescope.focalLength,
    exposureMultiplier: filter.exposureMultiplier,
    scienceValue: filter.scienceValue,
    cloudCoverage: slot.cloudCoverage,
    moonPhase: slot.moonPhase,
    telescopeCoolingPenalty: cooldownPenalty,
  })

  db.updateWhere(
    'observationSlots',
    (s: any) => s.runId === runId && s.slotIndex === slotIndex,
    { completed: true, score, observationTime: now, telescopeCooldown: cooldownPenalty },
  )

  db.insert('actionHistories', {
    runId,
    actionType: 'complete_observation',
    slotIndex,
    payload: JSON.stringify({ score, details }),
    timestamp: now,
  })

  const completedSlots = db.filter(
    'observationSlots',
    (s: any) => s.runId === runId && (s.completed === true || s.completed === 1),
  )
  const totalScore = completedSlots.reduce((sum: number, s: any) => sum + (s.score || 0), 0)
  db.updateWhere('gameRuns', (r: any) => r.id === runId, { score: totalScore })

  const updatedRun = db.find('gameRuns', (r: any) => r.id === runId)
  const updatedSlot = db.find('observationSlots', (s: any) => s.runId === runId && s.slotIndex === slotIndex)

  return {
    runScore: updatedRun.score,
    slot: {
      ...updatedSlot,
      completed: true,
    },
    scoreBreakdown: details,
  }
})
