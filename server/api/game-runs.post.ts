import { useDb } from '~/server/utils/db'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function calculateObservationScore(params: {
  basePoints: number
  difficulty: number
  aperture: number
  focalLength: number
  exposureMultiplier: number
  scienceValue: number
  cloudCoverage: number
  moonPhase: number
  telescopeCoolingPenalty: number
}): { score: number; details: Record<string, number> } {
  const details: Record<string, number> = {}

  let score = params.basePoints
  details.basePoints = params.basePoints

  const telescopeBonus = (params.aperture / 100) * (params.focalLength / 1000) * 20
  score += telescopeBonus
  details.telescopeBonus = Math.round(telescopeBonus)

  const filterBonus = params.scienceValue * 25 * params.exposureMultiplier
  score += filterBonus
  details.filterBonus = Math.round(filterBonus)

  const difficultyMultiplier = 1 + (params.difficulty - 1) * 0.25
  score *= difficultyMultiplier
  details.difficultyMultiplier = params.difficulty

  const cloudPenalty = params.cloudCoverage * params.basePoints * 1.5
  score -= cloudPenalty
  details.cloudPenalty = -Math.round(cloudPenalty)

  const moonPenalty = params.moonPhase * params.basePoints * 0.8
  score -= moonPenalty
  details.moonPenalty = -Math.round(moonPenalty)

  const cooldownPenalty = params.telescopeCoolingPenalty * params.basePoints * 0.15
  score -= cooldownPenalty
  details.cooldownPenalty = -Math.round(cooldownPenalty)

  if (score < 0) score = 0

  details.totalScore = Math.round(score)

  return { score: Math.round(score), details }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { playerId, levelId } = body

  if (!playerId || !levelId) {
    throw createError({ statusCode: 400, statusMessage: 'playerId 和 levelId 必填' })
  }

  const db = useDb()

  const level = db.find('levels', (l: any) => l.id === levelId)
  if (!level) {
    throw createError({ statusCode: 404, statusMessage: '关卡不存在' })
  }

  const weatherSeed = Math.floor(Math.random() * 100000)
  const rand = seededRandom(weatherSeed)
  const now = new Date().toISOString()

  const run = db.insert('gameRuns', {
    playerId,
    levelId,
    score: 0,
    status: 'in_progress',
    startTime: now,
    endTime: null,
    weatherSeed,
  })

  const runId = run.id
  const totalSlots = level.totalObservationSlots

  for (let i = 0; i < totalSlots; i++) {
    const cloud = Math.min(1, Math.max(0, rand() * level.cloudCoverageVariance * 2))
    const moon = Math.min(1, Math.max(0, rand() * level.moonPhaseVariance * 2))
    db.insert('observationSlots', {
      runId,
      slotIndex: i,
      telescopeId: null,
      filterId: null,
      skyRegionId: null,
      cloudCoverage: Number(cloud.toFixed(2)),
      moonPhase: Number(moon.toFixed(2)),
      telescopeCooldown: 0,
      completed: false,
      score: 0,
      observationTime: null,
    })
  }

  const slots = db.filter('observationSlots', (s: any) => s.runId === runId)
    .sort((a: any, b: any) => a.slotIndex - b.slotIndex)

  return {
    id: run.id,
    playerId: run.playerId,
    levelId: run.levelId,
    score: run.score,
    status: run.status,
    startTime: run.startTime,
    endTime: run.endTime,
    weatherSeed: run.weatherSeed,
    slots,
  }
})
