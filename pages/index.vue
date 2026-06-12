<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">告警记录列表</h2>
      <div class="text-sm text-gray-500">
        共 {{ store.list.length }} 条记录
      </div>
    </div>

    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="label">状态</label>
          <select v-model="store.filters.status" @change="store.fetchList" class="input">
            <option value="">全部</option>
            <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">样本类型</label>
          <select v-model="store.filters.sampleType" @change="store.fetchList" class="input">
            <option value="">全部</option>
            <option v-for="(label, key) in SAMPLE_TYPE_LABELS" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">泵站</label>
          <select v-model="store.filters.stationId" @change="store.fetchList" class="input">
            <option value="">全部</option>
            <option v-for="s in store.stations" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">搜索</label>
          <input
            v-model="store.filters.keyword"
            @keyup.enter="store.fetchList"
            type="text"
            placeholder="编号/标题/对象"
            class="input"
          >
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center py-12 text-gray-500">
      加载中...
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="record in store.list"
        :key="record.id"
        class="card p-4 hover:shadow-md transition cursor-pointer"
        @click="goToDetail(record.id)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-sm font-mono text-gray-500">{{ record.recordNo }}</span>
              <StatusBadge :status="record.status" />
              <SampleTypeBadge :type="record.sampleType" />
              <span v-if="record.isArchived" class="badge bg-gray-100 text-gray-600">
                已归档
              </span>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">{{ record.title }}</h3>
            <p class="text-sm text-gray-600 line-clamp-2">{{ record.evidenceConclusion }}</p>
            <div class="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
              <span>来源：{{ record.source }}</span>
              <span>泵站：{{ record.stationName }}</span>
              <span>对象：{{ record.keyObject }}</span>
              <span>金额：¥{{ Number(record.amount).toLocaleString() }}</span>
              <span>责任人：{{ record.currentHandlerName }}</span>
              <span>发生时间：{{ formatTime(record.occurrenceTime) }}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-xs text-gray-400">更新时间</div>
            <div class="text-sm text-gray-600">{{ formatTime(record.updatedAt) }}</div>
          </div>
        </div>
      </div>

      <div v-if="store.list.length === 0" class="card p-12 text-center text-gray-500">
        暂无记录
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecordsStore } from '~/stores/records'
import { STATUS_LABELS, SAMPLE_TYPE_LABELS } from '~/types'
import dayjs from 'dayjs'

const store = useRecordsStore()
const route = useRoute()

const initPage = () => {
  if (route.query.status) {
    store.filters.status = route.query.status as any
  }
  if (route.query.sampleType) {
    store.filters.sampleType = route.query.sampleType as any
  }
  if (route.query.stationId) {
    store.filters.stationId = route.query.stationId as string
  }
  return store.fetchList()
}

if (process.server) {
  await initPage()
} else {
  onMounted(() => initPage())
}

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const goToDetail = (id: string) => {
  navigateTo(`/records/${id}`)
}
</script>
