<template>
  <div class="history-panel card">
    <h3 class="subtitle">操作历史</h3>
    <div class="history-controls">
      <button
        class="btn btn-ghost"
        :disabled="!canUndo"
        @click="$emit('undo')"
      >
        ↶ 撤销
      </button>
      <button
        class="btn btn-ghost"
        :disabled="!canRedo"
        @click="$emit('redo')"
      >
        ↷ 重做
      </button>
    </div>
    <div class="history-list">
      <div
        v-for="(item, index) in reversedHistory"
        :key="item.id"
        class="history-item"
        :class="{ active: history.length - 1 - index <= historyIndex }"
      >
        <div class="history-icon">{{ getActionIcon(item.action.type) }}</div>
        <div class="history-info">
          <div class="history-action">{{ getActionName(item.action.type) }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
        </div>
        <ColorSwatch v-if="item.stateAfter" :color="item.stateAfter.color" :size="24" />
      </div>
      <div v-if="history.length === 0" class="empty-history">
        暂无操作记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OperationHistory } from '~/types/game'

const props = defineProps<{
  history: OperationHistory[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
}>()

defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
}>()

const reversedHistory = computed(() => {
  return [...props.history].reverse()
})

const getActionIcon = (type: string) => {
  const icons: Record<string, string> = {
    mix: '🎨',
    heat: '🔥',
    dip: '💧',
    rinse: '🫧'
  }
  return icons[type] || '•'
}

const getActionName = (type: string) => {
  const names: Record<string, string> = {
    mix: '加料',
    heat: '加热',
    dip: '浸泡',
    rinse: '漂洗'
  }
  return names[type] || type
}

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
}

.history-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.history-controls .btn {
  flex: 1;
  font-size: 14px;
  padding: 8px 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  opacity: 0.5;
  transition: all 0.2s ease;
}

.history-item.active {
  opacity: 1;
  background-color: var(--color-linen);
}

.history-icon {
  font-size: 20px;
}

.history-info {
  flex: 1;
}

.history-action {
  font-size: 14px;
  font-weight: bold;
}

.history-time {
  font-size: 11px;
  color: var(--color-text-light);
}

.empty-history {
  text-align: center;
  color: var(--color-text-light);
  padding: 20px;
  font-size: 14px;
}
</style>
