import { defineStore } from 'pinia'
import type { Telescope, Filter, SkyRegion, Level, PlayerProfile, GameRun, ObservationSlot, ActionHistory } from '~/types'

interface GameState {
  telescopes: Telescope[]
  filters: Filter[]
  skyRegions: SkyRegion[]
  levels: Level[]
  profiles: PlayerProfile[]
  currentProfile: PlayerProfile | null
  currentLevel: Level | null
  currentRun: (GameRun & { slots: ObservationSlot[]; history: ActionHistory[] }) | null
  selectedSlotIndex: number | null
  loading: boolean
  lastScoreBreakdown: Record<string, number> | null
  settlementResult: any | null
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    telescopes: [],
    filters: [],
    skyRegions: [],
    levels: [],
    profiles: [],
    currentProfile: null,
    currentLevel: null,
    currentRun: null,
    selectedSlotIndex: null,
    loading: false,
    lastScoreBreakdown: null,
    settlementResult: null,
  }),

  getters: {
    availableTelescopes(state): Telescope[] {
      if (!state.currentLevel) return state.telescopes
      return state.telescopes.filter(t => state.currentLevel!.availableTelescopeIds.includes(t.id))
    },
    availableFilters(state): Filter[] {
      if (!state.currentLevel) return state.filters
      return state.filters.filter(f => state.currentLevel!.availableFilterIds.includes(f.id))
    },
    availableSkyRegions(state): SkyRegion[] {
      if (!state.currentLevel) return state.skyRegions
      return state.skyRegions.filter(s => state.currentLevel!.availableSkyRegionIds.includes(s.id))
    },
    selectedSlot(state): ObservationSlot | null {
      if (state.selectedSlotIndex === null || !state.currentRun) return null
      return state.currentRun.slots[state.selectedSlotIndex] || null
    },
    totalRunScore(state): number {
      if (!state.currentRun) return 0
      return state.currentRun.slots.reduce((sum, s) => sum + s.score, 0)
    },
    completedSlotsCount(state): number {
      if (!state.currentRun) return 0
      return state.currentRun.slots.filter(s => s.completed).length
    },
  },

  actions: {
    async loadStaticData() {
      this.loading = true
      try {
        const [telescopes, filters, skyRegions, levels, profiles] = await Promise.all([
          $fetch<Telescope[]>('/api/telescopes'),
          $fetch<Filter[]>('/api/filters'),
          $fetch<SkyRegion[]>('/api/sky-regions'),
          $fetch<Level[]>('/api/levels'),
          $fetch<PlayerProfile[]>('/api/player-profiles'),
        ])
        this.telescopes = telescopes
        this.filters = filters
        this.skyRegions = skyRegions
        this.levels = levels
        this.profiles = profiles
        if (!this.currentProfile && profiles.length > 0) {
          this.currentProfile = profiles[0]
        }
      } finally {
        this.loading = false
      }
    },

    async createProfile(name: string) {
      const profile = await $fetch<PlayerProfile>('/api/player-profiles', {
        method: 'POST',
        body: { name },
      })
      this.profiles.push(profile)
      this.currentProfile = profile
      return profile
    },

    selectProfile(profile: PlayerProfile) {
      this.currentProfile = profile
    },

    selectLevel(level: Level) {
      this.currentLevel = level
    },

    async startGame(levelId: number) {
      if (!this.currentProfile) return
      this.loading = true
      try {
        const run = await $fetch<any>('/api/game-runs', {
          method: 'POST',
          body: { playerId: this.currentProfile.id, levelId },
        })
        this.currentRun = { ...run, history: [] }
        this.selectedSlotIndex = 0
        this.settlementResult = null
        return run
      } finally {
        this.loading = false
      }
    },

    async loadRun(runId: number) {
      this.loading = true
      try {
        const run = await $fetch<any>(`/api/game-runs/${runId}`)
        this.currentRun = run
        this.selectedSlotIndex = 0
        return run
      } finally {
        this.loading = false
      }
    },

    selectSlot(index: number) {
      this.selectedSlotIndex = index
    },

    async assignToSlot(slotIndex: number, params: { telescopeId?: number; filterId?: number; skyRegionId?: number }) {
      if (!this.currentRun) return
      const updatedSlot = await $fetch<any>(`/api/game-runs/${this.currentRun.id}/assign`, {
        method: 'PATCH',
        body: { slotIndex, ...params },
      })
      this.currentRun.slots[slotIndex] = updatedSlot
    },

    async completeObservation(slotIndex: number) {
      if (!this.currentRun) return
      this.loading = true
      try {
        const result = await $fetch<any>(`/api/game-runs/${this.currentRun.id}/complete`, {
          method: 'POST',
          body: { slotIndex },
        })
        this.currentRun.slots[slotIndex] = result.slot
        this.currentRun.score = result.runScore
        this.lastScoreBreakdown = result.scoreBreakdown
        return result
      } finally {
        this.loading = false
      }
    },

    async settleRun() {
      if (!this.currentRun) return
      this.loading = true
      try {
        const result = await $fetch<any>(`/api/game-runs/${this.currentRun.id}/settle`, {
          method: 'POST',
        })
        this.settlementResult = result
        this.currentRun.status = result.status
        this.currentRun.score = result.finalScore
        if (this.currentProfile && this.currentProfile.id === result.player.id) {
          this.currentProfile = result.player
          const idx = this.profiles.findIndex(p => p.id === result.player.id)
          if (idx >= 0) this.profiles[idx] = result.player
        }
        return result
      } finally {
        this.loading = false
      }
    },

    resetCurrentRun() {
      this.currentRun = null
      this.selectedSlotIndex = null
      this.settlementResult = null
      this.lastScoreBreakdown = null
    },
  },
})
