<template>
  <AppLayout title="看板统计">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">📊 复盘统计看板</h1>
        <div class="text-sm text-gray-500">
          数据实时更新 · 点击统计卡片可钻取明细
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          @click="drilldown({})"
          class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-500"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">记录总数</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ statistics.total }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              📋
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-3">点击查看全部记录 →</p>
        </div>

        <div
          @click="drilldown({ is_archived: '1' })"
          class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-green-500"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">已归档</p>
              <p class="text-3xl font-bold text-green-600 mt-1">{{ statistics.archived }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-3">
            归档率: {{ statistics.archive_rate }}% · 点击查看 →
          </p>
        </div>

        <div
          @click="drilldown({ is_archived: '0' })"
          class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">处理中</p>
              <p class="text-3xl font-bold text-yellow-600 mt-1">{{ statistics.processing }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
              ⚙️
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-3">点击查看处理中记录 →</p>
        </div>

        <div
          @click="drilldown({ has_blocking: '1' })"
          class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-red-500"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">有阻断</p>
              <p class="text-3xl font-bold text-red-600 mt-1">{{ statistics.has_blocking }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl animate-pulse">
              ⚠️
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-3">待处理异常: {{ statistics.pending_abnormal }} 项 →</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">📈 按状态分布</h2>
          <div class="space-y-3">
            <div
              v-for="(count, status) in statistics.by_status"
              :key="status"
              @click="drilldown({ status })"
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <StatusBadge :status="status" />
                <span class="text-sm text-gray-600">{{ statusLabels[status] || status }}</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-lg font-semibold">{{ count }}</span>
                <div class="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all"
                    :style="{ width: (count / statistics.total * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">🏷️ 按样本类型分布</h2>
          <div class="space-y-3">
            <div
              v-for="(count, type) in statistics.by_sample_type"
              :key="type"
              @click="drilldown({ sample_type: type })"
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{
                'bg-green-50': type === 'normal',
                'bg-yellow-50': type === 'number_conflict',
                'bg-orange-50': type === 'amount_difference',
                'bg-purple-50': type === 'appeal'
              }"
            >
              <div class="flex items-center space-x-3">
                <span class="text-xl">
                  {{ type === 'normal' ? '✅' : type === 'number_conflict' ? '🔢' : type === 'amount_difference' ? '💰' : '📝' }}
                </span>
                <span class="text-sm font-medium">{{ sampleLabels[type] || type }}</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-lg font-semibold">{{ count }}</span>
                <div class="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    :class="[
                      'h-2 rounded-full transition-all',
                      type === 'normal' ? 'bg-green-500' : 
                      type === 'number_conflict' ? 'bg-yellow-500' : 
                      type === 'amount_difference' ? 'bg-orange-500' : 'bg-purple-500'
                    ]"
                    :style="{ width: (count / statistics.total * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">⚠️ 按隐患等级分布</h2>
          <div class="space-y-3">
            <div
              v-for="(count, level) in statistics.by_danger_level"
              :key="level"
              @click="drilldown({ danger_level: level })"
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <DangerBadge :level="level" />
              </div>
              <span class="text-lg font-semibold">{{ count }}</span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">涉及总金额</span>
              <span class="font-semibold text-gray-800">¥{{ formatNumber(statistics.total_amount) }}</span>
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span class="text-gray-500">涉及总数量</span>
              <span class="font-semibold text-gray-800">{{ statistics.total_quantity }} 项</span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">🔴 异常处理追踪</h2>
          <div v-if="abnormalRecords.data.length === 0" class="text-center py-8 text-gray-500">
            暂无异常记录
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="abnormal in abnormalRecords.data"
              :key="abnormal.id"
              class="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="px-2 py-1 rounded text-xs font-medium"
                      :class="{
                        'bg-yellow-100 text-yellow-800': abnormal.abnormal_type === 'number_conflict',
                        'bg-orange-100 text-orange-800': abnormal.abnormal_type === 'amount_difference',
                        'bg-purple-100 text-purple-800': abnormal.abnormal_type === 'appeal'
                      }"
                    >
                      {{ abnormalTypeLabels[abnormal.abnormal_type] || abnormal.abnormal_type }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        abnormal.resolution_status === 'pending' ? 'bg-red-100 text-red-800' :
                        abnormal.resolution_status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ abnormalStatusLabels[abnormal.resolution_status] || abnormal.resolution_status }}
                    </span>
                    <Link
                      :href="route('records.show', abnormal.inspection_record.id)"
                      class="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {{ abnormal.inspection_record.record_no }} →
                    </Link>
                  </div>
                  <p class="text-sm text-red-600 font-medium mb-2">
                    {{ abnormal.blocking_reason }}
                  </p>
                  <div class="bg-gray-50 rounded p-3 text-sm">
                    <p class="text-gray-600 mb-1"><span class="font-medium">差异字段：</span>{{ abnormal.difference_fields?.join(', ') }}</p>
                    <p class="text-gray-600"><span class="font-medium">补救路径：</span>{{ abnormal.remedy_path }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">📅 最近更新记录</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">记录编号</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">户主</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">责任人</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">最近操作</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="record in latestRecords"
                :key="record.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="visitRecord(record)"
              >
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                  {{ record.record_no }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ record.household_name }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <StatusBadge :status="record.status" :has-blocking="record.has_blocking" :is-archived="record.is_archived" />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ record.current_responsible?.name || '-' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ record.latest_node?.[0]?.node_name || '-' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {{ record.latest_node?.[0]?.operator?.name || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import DangerBadge from '../../Components/DangerBadge.vue';

const props = defineProps({
  statistics: Object,
  trendData: Array,
  abnormalRecords: Object,
  latestRecords: Array,
});

const statusLabels = {
  accepted: '已受理',
  processing: '处理中',
  reviewing: '复核中',
  approved: '已通过',
  archived: '已归档',
  returned: '已退回',
  appealed: '申诉中',
  number_conflict: '编号冲突',
  amount_difference: '金额差异'
};

const sampleLabels = {
  normal: '正常归档',
  number_conflict: '编号冲突',
  amount_difference: '数量/金额差异',
  appeal: '当事人申诉'
};

const abnormalTypeLabels = {
  number_conflict: '编号冲突',
  amount_difference: '金额差异',
  quantity_difference: '数量差异',
  appeal: '当事人申诉'
};

const abnormalStatusLabels = {
  pending: '待处理',
  resolved: '已解决',
  rejected: '已驳回'
};

const formatNumber = (num) => {
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const drilldown = (params) => {
  router.get(route('dashboard.drilldown'), params);
};

const visitRecord = (record) => {
  if (record.is_archived) {
    router.visit(route('records.show', record.id));
  } else {
    router.visit(route('records.handle', record.id));
  }
};
</script>
