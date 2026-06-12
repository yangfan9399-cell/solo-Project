import { useRecordsStore } from '~/stores/records'
import type { UserInfo } from '~/types'

export function useCurrentUser() {
  const store = useRecordsStore()

  const selectUser = (user: UserInfo) => {
    store.setCurrentUser(user)
    if (process.client) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  }

  const restoreUser = () => {
    if (process.client) {
      const saved = localStorage.getItem('currentUser')
      if (saved) {
        try {
          const user = JSON.parse(saved) as UserInfo
          store.setCurrentUser(user)
          return user
        } catch {}
      }
    }
    return null
  }

  const clearUser = () => {
    store.setCurrentUser(null as any)
    if (process.client) {
      localStorage.removeItem('currentUser')
    }
  }

  return {
    currentUser: computed(() => store.currentUser),
    isApplicant: computed(() => store.isApplicant),
    isReviewer: computed(() => store.isReviewer),
    selectUser,
    restoreUser,
    clearUser
  }
}
