<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Claim } from '~/composables/mockData'
import { statusLabels } from '~/composables/mockData'
import Modal from './Modal.vue'

type ApprovalResult = 'APPROVED' | 'RETURNED' | 'REJECTED'

interface Props {
  visible: boolean
  claim: Claim
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [result: { result: ApprovalResult; opinion: string }]
}>()

const approvalResult = ref<ApprovalResult>('APPROVED')
const opinion = ref<string>('')

watch(() => props.visible, (visible) => {
  if (visible) {
    approvalResult.value = 'APPROVED'
    opinion.value = ''
  }
})

const isLiabilityDispute = computed(() => props.claim.status === 'LIABILITY_DISPUTE')

const canSubmit = computed(() => {
  if (!opinion.value.trim()) return false
  if (isLiabilityDispute.value && approvalResult.value === 'APPROVED') return false
  return true
})

const resultOptions = [
  { value: 'APPROVED', label: '批准赔付', class: 'success' },
  { value: 'RETURNED', label: '退回', class: 'warning' },
  { value: 'REJECTED', label: '拒绝', class: 'danger' }
]

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    result: approvalResult.value,
    opinion: opinion.value
  })
}

function formatAmount(amount?: number): string {
  if (!amount) return '-'
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}
</script>

<template>
  <Modal title="复核审批" :visible="visible" width="600px" @close="emit('close')">
    <div class="approval-modal">
      <div class="claim-summary card">
        <div class="summary-title">案件摘要</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">案件编号</span>
            <span class="item-value">{{ claim.claimNo }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">当前状态</span>
            <span class="badge" :class="{ 'badge-danger': isLiabilityDispute, 'badge-primary': !isLiabilityDispute }">
              {{ statusLabels[claim.status] }}
            </span>
          </div>
          <div class="summary-item">
            <span class="item-label">保单类型</span>
            <span class="item-value">{{ claim.policy?.policyType || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">被保险人</span>
            <span class="item-value">{{ claim.policy?.insuredName || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">事故类型</span>
            <span class="item-value">{{ claim.accident?.accidentType || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">保单保额</span>
            <span class="item-value">{{ formatAmount(claim.policy?.coverageAmount) }}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="payout-section">
          <span class="payout-label">建议赔付金额</span>
          <span class="payout-amount">{{ formatAmount(claim.calculation?.payableAmount) }}</span>
        </div>
      </div>

      <div v-if="isLiabilityDispute" class="dispute-warning">
        <span class="warning-icon">!</span>
        <div class="warning-content">
          <div class="warning-title">案件存在责任争议</div>
          <div class="warning-desc">该案件目前处于责任争议状态，请先处理争议事项，暂不可批准赔付。</div>
        </div>
      </div>

      <div class="form-group">
        <label class="label">审批结果</label>
        <div class="result-options">
          <label
            v-for="option in resultOptions"
            :key="option.value"
            :class="[
              'result-option',
              { active: approvalResult === option.value },
              { [`option-${option.class}`]: true },
              { disabled: option.value === 'APPROVED' && isLiabilityDispute }
            ]"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="approvalResult"
              :disabled="option.value === 'APPROVED' && isLiabilityDispute"
              style="display: none"
            />
            {{ option.label }}
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="label">审批意见</label>
        <textarea
          v-model="opinion"
          class="textarea"
          placeholder="请输入审批意见..."
          rows="4"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="!canSubmit" @click="handleSubmit">提交审批</button>
    </template>
  </Modal>
</template>

<style scoped>
.approval-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.claim-summary {
  padding: 16px;
  background-color: var(--gray-50);
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 12px;
  color: var(--gray-500);
}

.item-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-800);
}

.payout-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.payout-label {
  font-size: 14px;
  color: var(--gray-600);
}

.payout-amount {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.dispute-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
}

.warning-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--danger-color);
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--danger-color);
  margin-bottom: 4px;
}

.warning-desc {
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.5;
}

.result-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.result-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-300);
  background-color: white;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-option:hover:not(.disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.result-option.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.result-option.option-success.active {
  background-color: var(--success-color);
  border-color: var(--success-color);
}

.result-option.option-warning.active {
  background-color: var(--warning-color);
  border-color: var(--warning-color);
}

.result-option.option-danger.active {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
}

.result-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
