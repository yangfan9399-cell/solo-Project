<template>
  <div class="dyeing-workshop card">
    <h3 class="subtitle">染缸</h3>

    <div class="dyeing-vat" :style="{ backgroundColor: currentColorHex }">
      <div class="vat-water" :style="{ opacity: waterOpacity }">
        <div class="vat-steam" v-if="temperature > 50"></div>
      </div>
    </div>

    <div class="vat-info">
      <div class="info-item">
        <span class="label">水温</span>
        <span class="value" :class="tempClass">{{ temperature.toFixed(0) }}°C</span>
      </div>
      <div class="info-item">
        <span class="label">浸泡次数</span>
        <span class="value">{{ dipCount }}</span>
      </div>
      <div class="info-item">
        <span class="label">总浸泡时间</span>
        <span class="value">{{ totalDipTime }}秒</span>
      </div>
    </div>

    <div class="actions mt-md">
      <div class="action-row">
        <button class="btn btn-ghost" @click="handleHeat(10)" :disabled="disabled">
          加热 +10s
        </button>
        <button class="btn btn-ghost" @click="handleCool(10)" :disabled="disabled">
          冷却 +10s
        </button>
      </div>
      <div class="action-row mt-sm">
        <button class="btn btn-primary" @click="handleDip(5)" :disabled="disabled">
          浸泡 5秒
        </button>
        <button class="btn btn-primary" @click="handleDip(15)" :disabled="disabled">
          浸泡 15秒
        </button>
        <button class="btn btn-secondary" @click="handleRinse" :disabled="disabled">
          漂洗
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { rgbToHex, clampColor } from '~/utils/colorUtils'
import type { RGB } from '~/types/game'

const props = defineProps<{
  color: RGB
  temperature: number
  dipCount: number
  totalDipTime: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'heat', duration: number): void
  (e: 'cool', duration: number): void
  (e: 'dip', seconds: number): void
  (e: 'rinse'): void
}>()

const currentColorHex = computed(() => rgbToHex(clampColor(props.color)))

const waterOpacity = computed(() => {
  return 0.3 + (100 - props.temperature) / 150
})

const tempClass = computed(() => {
  if (props.temperature > 80) return 'hot'
  if (props.temperature > 50) return 'warm'
  return 'cool'
})

const handleHeat = (duration: number) => emit('heat', duration)
const handleCool = (duration: number) => emit('cool', duration)
const handleDip = (seconds: number) => emit('dip', seconds)
const handleRinse = () => emit('rinse')
</script>

<style scoped>
.dyeing-workshop {
  display: flex;
  flex-direction: column;
}

.dyeing-vat {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
  border: 4px solid rgba(61, 41, 20, 0.3);
  box-shadow: inset 0 10px 30px rgba(0, 0, 0, 0.3);
  margin-bottom: 16px;
}

.vat-water {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 85%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  transition: all 0.3s ease;
}

.vat-steam {
  position: absolute;
  top: 0;
  left: 50%;
  width: 80%;
  height: 30px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%);
  animation: steam 2s ease-in-out infinite;
}

@keyframes steam {
  0%, 100% { opacity: 0.4; transform: translateX(-50%) translateY(0); }
  50% { opacity: 0.8; transform: translateX(-50%) translateY(-5px); }
}

.vat-info {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.info-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 13px;
  color: var(--color-text-light);
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text);
}

.value.hot {
  color: var(--color-danger);
}

.value.warm {
  color: var(--color-warning);
}

.value.cool {
  color: var(--color-secondary);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-row {
  display: flex;
  gap: 8px;
}

.action-row .btn {
  flex: 1;
}
</style>
