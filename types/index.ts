export interface Telescope {
  id: number
  name: string
  aperture: number
  focalLength: number
  coolingTime: number
  maxObservationsPerNight: number
  description: string
}

export interface Filter {
  id: number
  name: string
  wavelength: string
  exposureMultiplier: number
  scienceValue: number
  description: string
  color: string
}

export interface SkyRegion {
  id: number
  name: string
  declination: number
  bestSeason: string
  difficulty: number
  basePoints: number
  description: string
}

export interface Level {
  id: number
  name: string
  description: string
  targetScore: number
  availableTelescopeIds: number[]
  availableFilterIds: number[]
  availableSkyRegionIds: number[]
  totalObservationSlots: number
  cloudCoverageVariance: number
  moonPhaseVariance: number
}

export interface PlayerProfile {
  id: number
  name: string
  totalScore: number
  highestLevel: number
  completedRuns: number
  createdAt: string
  updatedAt: string
}

export interface GameRun {
  id: number
  playerId: number
  levelId: number
  score: number
  status: 'in_progress' | 'completed' | 'failed'
  startTime: string
  endTime: string | null
  weatherSeed: number
}

export interface ObservationSlot {
  id: number
  runId: number
  slotIndex: number
  telescopeId: number | null
  filterId: number | null
  skyRegionId: number | null
  cloudCoverage: number
  moonPhase: number
  telescopeCooldown: number
  completed: boolean
  score: number
  observationTime: string | null
}

export interface ActionHistory {
  id: number
  runId: number
  actionType: 'assign_telescope' | 'assign_filter' | 'assign_skyregion' | 'complete_observation' | 'reset_slot'
  slotIndex: number
  payload: Record<string, any>
  timestamp: string
}

export interface WeatherCondition {
  cloudCoverage: number
  moonPhase: number
}
