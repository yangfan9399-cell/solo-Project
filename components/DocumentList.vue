<script setup lang="ts">
import type { Document } from '~/composables/mockData'
import { documentStatusLabels } from '~/composables/mockData'

defineProps<{
  documents: Document[]
}>()

function getStatusClass(status: string) {
  const statusMap: Record<string, string> = {
    PENDING: 'badge-gray',
    RECEIVED: 'badge-success',
    REJECTED: 'badge-danger',
    SUPPLEMENT_REQUIRED: 'badge-warning'
  }
  return statusMap[status] || 'badge-gray'
}
</script>

<template>
  <div class="document-list">
    <table class="document-table">
      <thead>
        <tr>
          <th>材料名称</th>
          <th>类型</th>
          <th>状态</th>
          <th>是否必需</th>
          <th>接收日期</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in documents" :key="doc.id" class="document-row">
          <td class="doc-name">
            <span class="doc-name-text">{{ doc.name }}</span>
          </td>
          <td class="doc-type text-gray-600">{{ doc.type }}</td>
          <td>
            <span class="badge" :class="getStatusClass(doc.status)">
              {{ documentStatusLabels[doc.status] }}
            </span>
          </td>
          <td>
            <span v-if="doc.required" class="required-badge">必需</span>
            <span v-else class="optional-badge">可选</span>
          </td>
          <td class="doc-date text-gray-500 text-sm">
            {{ doc.receivedDate || '-' }}
          </td>
          <td class="doc-remarks text-gray-600 text-sm">
            <span v-if="doc.remarks">{{ doc.remarks }}</span>
            <span v-else-if="doc.supplementReason" class="text-warning">{{ doc.supplementReason }}</span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.document-list {
  overflow-x: auto;
}

.document-table {
  width: 100%;
  border-collapse: collapse;
}

.document-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 13px;
  color: var(--gray-600);
  background-color: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  white-space: nowrap;
}

.document-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--gray-100);
  font-size: 14px;
  vertical-align: middle;
}

.document-row:hover {
  background-color: var(--gray-50);
}

.doc-name {
  font-weight: 500;
  color: var(--gray-800);
}

.doc-name-text {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.required-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  background-color: #fee2e2;
  color: #dc2626;
}

.optional-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  background-color: var(--gray-100);
  color: var(--gray-500);
}

.doc-date {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  white-space: nowrap;
}

.doc-remarks {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
