<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'
import { formatTime } from '~/utils/gameLogic'

const router = useRouter()
const gameStore = useGameStore()

const inputValue = ref('')
const showAnswer = ref(false)
const timerInterval = ref<number | null>(null)

const progress = computed(() => {
  if (gameStore.currentQuestions.length === 0) return 0
  return ((gameStore.currentIndex) / gameStore.currentQuestions.length) * 100
})

onMounted(() => {
  if (!gameStore.isPlaying || !gameStore.currentLevel) {
    router.push('/levels')
    return
  }

  timerInterval.value = window.setInterval(() => {
    gameStore.updateTimer()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

watch(() => gameStore.showResult, (newVal) => {
  if (newVal) {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
  }
})

function submitAnswer() {
  if (!inputValue.value.trim()) return
  const answer = parseFloat(inputValue.value)
  gameStore.submitAnswer(answer)
  showAnswer.value = true
  inputValue.value = ''
  setTimeout(() => {
    showAnswer.value = false
  }, 500)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    submitAnswer()
  }
}

function pauseGame() {
  gameStore.pauseGame()
}

function resumeGame() {
  gameStore.resumeGame()
}

function quitGame() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  gameStore.resetGame()
  router.push('/levels')
}

function goToNextLevel() {
  const nextLevelId = (gameStore.currentLevel?.id || 0) + 1
  if (nextLevelId <= 8) {
    gameStore.startLevel(nextLevelId)
    showAnswer.value = false
  } else {
    router.push('/')
  }
}

function retryLevel() {
  const levelId = gameStore.currentLevel?.id || 1
  gameStore.startLevel(levelId)
  showAnswer.value = false
}

function goHome() {
  gameStore.resetGame()
  router.push('/')
}

function getErrorTypeText(type?: string): string {
  const texts: Record<string, string> = {
    calculation: '计算错误',
    carry: '进位错误',
    borrow: '借位错误',
    digit: '位数错误',
    other: '其他错误'
  }
  return texts[type || 'other'] || '其他错误'
}
</script>

<template>
  <div class="game-container">
    <template v-if="gameStore.isPlaying && !gameStore.showResult">
      <header class="game-header">
        <button class="back-btn" @click="quitGame">✕</button>
        <div class="level-info">
          <span class="level-name">{{ gameStore.currentLevel?.name }}</span>
          <span class="question-count">{{ gameStore.currentIndex + 1 }}/{{ gameStore.currentQuestions.length }}</span>
        </div>
        <button class="pause-btn" @click="pauseGame">⏸</button>
      </header>

      <div class="timer-bar">
        <div class="time-display">{{ formatTime(gameStore.timeRemaining) }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
      </div>

      <main class="game-content">
        <div class="question-card" :class="{ 'show-answer': showAnswer }">
          <div class="question-expression">{{ gameStore.currentQuestion?.expression }}</div>
          <div class="question-answer" v-if="showAnswer">
            <span class="answer-label">答案:</span>
            <span class="answer-value">{{ gameStore.currentQuestion?.answer }}</span>
          </div>
        </div>

        <div class="input-area">
          <input
            v-model="inputValue"
            type="number"
            class="answer-input"
            placeholder="输入答案"
            @keydown="handleKeydown"
            :disabled="gameStore.isPaused"
            autofocus
          />
          <button class="submit-btn" @click="submitAnswer" :disabled="!inputValue.trim() || gameStore.isPaused">
            提交
          </button>
        </div>

        <div class="operation-history">
          <div class="history-title">得分记录</div>
          <div class="history-items">
            <div
              v-for="(op, index) in gameStore.operationHistory.slice(-5)"
              :key="index"
              class="history-item"
              :class="{ 'is-correct': op.type === 'add' }"
            >
              <span class="history-icon">{{ op.type === 'add' ? '+' : '-' }}</span>
              <span class="history-value">{{ op.value }}</span>
            </div>
            <div v-if="gameStore.operationHistory.length === 0" class="history-empty">
              暂无记录
            </div>
          </div>
        </div>
      </main>

      <div class="pause-overlay" v-if="gameStore.isPaused">
        <div class="pause-modal">
          <h2>游戏暂停</h2>
          <div class="pause-buttons">
            <button class="pause-btn resume" @click="resumeGame">继续游戏</button>
            <button class="pause-btn quit" @click="quitGame">退出游戏</button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="gameStore.showResult && gameStore.gameResult">
      <div class="result-container">
        <div class="result-header">
          <div class="result-icon" :class="{ passed: gameStore.gameResult.passed }">
            {{ gameStore.gameResult.passed ? '🎉' : '😢' }}
          </div>
          <h2>{{ gameStore.gameResult.passed ? '闯关成功！' : '挑战失败' }}</h2>
        </div>

        <div class="result-stats">
          <div class="stat-card">
            <div class="stat-value" :class="{ passed: gameStore.gameResult.passed }">
              {{ gameStore.gameResult.score }}
            </div>
            <div class="stat-label">总得分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value correct">{{ gameStore.gameResult.correctCount }}</div>
            <div class="stat-label">答对</div>
          </div>
          <div class="stat-card">
            <div class="stat-value wrong">{{ gameStore.gameResult.wrongCount }}</div>
            <div class="stat-label">答错</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatTime(gameStore.gameResult.timeUsed) }}</div>
            <div class="stat-label">用时</div>
          </div>
        </div>

        <div class="result-details" v-if="gameStore.answers.length > 0">
          <h3>答题详情</h3>
          <div class="answers-list">
            <div
              v-for="(answer, index) in gameStore.answers"
              :key="index"
              class="answer-item"
              :class="{ correct: answer.isCorrect, wrong: !answer.isCorrect }"
            >
              <div class="answer-status">
                {{ answer.isCorrect ? '✓' : '✗' }}
              </div>
              <div class="answer-content">
                <div class="answer-expression">
                  {{ gameStore.currentQuestions[index]?.expression }} = ?
                </div>
                <div class="answer-compare">
                  <span class="your-answer">你的答案: {{ answer.playerAnswer }}</span>
                  <span class="correct-answer">正确答案: {{ answer.correctAnswer }}</span>
                </div>
                <div class="error-type" v-if="!answer.isCorrect && answer.errorType">
                  {{ getErrorTypeText(answer.errorType) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="result-buttons">
          <button
            v-if="gameStore.gameResult.passed && (gameStore.currentLevel?.id || 0) < 8"
            class="result-btn primary"
            @click="goToNextLevel"
          >
            下一关 →
          </button>
          <button class="result-btn" @click="retryLevel">
            重试本关
          </button>
          <button class="result-btn" @click="goHome">
            返回首页
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  margin-bottom: 20px;
}

.back-btn, .pause-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.2s;
}

.back-btn:hover, .pause-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.level-info {
  display: flex;
  gap: 15px;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
}

.question-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
}

