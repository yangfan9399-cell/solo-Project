<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

function getRankIcon(index: number): string {
  return rankIcons[index] || `${index + 1}`
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="ranking-container">
    <header class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>段位榜</h1>
      <div class="empty"></div>
    </header>

    <main class="main-content">
      <div class="ranking-list">
        <div
          v-for="(entry, index) in gameStore.ranking.slice(0, 20)"
          :key="entry.playerId"
          class="ranking-item"
          :class="{ 'is-current': entry.playerId === gameStore.player?.id }"
        >
          <div class="rank-number">{{ getRankIcon(index) }}</div>
          <div class="player-info">
            <div class="player-name">{{ entry.playerName }}</div>
            <div class="player-rank">{{ entry.rank }}</div>
          </div>
          <div class="player-score">
            <div class="score-value">{{ entry.score }}</div>
            <div class="score-label">积分</div>
          </div>
        </div>

        <div v-if="gameStore.ranking.length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <p>暂无排名数据</p>
          <p class="empty-hint">完成游戏后将自动进入排行榜</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ranking-container {
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

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  transition: transform 0.2s;
}

.ranking-item:hover {
  transform: translateX(5px);
}

.ranking-item.is-current {
  border: 2px solid #f5576c;
  background: #fff5f5;
}

.rank-number {
  font-size: 28px;
  font-weight: bold;
  width: 40px;
  text-align: center;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.player-rank {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.player-score {
  text-align: right;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 12px;
  color: #666;
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
  .ranking-item {
    padding: 15px;
  }

  .rank-number {
    font-size: 24px;
    width: 35px;
  }

  .player-name {
    font-size: 16px;
  }

  .score-value {
    font-size: 20px;
  }
}
</style>
