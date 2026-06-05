<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Claim, ReviewResult } from '~/composables/mockData'
import { statusLabels } from '~/composables/mockData'
import Modal from './Modal.vue'

interface Props {
  visible: boolean
  claim: Claim
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [result: {
    result: ReviewResult
    opinion: string
    isLiabilityConfirmed: boolean
    disputeTerms?: {
      termClause: string
      termDescription: string
      disputeReason: string
      supplementPath: string
    }
  }]
}>()

const reviewResult = ref<ReviewResult>('APPROVED')
const opinion = ref<string>('')
const isLiabilityConfirmed = ref<boolean>(false)
const disputeTermClause = ref<string>('')
const disputeTermDescription = ref<string>('')
const disputeReason = ref<string>('')
const disputeSupplementPath = ref<string>('')

watch(() => props.visible, (visible) => {
  if (visible) {
    reviewResult.value = 'APPROVED'
    opinion.value = ''
    isLiabilityConfirmed.value = false
    disputeTermClause.value = ''
    disputeTermDescription.value = ''
    disputeReason.value = ''
    disputeSupplementPath.value = ''
  }
})

const isDispute = computed(() => reviewResult.value === 'DISPUTE')

const canSubmit = computed(() => {
  if (!opinion.value.trim()) return false
  if (isDispute.value) {
    if (!disputeTermClause.value.trim() || !disputeTermDescription.value.trim() || !disputeReason.value.trim() || !disputeSupplementPath.value.trim()) return false
  }
  return true
})

const resultOptions = [
  { value: 'APPROVED', label: '通过', class: 'success' },
  { value: 'SUPPLEMENT_REQUIRED', label: '需补充材料', class: 'warning' },
  { value: 'DISPUTE', label: '责任争议', class: 'danger' },
  { value: 'REJECTED', label: '拒绝', class: 'danger' }
]

function handleSubmit() {
  if (!canSubmit.value) return
  const result = {
    result: reviewResult.value,
    opinion: opinion.value,
    isLiabilityConfirmed: isLiabilityConfirmed.value
  } as any
  if (isDispute.value) {
    result.disputeTerms = {
      termClause: disputeTermClause.value,
      termDescription: disputeTermDescription.value,
      disputeReason: disputeReason.value,
      supplementPath: disputeSupplementPath.value
    }
  }
  emit('submit', result)
}

function formatAmount(amount?: number): string {
  if (!amount) return '-'
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}
</script>

<template>
  <Modal title="案件审核" :visible="visible" width="640px" @close="emit('close')">
    <div class="review-modal">
      <div class="claim-summary card">
        <div class="summary-title">案件基本信息</div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="item-label">案件编号</span>
            <span class="item-value">{{ claim.claimNo }}</span>
          </div>
          <div class="summary-item">
            <span class="item-label">当前状态</span>
            <span class="badge badge-primary">{{ statusLabels[claim.status] }}</span>
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
          <div class="summary-item full-width">
            <span class="item-label">赔付金额</span>
            <span class="item-value amount-primary">{{ formatAmount(claim.calculation?.payableAmount) }}</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="label">审核结果</label>
        <div class="result-options">
          <label
            v-for="option in resultOptions"
            :key="option.value"
            :class="['result-option', { active: reviewResult === option.value, [`option-${option.class}`]: true }]"
          >
            <input
              type="radio"
              :value="option.value"
              v-model="reviewResult"
              style="display: none"
            />
            {{ option.label }}
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" v-model="isLiabilityConfirmed" />
          <span class="checkbox-label">责任确认</span>
          <span class="checkbox-hint text-gray-500 text-sm">确认保险责任成立</span>
        </label>
      </div>

      <div v-if="isDispute" class="dispute-section card">
        <div class="dispute-title">争议条款信息</div>
        <div class="form-group">
          <label class="label">争议条款 <span class="required">*</span></label>
          <input
            v-model="disputeTermClause"
            type="text"
            class="input"
            placeholder="请输入争议条款编号及名称，如：第5条 责任免除"
          />
        </div>
        <div class="form-group">
          <label class="label">条款描述 <span class="required">*</span></label>
          <textarea
            v-model="disputeTermDescription"
            class="textarea"
            placeholder="请输入条款的具体内容描述..."
            rows="2"
          ></textarea>
        </div>
        <div class="form-group">
          <label class="label">争议理由 <span class="required">*</span></label>
          <textarea
            v-model="disputeReason"
            class="textarea"
            placeholder="请详细说明认定为责任争议的理由..."
            rows="3"
          ></textarea>
        </div>
        <div class="form-group">
          <label class="label">补证路径 <span class="required">*</span></label>
          <textarea
            v-model="disputeSupplementPath"
            class="textarea"
            placeholder="请说明需要补充哪些证据材料，以及如何获取这些证据..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="form-group">
        <label class="label">审核意见</label>
        <textarea
          v-model="opinion"
          class="textarea"
          placeholder="请输入审核意见..."
          rows="4"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="!canSubmit" @click="handleSubmit">提交审核</button>
    </template>
  </Modal>
</template>

<style scoped>
.review-modal {
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

.summary-item.full-width {
  grid-column: 1 / -1;
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

.amount-primary {
  font-size: 18px;
  color: var(--primary-color);
  font-weight: 700;
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
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius);
  border: 1px solid var(--gray-300);
  background-color: white;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-option:hover {
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

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.form-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

.checkbox-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
}

.checkbox-hint {
  font-size: 12px;
  margin-left: auto;
}

.dispute-section {
  padding: 16px;
  background-color: #fef2f2;
  border-color: #fecaca;
}

.dispute-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--danger-color);
  margin-bottom: 12px;
}
</style>
