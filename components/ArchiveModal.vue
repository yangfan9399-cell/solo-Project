<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [result: { archiveReason: string }]
}>()

const archiveReason = ref<string>('')

watch(() => props.visible, (visible) => {
  if (visible) {
    archiveReason.value = ''
  }
})

const canSubmit = computed(() => {
  return archiveReason.value.trim().length > 0
})

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', { archiveReason: archiveReason.value })
}
</script>

<template>
  <Modal title="归档案件" :visible="visible" width="480px" @close="emit('close')">
    <div class="archive-modal">
      <div class="archive-warning">
        <div class="warning-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="warning-icon">
            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="warning-text">
          <div class="warning-title">归档后案件将变为只读</div>
          <div class="warning-desc">案件归档后不可再修改，如需调整请重新开启案件。</div>
        </div>
      </div>

      <div class="form-group">
        <label class="label">归档原因</label>
        <textarea
          v-model="archiveReason"
          class="textarea"
          placeholder="请输入归档原因..."
          rows="4"
        ></textarea>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="!canSubmit" @click="handleSubmit">确认归档</button>
    </template>
  </Modal>
</template>

<style scoped>
.archive-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.archive-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--border-radius);
}

.warning-icon-box {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #fef3c7;
  color: #d97706;
}

.warning-icon {
  width: 18px;
  height: 18px;
}

.warning-text {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 4px;
}

.warning-desc {
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.5;
}
</style>
