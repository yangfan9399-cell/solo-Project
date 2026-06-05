interface CurrentUser {
  id: number
  name: string
  role: 'OPERATOR' | 'REVIEWER'
}

export const useCurrentUser = () => {
  const user = useState<CurrentUser | null>('currentUser', () => null)
  const isLoading = useState('userLoading', () => false)

  const isOperator = computed(() => user.value?.role === 'OPERATOR')
  const isReviewer = computed(() => user.value?.role === 'REVIEWER')

  const canEditMaterial = computed(() => isOperator.value || isReviewer.value)
  const canRemoveTourist = computed(() => isOperator.value || isReviewer.value)
  const canSubmit = computed(() => isReviewer.value)
  const canReject = computed(() => isReviewer.value)
  const canArchive = computed(() => isReviewer.value)

  const fetchUser = async (userId = 1) => {
    isLoading.value = true
    try {
      user.value = await $fetch<CurrentUser>('/api/user/current', {
        query: { userId }
      })
    } catch (e) {
      console.error('获取用户信息失败', e)
    } finally {
      isLoading.value = false
    }
  }

  const switchUser = async (role: 'OPERATOR' | 'REVIEWER') => {
    const userId = role === 'OPERATOR' ? 1 : 2
    await fetchUser(userId)
  }

  return {
    user,
    isLoading,
    isOperator,
    isReviewer,
    canEditMaterial,
    canRemoveTourist,
    canSubmit,
    canReject,
    canArchive,
    fetchUser,
    switchUser
  }
}
