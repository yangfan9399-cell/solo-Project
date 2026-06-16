<template>
  <div class="game-page">
    <GameHeader
      v-if="currentLevel"
      :level-name="currentLevel.name"
      :time-remaining="timeRemaining"
      :gold="currentGold"
      :completed="completedOrders.length"
      :target="currentLevel.targetOrders"
    />

    <div class="container" v-if="currentLevel">
      <div class="game-layout">
        <div class="left-panel">
          <div class="panel-section">
            <h3 class="subtitle">待处理订单</h3>
            <div class="orders-list">
              <OrderCard
                v-for="order in remainingOrders"
                :key="order.id"
                :order="order"
                :selectable="!currentSession"
                @select="handleSelectOrder(order)"
              />
              <div v-if="remainingOrders.length === 0" class="empty-orders">
                暂无可用订单
              </div>
            </div>
          </div>

          <div class="panel-section mt-lg" v-if="completedOrders.length > 0">
            <h3 class="subtitle">已完成 ({{ completedOrders.length }})</h3>
            <div class="completed-list">
              <div
                v-for="item in completedOrders"
                :key="item.order.id"
                class="completed-item"
              >
                <ColorSwatch :color="item.result.finalColor" :size="32" />
                <span class="item-name">{{ item.order.name }}</span>
                <span class="item-quality" :class="item.result.quality">
                  {{ qualityText(item.result.quality) }}
                </span>
                <span class="item-reward">+{{ item.reward }} 文</span>
              </div>
            </div>
          </div>
        </div>

        <div class="center-panel">
          <div v-if="!currentSession" class="no-order card">
            <div class="no-order-icon">🧵</div>
            <p class="no-order-text">选择左侧订单开始染色</p>
          </div>

          <div v-else>
            <div class="current-order card mb-md">
              <div class="order-header">
                <h3 class="subtitle">{{ currentOrder?.name }}</h3>
                <span class="customer">{{ currentOrder?.customer }}</span>
              </div>
              <div class="order-target">
                <div class="target-color">
                  <span class="label">目标色</span>
                  <ColorSwatch :color="currentOrder!.targetColor" :size="50" />
                </div>
                <div class="target-arrow">→</div>
                <div class="current-color">
                  <span class="label">当前色</span>
                  <ColorSwatch :color="currentSession.currentColor" :size="50" />
                </div>
                <div class="color-diff" v-if="currentSession.dipCount > 0">
                  <span class="label">色差</span>
                  <span class="diff-value" :class="diffClass">
                    {{ currentColorDiff.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>

            <DyeingVat
              :color="currentSession.currentColor"
              :temperature="currentSession.temperature"
              :dip-count="currentSession.dipCount"
              :total-dip-time="currentSession.totalDipTime"
              @heat="handleHeat"
              @cool="handleCool"
              @dip="handleDip"
              @rinse="handleRinse"
            />

            <div class="submit-section card mt-md">
              <button
                class="btn btn-primary submit-btn"
                :disabled="isSubmitting"
                @click="handleSubmit"
              >
                {{ isSubmitting ? '评定中...' : '提交评定' }}
              </button>
              <button class="btn btn-ghost" @click="handleCloseSession">
                放弃订单
              </button>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <DyePalette
            :inventory="inventory"
            @add-dye="handleAddDye"
            @open-shop="showShop = true"
          />

          <HistoryPanel
            class="mt-lg"
            :history="operationHistory"
            :history-index="historyIndex"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @undo="handleUndo"
            @redo="handleRedo"
          />
        </div>
      </div>
    </div>

    <DyeShop
      :visible="showShop"
      :current-gold="currentGold"
      @close="showShop = false"
      @buy="handleBuyDye"
    />

    <DyeResultModal
      :visible="showResult"
      :result="lastResult!"
      :target-color="lastTargetColor!"
      :base-reward="lastBaseReward"
      :final-reward="lastFinalReward"
      :server-verified="resultServerVerified"
      @close="showResult = false"
      @confirm="handleResultConfirm"
    />

    <div v-if="showLevelEnd" class="level-end-modal">
      <div class="modal-overlay"></div>
      <div class="modal-content card">
        <h2 class="title text-center" :class="levelEndStatus">
          {{ levelEndTitle }}
        </h2>

        <div class="end-stats">
          <div class="stat-row">
            <span>完成订单</span>
            <span class="stat-value">{{ completedOrders.length }} / {{ currentLevel?.targetOrders }}</span>
          </div>
          <div class="stat-row">
            <span>失败订单</span>
            <span class="stat-value">{{ failedOrders.length }}</span>
          </div>
          <div class="stat-row">
            <span>最终得分</span>
            <span class="stat-value score">{{ finalLevelScore }} 分</span>
          </div>
          <div class="stat-row highlight">
            <span>获得金币</span>
            <span class="stat-value gold">+{{ goldEarned - goldSpent }} 文</span>
          </div>
          <div class="stat-row">
            <span>星级评价</span>
            <span class="stat-value stars">{{ '★'.repeat(levelStars) }}{{ '☆'.repeat(3 - levelStars) }}</span>
          </div>
        </div>

        <div class="end-actions mt-lg">
          <button class="btn btn-primary" @click="handleBackToLevels">
            返回关卡
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGame } from '~/composables/useGame'
import { usePlayer } from '~/composables/usePlayer'
import { colorDiffPercentage, clampColor } from '~/utils/colorUtils'
import { getLevelById } from '~/data/gameData'
import type { Order, DyeResult, RGB } from '~/types/game'

const route = useRoute()
const {
  currentLevel,
  currentOrder,
  currentSession,
  inventory,
  completedOrders,
  failedOrders,
  goldEarned,
  goldSpent,
  timeRemaining,
  operationHistory,
  historyIndex,
  currentGold,
  remainingOrders,
  canUndo,
  canRedo,
  levelPassed,
  startLevel,
  selectOrder,
  addDye,
  heat,
  cool,
  dip,
  rinse,
  undo,
  redo,
  submitForEvaluation,
  closeSession,
  buyDye,
  tickTime
} = useGame()

const { profile, loadFromLocal, addGold, addScore, unlockLevel, updateProfile } = usePlayer()

const showShop = ref(false)
const showResult = ref(false)
const showLevelEnd = ref(false)
const isSubmitting = ref(false)
const lastResult = ref<DyeResult | null>(null)
const lastTargetColor = ref<RGB | null>(null)
const lastBaseReward = ref(0)
const lastFinalReward = ref(0)
const resultServerVerified = ref(false)
const finalLevelScore = ref(0)
const levelStars = ref(0)
const levelEndStatus = ref('')

const currentColorDiff = computed(() => {
  if (!currentSession.value || !currentOrder.value) return 0
  return colorDiffPercentage(
    clampColor(currentSession.value.currentColor),
    currentOrder.value.targetColor
  )
})

const diffClass = computed(() => {
  const diff = currentColorDiff.value
  if (diff <= 5) return 'perfect'
  if (diff <= 12) return 'good'
  if (diff <= 25) return 'fair'
  return 'poor'
})

const levelEndTitle = computed(() => {
  return levelPassed.value ? '🎉 通关成功!' : '😔 挑战失败'
})

onMounted(() => {
  loadFromLocal()
  const levelId = Number(route.query.levelId) || 1
  const level = getLevelById(levelId)
  if (level) {
    startLevel(level)
    startTimer()
  }
})

let timerInterval: ReturnType<typeof setInterval> | null = null

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    tickTime()
    if (timeRemaining.value <= 0) {
      endLevel()
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const handleSelectOrder = (order: Order) => {
  selectOrder(order)
}

const handleAddDye = (dyeId: string, amount: number) => {
  addDye(dyeId, amount)
}

const handleHeat = (duration: number) => {
  heat(duration)
}

const handleCool = (duration: number) => {
  cool(duration)
}

const handleDip = (seconds: number) => {
  dip(seconds)
}

const handleRinse = () => {
  rinse()
}

const handleUndo = () => {
  undo()
}

const handleRedo = () => {
  redo()
}

const handleSubmit = async () => {
  if (isSubmitting.value || !currentOrder.value) return

  isSubmitting.value = true
  const result = await submitForEvaluation()

  if (result) {
    lastResult.value = result
    lastTargetColor.value = currentOrder.value.targetColor
    lastBaseReward.value = currentOrder.value.reward
    lastFinalReward.value = Math.round(currentOrder.value.reward * result.rewardMultiplier)
    resultServerVerified.value = true
    showResult.value = true
  }

  isSubmitting.value = false
}

const handleResultConfirm = () => {
  showResult.value = false
  closeSession()

  if (remainingOrders.value.length === 0 || levelPassed.value) {
    setTimeout(() => endLevel(), 500)
  }
}

const handleCloseSession = () => {
  closeSession()
}

const handleBuyDye = (dyeId: string, quantity: number) => {
  const success = buyDye(dyeId, quantity)
  if (success) {
    // 购买成功
  }
}

const endLevel = async () => {
  if (timerInterval) clearInterval(timerInterval)

  const orderResults = completedOrders.value.map((item) => ({
    targetColor: item.order.targetColor,
    finalColor: item.result.finalColor
  }))

  try {
    const result = await $fetch('/api/level-result', {
      method: 'post',
      body: {
        levelId: currentLevel.value?.id,
        completedOrders: completedOrders.value.length,
        failedOrders: failedOrders.value.length,
        orderResults,
        goldEarned: goldEarned.value - goldSpent.value,
        timeRemaining: timeRemaining.value
      }
    })

    finalLevelScore.value = (result as any).finalScore
    levelStars.value = (result as any).stars || 0
    levelEndStatus.value = (result as any).passed ? 'completed' : 'failed'
  } catch (e) {
    const baseScore = completedOrders.value.length * 100
    const qualityBonus = completedOrders.value.reduce((sum, item) => {
      return sum + item.result.score
    }, 0)
    finalLevelScore.value = Math.round(baseScore + qualityBonus / 2)
    levelStars.value = levelPassed.value ? 1 : 0
    levelEndStatus.value = levelPassed.value ? 'completed' : 'failed'
  }

  if (profile.value) {
    const profit = goldEarned.value - goldSpent.value
    if (profit > 0) {
      await addGold(profit)
    }
    await addScore(finalLevelScore.value)

    if (levelPassed.value && currentLevel.value) {
      const nextLevelId = currentLevel.value.id + 1
      if (nextLevelId <= 4) {
        await unlockLevel(nextLevelId)
      }
    }
  }

  if (profile.value && currentLevel.value) {
    try {
      await $fetch('/api/records/create', {
        method: 'post',
        body: {
          playerId: profile.value.id,
          levelId: currentLevel.value.id,
          score: finalLevelScore.value,
          goldEarned: goldEarned.value - goldSpent.value,
          ordersCompleted: completedOrders.value.length,
          ordersFailed: failedOrders.value.length,
          totalColorDiff: completedOrders.value.reduce(
            (sum, item) => sum + item.result.colorDiff,
            0
          ),
          status: levelPassed.value ? 'completed' : 'failed',
          dyeingSessions: []
        }
      })
    } catch (e) {
      // 忽略记录保存错误
    }
  }

  showLevelEnd.value = true
}

const handleBackToLevels = () => {
  navigateTo('/levels')
}

const qualityText = (quality: string) => {
  const map: Record<string, string> = {
    perfect: '完美',
    good: '优良',
    fair: '合格',
    poor: '不合格'
  }
  return map[quality] || quality
}
</script>

<style scoped>
.game-page {
  min-height: 100vh;
  padding-bottom: 40px;
}

.game-layout {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 20px;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
}

.panel-section {
  flex-shrink: 0;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.empty-orders {
  text-align: center;
  color: var(--color-text-light);
  padding: 30px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.completed-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.item-name {
  flex: 1;
  font-weight: bold;
}

.item-quality {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
}

.item-quality.perfect {
  background-color: rgba(212, 175, 55, 0.2);
  color: #d4af37;
}

.item-quality.good {
  background-color: rgba(61, 92, 61, 0.2);
  color: var(--color-success);
}

.item-quality.fair {
  background-color: rgba(184, 134, 11, 0.2);
  color: var(--color-warning);
}

.item-quality.poor {
  background-color: rgba(139, 0, 0, 0.2);
  color: var(--color-danger);
}

.item-reward {
  color: var(--color-warning);
  font-weight: bold;
}

.no-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
}

.no-order-icon {
  font-size: 64px;
  opacity: 0.5;
}

.no-order-text {
  color: var(--color-text-light);
  font-size: 16px;
}

.current-order .order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.customer {
  font-size: 14px;
  color: var(--color-text-light);
}

.order-target {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.target-color,
.current-color,
.color-diff {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.target-arrow {
  font-size: 24px;
  color: var(--color-primary);
}

.diff-value {
  font-size: 18px;
  font-weight: bold;
}

.diff-value.perfect {
  color: #d4af37;
}

.diff-value.good {
  color: var(--color-success);
}

.diff-value.fair {
  color: var(--color-warning);
}

.diff-value.poor {
  color: var(--color-danger);
}

.submit-section {
  display: flex;
  gap: 12px;
}

.submit-btn {
  flex: 1;
  font-size: 18px;
  padding: 14px;
}

.level-end-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
}

.level-end-modal .modal-content {
  position: relative;
  width: 90%;
  max-width: 420px;
  padding: 30px;
  z-index: 1;
}

.title.completed {
  color: var(--color-success);
}

.title.failed {
  color: var(--color-danger);
}

.end-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.stat-row.highlight {
  background-color: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.stat-value {
  font-weight: bold;
  font-size: 18px;
}

.stat-value.score {
  color: var(--color-primary);
}

.stat-value.gold {
  color: var(--color-warning);
}

.stat-value.stars {
  color: #d4af37;
  font-size: 24px;
  letter-spacing: 4px;
}

.end-actions .btn {
  width: 100%;
}

@media (max-width: 1024px) {
  .game-layout {
    grid-template-columns: 1fr;
  }

  .orders-list {
    max-height: 250px;
  }
}
</style>
