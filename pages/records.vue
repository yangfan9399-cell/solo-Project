<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'
import { getLevelById } from '~/data/levels'
import { formatTime } from '~/utils/gameLogic'

const router = useRouter()
const gameStore = useGameStore()

function getLevelName(levelId: number): string {
  const level = getLevelById(levelId)
  return level?.name || `练习模式`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="records-container">
    <header class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>战绩记录</h1>
      <div class="empty"></div>
    </header>

    <main class="main-content">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-value">{{ gameStore.gameRecords.length }}</div>
          <div class="summary-label">总游戏次数</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">
            {{ gameStore.gameRecords.reduce((sum, r) => sum + r.correctCount, 0) }}
          </div>
          <div class="summary-label">总答对题数</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">
            {{ gameStore.gameRecords.reduce((sum, r) => sum + r.score, 0) }}
          </div>
          <div class="summary-label">总得分</div>
        </div>
      </div>

      <div class="records-list">
        <div
          v-for="record in gameStore.gameRecords.slice().reverse()"
          :key="record.id"
          class="record-item"
        >
          <div class="record-header">
            <div class="level-info">
              <span class="level-name">{{ getLevelName(record.levelId) }}</span>
              <span class="record-date">{{ formatDate(record.timestamp) }}</span>
            </div>
            <div class="record-score" :class="{ passed: record.score >= (getLevelById(record.levelId)?.requiredScore || 60) }">
              {{ record.score }}分
            </div>
          </div>

          <div class="record-details">
            <div class="detail-item">
              <span class="detail-label">答对</span>
              <span class="detail-value correct">{{ record.correctCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">答错</span>
              <span class="detail-value wrong">{{ record.wrongCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用时</span>
              <span class="detail-value">{{ formatTime(record.timeUsed) }}</span>
            </div>
          </div>
        </div>

        <div v-if="gameStore.gameRecords.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无游戏记录</p>
          <p class="empty-hint">完成游戏后将自动保存记录</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.records-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  color: white;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  font-size: 24px;
}

.empty {
  width: 80px;
}

.main-content {
  max-width: 600px;
  margin: 0 auto;
}

.summary-cards {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.summary-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: #667eea;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.record-date {
  font-size: 14px;
  color: #666;
}

.record-score {
  font-size: 24px;
  font-weight: bold;
  color: #F44336;
}

.record-score.passed {
  color: #4CAF50;
}

.record-details {
  display: flex;
  gap: 30px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.detail-value.correct {
  color: #4CAF50;
}

.detail-value.wrong {
  color: #F44336;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 10px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

@media (max-width: 600px) {
  .summary-cards {
    flex-direction: column;
  }

  .record-details {
    gap: 20px;
  }
}
</style>