.timer-bar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px 20px;
  margin-bottom: 30px;
}

.time-display {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
  text-align: center;
  margin-bottom: 10px;
}

.progress-bar {
  height: 10px;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

.game-content {
  max-width: 600px;
  margin: 0 auto;
}

.question-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  margin-bottom: 30px;
  transition: transform 0.3s;
}

.question-card.show-answer {
  transform: scale(1.02);
}

.question-expression {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.question-answer {
  font-size: 24px;
  color: #666;
}

.answer-label {
  margin-right: 10px;
}

.answer-value {
  font-weight: bold;
  color: #4CAF50;
}

.input-area {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.answer-input {
  flex: 1;
  padding: 20px;
  font-size: 24px;
  border: none;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.95);
  text-align: center;
  outline: none;
}

.submit-btn {
  padding: 20px 40px;
  font-size: 20px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: transform 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.operation-history {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
}

.history-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.history-items {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
}

.history-item.is-correct {
  background: #e8f5e9;
  color: #4CAF50;
}

.history-icon {
  font-weight: bold;
}

.history-empty {
  color: #999;
  font-size: 14px;
}

.pause-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.pause-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
}

.pause-modal h2 {
  font-size: 24px;
  margin-bottom: 30px;
}

.pause-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.pause-btn {
  color: #333;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 16px;
}

.pause-btn.resume {
  background: #4CAF50;
  color: white;
}

.pause-btn.quit {
  background: #eee;
}

.result-container {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  margin-top: 50px;
}

.result-header {
  text-align: center;
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f5f5f5;
  border-radius: 15px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-value.passed {
  color: #4CAF50;
}

.stat-value.correct {
  color: #4CAF50;
}

.stat-value.wrong {
  color: #F44336;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.result-details h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.answers-list {
  max-height: 300px;
  overflow-y: auto;
}

.answer-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 10px;
  margin-bottom: 10px;
}

.answer-item.correct {
  background: #e8f5e9;
}

.answer-item.wrong {
  background: #ffebee;
}

.answer-status {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.answer-item.correct .answer-status {
  background: #4CAF50;
  color: white;
}

.answer-item.wrong .answer-status {
  background: #F44336;
  color: white;
}

.answer-content {
  flex: 1;
}

.answer-expression {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.answer-compare {
  font-size: 14px;
  color: #666;
}

.your-answer {
  margin-right: 15px;
}

.your-answer {
  color: #F44336;
}

.correct-answer {
  color: #4CAF50;
}

.error-type {
  font-size: 12px;
  color: #F44336;
  margin-top: 5px;
}

.result-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
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

@media (max-width: 600px) {
  .result-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .question-expression {
    font-size: 32px;
  }

  .input-area {
    flex-direction: column;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
