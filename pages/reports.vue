<template>
  <div class="reports-page">
    <div class="container">
      <div class="page-header">
        <button class="btn btn-ghost back-btn" @click="goBack">
          ← 返回
        </button>
        <h1 class="title">经营报表</h1>
        <div style="width: 80px"></div>
      </div>

      <div class="summary-cards grid grid-3">
        <div class="summary-card card">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <div class="card-title">累计资金</div>
            <div class="card-value gold">{{ profile?.gold || 0 }} 文</div>
          </div>
        </div>
        <div class="summary-card card">
          <div class="card-icon">⭐</div>
          <div class="card-content">
            <div class="card-title">累计积分</div>
            <div class="card-value score">{{ profile?.totalScore || 0 }}</div>
          </div>
        </div>
        <div class="summary-card card">
          <div class="card-icon">🏆</div>
          <div class="card-content">
            <div class="card-title">已解锁关卡</div>
            <div class="card-value">{{ profile?.unlockedLevels?.length || 1 }} / 4</div>
          </div>
        </div>
      </div>

      <div class="report-section card mt-lg">
        <h3 class="subtitle">游戏记录</h3>
        <div v-if="records.length === 0" class="empty-records">
          暂无游戏记录，快去开始游戏吧！
        </div>
        <div v-else class="records-list">
          <div
            v-for="record in records"
            :key="record.id"
            class="record-item"
          >
            <div class="record-header">
              <span class="record-level">第 {{ record.levelId }} 关</span>
              <span class="record-status" :class="record.status">
                {{ statusText(record.status) }}
              </span>
            </div>
            <div class="record-stats">
              <div class="stat">
                <span class="stat-label">得分</span>
                <span class="stat-value">{{ record.score }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">完成订单</span>
                <span class="stat-value">{{ record.ordersCompleted }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">收益</span>
                <span class="stat-value gold">{{ record.goldEarned }} 文</span>
              </div>
              <div class="stat">
                <span class="stat-label">日期</span>
                <span class="stat-value date">{{ formatDate(record.endTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="level-stats card mt-lg">
        <h3 class="subtitle">各关卡最佳成绩</h3>
        <div class="level-best-list">
          <div
            v-for="level in levelBestScores"
            :key="level.levelId"
            class="level-best-item"
          >
            <span class="level-name">第 {{ level.levelId }} 关</span>
            <span class="level-score">
              {{ level.bestScore > 0 ? level.bestScore + ' 分' : '未通关' }}
            </span>
          </div>
        </div>
      </div>

      <div class="achievement-section card mt-lg">
        <h3 class="subtitle">成就</h3>
        <div class="achievements-grid">
          <div
            v-for="achievement in achievements"
            :key="achievement.id"
            class="achievement-item"
            :class="{ unlocked: achievement.unlocked }"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
            </div>
            <div class="achievement-status">
              {{ achievement.unlocked ? '✓ 已达成' : '未达成' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayer } from '~/composables/usePlayer'
import type { GameRecord } from '~/types/game'

const { profile, loadFromLocal } = usePlayer()

const records = ref<GameRecord[]>([])

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

const achievements = ref<Achievement[]>([])

const levelBestScores = computed(() => {
  const best: { levelId: number; bestScore: number }[] = []
  for (let i = 1; i <= 4; i++) {
    const levelRecords = records.value.filter((r) => r.levelId === i && r.status === 'completed')
    const bestScore = levelRecords.length > 0
      ? Math.max(...levelRecords.map((r) => r.score))
      : 0
    best.push({ levelId: i, bestScore })
  }
  return best
})

onMounted(async () => {
  loadFromLocal()
  await loadRecords()
  updateAchievements()
})

const loadRecords = async () => {
  if (!profile.value) return

  try {
    const data = await $fetch('/api/records', {
      query: { playerId: profile.value.id }
    })
    records.value = (data as any).records || []
  } catch (e) {
    records.value = []
  }
}

const updateAchievements = () => {
  const totalScore = profile.value?.totalScore || 0
  const completedLevels = profile.value?.unlockedLevels?.length || 0
  const completedRecords = records.value.filter((r) => r.status === 'completed').length

  achievements.value = [
    {
      id: 'first_dye',
      name: '初入染坊',
      description: '完成第一笔订单',
      icon: '🧵',
      unlocked: completedRecords > 0
    },
    {
      id: 'level_complete',
      name: '小有所成',
      description: '通过第1关',
      icon: '🎯',
      unlocked: completedLevels >= 2
    },
    {
      id: 'score_100',
      name: '百分解锁',
      description: '累计获得100分',
      icon: '💯',
      unlocked: totalScore >= 100
    },
    {
      id: 'score_500',
      name: '五百积分',
      description: '累计获得500分',
      icon: '🏅',
      unlocked: totalScore >= 500
    },
    {
      id: 'all_levels',
      name: '一代名染',
      description: '解锁所有关卡',
      icon: '👑',
      unlocked: completedLevels >= 4
    },
    {
      id: 'rich',
      name: '腰缠万贯',
      description: '持有资金超过500文',
      icon: '💰',
      unlocked: (profile.value?.gold || 0) >= 500
    }
  ]
}

const goBack = () => {
  navigateTo('/')
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    completed: '通关',
    failed: '失败',
    quit: '放弃'
  }
  return map[status] || status
}

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.reports-page {
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

.summary-cards {
  gap: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.card-icon {
  font-size: 40px;
}

.card-title {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
}

.card-value.gold {
  color: var(--color-warning);
}

.card-value.score {
  color: var(--color-primary);
}

.report-section {
  padding: 24px;
}

.empty-records {
  text-align: center;
  color: var(--color-text-light);
  padding: 40px;
  font-size: 15px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.record-item {
  padding: 14px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-level {
  font-size: 16px;
  font-weight: bold;
  color: var(--color-primary);
}

.record-status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: bold;
}

.record-status.completed {
  background-color: rgba(61, 92, 61, 0.2);
  color: var(--color-success);
}

.record-status.failed {
  background-color: rgba(139, 0, 0, 0.2);
  color: var(--color-danger);
}

.record-status.quit {
  background-color: rgba(107, 83, 68, 0.2);
  color: var(--color-text-light);
}

.record-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-light);
}

.stat-value {
  font-size: 15px;
  font-weight: bold;
}

.stat-value.gold {
  color: var(--color-warning);
}

.stat-value.date {
  font-size: 12px;
  color: var(--color-text-light);
  font-weight: normal;
}

.level-stats {
  padding: 24px;
}

.level-best-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.level-best-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.level-name {
  font-weight: bold;
}

.level-score {
  color: var(--color-primary);
  font-weight: bold;
}

.achievement-section {
  padding: 24px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  opacity: 0.6;
  position: relative;
}

.achievement-item.unlocked {
  opacity: 1;
  background-color: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
}

.achievement-icon {
  font-size: 28px;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.achievement-desc {
  font-size: 11px;
  color: var(--color-text-light);
}

.achievement-status {
  font-size: 11px;
  color: var(--color-text-light);
}

.achievement-item.unlocked .achievement-status {
  color: var(--color-success);
  font-weight: bold;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .record-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
