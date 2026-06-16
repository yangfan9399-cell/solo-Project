<template>
  <div class="container">
    <header class="text-center mb-6">
      <h1 class="title">🔭 天文台观测排班夜巡</h1>
      <p class="subtitle mt-2">合理安排设备与观测计划，在有限的夜晚中积累尽可能多的科学积分</p>
    </header>

    <div class="grid grid-3 mb-6">
      <div class="card">
        <div class="label">当前观测员</div>
        <div class="flex items-center justify-between mt-2">
          <div>
            <div class="value">{{ currentProfile?.name || '未选择' }}</div>
            <div class="text-muted text-sm mt-1">累计积分: {{ currentProfile?.totalScore || 0 }}</div>
            <div class="text-muted text-sm">最高解锁关卡: {{ currentProfile?.highestLevel || 1 }}</div>
          </div>
          <button class="btn btn-secondary" @click="showProfileModal = true">切换</button>
        </div>
      </div>

      <div class="card">
        <div class="label">望远镜库</div>
        <div class="value">{{ telescopes.length }} 台可用</div>
        <div class="text-muted text-sm mt-1">从入门级到超级望远镜</div>
      </div>

      <div class="card">
        <div class="label">天区目标</div>
        <div class="value">{{ skyRegions.length }} 个目标</div>
        <div class="text-muted text-sm mt-1">星云、星系、超新星遗迹等</div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">🪐 选择关卡</h2>
        <span class="text-muted">已解锁 1-{{ currentProfile?.highestLevel || 1 }} 关</span>
      </div>

      <div class="grid grid-2">
        <div
          v-for="level in levels"
          :key="level.id"
          class="card"
          :class="{ 'opacity-50': !isLevelUnlocked(level.id) }"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="badge badge-accent">关卡 {{ level.id }}</span>
                <span v-if="!isLevelUnlocked(level.id)" class="badge badge-warning">🔒 未解锁</span>
              </div>
              <h3 class="text-lg font-semibold">{{ level.name }}</h3>
              <p class="text-muted text-sm mt-1">{{ level.description }}</p>
            </div>
          </div>

          <div class="grid grid-3 mt-4 text-center">
            <div>
              <div class="label">目标积分</div>
              <div class="value text-accent">{{ level.targetScore }}</div>
            </div>
            <div>
              <div class="label">观测时段</div>
              <div class="value">{{ level.totalObservationSlots }}</div>
            </div>
            <div>
              <div class="label">天气波动</div>
              <div class="value text-warning">{{ Math.round(level.cloudCoverageVariance * 100) }}%</div>
            </div>
          </div>

          <div class="mt-4">
            <button
              class="btn btn-primary w-full"
              :disabled="!isLevelUnlocked(level.id) || !currentProfile"
              @click="startLevel(level)"
            >
              {{ isLevelUnlocked(level.id) ? '🚀 开始观测夜巡' : '完成前一关卡解锁' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-if="recentRuns.length > 0">
      <h2 class="text-xl font-bold mb-4">📋 最近局次</h2>
      <div class="grid grid-3">
        <div
          v-for="run in recentRuns.slice(0, 6)"
          :key="run.id"
          class="card"
          style="padding: 12px; cursor: pointer;"
          @click="resumeRun(run)"
        >
          <div class="flex items-center justify-between">
            <span class="badge" :class="runStatusClass(run.status)">{{ runStatusText(run.status) }}</span>
            <span class="text-sm text-muted">{{ formatDate(run.startTime) }}</span>
          </div>
          <div class="mt-2">
            <span class="label">关卡 {{ run.levelId }}</span>
          </div>
          <div class="text-xl font-bold mt-1">{{ run.score }} 分</div>
        </div>
      </div>
    </div>

    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal-content">
        <h3 class="text-xl font-bold mb-4">👤 观测员档案</h3>

        <div class="space-y-2 mb-6">
          <div
            v-for="profile in profiles"
            :key="profile.id"
            class="card selectable"
            :class="{ selected: currentProfile?.id === profile.id }"
            style="padding: 12px;"
            @click="selectProfile(profile)"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold">{{ profile.name }}</div>
                <div class="text-sm text-muted">累计 {{ profile.totalScore }} 分 · 完成 {{ profile.completedRuns }} 局</div>
              </div>
              <span v-if="currentProfile?.id === profile.id" class="badge badge-success">当前</span>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="label">创建新观测员</div>
          <div class="flex gap-2 mt-2">
            <input v-model="newProfileName" type="text" placeholder="输入观测员名称..." />
            <button class="btn btn-primary" :disabled="!newProfileName.trim()" @click="createNewProfile">
              创建
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary" @click="showProfileModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '~/stores/game'
import type { Level, GameRun } from '~/types'

const store = useGameStore()
const router = useRouter()

const showProfileModal = ref(false)
const newProfileName = ref('')
const recentRuns = ref<GameRun[]>([])

const telescopes = computed(() => store.telescopes)
const skyRegions = computed(() => store.skyRegions)
const levels = computed(() => store.levels)
const profiles = computed(() => store.profiles)
const currentProfile = computed(() => store.currentProfile)

function isLevelUnlocked(levelId: number) {
  return levelId <= (currentProfile.value?.highestLevel || 1)
}

function runStatusClass(status: string) {
  switch (status) {
    case 'completed': return 'badge-success'
    case 'failed': return 'badge-danger'
    default: return 'badge-accent'
  }
}

function runStatusText(status: string) {
  switch (status) {
    case 'completed': return '🏆 通关'
    case 'failed': return '💫 失败'
    default: return '⏳ 进行中'
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function selectProfile(profile: any) {
  store.selectProfile(profile)
}

async function createNewProfile() {
  if (!newProfileName.value.trim()) return
  await store.createProfile(newProfileName.value.trim())
  newProfileName.value = ''
}

async function startLevel(level: Level) {
  store.selectLevel(level)
  await store.startGame(level.id)
  router.push('/game')
}

async function resumeRun(run: GameRun) {
  await store.loadRun(run.id)
  const level = levels.value.find(l => l.id === run.levelId)
  if (level) store.selectLevel(level)
  router.push('/game')
}

async function loadRecentRuns() {
  if (currentProfile.value) {
    recentRuns.value = await $fetch<GameRun[]>('/api/game-runs', {
      query: { playerId: currentProfile.value.id },
    })
  }
}

onMounted(async () => {
  await store.loadStaticData()
  await loadRecentRuns()
})
</script>
