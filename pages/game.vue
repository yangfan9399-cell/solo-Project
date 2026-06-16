<template>
  <div class="container">
    <header class="card mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button class="btn btn-secondary" @click="goBack">← 返回</button>
          <div>
            <h1 class="text-xl font-bold">🔭 {{ currentLevel?.name }}</h1>
            <p class="text-sm text-muted">{{ currentLevel?.description }}</p>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="label">观测员</div>
            <div class="value">{{ currentProfile?.name }}</div>
          </div>
          <div class="text-center">
            <div class="label">当前积分</div>
            <div class="value-big text-accent">{{ totalRunScore }}</div>
          </div>
          <div class="text-center">
            <div class="label">目标</div>
            <div class="value">{{ currentLevel?.targetScore }}</div>
          </div>
          <div class="text-center">
            <div class="label">进度</div>
            <div class="value">{{ completedSlotsCount }} / {{ currentRun?.slots.length || 0 }}</div>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="flex justify-between mb-1">
          <span class="text-sm text-muted">积分进度</span>
          <span class="text-sm" :class="progressColor">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :class="progressFillClass"
            :style="{ width: Math.min(100, progressPercent) + '%' }"
          ></div>
        </div>
      </div>
    </header>

    <div class="grid" style="grid-template-columns: 280px 1fr 320px; gap: 16px;">
      <!-- 左侧：观测时段时间轴 -->
      <div class="card">
        <h3 class="font-bold mb-4">🌙 观测夜排班</h3>
        <div class="flex flex-col gap-2">
          <div
            v-for="(slot, idx) in currentRun?.slots"
            :key="idx"
            class="card slot-card"
            :class="{
              selected: selectedSlotIndex === idx,
              completed: slot.completed,
              disabled: !isSlotAccessible(idx),
            }"
            @click="selectSlot(idx)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold">时段 {{ idx + 1 }}</span>
              <span v-if="slot.completed" class="badge badge-success">✓ {{ slot.score }}分</span>
              <span v-else-if="isSlotAccessible(idx)" class="badge badge-accent">可安排</span>
              <span v-else class="badge badge-warning">需等待</span>
            </div>

            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-muted">☁️ 云量</span>
                <span :class="weatherColor(slot.cloudCoverage)">{{ Math.round(slot.cloudCoverage * 100) }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">🌕 月相</span>
                <span :class="weatherColor(slot.moonPhase)">{{ Math.round(slot.moonPhase * 100) }}%</span>
              </div>
              <div v-if="slot.telescopeCooldown > 0" class="flex justify-between">
                <span class="text-muted">❄️ 冷却惩罚</span>
                <span class="text-danger">{{ slot.telescopeCooldown }}</span>
              </div>
            </div>

            <div class="mt-2 pt-2 border-t" :style="{ borderColor: 'var(--border)' }">
              <div class="text-xs text-muted truncate" v-if="slot.telescopeId">
                🔭 {{ getTelescope(slot.telescopeId)?.name }}
              </div>
              <div class="text-xs text-muted truncate" v-if="slot.filterId">
                🎨 {{ getFilter(slot.filterId)?.name }}
              </div>
              <div class="text-xs text-muted truncate" v-if="slot.skyRegionId">
                ✨ {{ getSkyRegion(slot.skyRegionId)?.name }}
              </div>
              <div class="text-xs text-muted" v-if="!slot.telescopeId && !slot.filterId && !slot.skyRegionId && !slot.completed">
                点击分配设备与目标
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t" :style="{ borderColor: 'var(--border)' }">
          <button
            class="btn btn-primary w-full"
            :disabled="!canSettle"
            @click="settleGame"
          >
            {{ allCompleted ? '📊 查看结算' : '⏹️ 提前结算' }}
          </button>
        </div>
      </div>

      <!-- 中间：观测配置 -->
      <div class="card" v-if="selectedSlot">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold">
            ⚙️ 时段 {{ (selectedSlotIndex ?? 0) + 1 }} 观测配置
          </h3>
          <span v-if="selectedSlot.completed" class="badge badge-success">已完成</span>
        </div>

        <template v-if="!selectedSlot.completed && isSlotAccessible(selectedSlotIndex ?? 0)">
          <!-- 天气信息 -->
          <div class="grid grid-2 mb-6">
            <div class="card" style="background: var(--bg-secondary);">
              <div class="label">☁️ 云量覆盖</div>
              <div class="value-big" :class="weatherColor(selectedSlot.cloudCoverage)">
                {{ Math.round(selectedSlot.cloudCoverage * 100) }}%
              </div>
              <div class="progress-bar mt-2">
                <div
                  class="progress-damage"
                  style="height: 100%; border-radius: 999px; transition: width 0.3s;"
                  :style="{ width: selectedSlot.cloudCoverage * 100 + '%' }"
                ></div>
              </div>
              <p class="text-xs text-muted mt-2">云量越高，观测信号损失越严重</p>
            </div>

            <div class="card" style="background: var(--bg-secondary);">
              <div class="label">🌕 月相亮度</div>
              <div class="value-big" :class="weatherColor(selectedSlot.moonPhase)">
                {{ Math.round(selectedSlot.moonPhase * 100) }}%
              </div>
              <div class="progress-bar mt-2">
                <div
                  class="progress-fill-warning"
                  style="height: 100%; border-radius: 999px; transition: width 0.3s;"
                  :style="{ width: selectedSlot.moonPhase * 100 + '%' }"
                ></div>
              </div>
              <p class="text-xs text-muted mt-2">满月会产生光污染，影响暗弱天体</p>
            </div>
          </div>

          <!-- 望远镜选择 -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold">🔭 选择望远镜</h4>
              <span class="text-sm text-muted">已使用: {{ telescopeUsageText }}</span>
            </div>
            <div class="grid grid-2">
              <div
                v-for="tel in availableTelescopes"
                :key="tel.id"
                class="card selectable"
                :class="{ selected: selectedSlot.telescopeId === tel.id }"
                @click="assignTelescope(tel.id)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">🔭</span>
                  <span class="font-semibold">{{ tel.name }}</span>
                </div>
                <div class="grid grid-2 text-xs gap-1">
                  <div>
                    <span class="text-muted">口径:</span>
                    <span class="font-semibold ml-1">{{ tel.aperture }}mm</span>
                  </div>
                  <div>
                    <span class="text-muted">焦距:</span>
                    <span class="font-semibold ml-1">{{ tel.focalLength }}mm</span>
                  </div>
                  <div>
                    <span class="text-muted">冷却:</span>
                    <span class="font-semibold ml-1">{{ tel.coolingTime }}时段</span>
                  </div>
                  <div>
                    <span class="text-muted">夜限:</span>
                    <span class="font-semibold ml-1">{{ tel.maxObservationsPerNight }}次</span>
                  </div>
                </div>
                <p class="text-xs text-muted mt-2">{{ tel.description }}</p>
              </div>
            </div>
          </div>

          <!-- 滤镜选择 -->
          <div class="mb-6">
            <h4 class="font-semibold mb-3">🎨 选择滤镜</h4>
            <div class="grid grid-3">
              <div
                v-for="f in availableFilters"
                :key="f.id"
                class="card selectable"
                :class="{ selected: selectedSlot.filterId === f.id }"
                @click="assignFilter(f.id)"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="w-4 h-4 rounded-full"
                    :style="{ backgroundColor: f.color, border: '1px solid rgba(255,255,255,0.2)' }"
                  ></span>
                  <span class="font-semibold">{{ f.name }}</span>
                </div>
                <div class="text-xs space-y-1">
                  <div class="flex justify-between">
                    <span class="text-muted">波长</span>
                    <span>{{ f.wavelength }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">曝光倍率</span>
                    <span>×{{ f.exposureMultiplier.toFixed(1) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">科学价值</span>
                    <span class="text-accent">★{{ f.scienceValue }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 天区选择 -->
          <div class="mb-6">
            <h4 class="font-semibold mb-3">✨ 选择目标天区</h4>
            <div class="grid grid-2">
              <div
                v-for="sr in availableSkyRegions"
                :key="sr.id"
                class="card selectable"
                :class="{ selected: selectedSlot.skyRegionId === sr.id }"
                @click="assignSkyRegion(sr.id)"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <span class="font-semibold">{{ sr.name }}</span>
                  </div>
                  <span class="badge" :class="difficultyClass(sr.difficulty)">
                    难度 {{ sr.difficulty }}
                  </span>
                </div>
                <p class="text-xs text-muted mb-2">{{ sr.description }}</p>
                <div class="grid grid-2 text-xs gap-1">
                  <div>
                    <span class="text-muted">赤纬:</span>
                    <span class="ml-1">{{ sr.declination }}°</span>
                  </div>
                  <div>
                    <span class="text-muted">季节:</span>
                    <span class="ml-1">{{ sr.bestSeason }}</span>
                  </div>
                  <div class="col-span-2">
                    <span class="text-muted">基础积分:</span>
                    <span class="text-accent font-semibold ml-1">{{ sr.basePoints }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 执行观测按钮 -->
          <div class="card" style="background: var(--bg-secondary);">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold">🎯 开始观测</h4>
              <span v-if="!canComplete" class="text-sm text-warning">请先完整配置</span>
            </div>
            <div class="text-sm mb-3" v-if="previewInfo">
              <div class="grid grid-3 text-center">
                <div>
                  <span class="text-muted">望远镜</span>
                  <div class="font-semibold">{{ previewInfo.telescope }}</div>
                </div>
                <div>
                  <span class="text-muted">滤镜</span>
                  <div class="font-semibold">{{ previewInfo.filter }}</div>
                </div>
                <div>
                  <span class="text-muted">目标</span>
                  <div class="font-semibold">{{ previewInfo.skyRegion }}</div>
                </div>
              </div>
              <div v-if="previewInfo.cooldownWarning" class="mt-2 p-2 rounded" style="background: rgba(239, 68, 68, 0.1);">
                <span class="text-danger text-sm">⚠️ {{ previewInfo.cooldownWarning }}</span>
              </div>
            </div>
            <button
              class="btn btn-success w-full text-lg py-3"
              :disabled="!canComplete"
              @click="doCompleteObservation"
            >
              🚀 执行观测
            </button>
          </div>
        </template>

        <template v-else-if="selectedSlot.completed">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="text-2xl font-bold text-success mb-2">观测成功完成！</h3>
            <p class="text-muted mb-6">本时段获得积分</p>
            <div class="text-5xl font-bold text-accent mb-6">+{{ selectedSlot.score }}</div>

            <div v-if="lastScoreBreakdown" class="card text-left" style="background: var(--bg-secondary); max-width: 400px; margin: 0 auto;">
              <h4 class="font-semibold mb-3">📊 积分明细</h4>
              <div class="space-y-2">
                <div class="flex justify-between" v-for="(val, key) in lastScoreBreakdown" :key="key">
                  <span class="text-muted">{{ scoreDetailLabel(String(key)) }}</span>
                  <span :class="val >= 0 ? 'text-success' : 'text-danger'">
                    {{ val >= 0 ? '+' : '' }}{{ val }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="text-center py-12">
            <div class="text-5xl mb-4 animate-pulse">⏳</div>
            <h3 class="text-xl font-bold mb-2">等待观测时段到来</h3>
            <p class="text-muted">请按顺序完成前面的观测安排</p>
          </div>
        </template>
      </div>

      <!-- 右侧：设备使用情况和操作历史 -->
      <div class="flex flex-col gap-4">
        <div class="card">
          <h3 class="font-bold mb-3">📡 设备状态</h3>
          <div class="space-y-2">
            <div v-for="tel in availableTelescopes" :key="tel.id" class="p-2 rounded" style="background: var(--bg-secondary);">
              <div class="flex justify-between items-center">
                <span class="font-semibold text-sm">{{ tel.name }}</span>
                <span
                  class="badge"
                  :class="getTelescopeUsage(tel.id).remaining > 0 ? 'badge-success' : 'badge-danger'"
                >
                  {{ getTelescopeUsage(tel.id).used }}/{{ tel.maxObservationsPerNight }} 次
                </span>
              </div>
              <div class="text-xs text-muted mt-1" v-if="tel.coolingTime > 0">
                冷却状态: <span :class="getTelescopeCooldown(tel.id) > 0 ? 'text-warning' : 'text-success'">
                  {{ getTelescopeCooldown(tel.id) > 0 ? `还需 ${getTelescopeCooldown(tel.id)} 时段` : '就绪' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="card flex-1">
          <h3 class="font-bold mb-3">📜 操作历史</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(action, idx) in [...(currentRun?.history || [])].reverse().slice(0, 20)"
              :key="idx"
              class="p-2 rounded text-xs"
              style="background: var(--bg-secondary);"
            >
              <div class="flex justify-between items-center mb-1">
                <span class="badge" :class="actionBadgeClass(action.actionType)">
                  {{ actionLabel(action.actionType) }}
                </span>
                <span class="text-muted">{{ formatActionTime(action.timestamp) }}</span>
              </div>
              <div class="text-muted">
                时段 {{ action.slotIndex + 1 }} · {{ actionDescription(action) }}
              </div>
            </div>
            <div v-if="!currentRun?.history?.length" class="text-center text-muted py-8">
              暂无操作记录
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结算弹窗 -->
    <div v-if="settlementResult" class="modal-overlay">
      <div class="modal-content text-center">
        <div class="text-6xl mb-4">{{ settlementResult.passed ? '🏆' : '💫' }}</div>
        <h2 class="text-2xl font-bold mb-2" :class="settlementResult.passed ? 'text-success' : 'text-warning'">
          {{ settlementResult.passed ? '夜巡大成功！' : '积分未达标...' }}
        </h2>
        <p class="text-muted mb-6">{{ settlementResult.passed ? '你的观测数据将为天文学研究做出重要贡献' : '再接再厉，下次一定可以' }}</p>

        <div class="grid grid-2 gap-4 mb-6">
          <div class="card" style="background: var(--bg-secondary);">
            <div class="label">最终积分</div>
            <div class="value-big text-accent">{{ settlementResult.finalScore }}</div>
          </div>
          <div class="card" style="background: var(--bg-secondary);">
            <div class="label">目标积分</div>
            <div class="value-big">{{ settlementResult.targetScore }}</div>
          </div>
          <div class="card" style="background: var(--bg-secondary);">
            <div class="label">完成观测</div>
            <div class="value">{{ settlementResult.completedObservations }} / {{ settlementResult.totalSlots }}</div>
          </div>
          <div class="card" style="background: var(--bg-secondary);">
            <div class="label">累计积分</div>
            <div class="value text-purple">{{ settlementResult.player.totalScore }}</div>
          </div>
        </div>

        <div class="card mb-6" style="background: var(--bg-secondary);" v-if="settlementResult.passed">
          <h4 class="font-semibold mb-2">📊 各时段得分</h4>
          <div class="space-y-1">
            <div
              v-for="slot in settlementResult.slots"
              :key="slot.slotIndex"
              class="flex justify-between items-center text-sm"
            >
              <span>时段 {{ slot.slotIndex + 1 }}</span>
              <span :class="slot.completed ? 'text-success' : 'text-muted'">
                {{ slot.completed ? `+${slot.score}` : '未完成' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-center">
          <button class="btn btn-secondary" @click="goBack">返回主页</button>
          <button v-if="!settlementResult.passed" class="btn btn-primary" @click="retryLevel">
            🔄 再来一次
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGameStore } from '~/stores/game'
import type { Telescope, Filter, SkyRegion } from '~/types'

const store = useGameStore()
const router = useRouter()

const currentLevel = computed(() => store.currentLevel)
const currentProfile = computed(() => store.currentProfile)
const currentRun = computed(() => store.currentRun)
const selectedSlotIndex = computed(() => store.selectedSlotIndex)
const selectedSlot = computed(() => store.selectedSlot)
const availableTelescopes = computed(() => store.availableTelescopes)
const availableFilters = computed(() => store.availableFilters)
const availableSkyRegions = computed(() => store.availableSkyRegions)
const totalRunScore = computed(() => store.totalRunScore)
const completedSlotsCount = computed(() => store.completedSlotsCount)
const lastScoreBreakdown = computed(() => store.lastScoreBreakdown)
const settlementResult = computed(() => store.settlementResult)

const progressPercent = computed(() => {
  if (!currentLevel.value) return 0
  return Math.round((totalRunScore.value / currentLevel.value.targetScore) * 100)
})

const progressColor = computed(() => {
  if (progressPercent.value >= 100) return 'text-success'
  if (progressPercent.value >= 60) return 'text-accent'
  return 'text-warning'
})

const progressFillClass = computed(() => {
  if (progressPercent.value >= 100) return 'progress-fill-success'
  if (progressPercent.value >= 60) return ''
  return 'progress-fill-warning'
})

const allCompleted = computed(() => {
  if (!currentRun.value) return false
  return currentRun.value.slots.every(s => s.completed)
})

const canSettle = computed(() => {
  if (!currentRun.value) return false
  return currentRun.value.status === 'in_progress' && (allCompleted.value || completedSlotsCount.value > 0)
})

const canComplete = computed(() => {
  if (!selectedSlot.value) return false
  return selectedSlot.value.telescopeId !== null
    && selectedSlot.value.filterId !== null
    && selectedSlot.value.skyRegionId !== null
    && !selectedSlot.value.completed
})

const previewInfo = computed(() => {
  if (!selectedSlot.value) return null
  const tel = selectedSlot.value.telescopeId ? getTelescope(selectedSlot.value.telescopeId) : null
  const f = selectedSlot.value.filterId ? getFilter(selectedSlot.value.filterId) : null
  const sr = selectedSlot.value.skyRegionId ? getSkyRegion(selectedSlot.value.skyRegionId) : null
  if (!tel || !f || !sr) return null

  let cooldownWarning = ''
  const usage = getTelescopeUsage(tel.id)
  if (usage.remaining <= 0) {
    cooldownWarning = `${tel.name} 今夜已达最大使用次数`
  } else {
    const cd = getTelescopeCooldown(tel.id)
    if (cd > 0) {
      cooldownWarning = `${tel.name} 未充分冷却，将产生 ${cd} 级惩罚`
    }
  }

  return {
    telescope: tel.name,
    filter: f.name,
    skyRegion: sr.name,
    cooldownWarning,
  }
})

const telescopeUsageText = computed(() => {
  if (!currentRun.value || !selectedSlot.value) return '-'
  if (!selectedSlot.value.telescopeId) return '-'
  const tel = getTelescope(selectedSlot.value.telescopeId)
  if (!tel) return '-'
  const usage = getTelescopeUsage(tel.id)
  return `${usage.used}/${tel.maxObservationsPerNight}`
})

function getTelescope(id: number): Telescope | undefined {
  return store.telescopes.find(t => t.id === id)
}
function getFilter(id: number): Filter | undefined {
  return store.filters.find(f => f.id === id)
}
function getSkyRegion(id: number): SkyRegion | undefined {
  return store.skyRegions.find(s => s.id === id)
}

function weatherColor(v: number) {
  if (v <= 0.2) return 'text-success'
  if (v <= 0.5) return 'text-warning'
  return 'text-danger'
}

function difficultyClass(d: number) {
  switch (d) {
    case 1: return 'badge-success'
    case 2: return 'badge-accent'
    case 3: return 'badge-warning'
    default: return 'badge-danger'
  }
}

function isSlotAccessible(idx: number): boolean {
  if (!currentRun.value) return false
  for (let i = 0; i < idx; i++) {
    if (!currentRun.value.slots[i].completed) return false
  }
  return true
}

function getTelescopeUsage(telId: number) {
  if (!currentRun.value) return { used: 0, remaining: 999 }
  const tel = getTelescope(telId)
  if (!tel) return { used: 0, remaining: 999 }
  let used = 0
  const upTo = selectedSlotIndex.value ?? currentRun.value.slots.length
  for (let i = 0; i < upTo; i++) {
    if (currentRun.value.slots[i].completed && currentRun.value.slots[i].telescopeId === telId) {
      used++
    }
  }
  return { used, remaining: tel.maxObservationsPerNight - used }
}

function getTelescopeCooldown(telId: number): number {
  if (!currentRun.value || selectedSlotIndex.value === null) return 0
  const tel = getTelescope(telId)
  if (!tel || tel.coolingTime === 0) return 0
  for (let i = 1; i <= tel.coolingTime; i++) {
    const checkIdx = selectedSlotIndex.value - i
    if (checkIdx < 0) break
    const slot = currentRun.value.slots[checkIdx]
    if (slot.completed && slot.telescopeId === telId) {
      return tel.coolingTime - i + 1
    }
  }
  return 0
}

function scoreDetailLabel(key: string): string {
  const map: Record<string, string> = {
    basePoints: '天区基础分',
    telescopeBonus: '望远镜加成',
    filterBonus: '滤镜加成',
    difficultyMultiplier: '难度倍率',
    cloudPenalty: '云量惩罚',
    moonPenalty: '月相惩罚',
    cooldownPenalty: '冷却惩罚',
    totalScore: '最终得分',
  }
  return map[key] || key
}

function actionBadgeClass(type: string): string {
  switch (type) {
    case 'complete_observation': return 'badge-success'
    case 'assign_telescope': return 'badge-accent'
    case 'assign_filter': return 'badge-purple'
    case 'assign_skyregion': return 'badge-pink'
    default: return 'badge-warning'
  }
}

function actionLabel(type: string): string {
  switch (type) {
    case 'complete_observation': return '观测完成'
    case 'assign_telescope': return '分配望远镜'
    case 'assign_filter': return '分配滤镜'
    case 'assign_skyregion': return '分配天区'
    case 'reset_slot': return '重置时段'
    default: return type
  }
}

function actionDescription(action: any): string {
  const p = action.payload || {}
  switch (action.actionType) {
    case 'assign_telescope': {
      const t = getTelescope(p.telescopeId)
      return t ? `使用 ${t.name}` : '望远镜配置'
    }
    case 'assign_filter': {
      const f = getFilter(p.filterId)
      return f ? `使用 ${f.name}` : '滤镜配置'
    }
    case 'assign_skyregion': {
      const s = getSkyRegion(p.skyRegionId)
      return s ? `目标 ${s.name}` : '天区配置'
    }
    case 'complete_observation':
      return `获得 ${p.score || 0} 积分`
    default:
      return ''
  }
}

function formatActionTime(ts: string): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function selectSlot(idx: number) {
  if (!isSlotAccessible(idx)) return
  store.selectSlot(idx)
}

async function assignTelescope(telId: number) {
  if (selectedSlotIndex.value === null) return
  await store.assignToSlot(selectedSlotIndex.value, { telescopeId: telId })
}

async function assignFilter(filterId: number) {
  if (selectedSlotIndex.value === null) return
  await store.assignToSlot(selectedSlotIndex.value, { filterId })
}

async function assignSkyRegion(srId: number) {
  if (selectedSlotIndex.value === null) return
  await store.assignToSlot(selectedSlotIndex.value, { skyRegionId: srId })
}

async function doCompleteObservation() {
  if (selectedSlotIndex.value === null) return
  try {
    await store.completeObservation(selectedSlotIndex.value)
    const slots = currentRun.value?.slots || []
    const nextIdx = slots.findIndex(s => !s.completed)
    if (nextIdx >= 0) {
      store.selectSlot(nextIdx)
    }
    if (allCompleted.value) {
      await store.settleRun()
    }
  } catch (e: any) {
    alert(e?.data?.statusMessage || e?.message || '操作失败')
  }
}

async function settleGame() {
  await store.settleRun()
}

function goBack() {
  store.resetCurrentRun()
  router.push('/')
}

async function retryLevel() {
  if (!currentLevel.value || !currentProfile.value) return
  store.resetCurrentRun()
  await store.startGame(currentLevel.value.id)
}

onMounted(async () => {
  if (!store.telescopes.length) {
    await store.loadStaticData()
  }
  if (!currentRun.value) {
    router.push('/')
  }
})
</script>
