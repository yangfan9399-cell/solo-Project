import type { User, UserRole } from '../types'

const currentUser = ref<User | null>(null)

export function useAuth() {
  const users = ref<User[]>([])
  const loading = ref(false)

  async function fetchUsers() {
    loading.value = true
    try {
      const { data } = await useFetch<{ users: User[] }>('/api/users')
      if (data.value) {
        users.value = data.value.users
      }
    } finally {
      loading.value = false
    }
  }

  function setUser(user: User) {
    currentUser.value = user
    if (process.client) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  }

  function logout() {
    currentUser.value = null
    if (process.client) {
      localStorage.removeItem('currentUser')
    }
  }

  function initUser() {
    if (process.client) {
      const saved = localStorage.getItem('currentUser')
      if (saved) {
        currentUser.value = JSON.parse(saved)
      }
    }
  }

  function hasRole(roles: UserRole[]) {
    if (!currentUser.value) return false
    return roles.includes(currentUser.value.role)
  }

  return {
    currentUser,
    users,
    loading,
    fetchUsers,
    setUser,
    logout,
    initUser,
    hasRole
  }
}
