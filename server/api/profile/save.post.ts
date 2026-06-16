import type { PlayerProfile } from '~/types/game'

const STORAGE_KEY = 'player_profiles'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { profile } = body as { profile: PlayerProfile }

  if (!profile || !profile.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid profile data'
    })
  }

  const storage = useStorage('game-data')
  let profiles: PlayerProfile[] = []

  try {
    const existing = await storage.getItem(STORAGE_KEY)
    if (existing) {
      profiles = existing as PlayerProfile[]
    }
  } catch (e) {
    profiles = []
  }

  const index = profiles.findIndex((p) => p.id === profile.id)

  if (index >= 0) {
    profiles[index] = { ...profile, lastPlayed: Date.now() }
  } else {
    profiles.push(profile)
  }

  await storage.setItem(STORAGE_KEY, profiles)

  return { success: true, profile: profiles.find((p) => p.id === profile.id) }
})
