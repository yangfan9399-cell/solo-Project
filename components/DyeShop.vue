<template>
  <div class="shop-modal" v-if="visible">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-content card">
      <h2 class="title text-center">染料铺</h2>
      <p class="subtitle text-center">当前资金: {{ currentGold }} 文</p>

      <div class="shop-items">
        <div v-for="dye in dyes" :key="dye.id" class="shop-item">
          <ColorSwatch :color="dye.color" :size="40" />
          <div class="item-info">
            <div class="item-name">{{ dye.name }}</div>
            <div class="item-price">{{ dye.basePrice }} 文/份</div>
          </div>
          <div class="buy-controls">
            <button class="btn-minus" @click="decreaseQty(dye.id)" :disabled="quantities[dye.id] <= 1">
              -
            </button>
            <span class="qty">{{ quantities[dye.id] || 1 }}</span>
            <button class="btn-plus" @click="increaseQty(dye.id)">+</button>
          </div>
          <button
            class="btn btn-primary buy-btn"
            :disabled="currentGold < dye.basePrice * (quantities[dye.id] || 1)"
            @click="handleBuy(dye.id)"
          >
            购买
          </button>
        </div>
      </div>

      <button class="btn btn-ghost mt-lg" style="width: 100%" @click="$emit('close')">
        关闭
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dyes } from '~/data/gameData'
import { getDyePrice } from '~/utils/colorUtils'

const props = defineProps<{
  visible: boolean
  currentGold: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'buy', dyeId: string, quantity: number): void
}>()

const quantities = ref<Record<string, number>>({})

const increaseQty = (dyeId: string) => {
  if (!quantities.value[dyeId]) quantities.value[dyeId] = 1
  if (quantities.value[dyeId] < 10) {
    quantities.value[dyeId]++
  }
}

const decreaseQty = (dyeId: string) => {
  if (!quantities.value[dyeId]) quantities.value[dyeId] = 1
  if (quantities.value[dyeId] > 1) {
    quantities.value[dyeId]--
  }
}

const handleBuy = (dyeId: string) => {
  const qty = quantities.value[dyeId] || 1
  emit('buy', dyeId, qty)
}
</script>

<style scoped>
.shop-modal {
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
  width: 95%;
  max-width: 500px;
  max-height: 85vh;
  padding: 24px;
  z-index: 1;
  overflow-y: auto;
}

.shop-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 16px;
  font-weight: bold;
}

.item-price {
  font-size: 13px;
  color: var(--color-warning);
}

.buy-controls {
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

.qty {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}

.buy-btn {
  font-size: 14px;
  padding: 6px 14px;
}
</style>
