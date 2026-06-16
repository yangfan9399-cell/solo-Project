import type { PlayerProfile } from '~/types/game'
import { generateId } from '~/utils/colorUtils'

const STORAGE_KEY = 'player_profiles'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { playerName } = body as { playerName: string }

  if (!playerName || playerName.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player name is required'
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

  const existingProfile = profiles.find(
    (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
  )

  if (existingProfile) {
    existingProfile.lastPlayed = Date.now()
    await storage.setItem(STORAGE_KEY, profiles)
    return { profile: existingProfile, isNew: false }
  }

  const newProfile: PlayerProfile = {
    id: generateId(),
    name: playerName.trim(),
    gold: 0,
    totalScore: 0,
    currentLevel: 1,
    unlockedLevels: [1],
    inventory: [],
    createdAt: Date.now(),
    lastPlayed: Date.now()
  }

  profiles.push(newProfile)
  await storage.setItem(STORAGE_KEY, profiles)

  return { profile: newProfile, isNew: true }
})
