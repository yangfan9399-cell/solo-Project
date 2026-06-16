import { useDb } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const runId = Number(getRouterParam(event, 'id'))
  if (!runId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 run id' })
  }

  const db = useDb()
  const now = new Date().toISOString()

  const run = db.find('gameRuns', (r: any) => r.id === runId)
  if (!run) {
    throw createError({ statusCode: 404, statusMessage: '游戏局次不存在' })
  }

  const level = db.find('levels', (l: any) => l.id === run.levelId)
  const slots = db.filter('observationSlots', (s: any) => s.runId === runId)
    .sort((a: any, b: any) => a.slotIndex - b.slotIndex)

  const completedSlots = slots.filter((s: any) => s.completed === true || s.completed === 1)
  const totalScore = completedSlots.reduce((sum: number, s: any) => sum + (s.score || 0), 0)
  const passed = totalScore >= level.targetScore
  const status = passed ? 'completed' : 'failed'

  db.updateWhere('gameRuns', (r: any) => r.id === runId, {
    score: totalScore,
    status,
    endTime: now,
  })

  let player = db.find('playerProfiles', (p: any) => p.id === run.playerId)
  if (passed && player) {
    const newTotalScore = (player.totalScore || 0) + totalScore
    const newHighestLevel = Math.max(player.highestLevel || 1, Math.min(level.id + 1, 999))
    const newCompletedRuns = (player.completedRuns || 0) + 1
    db.updateWhere('playerProfiles', (p: any) => p.id === run.playerId, {
      totalScore: newTotalScore,
      highestLevel: newHighestLevel,
      completedRuns: newCompletedRuns,
      updatedAt: now,
    })
    player = db.find('playerProfiles', (p: any) => p.id === run.playerId)
  }

  return {
    runId,
    finalScore: totalScore,
    targetScore: level.targetScore,
    passed,
    status,
    completedObservations: completedSlots.length,
    totalSlots: slots.length,
    slots: slots.map((s: any) => ({
      slotIndex: s.slotIndex,
      completed: s.completed === true || s.completed === 1,
      score: s.score || 0,
      telescopeId: s.telescopeId,
      filterId: s.filterId,
      skyRegionId: s.skyRegionId,
      cloudCoverage: s.cloudCoverage,
      moonPhase: s.moonPhase,
    })),
    player: {
      id: player.id,
      name: player.name,
      totalScore: player.totalScore,
      highestLevel: player.highestLevel,
      completedRuns: player.completedRuns,
    },
  }
})
