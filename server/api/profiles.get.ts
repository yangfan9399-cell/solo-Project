import type { PlayerProfile } from '~/types/game'

const STORAGE_KEY = 'player_profiles'

export default defineEventHandler(() => {
  const storage = useStorage('game-data')

  return storage.getItem(STORAGE_KEY).then((data) => {
    if (!data) {
      return { profiles: [] }
    }
    const profiles = data as PlayerProfile[]
    return {
      profiles: profiles.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10)
    }
  }).catch(() => {
    return { profiles: [] }
  })
})
