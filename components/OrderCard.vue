<template>
  <div class="order-card card">
    <div class="order-header">
      <div class="order-name">{{ order.name }}</div>
      <div class="order-reward">{{ order.reward }} 文</div>
    </div>
    <div class="order-customer">{{ order.customer }}</div>
    <div class="order-target">
      <span class="label">目标色：</span>
      <ColorSwatch :color="order.targetColor" :size="32" />
    </div>
    <div class="order-desc mt-sm">{{ order.description }}</div>
    <div class="order-difficulty mt-sm">
      <span :class="'difficulty ' + order.difficulty">
        {{ difficultyText }}
      </span>
    </div>
    <button
      v-if="selectable"
      class="btn btn-primary mt-md"
      style="width: 100%"
      :disabled="disabled"
      @click="$emit('select')"
    >
      开始染色
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types/game'

const props = defineProps<{
  order: Order
  selectable?: boolean
  disabled?: boolean
}>()

defineEmits<{
  (e: 'select'): void
}>()

const difficultyText = computed(() => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[props.order.difficulty] || props.order.difficulty
})
</script>

<style scoped>
.order-card {
  display: flex;
  flex-direction: column;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--color-primary);
}

.order-reward {
  font-size: 16px;
  font-weight: bold;
  color: var(--color-warning);
}

.order-customer {
  font-size: 14px;
  color: var(--color-text-light);
}

.order-target {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.label {
  font-size: 14px;
  color: var(--color-text-light);
}

.order-desc {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.4;
}

.difficulty {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.difficulty.easy {
  background-color: rgba(61, 92, 61, 0.15);
  color: var(--color-success);
}

.difficulty.medium {
  background-color: rgba(184, 134, 11, 0.15);
  color: var(--color-warning);
}

.difficulty.hard {
  background-color: rgba(139, 0, 0, 0.15);
  color: var(--color-danger);
}
</style>
