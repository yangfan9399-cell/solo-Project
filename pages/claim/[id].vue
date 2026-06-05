<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClaimStore } from '~/composables/useClaimStore'
import { statusLabels, statusColors, reviewResultLabels, roleLabels, documentStatusLabels } from '~/composables/mockData'
import type { ReviewResult, UserRole, DocumentStatus, Claim } from '~/composables/mockData'
import StatusBadge from '~/components/StatusBadge.vue'
import SectionCard from '~/components/SectionCard.vue'
import DocumentList from '~/components/DocumentList.vue'
import Timeline from '~/components/Timeline.vue'
import DocumentSupplementModal from '~/components/DocumentSupplementModal.vue'
import CalculationModal from '~/components/CalculationModal.vue'
import ReviewModal from '~/components/ReviewModal.vue'
import ApprovalModal from '~/components/ApprovalModal.vue'
import ArchiveModal from '~/components/ArchiveModal.vue'
import ReopenModal from '~/components/ReopenModal.vue'

const route = useRoute()
const router = useRouter()
const claimStore = useClaimStore()

const showDocSupplementModal = ref(false)
const showCalculationModal = ref(false)
const showReviewModal = ref(false)
const showApprovalModal = ref(false)
const showArchiveModal = ref(false)
const showReopenModal = ref(false)

const claimId = computed(() => route.params.id as string)

const claim = computed(() => {
  return claimStore.getClaim(claimId.value)
})

const isArchived = computed(() => claim.value?.isArchived)
const isLiabilityDispute = computed(() => claim.value?.status === 'LIABILITY_DISPUTE')

