<template>
  <div class="dye-palette card">
    <h3 class="subtitle">染料库</h3>
    <div class="dye-list">
      <div
        v-for="item in inventoryWithDyes"
        :key="item.dye.id"
        class="dye-row"
        :class="{ disabled: item.quantity <= 0 }"
        @click="handleDyeClick(item.dye.id)"
      >
        <ColorSwatch :color="item.dye.color" :size="36" />
        <div class="dye-details">
          <div class="dye-name">{{ item.dye.name }}</div>
          <div class="dye-qty">库存: {{ item.quantity }}</div>
        </div>
        <div class="dye-controls">
          <button
            class="btn-minus"
            @click.stop="handleRemove(item.dye.id)"
            :disabled="item.quantity <= 0 || disabled"
          >
            -
          </button>
          <span class="add-amount">{{ addAmounts[item.dye.id] || 1 }}</span>
          <button
            class="btn-plus"
            @click.stop="handleAdd(item.dye.id)"
            :disabled="item.quantity < (addAmounts[item.dye.id] || 1) || disabled"
          >
            +
          </button>
        </div>
      </div>
    </div>
    <button
      class="btn btn-ghost mt-md"
      style="width: 100%"
      @click="$emit('openShop')"
    >
      购买染料
    </button>
  </div>
</template>

<script setup lang="ts">
import { dyes, getDyeById } from '~/data/gameData'
import type { InventoryItem } from '~/types/game'

const props = defineProps<{
  inventory: InventoryItem[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'addDye', dyeId: string, amount: number): void
  (e: 'openShop'): void
}>()

const addAmounts = ref<Record<string, number>>({})

const inventoryWithDyes = computed(() => {
  return dyes
    .map((dye) => {
      const invItem = props.inventory.find((i) => i.dyeId === dye.id)
      return {
        dye,
        quantity: invItem?.quantity || 0
      }
    })
    .filter((item) => item.quantity > 0 || props.inventory.some((i) => i.dyeId === item.dye.id))
})

const handleAdd = (dyeId: string) => {
  if (!addAmounts.value[dyeId]) {
    addAmounts.value[dyeId] = 1
  }
  if (addAmounts.value[dyeId] < 5) {
    addAmounts.value[dyeId]++
  }
}

const handleRemove = (dyeId: string) => {
  if (!addAmounts.value[dyeId]) {
    addAmounts.value[dyeId] = 1
  }
  if (addAmounts.value[dyeId] > 1) {
    addAmounts.value[dyeId]--
  }
}

const handleDyeClick = (dyeId: string) => {
  if (props.disabled) return
  const amount = addAmounts.value[dyeId] || 1
  const invItem = props.inventory.find((i) => i.dyeId === dyeId)
  if (invItem && invItem.quantity >= amount) {
    emit('addDye', dyeId, amount)
  }
}
</script>

<style scoped>
.dye-palette {
  display: flex;
  flex-direction: column;
}

.dye-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.dye-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dye-row:hover:not(.disabled) {
  background-color: var(--color-linen);
  transform: translateX(4px);
}

.dye-row.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dye-details {
  flex: 1;
}

.dye-name {
  font-size: 15px;
  font-weight: bold;
}

.dye-qty {
  font-size: 12px;
  color: var(--color-text-light);
}

.dye-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-minus,
.btn-plus {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-primary);
  background-color: var(--color-cream);
  color: var(--color-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-minus:disabled,
.btn-plus:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-amount {
  min-width: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
}
</style>
