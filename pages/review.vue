<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">复盘看板</h2>
      <button @click="refresh" class="btn btn-secondary">
        🔄 刷新数据
      </button>
    </div>

    <div v-if="!statistics" class="card p-12 text-center text-gray-500">
      加载中...
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('')">
        <div class="text-3xl font-bold text-gray-900">{{ statisticsSafe.total }}</div>
        <div class="text-sm text-gray-500 mt-1">总数</div>
      </div>
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('PENDING')">
        <div class="text-3xl font-bold text-amber-600">{{ statisticsSafe.pending }}</div>
        <div class="text-sm text-gray-500 mt-1">待受理</div>
      </div>
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('PROCESSING')">
        <div class="text-3xl font-bold text-blue-600">{{ statisticsSafe.processing }}</div>
        <div class="text-sm text-gray-500 mt-1">处理中</div>
      </div>
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('REVIEW')">
        <div class="text-3xl font-bold text-purple-600">{{ statisticsSafe.review }}</div>
        <div class="text-sm text-gray-500 mt-1">复核中</div>
      </div>
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('ARCHIVED')">
        <div class="text-3xl font-bold text-green-600">{{ statisticsSafe.archived }}</div>
        <div class="text-sm text-gray-500 mt-1">已归档</div>
      </div>
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('REJECTED')">
        <div class="text-3xl font-bold text-red-600">{{ statisticsSafe.rejected }}</div>
        <div class="text-sm text-gray-500 mt-1">已退回</div>
      </div>
      <div class="card p-4 text-center cursor-pointer hover:shadow-md transition" @click="filterByStatus('REOPENED')">
        <div class="text-3xl font-bold text-orange-600">{{ statisticsSafe.reopened }}</div>
        <div class="text-sm text-gray-500 mt-1">重新处理</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">样本类型分布</h3>
        <div class="space-y-3">
          <div
            v-for="item in statisticsSafe.bySampleType"
            :key="item.type"
            class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
            @click="filterBySampleType(item.type)"
          >
            <SampleTypeBadge :type="item.type" />
            <div class="flex-1">
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all"
                  :class="sampleTypeBarColor(item.type)"
                  :style="{ width: `${(item.count / statisticsSafe.total) * 100}%` }"
                ></div>
              </div>
            </div>
            <span class="font-semibold w-8 text-right">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">泵站分布</h3>
        <div class="space-y-3">
          <div
            v-for="item in statisticsSafe.byStation"
            :key="item.stationId"
            class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
            @click="filterByStation(item.stationId)"
          >
            <div class="w-2 h-2 rounded-full bg-primary-500"></div>
            <span class="flex-1 truncate">{{ item.stationName }}</span>
            <div class="flex-1">
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 transition-all"
                  :style="{ width: `${(item.count / statisticsSafe.total) * 100}%` }"
                ></div>
              </div>
            </div>
            <span class="font-semibold w-8 text-right">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">关键指标</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
            <span class="text-gray-600">损失总金额</span>
            <span class="text-xl font-bold text-amber-600">
              ¥{{ Number(statisticsSafe.amountTotal).toLocaleString() }}
            </span>
          </div>
          <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span class="text-gray-600">归档率</span>
            <span class="text-xl font-bold text-green-600">
              {{ statisticsSafe.total > 0 ? ((statisticsSafe.archived / statisticsSafe.total) * 100).toFixed(1) : '0' }}%
            </span>
          </div>
          <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <span class="text-gray-600">异常退回率</span>
            <span class="text-xl font-bold text-red-600">
              {{ statisticsSafe.total > 0 ? (((statisticsSafe.rejected + statisticsSafe.reopened) / statisticsSafe.total) * 100).toFixed(1) : '0' }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900">近7日趋势</h3>
      <div class="flex items-end gap-4 h-48">
        <div
          v-for="item in statisticsSafe.recentTrend"
          :key="item.date"
          class="flex-1 flex flex-col items-center gap-2"
        >
          <div class="w-full flex-1 flex items-end">
            <div
              class="w-full bg-primary-500 rounded-t transition-all cursor-pointer hover:bg-primary-600"
              :style="{ height: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`, minHeight: item.count > 0 ? '8px' : '2px' }"
            ></div>
          </div>
          <div class="text-xs text-gray-500">{{ item.date.slice(5) }}</div>
          <div class="text-xs font-semibold">{{ item.count }}</div>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900">
        异常样本详情
        <span class="text-sm font-normal text-gray-500 ml-2">
          （点击卡片可钻取到具体记录）
        </span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="record in abnormalRecords"
          :key="record.id"
          class="card p-4 cursor-pointer hover:shadow-lg transition border-l-4"
          :class="recordBorderClass(record.sampleType)"
          @click="goToDetail(record.id)"
        >
          <div class="flex items-center gap-2 mb-2">
            <SampleTypeBadge :type="record.sampleType" />
            <StatusBadge :status="record.status" />
          </div>
          <h4 class="font-semibold text-gray-900 mb-1">{{ record.title }}</h4>
          <p class="text-sm text-gray-600 line-clamp-2 mb-2">{{ record.evidenceConclusion }}</p>
          <div class="text-xs text-gray-400 space-y-1">
            <div>{{ record.recordNo }}</div>
            <div>责任人：{{ record.currentHandlerName }}</div>
            <div>更新时间：{{ formatTime(record.updatedAt) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900">阻断原因与补救路径汇总</h3>
      <div class="space-y-4">
        <div
          v-for="(analysis, index) in blockageAnalysis"
          :key="index"
          class="border border-gray-200 rounded-lg overflow-hidden"
        >
          <div class="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer" @click="toggleBlockage(index)">
            <div class="flex items-center gap-3">
              <SampleTypeBadge :type="analysis.sampleType" />
              <span class="font-medium">{{ analysis.title }}</span>
              <span class="text-sm text-gray-500">({{ analysis.count }} 条记录)</span>
            </div>
            <span class="text-gray-400">{{ expandedBlockage === index ? '−' : '+' }}</span>
          </div>
          <div v-show="expandedBlockage === index" class="p-4 space-y-4">
            <div v-for="item in analysis.items" :key="item.recordId" class="bg-white border border-gray-100 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="font-medium cursor-pointer text-primary-600 hover:underline" @click="goToDetail(item.recordId)">
                  {{ item.title }}
                </div>
                <StatusBadge :status="item.status" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div class="text-xs font-medium text-red-600 mb-1">阻断原因</div>
                  <div class="text-gray-700 bg-red-50 p-2 rounded whitespace-pre-line">{{ item.blockReason }}</div>
                </div>
                <div>
                  <div class="text-xs font-medium text-amber-600 mb-1">差异字段</div>
                  <FieldDiffView :diffs="item.diffs" />
                </div>
                <div>
                  <div class="text-xs font-medium text-green-600 mb-1">补救路径</div>
                  <div class="text-gray-700 bg-green-50 p-2 rounded whitespace-pre-line">{{ item.remedyPath }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeFilter" class="card p-4 bg-blue-50 border border-blue-200">
      <div class="flex items-center justify-between">
        <div class="text-blue-800">
          当前筛选：{{ activeFilter }}
          <span class="text-blue-600 ml-2">（点击列表页查看钻取结果）</span>
        </div>
        <div class="flex gap-2">
          <button @click="goToList" class="btn btn-primary btn-sm">
            查看列表
          </button>
          <button @click="clearFilter" class="btn btn-secondary btn-sm">
            清除筛选
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecordsStore } from '~/stores/records'
import { SAMPLE_TYPE_LABELS, SampleType, RecordStatus } from '~/types'
import dayjs from 'dayjs'

const store = useRecordsStore()
const router = useRouter()

const statistics = computed(() => store.statistics)
const statisticsSafe = computed(() => store.statistics ?? {
  total: 0,
  pending: 0,
  processing: 0,
  review: 0,
  archived: 0,
  rejected: 0,
  reopened: 0,
  bySampleType: [],
  byStation: [],
  amountTotal: '0',
  recentTrend: []
})
const activeFilter = ref('')
const expandedBlockage = ref<number | null>(0)

const maxCount = computed(() => {
  if (!statistics.value) return 0
  return Math.max(...statistics.value.recentTrend.map(t => t.count), 1)
})

const abnormalRecords = computed(() => {
  return store.list.filter(r =>
    r.sampleType === 'MISSING_FIELDS' ||
    r.sampleType === 'ATTACHMENT_MISMATCH' ||
    r.sampleType === 'REPROCESS'
  )
})

interface BlockageItem {
  recordId: string
  title: string
  status: string
  blockReason: string
  remedyPath: string
  diffs: any[]
}

interface BlockageGroup {
  sampleType: string | null
  title: string
  count: number
  items: BlockageItem[]
}

const blockageAnalysis = computed<BlockageGroup[]>(() => {
  const groups: BlockageGroup[] = []

  const missingRecords = store.list.filter(r => r.sampleType === 'MISSING_FIELDS')
  if (missingRecords.length > 0) {
    groups.push({
      sampleType: 'MISSING_FIELDS' as SampleType,
      title: '记录漏填',
      count: missingRecords.length,
      items: missingRecords.map(r => {
        const detail = store.detail?.id === r.id ? store.detail : null
        const lastNode = detail?.nodes.reverse().find(n => n.blockReason)
        return {
          recordId: r.id,
          title: r.title,
          status: r.status,
          blockReason: lastNode?.blockReason || '缺少必要的业务记录字段',
          remedyPath: lastNode?.remedyPath || '请按要求补充缺失字段',
          diffs: detail?.fieldDiffs || []
        }
      })
    })
  }

  const mismatchRecords = store.list.filter(r => r.sampleType === 'ATTACHMENT_MISMATCH')
  if (mismatchRecords.length > 0) {
    groups.push({
      sampleType: 'ATTACHMENT_MISMATCH' as SampleType,
      title: '附件版本不一致',
      count: mismatchRecords.length,
      items: mismatchRecords.map(r => {
        const detail = store.detail?.id === r.id ? store.detail : null
        const lastNode = detail?.nodes.reverse().find(n => n.blockReason)
        return {
          recordId: r.id,
          title: r.title,
          status: r.status,
          blockReason: lastNode?.blockReason || '附件版本或内容存在不一致',
          remedyPath: lastNode?.remedyPath || '请重新上传正确版本的附件',
          diffs: detail?.fieldDiffs || []
        }
      })
    })
  }

  const reprocessRecords = store.list.filter(r => r.sampleType === 'REPROCESS')
  if (reprocessRecords.length > 0) {
    groups.push({
      sampleType: 'REPROCESS' as SampleType,
      title: '重新处理',
      count: reprocessRecords.length,
      items: reprocessRecords.map(r => {
        const detail = store.detail?.id === r.id ? store.detail : null
        const lastNode = detail?.nodes.reverse().find(n => n.blockReason)
        return {
          recordId: r.id,
          title: r.title,
          status: r.status,
          blockReason: lastNode?.blockReason || '需要重新核查处理',
          remedyPath: lastNode?.remedyPath || '按新的要求重新处理',
          diffs: detail?.fieldDiffs || []
        }
      })
    })
  }

  return groups
})

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const sampleTypeBarColor = (type: SampleType) => {
  switch (type) {
    case 'NORMAL_VERIFICATION': return 'bg-green-500'
    case 'MISSING_FIELDS': return 'bg-amber-500'
    case 'ATTACHMENT_MISMATCH': return 'bg-red-500'
    case 'REPROCESS': return 'bg-orange-500'
    default: return 'bg-gray-500'
  }
}

const recordBorderClass = (type: SampleType | null) => {
  switch (type) {
    case 'NORMAL_VERIFICATION': return 'border-l-green-500'
    case 'MISSING_FIELDS': return 'border-l-amber-500'
    case 'ATTACHMENT_MISMATCH': return 'border-l-red-500'
    case 'REPROCESS': return 'border-l-orange-500'
    default: return 'border-l-gray-500'
  }
}

const filterByStatus = (status: string) => {
  store.updateFilters({ status: (status as RecordStatus) || '', sampleType: '', stationId: '', keyword: '' })
  activeFilter.value = status ? `状态 = ${status}` : ''
}

const filterBySampleType = (type: string) => {
  store.updateFilters({ status: '', sampleType: type as SampleType, stationId: '', keyword: '' })
  activeFilter.value = `样本类型 = ${SAMPLE_TYPE_LABELS[type as SampleType]}`
}

const filterByStation = (stationId: string) => {
  const station = store.stations.find(s => s.id === stationId)
  store.updateFilters({ status: '', sampleType: '', stationId, keyword: '' })
  activeFilter.value = `泵站 = ${station?.name || stationId}`
}

const clearFilter = () => {
  store.updateFilters({ status: '', sampleType: '', stationId: '', keyword: '' })
  activeFilter.value = ''
}

const goToDetail = (id: string) => {
  navigateTo(`/records/${id}`)
}

const goToList = () => {
  const query: any = {}
  if (store.filters.status) query.status = store.filters.status
  if (store.filters.sampleType) query.sampleType = store.filters.sampleType
  if (store.filters.stationId) query.stationId = store.filters.stationId
  navigateTo({ path: '/', query })
}

const toggleBlockage = (index: number) => {
  expandedBlockage.value = expandedBlockage.value === index ? null : index
}

const refresh = async () => {
  await Promise.all([
    store.fetchStatistics(),
    store.fetchList()
  ])
}

if (process.server) {
  await refresh()
} else {
  onMounted(() => refresh())
}
</script>
