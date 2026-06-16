<template>
  <div class="game-header card">
    <div class="header-left">
      <div class="level-info">
        <span class="label">关卡</span>
        <span class="value">{{ levelName }}</span>
      </div>
    </div>
    <div class="header-center">
      <div class="timer" :class="{ warning: timeRemaining < 60, danger: timeRemaining < 30 }">
        ⏱ {{ formatTime(timeRemaining) }}
      </div>
    </div>
    <div class="header-right">
      <div class="stat-item">
        <span class="label">资金</span>
        <span class="value gold">{{ gold }} 文</span>
      </div>
      <div class="stat-item">
        <span class="label">已完成</span>
        <span class="value">{{ completed }}/{{ target }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  levelName: string
  timeRemaining: number
  gold: number
  completed: number
  target: number
}>()

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  margin-bottom: 16px;
}

.header-left,
.header-right {
  display: flex;
  gap: 20px;
}

.level-info,
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: var(--color-text-light);
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
}

.value.gold {
  color: var(--color-warning);
}

.timer {
  font-size: 28px;
  font-weight: bold;
  color: var(--color-primary);
  font-family: monospace;
}

.timer.warning {
  color: var(--color-warning);
  animation: pulse 1s ease-in-out infinite;
}

.timer.danger {
  color: var(--color-danger);
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
