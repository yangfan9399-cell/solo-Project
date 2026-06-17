<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'
import { formatTime } from '~/utils/gameLogic'

const router = useRouter()
const gameStore = useGameStore()

const timeElapsed = ref(0)
const timerInterval = ref<number | null>(null)

onMounted(() => {
  gameStore.startMemoryGame()
  
  timerInterval.value = window.setInterval(() => {
    if (gameStore.isPlaying && !gameStore.showResult) {
      timeElapsed.value++
    }
  }, 1000)
})

watch(() => gameStore.showResult, (newVal) => {
  if (newVal && timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

function flipCard(cardId: number) {
  gameStore.flipMemoryCard(cardId)
}

function restartGame() {
  timeElapsed.value = 0
  gameStore.startMemoryGame()
}

function goBack() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  gameStore.resetGame()
  router.push('/')
}

function getMatchedCount() {
  return gameStore.memoryCards.filter(c => c.isMatched).length / 2
}
</script>

<template>
  <div class="memory-container">
    <template v-if="gameStore.isPlaying && !gameStore.showResult">
      <header class="header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="timer">{{ formatTime(timeElapsed) }}</div>
        <div class="matches">已匹配: {{ getMatchedCount() }}/{{ gameStore.memoryCards.length / 2 }}</div>
      </header>

      <main class="memory-content">
        <div class="memory-board">
          <div
            v-for="card in gameStore.memoryCards"
            :key="card.id"
            class="memory-card"
            :class="{
              'is-revealed': card.isRevealed,
              'is-matched': card.isMatched
            }"
            @click="flipCard(card.id)"
          >
            <div class="card-front">?</div>
            <div class="card-back">{{ card.value }}</div>
          </div>
        </div>

        <div class="instructions">
          <p>点击卡片翻转，找到所有配对的数字</p>
        </div>
      </main>
    </template>

    <template v-else-if="gameStore.showResult && gameStore.gameResult">
      <div class="result-container">
        <div class="result-header">
          <div class="result-icon" :class="{ passed: gameStore.gameResult.passed }">
            {{ gameStore.gameResult.passed ? '🎉' : '😢' }}
          </div>
          <h2>{{ gameStore.gameResult.passed ? '挑战成功！' : '继续加油' }}</h2>
        </div>

        <div class="result-stats">
          <div class="stat-card">
            <div class="stat-value" :class="{ passed: gameStore.gameResult.passed }">
              {{ gameStore.gameResult.score }}
            </div>
            <div class="stat-label">得分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatTime(gameStore.gameResult.timeUsed) }}</div>
            <div class="stat-label">用时</div>
          </div>
        </div>

        <div class="result-buttons">
          <button class="result-btn primary" @click="restartGame">
            再玩一次
          </button>
          <button class="result-btn" @click="goBack">
            返回首页
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.memory-container {
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

.timer {
  font-size: 24px;
  font-weight: bold;
}

.matches {
  font-size: 16px;
}

.memory-content {
  max-width: 500px;
  margin: 0 auto;
}

.memory-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.memory-card {
  aspect-ratio: 1;
  perspective: 1000px;
  cursor: pointer;
}

.memory-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.memory-card.is-revealed .memory-card-inner,
.memory-card.is-matched .memory-card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 36px;
  font-weight: bold;
}

.card-front {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.card-back {
  background: white;
  color: #667eea;
  transform: rotateY(180deg);
}

.memory-card.is-matched .card-back {
  background: #4CAF50;
  color: white;
}

.instructions {
  text-align: center;
  color: white;
  font-size: 16px;
}

.result-container {
  max-width: 400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  margin-top: 100px;
  text-align: center;
}

.result-header {
  margin-bottom: 30px;
}

.result-icon {
  font-size: 72px;
  margin-bottom: 20px;
}

.result-icon.passed {
  animation: bounce 0.5s ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.result-header h2 {
  font-size: 28px;
  color: #333;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #333;
}

.stat-value.passed {
  color: #4CAF50;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.result-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.result-btn {
  padding: 15px 30px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: transform 0.2s;
}

.result-btn.primary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.result-btn:not(.primary) {
  background: #eee;
  color: #333;
}

.result-btn:hover {
  transform: scale(1.05);
}

.memory-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.memory-card.is-revealed,
.memory-card.is-matched {
  transform: rotateY(180deg);
}

.card-front {
  transform: rotateY(0deg);
}

.card-back {
  transform: rotateY(180deg);
}

@media (max-width: 600px) {
  .memory-board {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .card-front,
  .card-back {
    font-size: 24px;
  }
}
</style>
