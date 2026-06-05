import { ref, computed } from 'vue'
import type { Claim, ClaimStatus, UserRole, User } from './mockData'
import { mockClaims, mockUsers, mockPolicies, mockAccidents, mockCalculations, getUserById, getClaimWithDetails, statusLabels } from './mockData'

const claims = ref<Claim[]>([...mockClaims])
const currentRole = ref<UserRole>('HANDLER')
const currentUser = ref<User | null>(mockUsers[0])
const statusFilter = ref<ClaimStatus | 'ALL'>('ALL')

export function useClaimStore() {
  const filteredClaims = computed(() => {
    let result = [...claims.value]
    if (statusFilter.value !== 'ALL') {
      result = result.filter(c => c.status === statusFilter.value)
    }
    return result.map(c => ({
      ...c,
      policy: mockPolicies.find(p => p.id === c.policyId),
      accident: mockAccidents.find(a => a.id === c.accidentId)
    }))
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

  function getClaim(id: string) {
    const claim = claims.value.find(c => c.id === id)
    if (!claim) return null
    return getClaimWithDetails(id) || null
  }

  function updateDocumentStatus(claimId: string, documentId: string, status: any, remarks?: string) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    const doc = claim.documents.find(d => d.id === documentId)
    if (doc) {
      doc.status = status
      if (remarks) doc.remarks = remarks
      if (status === 'RECEIVED') {
        doc.receivedDate = new Date().toISOString().split('T')[0]
      }
    }

    addHistoryNode(claimId, '更新材料', claim.status, `更新了材料「${doc.name}」的状态为${statusLabels[status as keyof typeof statusLabels] || status}`)
  }

  function addReview(claimId: string, review: any) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    claim.reviews.push({
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString()
    })
  }

  function updateClaimStatus(claimId: string, status: ClaimStatus, remark?: string) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    const oldStatus = claim.status
    claim.status = status

    addHistoryNode(claimId, '状态变更', status, remark || `状态从「${statusLabels[oldStatus]}」变更为「${statusLabels[status]}」`)
  }

  function addHistoryNode(claimId: string, action: string, status: ClaimStatus, remark?: string) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    claim.historyNodes.push({
      id: `hist-${Date.now()}`,
      claimId,
      userId: currentUser.value?.id,
      action,
      status,
      remark,
      timestamp: new Date().toLocaleString('zh-CN')
    })
  }

  function archiveClaim(claimId: string, reason: string, conclusionText?: string) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    const oldStatus = claim.status
    claim.previousConclusion = oldStatus
    claim.previousConclusionText = conclusionText || statusLabels[oldStatus]
    claim.isArchived = true
    claim.archiveReason = reason
    claim.archiveDate = new Date().toISOString()
    claim.status = 'ARCHIVED'

    addHistoryNode(claimId, '归档', 'ARCHIVED', `卷宗已归档，原因：${reason}。原结论：${statusLabels[oldStatus]}`)
  }

  function reopenClaim(claimId: string, reason: string) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    const prevStatus = (claim.previousConclusion as ClaimStatus) || 'DRAFT'
    const prevConclusion = claim.previousConclusionText || statusLabels[prevStatus]
    const archiveReason = claim.archiveReason || '未记录'

    claim.isArchived = false
    claim.reopenedFrom = claim.previousConclusion
    claim.lastArchiveReason = claim.archiveReason
    claim.reopenReason = reason
    claim.reopenDate = new Date().toISOString()
    claim.previousConclusion = claim.previousConclusion
    claim.previousConclusionText = claim.previousConclusionText

    claim.status = 'REOPENED'
    addHistoryNode(claimId, '重新开启', 'REOPENED', `卷宗重新开启，原因：${reason}。旧结论：${prevConclusion}。原归档原因：${archiveReason}`)

    setTimeout(() => {
      const c = claims.value.find(cl => cl.id === claimId)
      if (c) {
        c.status = prevStatus
        addHistoryNode(claimId, '恢复处理', prevStatus, '卷宗恢复到重新开启前的处理状态，可继续办理')
      }
    }, 100)
  }

  function updateCalculation(claimId: string, calculation: any) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    if (claim.calculationId) {
      const calc = mockCalculations.find(c => c.id === claim.calculationId)
      if (calc) {
        Object.assign(calc, calculation)
      }
    } else {
      const newCalc = {
        id: `calc-${Date.now()}`,
        ...calculation
      }
      mockCalculations.push(newCalc)
      claim.calculationId = newCalc.id
    }
  }

  function resolveDispute(claimId: string, disputeId: string, resolutionNote: string) {
    const claim = claims.value.find(c => c.id === claimId)
    if (!claim) return

    const dispute = claim.disputeTerms.find(d => d.id === disputeId)
    if (dispute) {
      dispute.isResolved = true
      dispute.resolutionNote = resolutionNote
    }

    const allResolved = claim.disputeTerms.every(d => d.isResolved)
    if (allResolved && claim.status === 'LIABILITY_DISPUTE') {
      updateClaimStatus(claimId, 'UNDER_REVIEW', '所有争议已解决，恢复审核流程')
    }
  }

  return {
    claims,
    currentRole,
    currentUser,
    statusFilter,
    filteredClaims,
    stats,
    setRole,
    getClaim,
    updateDocumentStatus,
    addReview,
    updateClaimStatus,
    addHistoryNode,
    archiveClaim,
    reopenClaim,
    updateCalculation,
    resolveDispute
  }
}
