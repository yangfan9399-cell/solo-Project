<template>
  <div class="result-modal" v-if="visible">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-content card">
      <h2 class="title text-center" :class="qualityClass">
        {{ qualityText }}
      </h2>

      <div class="color-comparison">
        <div class="color-item">
          <ColorSwatch :color="targetColor" :size="80" />
          <span class="color-label">目标色</span>
        </div>
        <div class="vs">VS</div>
        <div class="color-item">
          <ColorSwatch :color="result.finalColor" :size="80" />
          <span class="color-label">成品色</span>
        </div>
      </div>

      <div class="result-stats">
        <div class="stat-row">
          <span>色差程度</span>
          <span class="stat-value">{{ result.colorDiff.toFixed(1) }}%</span>
        </div>
        <div class="stat-row">
          <span>品质评分</span>
          <span class="stat-value score">{{ result.score }} 分</span>
        </div>
        <div class="stat-row">
          <span>基础报酬</span>
          <span class="stat-value">{{ baseReward }} 文</span>
        </div>
        <div class="stat-row highlight">
          <span>实际获得</span>
          <span class="stat-value gold">{{ finalReward }} 文</span>
        </div>
      </div>

      <div class="server-badge" v-if="serverVerified">
        ✓ 分数已由服务端验证
      </div>

      <button class="btn btn-primary mt-lg" style="width: 100%" @click="$emit('confirm')">
        确定
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DyeResult, RGB } from '~/types/game'

const props = defineProps<{
  visible: boolean
  result: DyeResult
  targetColor: RGB
  baseReward: number
  finalReward: number
  serverVerified?: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const qualityText = computed(() => {
  const texts: Record<string, string> = {
    perfect: '🌟 完美染色!',
    good: '👍 染工优良',
    fair: '😊 尚算合格',
    poor: '😔 染色失败'
  }
  return texts[props.result.quality] || props.result.quality
})

const qualityClass = computed(() => props.result.quality)
</script>

<style scoped>
.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  padding: 30px;
  z-index: 1;
}

.title.perfect {
  color: #d4af37;
}

.title.good {
  color: var(--color-success);
}

.title.fair {
  color: var(--color-warning);
}

.title.poor {
  color: var(--color-danger);
}

.color-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-label {
  font-size: 14px;
  color: var(--color-text-light);
}

.vs {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-primary);
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.stat-row.highlight {
  background-color: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.stat-value {
  font-weight: bold;
  font-size: 16px;
}

.stat-value.score {
  color: var(--color-primary);
}

.stat-value.gold {
  color: var(--color-warning);
  font-size: 20px;
}

.server-badge {
  text-align: center;
  font-size: 12px;
  color: var(--color-success);
  margin-top: 12px;
  padding: 6px;
  background-color: rgba(61, 92, 61, 0.1);
  border-radius: var(--radius-sm);
}
</style>
