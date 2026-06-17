<script setup lang="ts">
import { useGameStore } from '~/stores/gameStore'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const gameStore = useGameStore()
const router = useRouter()

onMounted(() => {
  gameStore.initPlayer()
})

function goToLevels() {
  router.push('/levels')
}

function goToPractice() {
  router.push('/practice')
}

function goToMemory() {
  router.push('/memory')
}

function goToListen() {
  router.push('/listen')
}

function goToRanking() {
  router.push('/ranking')
}

function goToRecords() {
  router.push('/records')
}
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="logo">
        <div class="abacus-icon">🧮</div>
        <h1>算盘心算闯关训练</h1>
      </div>
      <div class="player-info" v-if="gameStore.player">
        <div class="player-name">{{ gameStore.player.name }}</div>
        <div class="player-rank">{{ gameStore.player.rank }}</div>
        <div class="player-level">Lv.{{ gameStore.player.level }}</div>
      </div>
    </header>

    <main class="main-content">
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ gameStore.player?.totalScore || 0 }}</div>
          <div class="stat-label">总积分</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ gameStore.player?.experience || 0 }}</div>
          <div class="stat-label">经验值</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ gameStore.gameRecords.length }}</div>
          <div class="stat-label">游戏次数</div>
        </div>
      </div>

      <div class="menu-grid">
        <button class="menu-item primary" @click="goToLevels">
          <div class="menu-icon">🎯</div>
          <div class="menu-text">
            <div class="menu-title">闯关模式</div>
            <div class="menu-desc">挑战8个精心设计的关卡</div>
          </div>
        </button>

        <button class="menu-item" @click="goToPractice">
          <div class="menu-icon">📚</div>
          <div class="menu-text">
            <div class="menu-title">练习包</div>
            <div class="menu-desc">专项训练，巩固基础</div>
          </div>
        </button>

        <button class="menu-item" @click="goToMemory">
          <div class="menu-icon">🧠</div>
          <div class="menu-text">
            <div class="menu-title">记忆盘</div>
            <div class="menu-desc">锻炼记忆力和反应</div>
          </div>
        </button>

        <button class="menu-item" @click="goToListen">
          <div class="menu-icon">👂</div>
          <div class="menu-text">
            <div class="menu-title">听算挑战</div>
            <div class="menu-desc">听题心算，提升专注力</div>
          </div>
        </button>

        <button class="menu-item" @click="goToRanking">
          <div class="menu-icon">🏆</div>
          <div class="menu-text">
            <div class="menu-title">段位榜</div>
            <div class="menu-desc">查看排行榜</div>
          </div>
        </button>

        <button class="menu-item" @click="goToRecords">
          <div class="menu-icon">📊</div>
          <div class="menu-text">
            <div class="menu-title">战绩记录</div>
            <div class="menu-desc">查看历史成绩</div>
          </div>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 15px;
}

.abacus-icon {
  font-size: 48px;
}

.logo h1 {
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.player-info {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 15px 25px;
  border-radius: 20px;
  color: white;
  text-align: center;
}

.player-name {
  font-weight: bold;
  font-size: 18px;
}

.player-rank {
  font-size: 14px;
  opacity: 0.9;
}

.player-level {
  font-size: 16px;
  font-weight: bold;
  margin-top: 5px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
}

.stats-card {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.menu-item {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 20px;
  padding: 25px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: left;
}

.menu-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.menu-item.primary {
  grid-column: span 2;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.menu-item.primary .menu-title {
  color: white;
}

.menu-item.primary .menu-desc {
  color: rgba(255, 255, 255, 0.8);
}

.menu-icon {
  font-size: 40px;
}

.menu-text {
  flex: 1;
}

.menu-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.menu-desc {
  font-size: 14px;
  color: #666;
}

@media (max-width: 600px) {
  .menu-grid {
    grid-template-columns: 1fr;
  }

  .menu-item.primary {
    grid-column: span 1;
  }

  .stats-card {
    flex-direction: column;
    gap: 20px;
  }

  .logo h1 {
    font-size: 20px;
  }

  .abacus-icon {
    font-size: 36px;
  }
}
</style>
