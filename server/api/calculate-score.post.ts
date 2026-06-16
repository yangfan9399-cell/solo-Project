import { calculateDyeResult, clampColor } from '~/utils/colorUtils'
import type { RGB } from '~/types/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { finalColor, targetColor, totalDyeCost, baseReward } = body as {
    finalColor: RGB
    targetColor: RGB
    totalDyeCost: number
    baseReward: number
  }

  if (!finalColor || !targetColor) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters'
    })
  }

  const result = calculateDyeResult(
    clampColor(finalColor),
    clampColor(targetColor),
    totalDyeCost,
    baseReward
  )

  const finalReward = Math.round(baseReward * result.rewardMultiplier)

  return {
    ...result,
    finalReward,
    calculatedAt: Date.now(),
    serverVerified: true
  }
})
