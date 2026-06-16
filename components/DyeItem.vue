<template>
  <div class="dye-item card" @click="handleClick">
    <ColorSwatch :color="dye.color" :size="50" />
    <div class="dye-info">
      <div class="dye-name">{{ dye.name }}</div>
      <div class="dye-price">{{ dye.basePrice }} 文/份</div>
      <div class="dye-quantity" v-if="showQuantity">
        库存: {{ quantity }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Dye } from '~/types/game'

const props = defineProps<{
  dye: Dye
  quantity?: number
  showQuantity?: boolean
  clickable?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const handleClick = () => {
  if (props.clickable !== false) {
    emit('click')
  }
}
</script>

<style scoped>
.dye-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dye-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.dye-info {
  flex: 1;
}

.dye-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--color-text);
}

.dye-price {
  font-size: 13px;
  color: var(--color-text-light);
  margin-top: 2px;
}

.dye-quantity {
  font-size: 13px;
  color: var(--color-primary);
  margin-top: 4px;
  font-weight: bold;
}
</style>
