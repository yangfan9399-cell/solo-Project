import type { RGB, DyeResult, DyeAction } from '~/types/game'
import { dyes } from '~/data/gameData'

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

export function rgbToHex(rgb: RGB): string {
  return (
    '#' +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export function clampColor(rgb: RGB): RGB {
  return {
    r: Math.max(0, Math.min(255, Math.round(rgb.r))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b)))
  }
}

export function colorDiff(color1: RGB, color2: RGB): number {
  const rDiff = color1.r - color2.r
  const gDiff = color1.g - color2.g
  const bDiff = color1.b - color2.b
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
}

export function colorDiffPercentage(color1: RGB, color2: RGB): number {
  const diff = colorDiff(color1, color2)
  const maxDiff = Math.sqrt(255 * 255 * 3)
  return (diff / maxDiff) * 100
}

export function mixColors(colors: { color: RGB; ratio: number }[]): RGB {
  const totalRatio = colors.reduce((sum, c) => sum + c.ratio, 0)
  if (totalRatio === 0) return { r: 255, g: 255, b: 255 }

  let r = 0
  let g = 0
  let b = 0

  for (const c of colors) {
    const weight = c.ratio / totalRatio
    r += c.color.r * weight
    g += c.color.g * weight
    b += c.color.b * weight
  }

  return { r, g, b }
}

export function mixDye(currentColor: RGB, dyeColor: RGB, dyeAmount: number): RGB {
  const totalWeight = 100 + dyeAmount
  const currentWeight = 100 / totalWeight
  const dyeWeight = dyeAmount / totalWeight

  return {
    r: currentColor.r * currentWeight + dyeColor.r * dyeWeight,
    g: currentColor.g * currentWeight + dyeColor.g * dyeWeight,
    b: currentColor.b * currentWeight + dyeColor.b * dyeWeight
  }
}

const BASE_TEMPERATURE = 25
const OPTIMAL_TEMPERATURE = 60
const MAX_TEMPERATURE_EFFECT = 1.3
const MIN_TEMPERATURE_EFFECT = 0.5

export function getTemperatureEffect(temperature: number): number {
  if (temperature <= OPTIMAL_TEMPERATURE) {
    const ratio = (temperature - BASE_TEMPERATURE) / (OPTIMAL_TEMPERATURE - BASE_TEMPERATURE)
    return MIN_TEMPERATURE_EFFECT + (MAX_TEMPERATURE_EFFECT - MIN_TEMPERATURE_EFFECT) * Math.max(0, ratio)
  } else {
    const excess = temperature - OPTIMAL_TEMPERATURE
    const decay = Math.exp(-excess * 0.02)
    return 1 + (MAX_TEMPERATURE_EFFECT - 1) * decay
  }
}

export function applyDipEffect(color: RGB, dyeColor: RGB, temperature: number, dipTime: number): RGB {
  const tempEffect = getTemperatureEffect(temperature)
  const effectiveTime = dipTime * tempEffect

  const penetrationRatio = Math.min(1, effectiveTime / 60)
  const saturationBoost = 1 + penetrationRatio * 0.2

  const mixedColor = mixColors([
    { color, ratio: 1 - penetrationRatio * 0.3 },
    { color: dyeColor, ratio: penetrationRatio * 0.3 }
  ])

  return {
    r: mixedColor.r * saturationBoost,
    g: mixedColor.g * saturationBoost,
    b: mixedColor.b * saturationBoost
  }
}

const HEAT_RATE = 5
const COOL_RATE = 2

export function heatWater(currentTemp: number, duration: number): number {
  const targetTemp = 100
  const newTemp = currentTemp + HEAT_RATE * duration
  return Math.min(targetTemp, newTemp)
}

export function coolWater(currentTemp: number, duration: number): number {
  const ambientTemp = 25
  const newTemp = currentTemp - COOL_RATE * duration
  return Math.max(ambientTemp, newTemp)
}

export function calculateDyeResult(
  finalColor: RGB,
  targetColor: RGB,
  totalDyeCost: number,
  baseReward: number
): DyeResult {
  const clampedFinal = clampColor(finalColor)
  const diff = colorDiff(clampedFinal, targetColor)
  const diffPercent = colorDiffPercentage(clampedFinal, targetColor)

  let quality: DyeResult['quality'] = 'poor'
  let rewardMultiplier = 0
  let score = 0

  if (diffPercent <= 5) {
    quality = 'perfect'
    rewardMultiplier = 2.0
    score = 100
  } else if (diffPercent <= 12) {
    quality = 'good'
    rewardMultiplier = 1.5
    score = 75
  } else if (diffPercent <= 25) {
    quality = 'fair'
    rewardMultiplier = 1.0
    score = 50
  } else {
    quality = 'poor'
    rewardMultiplier = 0.3
    score = 20
  }

  const efficiencyBonus = Math.max(0, 1 - totalDyeCost / baseReward) * 0.2
  rewardMultiplier += efficiencyBonus

  score += Math.round(efficiencyBonus * 20)

  return {
    finalColor: clampedFinal,
    colorDiff: diffPercent,
    score,
    quality,
    rewardMultiplier
  }
}

export function calculateLevelScore(
  completedOrders: number,
  failedOrders: number,
  totalColorDiff: number,
  goldEarned: number,
  timeBonus: number
): number {
  const orderScore = completedOrders * 100
  const penalty = failedOrders * 50
  const qualityScore = Math.max(0, 500 - totalColorDiff * 2)
  const goldScore = Math.floor(goldEarned / 5)
  const timeScore = Math.floor(timeBonus / 10)

  return Math.max(0, orderScore - penalty + qualityScore + goldScore + timeScore)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function getDyeColor(dyeId: string): RGB {
  const dye = dyes.find((d) => d.id === dyeId)
  return dye ? dye.color : { r: 128, g: 128, b: 128 }
}

export function getDyePrice(dyeId: string): number {
  const dye = dyes.find((d) => d.id === dyeId)
  return dye ? dye.basePrice : 10
}
