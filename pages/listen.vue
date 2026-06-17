<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const inputValue = ref('')
const isPlaying = ref(false)
const currentQuestionIndex = ref(0)
const showQuestion = ref(false)

onMounted(() => {
  gameStore.startListenGame()
})

watch(() => gameStore.currentListenIndex, (newIndex) => {
  currentQuestionIndex.value = newIndex
  inputValue.value = ''
  showQuestion.value = false
})

watch(() => gameStore.showResult, (newVal) => {
  if (newVal) {
    isPlaying.value = false
  }
})

function speakQuestion() {
  const question = gameStore.listenQuestions[currentQuestionIndex.value]
  if (!question || isPlaying.value) return

  isPlaying.value = true
  const utterance = new SpeechSynthesisUtterance(question.expression)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8
  utterance.onend = () => {
    isPlaying.value = false
    showQuestion.value = true
  }
  speechSynthesis.speak(utterance)
}

function submitAnswer() {
  if (!inputValue.value.trim()) return
  const answer = parseFloat(inputValue.value)
  gameStore.submitListenAnswer(answer)
  inputValue.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    submitAnswer()
  }
}

function restartGame() {
  gameStore.startListenGame()
  currentQuestionIndex.value = 0
  inputValue.value = ''
  showQuestion.value = false
}

function goBack() {
  gameStore.resetGame()
  router.push('/')
}
</script>

<template>
  <div class="listen-container">
    <template v-if="gameStore.isPlaying && !gameStore.showResult">
      <header class="header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="question-count">第{{ currentQuestionIndex + 1 }}题 / 共{{ gameStore.listenQuestions.length }}题</div>
        <div class="empty"></div>
      </header>

      <main class="listen-content">
        <div class="listen-card">
          <div class="question-display">
            <div v-if="!showQuestion" class="waiting-state">
              <div class="play-icon" :class="{ playing: isPlaying }" @click="speakQuestion">
                🔊
              </div>
              <p>点击播放按钮听题</p>
            </div>
            <div v-else class="question-text">
              {{ gameStore.listenQuestions[currentQuestionIndex]?.expression }} = ?
            </div>
          </div>

          <div class="input-area" v-if="showQuestion">
            <input
              v-model="inputValue"
              type="number"
              class="answer-input"
              placeholder="输入答案"
              @keydown="handleKeydown"
              autofocus
            />
            <button class="submit-btn" @click="submitAnswer" :disabled="!inputValue.trim()">
              提交
            </button>
          </div>

          <div class="replay-btn" v-if="showQuestion" @click="speakQuestion">
            🔄 重新播放
          </div>
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
            <div class="stat-value correct">{{ gameStore.gameResult.correctCount }}</div>
            <div class="stat-label">答对</div>
          </div>
          <div class="stat-card">
            <div class="stat-value wrong">{{ gameStore.gameResult.wrongCount }}</div>
            <div class="stat-label">答错</div>
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
                  {{ gameStore.listenQuestions[index]?.expression }} = ?
                </div>
                <div class="answer-compare">
                  <span class="your-answer">你的答案: {{ answer.playerAnswer }}</span>
                  <span class="correct-answer">正确答案: {{ answer.correctAnswer }}</span>
                </div>
              </div>
            </div>
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
.listen-container {
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

.question-count {
  font-size: 18px;
  font-weight: bold;
}

.empty {
  width: 80px;
}

.listen-content {
  max-width: 600px;
  margin: 0 auto;
}

.listen-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
}

.question-display {
  margin-bottom: 30px;
}

.waiting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.play-icon {
  font-size: 80px;
  cursor: pointer;
  transition: transform 0.2s;
}

.play-icon:hover {
  transform: scale(1.1);
}

.play-icon.playing {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.waiting-state p {
  font-size: 18px;
  color: #666;
}

.question-text {
  font-size: 36px;
  font-weight: bold;
  color: #333;
}

.input-area {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.answer-input {
  padding: 20px 40px;
  font-size: 24px;
  border: none;
  border-radius: 15px;
  background: #f0f0f0;
  text-align: center;
  outline: none;
  width: 200px;
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

.replay-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: background 0.2s;
}

.replay-btn:hover {
  background: #e0e0e0;
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
  display: flex;
  justify-content: center;
  gap: 30px;
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

.stat-value.correct {
  color: #4CAF50;
}

.stat-value.wrong {
  color: #F44336;
}

.stat-label {
  font-size: 14px;
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
  color: #F44336;
}

.correct-answer {
  color: #4CAF50;
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
  .input-area {
    flex-direction: column;
    align-items: center;
  }

  .answer-input {
    width: 100%;
  }

  .question-text {
    font-size: 28px;
  }
}
</style>
