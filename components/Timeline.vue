<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryNode } from '~/composables/mockData'
import { statusColors, statusLabels } from '~/composables/mockData'
import StatusBadge from '~/components/StatusBadge.vue'

const props = defineProps<{
  historyNodes: HistoryNode[]
}>()

const sortedNodes = computed(() => {
  return [...props.historyNodes].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
})

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="timeline">
    <div
      v-for="(node, index) in sortedNodes"
      :key="node.id"
      class="timeline-item"
    >
      <div class="timeline-left">
        <div class="timeline-dot" :style="{ backgroundColor: statusColors[node.status] }">
          <svg v-if="index === 0" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div v-if="index < sortedNodes.length - 1" class="timeline-line"></div>
      </div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-action font-semibold">{{ node.action }}</span>
          <StatusBadge :status="node.status" />
        </div>
        <div class="timeline-meta">
          <span class="timeline-time">{{ formatTime(node.timestamp) }}</span>
          <span v-if="node.user" class="timeline-user">{{ node.user.name }}</span>
        </div>
        <p v-if="node.remark" class="timeline-remark">{{ node.remark }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 16px;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(to bottom, var(--gray-300), var(--gray-200));
  margin-top: 4px;
}

.timeline-content {
  flex: 1;
  padding-bottom: 24px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.timeline-action {
  font-size: 15px;
  color: var(--gray-800);
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 8px;
}

.timeline-time {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.timeline-user::before {
  content: '操作人：';
  color: var(--gray-400);
}

.timeline-remark {
  font-size: 14px;
  color: var(--gray-600);
  line-height: 1.6;
  margin: 0;
  padding: 10px 14px;
  background-color: var(--gray-50);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--gray-200);
}
</style>
