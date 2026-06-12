<template>
  <div v-if="store.detail" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="btn btn-secondary">
          ← 返回列表
        </button>
        <h2 class="text-2xl font-bold text-gray-900">记录详情</h2>
        <StatusBadge :status="store.detail.status" />
        <SampleTypeBadge :type="store.detail.sampleType" />
        <span v-if="store.detail.isArchived" class="badge bg-gray-100 text-gray-600">
          已归档
        </span>
      </div>
      <div class="flex gap-2">
        <NuxtLink :to="`/process?id=${store.detail.id}`" class="btn btn-primary">
          进入处理台
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">{{ store.detail.title }}</h3>
          <p class="text-gray-700 mb-4">{{ store.detail.description }}</p>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">记录编号：</span>
              <span class="font-mono">{{ store.detail.recordNo }}</span>
            </div>
            <div>
              <span class="text-gray-500">来源：</span>
              <span>{{ store.detail.source }}</span>
            </div>
            <div>
              <span class="text-gray-500">发生时间：</span>
              <span>{{ formatTime(store.detail.occurrenceTime) }}</span>
            </div>
            <div>
              <span class="text-gray-500">损失金额：</span>
              <span class="font-semibold text-amber-600">
                ¥{{ Number(store.detail.amount).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">处理前后差异</h3>
          <div v-if="store.detail.fieldDiffs.length > 0">
            <FieldDiffView :diffs="store.detail.fieldDiffs" />
          </div>
          <div v-else class="text-gray-500 text-center py-6">
            暂无字段变更记录
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">采用依据</h3>
          <div class="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            <ul class="space-y-2">
              <li>• 《城市排水泵站运行、维护及安全技术规程》CJJ68-2020</li>
              <li>• 《城镇排水与污水处理条例》国务院令第641号</li>
              <li>• 《水污染防治法》(2017修正)</li>
              <li>• 《城市排水泵站仪表维护规程》</li>
            </ul>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">历史节点</h3>
          <TimelineView :nodes="store.detail.nodes" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">关键信息</h3>
          <div class="space-y-4">
            <div>
              <div class="text-xs text-gray-500 mb-1">泵站信息</div>
              <div class="font-medium">{{ store.detail.station.name }}</div>
              <div class="text-sm text-gray-500">{{ store.detail.station.code }}</div>
              <div class="text-sm text-gray-500">{{ store.detail.station.location }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">关键对象</div>
              <div class="font-medium">{{ store.detail.keyObject }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">当前责任人</div>
              <div class="font-medium">{{ store.detail.currentHandler.name }}</div>
              <div class="text-sm">
                <span class="badge bg-blue-100 text-blue-800">
                  {{ ROLE_LABELS[store.detail.currentHandler.role] }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">证据结论</div>
              <div class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {{ store.detail.evidenceConclusion }}
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">操作人汇总</h3>
          <div class="space-y-3">
            <div
              v-for="(operator, index) in uniqueOperators"
              :key="index"
              class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
            >
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                {{ operator.name.charAt(0) }}
              </div>
              <div>
                <div class="font-medium text-sm">{{ operator.name }}</div>
                <div class="text-xs text-gray-500">
                  参与 {{ operator.count }} 个节点
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">所有附件</h3>
          <div v-if="store.detail.attachments.length > 0" class="space-y-2">
            <div
              v-for="att in store.detail.attachments"
              :key="att.url"
              class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
            >
              <span class="text-gray-600 truncate">{{ att.name }}</span>
              <span class="shrink-0 text-xs text-gray-400">{{ att.version }}</span>
            </div>
          </div>
          <div v-else class="text-gray-500 text-center py-4 text-sm">
            暂无附件
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">元数据</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">创建时间</span>
              <span>{{ formatTime(store.detail.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">更新时间</span>
              <span>{{ formatTime(store.detail.updatedAt) }}</span>
            </div>
            <div v-if="store.detail.archivedAt" class="flex justify-between">
              <span class="text-gray-500">归档时间</span>
              <span>{{ formatTime(store.detail.archivedAt) }}</span>
            </div>
            <div v-if="store.detail.archivedBy" class="flex justify-between">
              <span class="text-gray-500">归档人</span>
              <span>{{ store.detail.archivedBy }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecordsStore } from '~/stores/records'
import { ROLE_LABELS } from '~/types'
import dayjs from 'dayjs'

const store = useRecordsStore()
const route = useRoute()

const id = computed(() => route.params.id as string)

const initPage = () => store.fetchDetail(id.value)
if (process.server) {
  await initPage()
} else {
  onMounted(() => initPage())
}

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss')

const goBack = () => {
  navigateTo('/')
}

const uniqueOperators = computed(() => {
  if (!store.detail) return []
  const map: Record<string, { name: string; count: number }> = {}
  store.detail.nodes.forEach(node => {
    if (!map[node.operatorId]) {
      map[node.operatorId] = { name: node.operatorName, count: 0 }
    }
    map[node.operatorId].count++
  })
  return Object.values(map)
})
</script>
