export interface Thresholds {
  altitude: { passMax: number; warnMax: number }
  substrate: { passMax: number; warnMax: number }
  sporeDensity: { passMax: number; warnMax: number }
  humidityExposure: { passMax: number; warnMax: number }
}

export interface Specimen {
  id: string
  code: string
  collection_point: string
  season: string
  altitude: number
  substrate: number
  spore_density: number
  humidity_exposure: number
  current_status: string
  linked_specimen_id: string | null
}

export type Status = 'pass' | 'warn' | 'block'

export interface ImpactResult {
  specimen: Specimen
  oldStatus: Status
  newStatus: Status
  changedDimensions: string[]
  isCrossSeason: boolean
}

const DIMENSION_MAP: Record<string, keyof Thresholds> = {
  altitude: 'altitude',
  substrate: 'substrate',
  spore_density: 'sporeDensity',
  humidity_exposure: 'humidityExposure',
}

const DIMENSION_FIELDS: [string, keyof Thresholds][] = [
  ['altitude', 'altitude'],
  ['substrate', 'substrate'],
  ['spore_density', 'sporeDensity'],
  ['humidity_exposure', 'humidityExposure'],
]

function dimensionStatus(value: number, threshold: { passMax: number; warnMax: number }): Status {
  if (value <= threshold.passMax) return 'pass'
  if (value <= threshold.warnMax) return 'warn'
  return 'block'
}

export function computeSpecimenStatus(specimen: Specimen, thresholds: Thresholds): Status {
  const statuses: Status[] = [
    dimensionStatus(specimen.altitude, thresholds.altitude),
    dimensionStatus(specimen.substrate, thresholds.substrate),
    dimensionStatus(specimen.spore_density, thresholds.sporeDensity),
    dimensionStatus(specimen.humidity_exposure, thresholds.humidityExposure),
  ]
  if (statuses.includes('block')) return 'block'
  if (statuses.includes('warn')) return 'warn'
  return 'pass'
}

export function computeImpact(
  specimens: Specimen[],
  oldThresholds: Thresholds,
  newThresholds: Thresholds,
): ImpactResult[] {
  const results: ImpactResult[] = []

  for (const specimen of specimens) {
    const oldStatus = computeSpecimenStatus(specimen, oldThresholds)
    const newStatus = computeSpecimenStatus(specimen, newThresholds)

    if (oldStatus !== newStatus) {
      const changedDimensions: string[] = []

      for (const [field, dimKey] of DIMENSION_FIELDS) {
        const oldDim = dimensionStatus(
          specimen[field as keyof Specimen] as number,
          oldThresholds[dimKey],
        )
        const newDim = dimensionStatus(
          specimen[field as keyof Specimen] as number,
          newThresholds[dimKey],
        )
        if (oldDim !== newDim) {
          changedDimensions.push(field)
        }
      }

      results.push({
        specimen,
        oldStatus,
        newStatus,
        changedDimensions,
        isCrossSeason: specimen.linked_specimen_id !== null,
      })
    }
  }

  return results
}
