import type {
  Level,
  Order,
  DyeingSession,
  DyeAction,
  InventoryItem,
  DyeResult,
  OperationHistory,
  GameReport
} from '~/types/game'
import {
  mixDye,
  heatWater,
  coolWater,
  getTemperatureEffect,
  getDyeColor,
  getDyePrice,
  clampColor,
  generateId,
  colorDiff
} from '~/utils/colorUtils'

const currentLevel = ref<Level | null>(null)
const currentOrder = ref<Order | null>(null)
const currentSession = ref<DyeingSession | null>(null)
const inventory = ref<InventoryItem[]>([])
const completedOrders = ref<{ order: Order; result: DyeResult; reward: number }[]>([])
const failedOrders = ref<Order[]>([])
const goldEarned = ref(0)
const goldSpent = ref(0)
const timeRemaining = ref(0)
const isGameActive = ref(false)
const operationHistory = ref<OperationHistory[]>([])
const historyIndex = ref(-1)

const WHITE_COLOR = { r: 255, g: 255, b: 255 }
const BASE_TEMP = 25

export function useGame() {
  const startLevel = (level: Level) => {
    currentLevel.value = level
    inventory.value = level.initialInventory.map((i) => ({ ...i }))
    completedOrders.value = []
    failedOrders.value = []
    goldEarned.value = 0
    goldSpent.value = 0
    timeRemaining.value = level.timeLimit
    isGameActive.value = true
    currentOrder.value = null
    currentSession.value = null
    operationHistory.value = []
    historyIndex.value = -1
  }

  const endLevel = () => {
    isGameActive.value = false
  }

  const selectOrder = (order: Order) => {
    if (!isGameActive.value) return

    currentOrder.value = order
    currentSession.value = {
      id: generateId(),
      orderId: order.id,
      currentColor: { ...WHITE_COLOR },
      temperature: BASE_TEMP,
      dipCount: 0,
      totalDipTime: 0,
      actions: [],
      dyeUsed: {},
      startTime: Date.now(),
      status: 'active'
    }
    operationHistory.value = []
    historyIndex.value = -1
  }

  const addDye = (dyeId: string, amount: number) => {
    if (!currentSession.value || !currentOrder.value) return false

    const invItem = inventory.value.find((i) => i.dyeId === dyeId)
    if (!invItem || invItem.quantity < amount) return false

    const dyeColor = getDyeColor(dyeId)
    const stateBefore = {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    }

    currentSession.value.currentColor = mixDye(
      currentSession.value.currentColor,
      dyeColor,
      amount * 5
    )

    invItem.quantity -= amount
    currentSession.value.dyeUsed[dyeId] = (currentSession.value.dyeUsed[dyeId] || 0) + amount

    const action: DyeAction = {
      id: generateId(),
      type: 'mix',
      timestamp: Date.now(),
      details: { dyeId, amount }
    }
    currentSession.value.actions.push(action)

    pushHistory(action, stateBefore, {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    })

    return true
  }

  const heat = (duration: number) => {
    if (!currentSession.value) return

    const stateBefore = {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    }

    currentSession.value.temperature = heatWater(currentSession.value.temperature, duration)

    const action: DyeAction = {
      id: generateId(),
      type: 'heat',
      timestamp: Date.now(),
      details: { duration, newTemp: currentSession.value.temperature }
    }
    currentSession.value.actions.push(action)

    pushHistory(action, stateBefore, {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    })
  }

  const cool = (duration: number) => {
    if (!currentSession.value) return

    const stateBefore = {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    }

    currentSession.value.temperature = coolWater(currentSession.value.temperature, duration)

    const action: DyeAction = {
      id: generateId(),
      type: 'dip',
      timestamp: Date.now(),
      details: { duration, newTemp: currentSession.value.temperature }
    }
    currentSession.value.actions.push(action)

    pushHistory(action, stateBefore, {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    })
  }

  const dip = (seconds: number) => {
    if (!currentSession.value || !currentOrder.value) return

    const stateBefore = {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    }

    const temp = currentSession.value.temperature
    const tempEffect = getTemperatureEffect(temp)
    const effectiveTime = seconds * tempEffect

    const penetration = Math.min(1, effectiveTime / 30)
    const targetColor = currentOrder.value.targetColor

    currentSession.value.currentColor = {
      r:
        currentSession.value.currentColor.r * (1 - penetration * 0.15) +
        targetColor.r * penetration * 0.15,
      g:
        currentSession.value.currentColor.g * (1 - penetration * 0.15) +
        targetColor.g * penetration * 0.15,
      b:
        currentSession.value.currentColor.b * (1 - penetration * 0.15) +
        targetColor.b * penetration * 0.15
    }

    currentSession.value.dipCount++
    currentSession.value.totalDipTime += seconds

    if (temp > 80) {
      currentSession.value.temperature = coolWater(temp, seconds * 0.5)
    }

    const action: DyeAction = {
      id: generateId(),
      type: 'dip',
      timestamp: Date.now(),
      details: { seconds, penetration }
    }
    currentSession.value.actions.push(action)

    pushHistory(action, stateBefore, {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    })
  }

  const rinse = () => {
    if (!currentSession.value) return

    const stateBefore = {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    }

    currentSession.value.currentColor = {
      r: currentSession.value.currentColor.r * 0.98 + 255 * 0.02,
      g: currentSession.value.currentColor.g * 0.98 + 255 * 0.02,
      b: currentSession.value.currentColor.b * 0.98 + 255 * 0.02
    }

    const action: DyeAction = {
      id: generateId(),
      type: 'rinse',
      timestamp: Date.now(),
      details: {}
    }
    currentSession.value.actions.push(action)

    pushHistory(action, stateBefore, {
      color: { ...currentSession.value.currentColor },
      temperature: currentSession.value.temperature
    })
  }

  const pushHistory = (
    action: DyeAction,
    stateBefore: { color: typeof WHITE_COLOR; temperature: number },
    stateAfter: { color: typeof WHITE_COLOR; temperature: number }
  ) => {
    if (historyIndex.value < operationHistory.value.length - 1) {
      operationHistory.value = operationHistory.value.slice(0, historyIndex.value + 1)
    }

    operationHistory.value.push({
      id: generateId(),
      sessionId: currentSession.value!.id,
      action,
      stateBefore,
      stateAfter,
      timestamp: Date.now()
    })
    historyIndex.value = operationHistory.value.length - 1
  }

  const canUndo = computed(() => historyIndex.value >= 0)
  const canRedo = computed(() => historyIndex.value < operationHistory.value.length - 1)

  const undo = () => {
    if (!canUndo.value || !currentSession.value) return

    const history = operationHistory.value[historyIndex.value]
    currentSession.value.currentColor = { ...history.stateBefore.color }
    currentSession.value.temperature = history.stateBefore.temperature

    if (history.action.type === 'mix' && history.action.details.dyeId) {
      const dyeId = history.action.details.dyeId
      const amount = history.action.details.amount
      const invItem = inventory.value.find((i) => i.dyeId === dyeId)
      if (invItem) {
        invItem.quantity += amount
      }
      if (currentSession.value.dyeUsed[dyeId]) {
        currentSession.value.dyeUsed[dyeId] -= amount
      }
    }

    historyIndex.value--
  }

  const redo = () => {
    if (!canRedo.value || !currentSession.value) return

    historyIndex.value++
    const history = operationHistory.value[historyIndex.value]
    currentSession.value.currentColor = { ...history.stateAfter.color }
    currentSession.value.temperature = history.stateAfter.temperature

    if (history.action.type === 'mix' && history.action.details.dyeId) {
      const dyeId = history.action.details.dyeId
      const amount = history.action.details.amount
      const invItem = inventory.value.find((i) => i.dyeId === dyeId)
      if (invItem) {
        invItem.quantity -= amount
      }
      if (currentSession.value.dyeUsed[dyeId]) {
        currentSession.value.dyeUsed[dyeId] += amount
      }
    }
  }

  const submitForEvaluation = async (): Promise<DyeResult | null> => {
    if (!currentSession.value || !currentOrder.value || !currentLevel.value) return null

    const totalDyeCost = Object.entries(currentSession.value.dyeUsed).reduce((sum, [id, qty]) => {
      return sum + getDyePrice(id) * qty
    }, 0)

    let result: DyeResult | null = null

    try {
      const serverResult = await $fetch('/api/calculate-score', {
        method: 'post',
        body: {
          finalColor: currentSession.value.currentColor,
          targetColor: currentOrder.value.targetColor,
          totalDyeCost,
          baseReward: currentOrder.value.reward
        }
      })
      result = serverResult as DyeResult & { finalReward: number }
    } catch (e) {
      return null
    }

    const finalReward = Math.round(currentOrder.value.reward * result.rewardMultiplier)

    if (result.quality === 'poor') {
      failedOrders.value.push(currentOrder.value)
    } else {
      completedOrders.value.push({
        order: currentOrder.value,
        result: result!,
        reward: finalReward
      })
      goldEarned.value += finalReward
    }

    goldSpent.value += totalDyeCost
    currentSession.value.status = result.quality === 'poor' ? 'failed' : 'completed'

    return result
  }

  const closeSession = () => {
    currentSession.value = null
    currentOrder.value = null
    operationHistory.value = []
    historyIndex.value = -1
  }

  const buyDye = (dyeId: string, quantity: number): boolean => {
    const price = getDyePrice(dyeId) * quantity
    if (goldEarned.value + (currentLevel.value?.initialGold || 0) - goldSpent.value < price) {
      return false
    }

    const invItem = inventory.value.find((i) => i.dyeId === dyeId)
    if (invItem) {
      invItem.quantity += quantity
    } else {
      inventory.value.push({ dyeId, quantity })
    }

    goldSpent.value += price
    return true
  }

  const currentGold = computed(() => {
    if (!currentLevel.value) return 0
    return currentLevel.value.initialGold + goldEarned.value - goldSpent.value
  })

  const remainingOrders = computed(() => {
    if (!currentLevel.value) return []
    const completedIds = completedOrders.value.map((o) => o.order.id)
    const failedIds = failedOrders.value.map((o) => o.id)
    return currentLevel.value.orders.filter(
      (o) => !completedIds.includes(o.id) && !failedIds.includes(o.id)
    )
  })

  const gameReport = computed<GameReport>(() => {
    const totalOrders = completedOrders.value.length + failedOrders.value.length
    let totalRevenue = 0
    let totalDiff = 0
    let perfectCount = 0
    let goodCount = 0
    let fairCount = 0
    let poorCount = 0

    for (const item of completedOrders.value) {
      totalRevenue += item.reward
      totalDiff += item.result.colorDiff
      switch (item.result.quality) {
        case 'perfect':
          perfectCount++
          break
        case 'good':
          goodCount++
          break
        case 'fair':
          fairCount++
          break
        case 'poor':
          poorCount++
          break
      }
    }

    return {
      totalOrders,
      completedOrders: completedOrders.value.length,
      failedOrders: failedOrders.value.length,
      totalRevenue,
      totalCost: goldSpent.value,
      profit: totalRevenue - goldSpent.value,
      avgColorDiff: completedOrders.value.length > 0 ? totalDiff / completedOrders.value.length : 0,
      perfectCount,
      goodCount,
      fairCount,
      poorCount
    }
  })

  const tickTime = () => {
    if (isGameActive.value && timeRemaining.value > 0) {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        isGameActive.value = false
      }
    }
  }

  const levelPassed = computed(() => {
    if (!currentLevel.value) return false
    return completedOrders.value.length >= currentLevel.value.targetOrders
  })

  const levelFailed = computed(() => {
    if (!currentLevel.value) return false
    const remaining = currentLevel.value.orders.length - completedOrders.value.length - failedOrders.value.length
    return (
      timeRemaining.value <= 0 ||
      (completedOrders.value.length + remaining < currentLevel.value.targetOrders)
    )
  })

  return {
    currentLevel,
    currentOrder,
    currentSession,
    inventory,
    completedOrders,
    failedOrders,
    goldEarned,
    goldSpent,
    timeRemaining,
    isGameActive,
    operationHistory,
    historyIndex,
    currentGold,
    remainingOrders,
    gameReport,
    canUndo,
    canRedo,
    levelPassed,
    levelFailed,
    startLevel,
    endLevel,
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
  }
}
