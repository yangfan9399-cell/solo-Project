<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from '~/stores/gameStore'
import { practicePacks } from '~/data/practicePacks'

const router = useRouter()
const gameStore = useGameStore()

const categoryIcons: Record<string, string> = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
  mixed: '🔢',
  memory: '🧠'
}

function startPractice(packId: string) {
  gameStore.startPractice(packId)
  router.push('/game')
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="practice-container">
    <header class="header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1>练习包</h1>
      <div class="empty"></div>
    </header>

    <main class="main-content">
      <div class="practice-grid">
        <div
          v-for="pack in practicePacks"
          :key="pack.id"
          class="practice-card"
          @click="startPractice(pack.id)"
        >
          <div class="practice-icon">{{ categoryIcons[pack.category] }}</div>
          <h3 class="practice-name">{{ pack.name }}</h3>
          <p class="practice-desc">{{ pack.description }}</p>
          <div class="practice-info">
            <span class="question-count">{{ pack.questions.length }}题</span>
            <span class="category-label">{{ pack.category === 'addition' ? '加法' : pack.category === 'subtraction' ? '减法' : pack.category === 'multiplication' ? '乘法' : pack.category === 'division' ? '除法' : '混合' }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.practice-container {
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

.practice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.practice-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
}

.practice-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.practice-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.practice-name {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.practice-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.practice-info {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.question-count {
  background: #f0f0f0;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
}

.category-label {
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  color: white;
}

@media (max-width: 600px) {
  .practice-grid {
    grid-template-columns: 1fr;
  }
}
</style>
