<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">古法染坊</h1>
        <p class="hero-subtitle">配色经营游戏</p>
        <p class="hero-desc">
          调配染料，掌控火候，染出千般色彩<br />
          经营染坊，完成订单，成就一代名染
        </p>
      </div>
    </div>

    <div class="main-content container">
      <div v-if="!isLoggedIn" class="login-section card">
        <h2 class="title text-center">进入染坊</h2>
        <p class="subtitle text-center">请输入你的名号</p>
        <div class="login-form">
          <input
            v-model="playerName"
            type="text"
            placeholder="请输入名字..."
            class="name-input"
            @keyup.enter="handleLogin"
          />
          <button class="btn btn-primary" :disabled="!playerName.trim()" @click="handleLogin">
            进入染坊
          </button>
        </div>
        <p class="hint mt-sm">输入相同名字可继续上次的游戏进度</p>
      </div>

      <div v-else class="dashboard-section">
        <div class="welcome-card card">
          <div class="welcome-text">
            <h2 class="title">{{ profile?.name }} 的染坊</h2>
            <p class="subtitle">累计积分: <span class="gold-text">{{ profile?.totalScore }}</span></p>
            <p class="subtitle">持有资金: <span class="gold-text">{{ profile?.gold }} 文</span></p>
          </div>
          <button class="btn btn-ghost" @click="handleLogout">换个名号</button>
        </div>

        <div class="action-buttons grid grid-3 mt-lg">
          <button class="btn btn-primary action-card" @click="goToLevels">
            <span class="action-icon">🎮</span>
            <span class="action-title">开始游戏</span>
            <span class="action-desc">选择关卡开始染色</span>
          </button>
          <button class="btn btn-secondary action-card" @click="goToReports">
            <span class="action-icon">📊</span>
            <span class="action-title">经营报表</span>
            <span class="action-desc">查看历史记录</span>
          </button>
          <button class="btn btn-ghost action-card" @click="showRanking = true">
            <span class="action-icon">🏆</span>
            <span class="action-title">排行榜</span>
            <span class="action-desc">查看高手排名</span>
          </button>
        </div>

        <div class="tutorial-card card mt-lg">
          <h3 class="subtitle">游戏玩法</h3>
          <div class="tutorial-content">
            <div class="tutorial-item">
              <span class="tutorial-num">1</span>
              <div>
                <h4>选择订单</h4>
                <p>从布庄、官衙等客户手中承接染色订单</p>
              </div>
            </div>
            <div class="tutorial-item">
              <span class="tutorial-num">2</span>
              <div>
                <h4>调配染料</h4>
                <p>加入不同染料，调整水温，控制浸泡时间</p>
              </div>
            </div>
            <div class="tutorial-item">
              <span class="tutorial-num">3</span>
              <div>
                <h4>提交交货</h4>
                <p>将成品提交给客户，根据色差获得报酬</p>
              </div>
            </div>
            <div class="tutorial-item">
              <span class="tutorial-num">4</span>
              <div>
                <h4>经营染坊</h4>
                <p>采购染料，完成更多订单，成为名染大师</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRanking" class="ranking-modal">
      <div class="modal-overlay" @click="showRanking = false"></div>
      <div class="modal-content card">
        <h2 class="title text-center">🏆 排行榜</h2>
        <div class="ranking-list">
          <div v-if="rankings.length === 0" class="empty-ranking">
            暂无数据，快去游戏吧！
          </div>
          <div
            v-for="(p, index) in rankings"
            :key="p.id"
            class="ranking-item"
            :class="'rank-' + (index + 1)"
          >
            <span class="rank-num">{{ index + 1 }}</span>
            <span class="rank-name">{{ p.name }}</span>
            <span class="rank-score">{{ p.totalScore }} 分</span>
          </div>
        </div>
        <button class="btn btn-ghost mt-md" style="width: 100%" @click="showRanking = false">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayer } from '~/composables/usePlayer'

const { profile, isLoggedIn, login, logout, loadFromLocal } = usePlayer()

const playerName = ref('')
const showRanking = ref(false)
const rankings = ref<any[]>([])

onMounted(() => {
  loadFromLocal()
})

const handleLogin = async () => {
  if (!playerName.value.trim()) return
  await login(playerName.value.trim())
  playerName.value = ''
}

const handleLogout = () => {
  logout()
}

const goToLevels = () => {
  navigateTo('/levels')
}

const goToReports = () => {
  navigateTo('/reports')
}

const loadRankings = async () => {
  try {
    const data = await $fetch('/api/profiles')
    rankings.value = (data as any).profiles || []
  } catch (e) {
    rankings.value = []
  }
}

watch(showRanking, (val) => {
  if (val) {
    loadRankings()
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #8b4513 0%, #cd853f 50%, #daa520 100%);
  padding: 60px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%);
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 56px;
  color: #fff8e7;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
  margin-bottom: 8px;
  letter-spacing: 8px;
}

.hero-subtitle {
  font-size: 24px;
  color: rgba(255, 248, 231, 0.9);
  margin-bottom: 20px;
  letter-spacing: 4px;
}

.hero-desc {
  font-size: 16px;
  color: rgba(255, 248, 231, 0.8);
  line-height: 1.8;
}

.main-content {
  padding: 40px 20px;
}

.login-section {
  max-width: 400px;
  margin: 0 auto;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.name-input {
  padding: 14px 16px;
  border: 2px solid rgba(139, 69, 19, 0.3);
  border-radius: var(--radius-md);
  font-size: 18px;
  font-family: inherit;
  background-color: var(--color-cream);
  text-align: center;
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.hint {
  font-size: 13px;
  color: var(--color-text-light);
  text-align: center;
}

.welcome-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text .gold-text {
  color: var(--color-warning);
  font-weight: bold;
}

.action-buttons {
  gap: 20px;
}

.action-card {
  flex-direction: column;
  gap: 10px;
  padding: 30px 20px;
  min-height: 140px;
}

.action-icon {
  font-size: 40px;
}

.action-title {
  font-size: 20px;
  font-weight: bold;
}

.action-desc {
  font-size: 13px;
  opacity: 0.8;
}

.tutorial-card {
  padding: 24px;
}

.tutorial-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 16px;
}

.tutorial-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tutorial-num {
  width: 32px;
  height: 32px;
  background-color: var(--color-primary);
  color: var(--color-cream);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.tutorial-item h4 {
  font-size: 16px;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.tutorial-item p {
  font-size: 13px;
  color: var(--color-text-light);
  line-height: 1.5;
}

.ranking-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  padding: 24px;
  z-index: 1;
  max-height: 80vh;
  overflow-y: auto;
}

.ranking-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-ranking {
  text-align: center;
  color: var(--color-text-light);
  padding: 30px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.rank-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--color-text-light);
  color: var(--color-cream);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.rank-1 .rank-num {
  background-color: #d4af37;
}

.rank-2 .rank-num {
  background-color: #a0a0a0;
}

.rank-3 .rank-num {
  background-color: #cd7f32;
}

.rank-name {
  flex: 1;
  font-weight: bold;
}

.rank-score {
  color: var(--color-warning);
  font-weight: bold;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
    letter-spacing: 4px;
  }

  .tutorial-content {
    grid-template-columns: 1fr;
  }
}
</style>