function goBack() {
  router.back()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

function getReviewResultClass(result: ReviewResult) {
  const classMap: Record<ReviewResult, string> = {
    PENDING: 'badge-gray',
    APPROVED: 'badge-success',
    REJECTED: 'badge-danger',
    SUPPLEMENT_REQUIRED: 'badge-warning',
    DISPUTE: 'badge-danger'
  }
  return classMap[result] || 'badge-gray'
}

function getStageLabel(stage: string) {
  const stageMap: Record<string, string> = {
    HANDLER: '经办人处理',
    REVIEWER: '审核人审核',
    APPROVER: '复核人审批'
  }
  return stageMap[stage] || stage
}

function canPerformAction(action: string) {
  if (isArchived.value && action !== 'reopen') return false

  const role = claimStore.currentRole.value
  const status = claim.value?.status

  if (action === 'supplement-doc') {
    return role === 'HANDLER' && ['DRAFT', 'MATERIALS_MISSING', 'MATERIALS_SUPPLEMENTED'].includes(status || '')
  }
  if (action === 'edit-calculation') {
    return role === 'HANDLER' && ['DRAFT', 'MATERIALS_MISSING', 'MATERIALS_SUPPLEMENTED', 'UNDER_REVIEW'].includes(status || '')
  }
  if (action === 'submit-review') {
    return role === 'HANDLER' && ['MATERIALS_SUPPLEMENTED', 'DRAFT'].includes(status || '')
  }
  if (action === 'review') {
    return role === 'REVIEWER' && ['UNDER_REVIEW', 'LIABILITY_DISPUTE', 'MATERIALS_SUPPLEMENTED'].includes(status || '')
  }
  if (action === 'approve') {
    return role === 'APPROVER' && ['UNDER_REVIEW', 'AMOUNT_EXCEEDED'].includes(status || '')
  }
  if (action === 'archive') {
    return role === 'APPROVER' && ['PAID', 'REJECTED', 'APPROVED'].includes(status || '')
  }
  if (action === 'reopen') {
    return role === 'APPROVER' && status === 'ARCHIVED'
  }
  if (action === 'print') {
    return true
  }
  return false
}

function handleSubmitReview() {
  if (!claim.value) return
  claimStore.updateClaimStatus(claimId.value, 'UNDER_REVIEW', '经办人提交审核')
  claimStore.addReview(claimId.value, {
    userId: claimStore.currentUser.value?.id,
    stage: 'HANDLER',
    result: 'APPROVED',
    opinion: '材料已收齐，提交审核。',
    isLiabilityConfirmed: false
  })
}

function handleDocSupplementSubmit(updates: any[]) {
  if (!claim.value) return
  updates.forEach((update: any) => {
    claimStore.updateDocumentStatus(claimId.value, update.documentId, update.status, update.remarks)
  })

  const allReceived = claim.value.documents.filter(d => d.required).every(d => d.status === 'RECEIVED')
  if (allReceived && claim.value.status === 'MATERIALS_MISSING') {
    claimStore.updateClaimStatus(claimId.value, 'MATERIALS_SUPPLEMENTED', '所有必需材料已收齐')
  }

  showDocSupplementModal.value = false
}

function handleCalculationSubmit(data: any) {
  if (!claim.value) return
  claimStore.updateCalculation(claimId.value, data)
  claimStore.addHistoryNode(claimId.value, '更新赔付计算', claim.value.status, '更新了赔付计算明细')

  if (data.limitExceeded && claim.value.status === 'UNDER_REVIEW') {
    claimStore.updateClaimStatus(claimId.value, 'AMOUNT_EXCEEDED', '赔付金额超限，需高级复核')
  }

  showCalculationModal.value = false
}

function handleReviewSubmit(data: any) {
  if (!claim.value) return

  claimStore.addReview(claimId.value, {
    userId: claimStore.currentUser.value?.id,
    stage: 'REVIEWER',
    result: data.result,
    opinion: data.opinion,
    isLiabilityConfirmed: data.isLiabilityConfirmed
  })

  if (data.result === 'APPROVED') {
    const calc = claim.value.calculation
    if (calc && calc.limitExceeded) {
      claimStore.updateClaimStatus(claimId.value, 'AMOUNT_EXCEEDED', '审核通过，金额超限需复核')
    } else {
      claimStore.updateClaimStatus(claimId.value, 'UNDER_REVIEW', '审核通过，提交复核')
    }
  } else if (data.result === 'SUPPLEMENT_REQUIRED') {
    claimStore.updateClaimStatus(claimId.value, 'MATERIALS_MISSING', '审核要求补充材料')
  } else if (data.result === 'DISPUTE') {
    claimStore.updateClaimStatus(claimId.value, 'LIABILITY_DISPUTE', '审核发现责任免除争议')
    if (data.disputeTerm) {
      claim.value.disputeTerms.push({
        id: `disp-${Date.now()}`,
        claimId: claimId.value,
        termClause: data.disputeTerm.clause,
        termDescription: data.disputeTerm.description,
        disputeReason: data.disputeTerm.reason,
        supplementPath: data.disputeTerm.path,
        isResolved: false
      })
    }
  } else if (data.result === 'REJECTED') {
    claimStore.updateClaimStatus(claimId.value, 'REJECTED', '审核拒绝')
  }

  showReviewModal.value = false
}

function handleApprovalSubmit(data: any) {
  if (!claim.value) return

  claimStore.addReview(claimId.value, {
    userId: claimStore.currentUser.value?.id,
    stage: 'APPROVER',
    result: data.result,
    opinion: data.opinion,
    isLiabilityConfirmed: true
  })

  if (data.result === 'APPROVED') {
    claimStore.updateClaimStatus(claimId.value, 'PAID', '复核批准，已完成赔付')
  } else if (data.result === 'REJECTED') {
    claimStore.updateClaimStatus(claimId.value, 'REJECTED', '复核拒绝赔付')
  } else if (data.result === 'SUPPLEMENT_REQUIRED') {
    claimStore.updateClaimStatus(claimId.value, 'MATERIALS_MISSING', '复核要求补充材料')
  }

  showApprovalModal.value = false
}

function handleArchiveSubmit(reason: string) {
  claimStore.archiveClaim(claimId.value, reason)
  showArchiveModal.value = false
}

function handleReopenSubmit(reason: string) {
  claimStore.reopenClaim(claimId.value, reason)
  showReopenModal.value = false
}

function getDocumentStatusClass(status: DocumentStatus) {
  const classMap: Record<DocumentStatus, string> = {
    PENDING: 'badge-gray',
    RECEIVED: 'badge-success',
    REJECTED: 'badge-danger',
    SUPPLEMENT_REQUIRED: 'badge-warning'
  }
  return classMap[status] || 'badge-gray'
}
</script>

<template>
  <div v-if="claim" class="claim-detail-page" :class="{ 'is-archived': isArchived }">
    <div v-if="isArchived" class="archive-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="21 8 21 21 3 21 3 8"></polyline>
        <rect x="1" y="3" width="22" height="5"></rect>
        <line x1="10" y1="12" x2="14" y2="12"></line>
      </svg>
      <span>该卷宗已归档，当前为只读模式。{{ claim.previousConclusion ? `原结论：${statusLabels[claim.previousConclusion as keyof typeof statusLabels] || claim.previousConclusion}` : '' }}</span>
      <button v-if="canPerformAction('reopen')" class="btn btn-sm btn-outline" @click.stop="showReopenModal = true">
        重新开启
      </button>
    </div>

    <div class="page-header">
      <div class="header-left">
        <button class="btn btn-secondary back-btn" @click="goBack()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          返回
        </button>
        <div class="claim-title">
          <h1 class="claim-no">{{ claim.claimNo }}</h1>
          <StatusBadge :status="claim.status" />
          <span v-if="claim.isArchived" class="badge badge-gray ml-2">已归档</span>
        </div>
      </div>
      <div class="header-right">
        <span class="create-time">创建时间：{{ claim.createdAt }}</span>
      </div>
    </div>

    <div class="detail-layout">
      <div class="main-content">
        <SectionCard title="保单信息">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">保单号</span>
              <span class="info-value font-mono">{{ claim.policy?.policyNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">被保险人</span>
              <span class="info-value">{{ claim.policy?.insuredName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">险种</span>
              <span class="info-value">{{ claim.policy?.policyType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">保额</span>
              <span class="info-value font-semibold text-primary">{{ formatCurrency(claim.policy?.coverageAmount || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">保费</span>
              <span class="info-value">{{ formatCurrency(claim.policy?.premium || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">保险期间</span>
              <span class="info-value">{{ claim.policy?.effectiveDate }} 至 {{ claim.policy?.expiryDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">受益人</span>
              <span class="info-value">{{ claim.policy?.beneficiary || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">身份证号</span>
              <span class="info-value font-mono">{{ claim.policy?.insuredIdNo }}</span>
            </div>
            <div v-if="claim.policy?.remarks" class="info-item info-item-full">
              <span class="info-label">备注</span>
              <span class="info-value">{{ claim.policy.remarks }}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="事故信息">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">事故类型</span>
              <span class="info-value">{{ claim.accident?.accidentType }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">事故日期</span>
              <span class="info-value">{{ claim.accident?.accidentDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">事故地点</span>
              <span class="info-value">{{ claim.accident?.accidentLocation }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">伤情程度</span>
              <span class="info-value">
                <span v-if="claim.accident?.injuryLevel" class="badge" :class="claim.accident?.injuryLevel === '重伤' ? 'badge-danger' : claim.accident?.injuryLevel === '重大疾病' ? 'badge-warning' : 'badge-info'">
                  {{ claim.accident.injuryLevel }}
                </span>
                <span v-else>-</span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">预估损失</span>
              <span class="info-value font-semibold text-warning">{{ formatCurrency(claim.accident?.damageAmount || 0) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">警方证明</span>
              <span class="info-value">{{ claim.accident?.policeReport || '-' }}</span>
            </div>
            <div class="info-item info-item-full">
              <span class="info-label">事故描述</span>
              <p class="info-value info-desc">{{ claim.accident?.description }}</p>
            </div>
            <div v-if="claim.accident?.witness" class="info-item info-item-full">
              <span class="info-label">证人</span>
              <span class="info-value">{{ claim.accident.witness }}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="材料清单">
          <template #actions>
            <button
              v-if="canPerformAction('supplement-doc')"
              class="btn btn-sm btn-primary"
              @click="showDocSupplementModal = true"
            >
              补正材料
            </button>
          </template>
          <DocumentList :documents="claim.documents" />
          <div class="doc-stats mt-3">
            <span class="text-sm text-gray-500">
              共 {{ claim.documents.length }} 份材料，
              必需 {{ claim.documents.filter(d => d.required).length }} 份，
              已收齐 {{ claim.documents.filter(d => d.status === 'RECEIVED').length }} 份
            </span>
          </div>
        </SectionCard>

        <SectionCard title="赔付计算">
          <template #actions>
            <button
              v-if="canPerformAction('edit-calculation')"
              class="btn btn-sm btn-primary"
              @click="showCalculationModal = true"
            >
              {{ claim.calculation ? '修改计算' : '新增计算' }}
            </button>
          </template>
          <div v-if="claim.calculation" class="calculation-section">
            <div class="calc-grid">
              <div class="calc-item">
                <span class="calc-label">总损失金额</span>
                <span class="calc-value">{{ formatCurrency(claim.calculation.totalLoss) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">免赔额</span>
                <span class="calc-value text-danger">- {{ formatCurrency(claim.calculation.deductible) }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">赔付比例</span>
                <span class="calc-value">{{ (claim.calculation.coverageRatio * 100).toFixed(0) }}%</span>
              </div>
              <div class="calc-item calc-result">
                <span class="calc-label">赔付金额</span>
                <span class="calc-value text-primary font-bold">{{ formatCurrency(claim.calculation.payableAmount) }}</span>
              </div>
            </div>
            <div v-if="claim.calculation.limitExceeded" class="limit-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>已达保额上限（{{ formatCurrency(claim.calculation.limitAmount || 0) }}），按限额赔付</span>
            </div>
            <div v-if="claim.calculation.calculationNote" class="calc-note">
              <span class="calc-note-label">计算说明：</span>
              <span>{{ claim.calculation.calculationNote }}</span>
            </div>
          </div>
          <div v-else class="empty-calculation">
            <p class="text-gray-500">暂无赔付计算，点击右上角按钮新增</p>
          </div>
        </SectionCard>

        <SectionCard v-if="isLiabilityDispute && claim.disputeTerms.length > 0" title="争议条款">
          <div class="dispute-warning-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>存在责任免除争议，暂不能进行赔付确认</span>
          </div>
          <div class="dispute-list">
            <div v-for="dispute in claim.disputeTerms" :key="dispute.id" class="dispute-item">
              <div class="dispute-header">
                <span class="dispute-clause">{{ dispute.termClause }}</span>
                <span v-if="dispute.isResolved" class="badge badge-success">已解决</span>
                <span v-else class="badge badge-danger">待处理</span>
              </div>
              <div class="dispute-desc">
                <span class="dispute-label">条款描述：</span>
                <span>{{ dispute.termDescription }}</span>
              </div>
              <div class="dispute-reason">
                <span class="dispute-label">争议原因：</span>
                <span>{{ dispute.disputeReason }}</span>
              </div>
              <div class="dispute-path">
                <span class="dispute-label">补证路径：</span>
                <div class="path-content">{{ dispute.supplementPath }}</div>
              </div>
              <div v-if="dispute.isResolved && dispute.resolutionNote" class="dispute-resolution">
                <span class="dispute-label">解决说明：</span>
                <span>{{ dispute.resolutionNote }}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard v-if="claim.reviews.length > 0" title="审核意见">
          <div class="review-list">
            <div v-for="review in claim.reviews" :key="review.id" class="review-item">
              <div class="review-header">
                <div class="review-stage">
                  <span class="stage-badge">{{ getStageLabel(review.stage) }}</span>
                  <span class="badge" :class="getReviewResultClass(review.result)">
                    {{ reviewResultLabels[review.result] }}
                  </span>
                </div>
                <div class="review-meta">
                  <span v-if="review.user" class="review-user">{{ review.user.name }}</span>
                  <span class="review-date">{{ review.createdAt }}</span>
                </div>
              </div>
              <div v-if="review.opinion" class="review-opinion">
                {{ review.opinion }}
              </div>
              <div class="review-liability">
                <span class="liability-label">责任确认：</span>
                <span :class="review.isLiabilityConfirmed ? 'text-success' : 'text-danger'">
                  {{ review.isLiabilityConfirmed ? '已确认' : '未确认' }}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="历史记录">
          <Timeline :history-nodes="claim.historyNodes" />
        </SectionCard>
      </div>

      <div class="sidebar">
        <div class="sidebar-card card">
          <div class="sidebar-card-header">
            <span class="sidebar-title">案件操作</span>
          </div>
          <div class="sidebar-card-body">
            <div class="action-buttons">
              <button
                v-if="canPerformAction('supplement-doc')"
                class="btn btn-primary w-full"
                @click="showDocSupplementModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                补正材料
              </button>
              <button
                v-if="canPerformAction('edit-calculation')"
                class="btn btn-secondary w-full"
                @click="showCalculationModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                赔付计算
              </button>
              <button
                v-if="canPerformAction('submit-review')"
                class="btn btn-success w-full"
                @click="handleSubmitReview"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                提交审核
              </button>
              <button
                v-if="canPerformAction('review')"
                class="btn btn-primary w-full"
                @click="showReviewModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                审核处理
              </button>
              <button
                v-if="canPerformAction('approve')"
                class="btn btn-success w-full"
                :disabled="isLiabilityDispute"
                @click="showApprovalModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                复核审批
              </button>
              <button
                v-if="canPerformAction('archive')"
                class="btn btn-secondary w-full"
                @click="showArchiveModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="21 8 21 21 3 21 3 8"></polyline>
                  <rect x="1" y="3" width="22" height="5"></rect>
                  <line x1="10" y1="12" x2="14" y2="12"></line>
                </svg>
                归档卷宗
              </button>
              <button
                v-if="canPerformAction('reopen')"
                class="btn btn-warning w-full"
                @click="showReopenModal = true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                重新开启
              </button>
              <div v-if="isLiabilityDispute && canPerformAction('approve')" class="dispute-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>存在责任争议，需先解决争议</span>
              </div>
              <div class="divider"></div>
              <button class="btn btn-outline w-full" @click="window.print()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                打印卷宗
              </button>
            </div>
          </div>
        </div>

        <div class="sidebar-card card">
          <div class="sidebar-card-header">
            <span class="sidebar-title">处理人员</span>
          </div>
          <div class="sidebar-card-body">
            <div class="handler-list">
              <div v-if="claim.handler" class="handler-item">
                <div class="handler-avatar">
                  <img :src="claim.handler.avatar" :alt="claim.handler.name" />
                </div>
                <div class="handler-info">
                  <span class="handler-name">{{ claim.handler.name }}</span>
                  <span class="handler-role">{{ roleLabels[claim.handler.role] }}</span>
                </div>
              </div>
              <div v-if="claim.reviewer" class="handler-item">
                <div class="handler-avatar">
                  <img :src="claim.reviewer.avatar" :alt="claim.reviewer.name" />
                </div>
                <div class="handler-info">
                  <span class="handler-name">{{ claim.reviewer.name }}</span>
                  <span class="handler-role">{{ roleLabels[claim.reviewer.role] }}</span>
                </div>
              </div>
              <div v-if="claim.approver" class="handler-item">
                <div class="handler-avatar">
                  <img :src="claim.approver.avatar" :alt="claim.approver.name" />
                </div>
                <div class="handler-info">
                  <span class="handler-name">{{ claim.approver.name }}</span>
                  <span class="handler-role">{{ roleLabels[claim.approver.role] }}</span>
                </div>
              </div>
              <div v-if="!claim.handler && !claim.reviewer && !claim.approver" class="empty-handlers">
                <span class="text-sm text-gray-500">暂无处理人员</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-card card">
          <div class="sidebar-card-header">
            <span class="sidebar-title">案件统计</span>
          </div>
          <div class="sidebar-card-body">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ claim.documents.length }}</span>
                <span class="stat-label">材料总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value text-success">{{ claim.documents.filter(d => d.status === 'RECEIVED').length }}</span>
                <span class="stat-label">已收齐</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ claim.reviews.length }}</span>
                <span class="stat-label">审核次数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ claim.historyNodes.length }}</span>
                <span class="stat-label">操作记录</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DocumentSupplementModal
      v-model:visible="showDocSupplementModal"
      :documents="claim.documents.filter(d => d.status !== 'RECEIVED')"
      @submit="handleDocSupplementSubmit"
    />

    <CalculationModal
      v-model:visible="showCalculationModal"
      :calculation="claim.calculation"
      :coverage-amount="claim.policy?.coverageAmount || 0"
      @submit="handleCalculationSubmit"
    />

    <ReviewModal
      v-model:visible="showReviewModal"
      :claim="claim"
      @submit="handleReviewSubmit"
    />

    <ApprovalModal
      v-model:visible="showApprovalModal"
      :claim="claim"
      @submit="handleApprovalSubmit"
    />

    <ArchiveModal
      v-model:visible="showArchiveModal"
      @submit="handleArchiveSubmit"
    />

    <ReopenModal
      v-model:visible="showReopenModal"
      :previous-conclusion="claim.previousConclusion || ''"
      @submit="handleReopenSubmit"
    />
  </div>

  <div v-else class="claim-detail-page">
    <div class="loading-state">
      <p>加载中...</p>
    </div>
  </div>
</template>

<style scoped>
.claim-detail-page {
  min-height: 100vh;
  padding: 24px 32px;
  padding-bottom: 60px;
}

.claim-detail-page.is-archived {
  opacity: 0.95;
}

.archive-banner {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: #fef3c7;
  color: #92400e;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #fde68a;
}

.archive-banner .btn {
  margin-left: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-top: 0;
}

.is-archived .page-header {
  padding-top: 50px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.claim-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.claim-no {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.create-time {
  font-size: 14px;
  color: var(--gray-500);
}

.detail-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 84px;
}

.is-archived .sidebar {
  top: 134px;
}

.font-mono {
  font-family: 'SF Mono', Monaco, monospace;
}

.ml-2 {
  margin-left: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item-full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 13px;
  color: var(--gray-500);
  font-weight: 400;
}

.info-value {
  font-size: 14px;
  color: var(--gray-800);
  font-weight: 500;
}

.info-desc {
  margin: 0;
  line-height: 1.6;
}

.calculation-section {
  padding: 4px 0;
}

.calc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.calc-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background-color: var(--gray-50);
  border-radius: var(--border-radius);
}

.calc-item.calc-result {
  background-color: #eff6ff;
}

.calc-label {
  font-size: 13px;
  color: var(--gray-500);
}

.calc-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-800);
}

.font-bold {
  font-weight: 700;
}

.limit-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #fffbeb;
  border-radius: var(--border-radius);
  color: #d97706;
  font-size: 14px;
}

.calc-note {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--gray-200);
  font-size: 14px;
  color: var(--gray-600);
  line-height: 1.6;
}

.calc-note-label {
  font-weight: 600;
  color: var(--gray-700);
}

.empty-calculation {
  text-align: center;
  padding: 30px;
}

.doc-stats {
  padding-top: 12px;
  border-top: 1px solid var(--gray-100);
}

.dispute-warning-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  color: #dc2626;
  font-weight: 500;
  margin-bottom: 16px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 16px;
  background-color: var(--gray-50);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary-color);
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.review-stage {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stage-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-color);
  background-color: #dbeafe;
  border-radius: 4px;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--gray-500);
}

.review-user {
  font-weight: 500;
  color: var(--gray-700);
}

.review-opinion {
  font-size: 14px;
  color: var(--gray-700);
  line-height: 1.6;
  margin-bottom: 10px;
}

.review-liability {
  font-size: 13px;
  color: var(--gray-600);
}

.liability-label {
  color: var(--gray-500);
}

.dispute-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dispute-item {
  padding: 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
}

.dispute-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.dispute-clause {
  font-size: 15px;
  font-weight: 600;
  color: var(--danger-color);
}

.dispute-desc,
.dispute-reason,
.dispute-path,
.dispute-resolution {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--gray-700);
  line-height: 1.6;
}

.path-content {
  white-space: pre-line;
}

.dispute-resolution {
  margin-bottom: 0;
  padding-top: 10px;
  border-top: 1px dashed #fecaca;
  color: var(--success-color);
}

.dispute-label {
  font-weight: 600;
  color: var(--gray-600);
}

.sidebar-card {
  overflow: hidden;
}

.sidebar-card-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--gray-200);
  background-color: var(--gray-50);
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
}

.sidebar-card-body {
  padding: 16px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-buttons .btn {
  justify-content: center;
  gap: 8px;
}

.dispute-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background-color: #fef2f2;
  border-radius: var(--border-radius);
  color: #dc2626;
  font-size: 12px;
  line-height: 1.4;
}

.handler-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.handler-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.handler-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--gray-100);
}

.handler-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.handler-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.handler-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
}

.handler-role {
  font-size: 12px;
  color: var(--gray-500);
}

.empty-handlers {
  text-align: center;
  padding: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background-color: var(--gray-50);
  border-radius: var(--border-radius);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-800);
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--gray-500);
}

.divider {
  height: 1px;
  background-color: var(--gray-200);
  margin: 8px 0;
}

@media (max-width: 1024px) {
  .detail-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: static;
  }
}

@media (max-width: 640px) {
  .claim-detail-page {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .calc-grid {
    grid-template-columns: 1fr;
  }

  .claim-no {
    font-size: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .is-archived .page-header {
    padding-top: 60px;
  }
}

@media print {
  .sidebar,
  .archive-banner .btn,
  .back-btn {
    display: none !important;
  }

  .claim-detail-page {
    padding: 0;
  }

  .page-header {
    padding-top: 0 !important;
  }
}
</style>
