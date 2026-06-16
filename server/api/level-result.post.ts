import type { RGB } from '~/types/game'
import { calculateLevelScore, clampColor, colorDiff } from '~/utils/colorUtils'
import { getLevelById } from '~/data/gameData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    levelId,
    completedOrders,
    failedOrders,
    orderResults,
    goldEarned,
    timeRemaining
  } = body as {
    levelId: number
    completedOrders: number
    failedOrders: number
    orderResults: {
      targetColor: RGB
      finalColor: RGB
    }[]
    goldEarned: number
    timeRemaining: number
  }

  if (!levelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing levelId'
    })
  }

  const level = getLevelById(levelId)
  if (!level) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Level not found'
    })
  }

  let totalColorDiff = 0
  if (orderResults && orderResults.length > 0) {
    totalColorDiff = orderResults.reduce((sum, o) => {
      return sum + colorDiff(clampColor(o.finalColor), clampColor(o.targetColor))
    }, 0)
  }

  const timeBonus = Math.max(0, timeRemaining || 0)

  const finalScore = calculateLevelScore(
    completedOrders,
    failedOrders,
    totalColorDiff,
    goldEarned,
    timeBonus
  )

  let status: 'completed' | 'failed' = 'failed'
  if (completedOrders >= level.targetOrders) {
    status = 'completed'
  }

  const passed = status === 'completed'
  const newBestScore = finalScore

  return {
    serverVerified: true,
    finalScore,
    status,
    passed,
    totalColorDiff,
    newBestScore,
    stars: getStars(finalScore, level.targetOrders),
    calculatedAt: Date.now()
  }
})

function getStars(score: number, targetOrders: number): number {
  const baseScore = targetOrders * 100
  if (score >= baseScore * 1.5) return 3
  if (score >= baseScore * 1.2) return 2
  if (score >= baseScore * 0.8) return 1
  return 0
}
