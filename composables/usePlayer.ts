import type { PlayerProfile } from '~/types/game'

const STORAGE_KEY = 'dye_workshop_profile'

const profile = ref<PlayerProfile | null>(null)
const isLoading = ref(false)

export function usePlayer() {
  const isLoggedIn = computed(() => profile.value !== null)

  const loadFromLocal = () => {
    if (process.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          profile.value = JSON.parse(saved)
        } catch (e) {
          profile.value = null
        }
      }
    }
  }

  const saveToLocal = () => {
    if (process.client && profile.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
    }
  }

  const login = async (name: string) => {
    isLoading.value = true
    try {
      const { data } = await useFetch('/api/profile/login', {
        method: 'post',
        body: { playerName: name }
      })
      if (data.value) {
        profile.value = (data.value as any).profile
        saveToLocal()
        return { success: true, isNew: (data.value as any).isNew }
      }
      return { success: false }
    } catch (e) {
      if (process.client) {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.name === name) {
            profile.value = parsed
            return { success: true, isNew: false }
          }
        }
        const newProfile: PlayerProfile = {
          id: 'local_' + Date.now(),
          name: name.trim(),
          gold: 0,
          totalScore: 0,
          currentLevel: 1,
          unlockedLevels: [1],
          inventory: [],
          createdAt: Date.now(),
          lastPlayed: Date.now()
        }
        profile.value = newProfile
        saveToLocal()
        return { success: true, isNew: true }
      }
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (updates: Partial<PlayerProfile>) => {
    if (!profile.value) return false

    profile.value = { ...profile.value, ...updates }
    saveToLocal()

    try {
      await $fetch('/api/profile/save', {
        method: 'post',
        body: { profile: profile.value }
      })
    } catch (e) {
      // 离线模式下忽略服务器错误
    }

    return true
  }

  const logout = () => {
    profile.value = null
    if (process.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const addGold = async (amount: number) => {
    if (!profile.value) return
    await updateProfile({ gold: profile.value.gold + amount })
  }

  const addScore = async (amount: number) => {
    if (!profile.value) return
    await updateProfile({ totalScore: profile.value.totalScore + amount })
  }

  const unlockLevel = async (levelId: number) => {
    if (!profile.value) return
    if (!profile.value.unlockedLevels.includes(levelId)) {
      await updateProfile({
        unlockedLevels: [...profile.value.unlockedLevels, levelId].sort((a, b) => a - b)
      })
    }
  }

  return {
    profile,
    isLoading,
    isLoggedIn,
    loadFromLocal,
    login,
    updateProfile,
    logout,
    addGold,
    addScore,
    unlockLevel
  }
}
