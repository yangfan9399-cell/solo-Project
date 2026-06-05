<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Document } from '~/composables/mockData'
import { documentStatusLabels } from '~/composables/mockData'
import Modal from './Modal.vue'

interface Props {
  visible: boolean
  documents: Document[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [results: { documentId: string; status: 'RECEIVED' | 'SUPPLEMENT_REQUIRED'; remarks: string }[]]
}>()

interface SupplementItem {
  documentId: string
  status: 'RECEIVED' | 'SUPPLEMENT_REQUIRED'
  remarks: string
}

const supplementItems = ref<SupplementItem[]>([])

watch(() => props.visible, (visible) => {
  if (visible) {
    supplementItems.value = props.documents
      .filter(doc => doc.status !== 'RECEIVED')
      .map(doc => ({
        documentId: doc.id,
        status: doc.status === 'SUPPLEMENT_REQUIRED' ? 'SUPPLEMENT_REQUIRED' : 'RECEIVED',
        remarks: doc.remarks || doc.supplementReason || ''
      }))
  }
})

const pendingDocuments = computed(() => {
  return props.documents.filter(doc => doc.status !== 'RECEIVED')
})

const canSubmit = computed(() => {
  if (supplementItems.value.length === 0) return false
  return supplementItems.value.every(item => item.status)
})

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', supplementItems.value)
}
</script>

<template>
  <Modal title="材料补正" :visible="visible" width="700px" @close="emit('close')">
    <div v-if="pendingDocuments.length === 0" class="empty-tip">
      所有材料均已收到，无需补正。
    </div>
    <div v-else class="supplement-list">
      <div v-for="item in supplementItems" :key="item.documentId" class="supplement-item card">
        <div class="supplement-header">
          <div class="doc-info">
            <span class="doc-name">
              {{ documents.find(d => d.id === item.documentId)?.name }}
            </span>
            <span v-if="documents.find(d => d.id === item.documentId)?.required" class="required-tag">必需</span>
          </div>
          <span class="doc-type text-gray-500 text-sm">
            {{ documents.find(d => d.id === item.documentId)?.type }}
          </span>
        </div>
        <div class="supplement-body">
          <div class="form-group">
            <label class="label">材料状态</label>
            <select v-model="item.status" class="select">
              <option value="RECEIVED">已收到</option>
              <option value="SUPPLEMENT_REQUIRED">需补正</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">备注</label>
            <textarea
              v-model="item.remarks"
              class="textarea"
              placeholder="请输入备注说明..."
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">取消</button>
      <button class="btn btn-primary" :disabled="!canSubmit" @click="handleSubmit">提交</button>
    </template>
  </Modal>
</template>

<style scoped>
.supplement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 50vh;
  overflow-y: auto;
}

.supplement-item {
  padding: 16px;
}

.supplement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-name {
  font-weight: 600;
  color: var(--gray-800);
}

.required-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  background-color: #fee2e2;
  color: #dc2626;
}

.supplement-body {
  display: flex;
  gap: 16px;
}

.supplement-body .form-group:first-child {
  flex: 0 0 160px;
}

.supplement-body .form-group:last-child {
  flex: 1;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: var(--gray-500);
}
</style>
