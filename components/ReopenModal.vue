<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'

interface Props {
  visible: boolean
  previousConclusion?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [result: { reopenReason: string }]
}>()

const reopenReason = ref<string>('')

watch(() => props.visible, (visible) => {
  if (visible) {
    reopenReason.value = ''
  }
})

const canSubmit = computed(() => {
  return reopenReason.value.trim().length > 0
})

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', { reopenReason: reopenReason.value })
}
</script>

<template>
  <Modal title="重新开启案件" :visible="visible" width="480px" @close="emit('close')">
    <div class="reopen-modal">
      <div class="conclusion-section card">
        <div class="conclusion-title">原结论</div>
        <div class="conclusion-content">
          <template v-if="previousConclusion">
            {{ previousConclusion }}
          </template>
          <span v-else class="text-gray-400">无</span>
        </div>
      </div>

      <div class="reopen-tip">
        <div class="tip-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="tip-icon">
            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="tip-text">
          <div class="tip-title">旧结论会被保留</div>
          <div class="tip-desc">重新开启后，原案件结论将作为历史记录保留，可在案件时间线中查看。</div>
        </div>
      </div>

      <div class="form-group">
        <label class="label">重新开启原因</label>
        <textarea
          v-model="reopenReason"
          class="textarea"
          placeholder="请输入重新开启的原因..."
          rows="4"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="!canSubmit" @click="handleSubmit">确认重新开启</button>
    </template>
  </Modal>
</template>

<style scoped>
.reopen-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conclusion-section {
  padding: 16px;
  background-color: var(--gray-50);
}

.conclusion-title {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 8px;
}

.conclusion-content {
  font-size: 14px;
  color: var(--gray-800);
  font-weight: 500;
  line-height: 1.6;
}

.reopen-tip {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--border-radius);
}

.tip-icon-box {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #dbeafe;
  color: var(--primary-color);
}

.tip-icon {
  width: 18px;
  height: 18px;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.5;
}
</style>
