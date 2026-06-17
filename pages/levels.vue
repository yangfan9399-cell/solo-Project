<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'
import { getLevelById } from '~/data/levels'
import { formatTime } from '~/utils/gameLogic'

const router = useRouter()
const gameStore = useGameStore()

const difficultyColors: Record<string, string> = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#F44336',
  expert: '#9C27B0'
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  expert: '专家'
}

function getBestScore(levelId: number): number {
  const records = gameStore.gameRecords.filter(r => r.levelId === levelId)
  return records.length > 0 ? Math.max(...records.map(r => r.score)) : 0
}

function isLevelUnlocked(levelId: number): boolean {
  return levelId <= gameStore.player?.level || levelId === 1
}

function startLevel(levelId: number) {
  if (!isLevelUnlocked(levelId)) return
  gameStore.startLevel(levelId)
  router.push('/game')
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="levels-container">
    <header class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>闯关模式</h1>
      <div class="empty"></div>
    </header>

    <main class="main-content">
      <div class="levels-grid">
        <div
          v-for="level in gameStore.unlockedLevels"
          :key="level.id"
          class="level-card"
          :class="{ locked: !isLevelUnlocked(level.id) }"
          @click="startLevel(level.id)"
        >
          <div class="level-header">
            <div class="level-number">{{ level.id }}</div>
            <div
              class="difficulty-badge"
              :style="{ backgroundColor: difficultyColors[level.difficulty] }"
            >
              {{ difficultyLabels[level.difficulty] }}
            </div>
          </div>

          <h3 class="level-name">{{ level.name }}</h3>
          <p class="level-desc">{{ level.description }}</p>

          <div class="level-info">
            <div class="info-item">
              <span class="info-icon">⏱</span>
              <span>{{ formatTime(level.timeLimit) }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">📝</span>
              <span>{{ level.questions.length }}题</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🎯</span>
              <span>{{ level.requiredScore }}分通关</span>
            </div>
          </div>

          <div class="level-score" v-if="getBestScore(level.id) > 0">
            <span class="score-label">最高分:</span>
            <span class="score-value">{{ getBestScore(level.id) }}</span>
          </div>

          <div class="lock-overlay" v-if="!isLevelUnlocked(level.id)">
            <span class="lock-icon">🔒</span>
            <span class="lock-text">完成第{{ level.id - 1 }}关解锁</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.levels-container {
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
  max-width: 900px;
  margin: 0 auto;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.level-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 25px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.level-card:hover:not(.locked) {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.level-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.level-number {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
}

.difficulty-badge {
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.level-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.level-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.level-info {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
}

.info-icon {
  font-size: 16px;
}

.level-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.score-label {
  font-size: 14px;
  color: #666;
}

.score-value {
  font-size: 20px;
  font-weight: bold;
  color: #f5576c;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  color: white;
}

.lock-icon {
  font-size: 48px;
}

.lock-text {
  font-size: 16px;
}

@media (max-width: 600px) {
  .levels-grid {
    grid-template-columns: 1fr;
  }
}
</style>
