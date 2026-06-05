<script setup lang="ts">
import { useClaimStore } from '~/composables/useClaimStore'
import type { ClaimStatus } from '~/composables/mockData'
import StatusBadge from '~/components/StatusBadge.vue'
import { getUserById } from '~/composables/mockData'

const { stats, statusFilter, filteredClaims } = useClaimStore()

const filterTabs: Array<{ key: ClaimStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'DRAFT', label: '草稿' },
  { key: 'MATERIALS_MISSING', label: '材料缺失' },
  { key: 'UNDER_REVIEW', label: '审核中' },
  { key: 'LIABILITY_DISPUTE', label: '责任争议' },
  { key: 'AMOUNT_EXCEEDED', label: '金额超限' },
  { key: 'PAID', label: '已赔付' },
  { key: 'ARCHIVED', label: '已归档' }
]

function setFilter(filter: ClaimStatus | 'ALL') {
  statusFilter.value = filter
}

function goToDetail(id: string) {
  navigateTo(`/claim/${id}`)
}

function getHandlerName(handlerId?: string) {
  if (!handlerId) return '-'
  const user = getUserById(handlerId)
  return user?.name || '-'
}
</script>

<template>
  <div class="claim-list-page">
    <div class="page-header">
      <h1 class="page-title">理赔卷宗管理</h1>
      <p class="page-desc">管理和处理所有理赔案件卷宗</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon stat-icon-total">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">总数</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon stat-icon-pending">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending }}</span>
          <span class="stat-label">待处理</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon stat-icon-dispute">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.dispute }}</span>
          <span class="stat-label">争议中</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon stat-icon-paid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.paid }}</span>
          <span class="stat-label">已赔付</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon stat-icon-archived">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.archived }}</span>
          <span class="stat-label">已归档</span>
        </div>
      </div>
    </div>

    <div class="card claim-table-card">
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          :class="['filter-tab', { active: statusFilter === tab.key }]"
          @click="setFilter(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="table-wrapper">
        <table class="claim-table">
          <thead>
            <tr>
              <th>案件号</th>
              <th>保单号</th>
              <th>被保险人</th>
              <th>事故类型</th>
              <th>状态</th>
              <th>经办人</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="claim in filteredClaims"
              :key="claim.id"
              class="claim-row"
              @click="goToDetail(claim.id)"
            >
              <td class="claim-no">{{ claim.claimNo }}</td>
              <td class="policy-no">{{ claim.policy?.policyNo || '-' }}</td>
              <td class="insured-name">{{ claim.policy?.insuredName || '-' }}</td>
              <td class="accident-type">{{ claim.accident?.accidentType || '-' }}</td>
              <td>
                <StatusBadge :status="claim.status" />
              </td>
              <td class="handler">{{ getHandlerName(claim.handlerId) }}</td>
              <td class="created-at">{{ claim.createdAt }}</td>
            </tr>
            <tr v-if="filteredClaims.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>暂无数据</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claim-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 4px;
}

.page-desc {
  font-size: 14px;
  color: var(--gray-500);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon-total {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
}

.stat-icon-pending {
  background: linear-gradient(135deg, var(--warning-color), #d97706);
}

.stat-icon-dispute {
  background: linear-gradient(135deg, var(--danger-color), #dc2626);
}

.stat-icon-paid {
  background: linear-gradient(135deg, var(--success-color), #16a34a);
}

.stat-icon-archived {
  background: linear-gradient(135deg, var(--gray-500), var(--gray-600));
}

.stat-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-900);
}

.stat-label {
  font-size: 13px;
  color: var(--gray-500);
}

.claim-table-card {
  padding: 0;
  overflow: hidden;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-200);
  background-color: var(--gray-50);
  overflow-x: auto;
}

.filter-tab {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-tab:hover {
  background-color: var(--gray-100);
  color: var(--gray-700);
}

.filter-tab.active {
  background-color: var(--primary-color);
  color: white;
}

.table-wrapper {
  overflow-x: auto;
}

.claim-table {
  width: 100%;
}

.claim-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.claim-row:hover {
  background-color: #f0f7ff;
}

.claim-no {
  font-weight: 600;
  color: var(--primary-color);
}

.policy-no {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: var(--gray-600);
}

.insured-name {
  color: var(--gray-800);
}

.accident-type {
  color: var(--gray-700);
}

.handler {
  color: var(--gray-600);
}

.created-at {
  color: var(--gray-500);
  font-size: 13px;
}

.empty-row {
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--gray-400);
  gap: 12px;
}

.empty-state svg {
  width: 48px;
  height: 48px;
}

.empty-state span {
  font-size: 14px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .claim-list-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 14px;
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>
