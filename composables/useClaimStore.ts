import { ref, computed } from 'vue'
import type { Claim, ClaimStatus, UserRole, User } from './mockData'
import { mockUsers, statusLabels } from './mockData'

const claims = ref<Claim[]>([])
const currentRole = ref<UserRole>('HANDLER')
const currentUser = ref<User | null>(mockUsers[0])
const statusFilter = ref<ClaimStatus | 'ALL'>('ALL')
const currentClaim = ref<Claim | null>(null)
const loading = ref(false)

export function useClaimStore() {
  const filteredClaims = computed(() => {
    let result = [...claims.value]
    if (statusFilter.value !== 'ALL') {
      result = result.filter(c => c.status === statusFilter.value)
    }
    return result
  })

  const stats = computed(() => {
    return {
      total: claims.value.length,
      pending: claims.value.filter(c => ['DRAFT', 'MATERIALS_MISSING', 'MATERIALS_SUPPLEMENTED', 'UNDER_REVIEW'].includes(c.status)).length,
      dispute: claims.value.filter(c => c.status === 'LIABILITY_DISPUTE').length,
      paid: claims.value.filter(c => c.status === 'PAID').length,
      archived: claims.value.filter(c => c.isArchived).length
    }
  })

  function setRole(role: UserRole) {
    currentRole.value = role
    currentUser.value = mockUsers.find(u => u.role === role) || null
  }

  async function loadClaims() {
    try {
      const params: any = {}
      if (statusFilter.value !== 'ALL') {
        params.status = statusFilter.value
      }
      const data = await $fetch<Claim[]>('/api/claims', { query: params })
      claims.value = data
    } catch (e) {
      console.error('加载卷宗列表失败', e)
    }
  }

  async function loadClaim(id: string) {
    loading.value = true
    try {
      const data = await $fetch<Claim>(`/api/claims/${id}`)
      currentClaim.value = data
      return data
    } catch (e) {
      console.error('加载卷宗详情失败', e)
      return null
    } finally {
      loading.value = false
    }
  }

  function getClaim(id: string) {
    if (currentClaim.value && currentClaim.value.id === id) {
      return currentClaim.value
    }
    return null
  }

  async function submitReview(claimId: string, data: {
    result: string
    opinion: string
    isLiabilityConfirmed: boolean
    disputeTerms?: {
      termClause: string
      termDescription: string
      disputeReason: string
      supplementPath: string
    }
  }) {
    const userId = currentUser.value?.id
    if (!userId) return null

    loading.value = true
    try {
      const updated = await $fetch<Claim>(`/api/claims/${claimId}/review`, {
        method: 'POST',
        body: {
          ...data,
          userId
        }
      })
      currentClaim.value = updated
      return updated
    } catch (e) {
      console.error('提交审核失败', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function submitApproval(claimId: string, data: {
    result: string
    opinion: string
  }) {
    const userId = currentUser.value?.id
    if (!userId) return null

    loading.value = true
    try {
      const updated = await $fetch<Claim>(`/api/claims/${claimId}/approval`, {
        method: 'POST',
        body: {
          ...data,
          userId
        }
      })
      currentClaim.value = updated
      return updated
    } catch (e) {
      console.error('提交审批失败', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function archiveClaim(claimId: string, reason: string, conclusionText?: string) {
    const userId = currentUser.value?.id
    if (!userId) return null

    loading.value = true
    try {
      const updated = await $fetch<Claim>(`/api/claims/${claimId}/archive`, {
        method: 'POST',
        body: {
          archiveReason: reason,
          conclusionText,
          userId
        }
      })
      currentClaim.value = updated
      return updated
    } catch (e) {
      console.error('归档失败', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function reopenClaim(claimId: string, reason: string) {
    const userId = currentUser.value?.id
    if (!userId) return null

    loading.value = true
    try {
      const updated = await $fetch<Claim>(`/api/claims/${claimId}/reopen`, {
        method: 'POST',
        body: {
          reopenReason: reason,
          userId
        }
      })
      currentClaim.value = updated
      return updated
    } catch (e) {
      console.error('重新开启失败', e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    claims,
    currentRole,
    currentUser,
    statusFilter,
    filteredClaims,
    stats,
    loading,
    currentClaim,
    setRole,
    loadClaims,
    loadClaim,
    getClaim,
    submitReview,
    submitApproval,
    archiveClaim,
    reopenClaim
  }
}
