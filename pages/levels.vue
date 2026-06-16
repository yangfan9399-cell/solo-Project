<template>
  <div class="levels-page">
    <div class="container">
      <div class="page-header">
        <button class="btn btn-ghost back-btn" @click="goBack">
          ← 返回
        </button>
        <h1 class="title">选择关卡</h1>
        <div style="width: 80px"></div>
      </div>

      <div class="levels-grid grid grid-2">
        <div
          v-for="level in levelsData"
          :key="level.id"
          class="level-card card"
          :class="{ locked: !isUnlocked(level.id) }"
        >
          <div class="level-number">第 {{ level.id }} 关</div>
          <h3 class="level-name">{{ level.name }}</h3>
          <p class="level-desc">{{ level.description }}</p>

          <div class="level-info">
            <div class="info-item">
              <span class="label">初始资金</span>
              <span class="value">{{ level.initialGold }} 文</span>
            </div>
            <div class="info-item">
              <span class="label">订单数量</span>
              <span class="value">{{ level.orderCount }} 笔</span>
            </div>
            <div class="info-item">
              <span class="label">目标完成</span>
              <span class="value">{{ level.targetOrders }} 笔</span>
            </div>
            <div class="info-item">
              <span class="label">时间限制</span>
              <span class="value">{{ formatTime(level.timeLimit) }}</span>
            </div>
          </div>

          <div v-if="!isUnlocked(level.id)" class="locked-overlay">
            <span class="lock-icon">🔒</span>
            <span class="lock-text">需累计 {{ level.unlockRequirement }} 分解锁</span>
          </div>

          <button
            v-else
            class="btn btn-primary start-btn"
            @click="startLevel(level.id)"
          >
            开始挑战
          </button>
        </div>
      </div>

      <div class="player-stats card mt-lg">
        <h3 class="subtitle">我的进度</h3>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">累计积分</span>
            <span class="stat-value gold">{{ profile?.totalScore || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已解锁关卡</span>
            <span class="stat-value">{{ profile?.unlockedLevels?.length || 1 }} / {{ levelsData.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前资金</span>
            <span class="stat-value gold">{{ profile?.gold || 0 }} 文</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayer } from '~/composables/usePlayer'

const { profile, loadFromLocal } = usePlayer()

interface LevelInfo {
  id: number
  name: string
  description: string
  initialGold: number
  targetOrders: number
  timeLimit: number
  unlockRequirement: number
  orderCount: number
}

const levelsData = ref<LevelInfo[]>([])

onMounted(async () => {
  loadFromLocal()
  try {
    const data = await $fetch('/api/levels')
    levelsData.value = (data as any).levels || []
  } catch (e) {
    levelsData.value = [
      { id: 1, name: '初入染坊', description: '学习基础的染色技艺', initialGold: 100, targetOrders: 3, timeLimit: 600, unlockRequirement: 0, orderCount: 3 },
      { id: 2, name: '渐入佳境', description: '尝试调配间色', initialGold: 150, targetOrders: 4, timeLimit: 900, unlockRequirement: 60, orderCount: 5 },
      { id: 3, name: '名染初成', description: '挑战复杂的配色', initialGold: 200, targetOrders: 5, timeLimit: 1200, unlockRequirement: 180, orderCount: 6 },
      { id: 4, name: '染坊大师', description: '调配最难的颜色', initialGold: 300, targetOrders: 6, timeLimit: 1500, unlockRequirement: 350, orderCount: 7 }
    ]
  }
})

const isUnlocked = (levelId: number) => {
  if (!profile.value) return levelId === 1
  if (profile.value.unlockedLevels?.includes(levelId)) return true
  const level = levelsData.value.find((l) => l.id === levelId)
  if (!level) return false
  return (profile.value.totalScore || 0) >= level.unlockRequirement
}

const startLevel = (levelId: number) => {
  navigateTo(`/game?levelId=${levelId}`)
}

const goBack = () => {
  navigateTo('/')
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs > 0 ? secs + '秒' : ''}`
}
</script>

<style scoped>
.levels-page {
  min-height: 100vh;
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back-btn {
  font-size: 14px;
}

.levels-grid {
  gap: 20px;
}

.level-card {
  position: relative;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.level-card.locked {
  opacity: 0.7;
}

.level-number {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.level-name {
  font-size: 24px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.level-desc {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 16px;
  line-height: 1.5;
}

.level-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 12px;
  color: var(--color-text-light);
}

.value {
  font-size: 16px;
  font-weight: bold;
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(245, 240, 230, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: var(--radius-md);
}

.lock-icon {
  font-size: 48px;
}

.lock-text {
  font-size: 14px;
  color: var(--color-text-light);
}

.start-btn {
  margin-top: auto;
}

.player-stats {
  padding: 20px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
}

.stat-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-light);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.gold {
  color: var(--color-warning);
}

@media (max-width: 768px) {
  .levels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
