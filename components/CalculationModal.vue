<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Calculation } from '~/composables/mockData'
import Modal from './Modal.vue'

interface Props {
  visible: boolean
  calculation?: Calculation
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [result: Partial<Calculation>]
}>()

const totalLoss = ref<number>(0)
const deductible = ref<number>(0)
const coverageRatio = ref<number>(1)
const limitAmount = ref<number>(0)
const calculationNote = ref<string>('')

watch(() => props.visible, (visible) => {
  if (visible && props.calculation) {
    totalLoss.value = props.calculation.totalLoss
    deductible.value = props.calculation.deductible
    coverageRatio.value = props.calculation.coverageRatio
    limitAmount.value = props.calculation.limitAmount || 0
    calculationNote.value = props.calculation.calculationNote || ''
  } else if (visible) {
    totalLoss.value = 0
    deductible.value = 0
    coverageRatio.value = 1
    limitAmount.value = 0
    calculationNote.value = ''
  }
})

const payableAmount = computed(() => {
  const baseAmount = Math.max(0, totalLoss.value - deductible.value)
  const calculated = baseAmount * coverageRatio.value
  if (limitAmount.value > 0 && calculated > limitAmount.value) {
    return limitAmount.value
  }
  return calculated
})

const limitExceeded = computed(() => {
  if (limitAmount.value <= 0) return false
  const baseAmount = Math.max(0, totalLoss.value - deductible.value)
  const calculated = baseAmount * coverageRatio.value
  return calculated > limitAmount.value
})

const canSubmit = computed(() => {
  return totalLoss.value >= 0 && deductible.value >= 0 && coverageRatio.value > 0 && coverageRatio.value <= 1
})

function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    totalLoss: totalLoss.value,
    deductible: deductible.value,
    coverageRatio: coverageRatio.value,
    payableAmount: payableAmount.value,
    limitExceeded: limitExceeded.value,
    limitAmount: limitAmount.value || undefined,
    calculationNote: calculationNote.value
  })
}
</script>

<template>
  <Modal title="赔付计算" :visible="visible" width="560px" @close="emit('close')">
    <div class="calculation-form">
      <div class="form-row">
        <div class="form-group">
          <label class="label">总损失金额（元）</label>
          <input
            v-model.number="totalLoss"
            type="number"
            class="input"
            min="0"
            step="0.01"
            placeholder="请输入总损失金额"
          />
        </div>
        <div class="form-group">
          <label class="label">免赔额（元）</label>
          <input
            v-model.number="deductible"
            type="number"
            class="input"
            min="0"
            step="0.01"
            placeholder="请输入免赔额"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="label">赔付比例</label>
          <input
            v-model.number="coverageRatio"
            type="number"
            class="input"
            min="0"
            max="1"
            step="0.01"
            placeholder="请输入赔付比例（0-1）"
          />
          <div class="hint text-sm text-gray-500 mt-2">
            例如：0.85 表示赔付 85%
          </div>
        </div>
        <div class="form-group">
          <label class="label">赔付限额（元）</label>
          <input
            v-model.number="limitAmount"
            type="number"
            class="input"
            min="0"
            step="0.01"
            placeholder="0 表示无限制"
          />
          <div class="hint text-sm text-gray-500 mt-2">
            保单保额上限，0 表示无限制
          </div>
        </div>
      </div>

      <div class="result-card card">
        <div class="result-row">
          <span class="result-label">计算赔付金额：</span>
          <span class="result-amount text-primary">{{ formatAmount(payableAmount) }}</span>
        </div>
        <div v-if="limitExceeded" class="result-warning">
          <span class="warning-icon">!</span>
          <span class="warning-text">已超过赔付限额，按限额赔付</span>
        </div>
        <div v-else class="result-normal">
          <span class="normal-icon">✓</span>
          <span class="normal-text">未超过赔付限额</span>
        </div>
      </div>

      <div class="form-group">
        <label class="label">计算说明</label>
        <textarea
          v-model="calculationNote"
          class="textarea"
          placeholder="请输入计算说明..."
          rows="4"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="!canSubmit" @click="handleSubmit">确认计算</button>
    </template>
  </Modal>
</template>

<style scoped>
.calculation-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.result-card {
  padding: 16px;
  background-color: var(--gray-50);
  border: 1px solid var(--gray-200);
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-label {
  font-size: 14px;
  color: var(--gray-600);
}

.result-amount {
  font-size: 24px;
  font-weight: 700;
}

.result-warning,
.result-normal {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.result-warning {
  color: var(--warning-color);
}

.warning-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #fef3c7;
  color: #d97706;
  font-weight: 700;
  font-size: 12px;
}

.result-normal {
  color: var(--success-color);
}

.normal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #dcfce7;
  color: #16a34a;
  font-weight: 700;
  font-size: 12px;
}

.hint {
  font-size: 12px;
}
</style>
