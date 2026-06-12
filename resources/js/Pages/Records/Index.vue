<template>
  <AppLayout title="记录列表">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            📋 {{ drillTitle || '安检隐患整改记录' }}
          </h1>
          <p v-if="fromDashboard" class="text-sm text-gray-500 mt-1">
            ← 从看板钻取而来，可返回看板继续探索
          </p>
        </div>
        <div v-if="fromDashboard" class="flex space-x-2">
          <Link
            :href="route('dashboard')"
            class="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            ← 返回看板
          </Link>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              type="text"
              v-model="localFilters.search"
              @keyup.enter="applyFilters"
              placeholder="编号/户主/地址..."
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              v-model="localFilters.status"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option v-for="(label, value) in statusLabels" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">样本类型</label>
            <select
              v-model="localFilters.sample_type"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              <option v-for="(label, value) in sampleLabels" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">隐患等级</label>
            <select
              v-model="localFilters.danger_level"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部等级</option>
              <option v-for="(label, value) in dangerLevels" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">归档状态</label>
            <select
              v-model="localFilters.is_archived"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="0">未归档</option>
              <option value="1">已归档</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">阻断状态</label>
            <select
              v-model="localFilters.has_blocking"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="0">无阻断</option>
              <option value="1">有阻断</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-500">
            共 <span class="font-semibold">{{ records.total }}</span> 条记录
          </div>
          <button
            @click="resetFilters"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            重置筛选
          </button>
        </div>
      </div>

      <div v-if="statistics" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 rounded-lg p-4">
          <p class="text-sm text-blue-600">筛选后总数</p>
          <p class="text-2xl font-bold text-blue-800">{{ records.total }}</p>
        </div>
        <div class="bg-green-50 rounded-lg p-4">
          <p class="text-sm text-green-600">涉及金额</p>
          <p class="text-2xl font-bold text-green-800">¥{{ formatNumber(statistics.total_amount) }}</p>
        </div>
        <div class="bg-yellow-50 rounded-lg p-4">
          <p class="text-sm text-yellow-600">涉及数量</p>
          <p class="text-2xl font-bold text-yellow-800">{{ statistics.total_quantity }}</p>
        </div>
        <div class="bg-red-50 rounded-lg p-4">
          <p class="text-sm text-red-600">有阻断</p>
          <p class="text-2xl font-bold text-red-800">{{ statistics.has_blocking }}</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div v-if="records.data.length === 0" class="text-center py-12 text-gray-500">
          <p class="text-4xl mb-2">📭</p>
          <p>暂无符合条件的记录</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">记录编号</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">户主信息</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">隐患</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额/数量</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">责任人</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">列表摘要</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="record in records.data"
                :key="record.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'bg-red-50': record.has_blocking }"
              >
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <span v-if="record.version > 1" class="text-xs text-gray-500">
                      v{{ record.version }}
                    </span>
                    <span class="font-mono text-sm font-medium text-blue-600">
                      {{ record.record_no }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ formatDate(record.created_at) }}
                  </div>
                </td>

                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ record.source }}</div>
                  <div v-if="record.source_no" class="text-xs text-gray-500">
                    {{ record.source_no }}
                  </div>
                </td>

                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ record.household_name }}</div>
                  <div class="text-xs text-gray-500">{{ record.household_phone }}</div>
                  <div class="text-xs text-gray-400 truncate max-w-[180px]" :title="record.address">
                    {{ record.address }}
                  </div>
                  <div v-if="record.gas_meter_no" class="text-xs text-gray-400">
                    表号: {{ record.gas_meter_no }}
                  </div>
                </td>

                <td class="px-4 py-4">
                  <div class="flex items-center space-x-2 mb-1">
                    <DangerBadge :level="record.danger_level" />
                    <span class="text-xs text-gray-500">{{ record.danger_type }}</span>
                  </div>
                  <div class="text-xs text-gray-600 line-clamp-2 max-w-[200px]" :title="record.hidden_danger">
                    {{ record.hidden_danger }}
                  </div>
                </td>

                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    ¥{{ formatNumber(record.involve_amount) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ record.involve_quantity }} 项
                  </div>
                </td>

                <td class="px-4 py-4 whitespace-nowrap">
                  <StatusBadge
                    :status="record.status"
                    :has-blocking="record.has_blocking"
                    :is-archived="record.is_archived"
                  />
                  <div class="mt-1">
                    <span
                      class="inline-block text-xs px-2 py-0.5 rounded"
                      :class="{
                        'bg-green-100 text-green-700': record.sample_type === 'normal',
                        'bg-yellow-100 text-yellow-700': record.sample_type === 'number_conflict',
                        'bg-orange-100 text-orange-700': record.sample_type === 'amount_difference',
                        'bg-purple-100 text-purple-700': record.sample_type === 'appeal'
                      }"
                    >
                      {{ sampleLabels[record.sample_type] }}
                    </span>
                  </div>
                </td>

                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ record.current_responsible?.name || '-' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ record.current_responsible?.role_label || '-' }}
                  </div>
                </td>

                <td class="px-4 py-4 max-w-[280px]">
                  <p class="text-xs text-gray-600 leading-relaxed">
                    {{ record.summary }}
                  </p>
                </td>

                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    :href="route('records.show', record.id)"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    详情
                  </Link>
                  <template v-if="!record.is_archived">
                    <span class="text-gray-300">|</span>
                    <Link
                      :href="route('records.handle', record.id)"
                      class="text-purple-600 hover:text-purple-800"
                    >
                      处理
                    </Link>
                  </template>
                  <template v-else>
                    <span class="text-gray-300">|</span>
                    <button
                      v-if="$page.props.auth.user?.can_approve"
                      @click="showReopenModal(record)"
                      class="text-orange-600 hover:text-orange-800"
                    >
                      重开
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="records.last_page > 1" class="px-4 py-3 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              显示第 {{ records.from }} - {{ records.to }} 条，共 {{ records.total }} 条
            </div>
            <div class="flex space-x-1">
              <Link
                v-for="page in getVisiblePages()"
                :key="page"
                :href="records.links[page - 1]?.url || '#'"
                :class="[
                  'px-3 py-1 text-sm rounded',
                  page === records.current_page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ page }}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="reopenModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">重新处理记录</h3>
        <p class="text-sm text-gray-600 mb-4">
          确定要重新处理记录 <strong>{{ reopenModal.record?.record_no }}</strong> 吗？
          系统将创建一条新记录，保留原记录归档状态。
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">重开原因</label>
          <textarea
            v-model="reopenModal.reason"
            rows="3"
            placeholder="请输入重新处理的原因..."
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="reopenModal.show = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="submitReopen"
            :disabled="!reopenModal.reason.trim()"
            class="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认重开
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import DangerBadge from '../../Components/DangerBadge.vue';

const props = defineProps({
  records: Object,
  filters: Object,
  users: Array,
  statistics: Object,
  fromDashboard: Boolean,
  drillTitle: String,
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

const dangerLevels = {
  general: '一般',
  major: '较大',
  serious: '重大'
};

const localFilters = reactive({
  search: props.filters.search || '',
  status: props.filters.status || '',
  sample_type: props.filters.sample_type || '',
  danger_level: props.filters.danger_level || '',
  is_archived: props.filters.is_archived !== undefined ? props.filters.is_archived : '',
  has_blocking: props.filters.has_blocking !== undefined ? props.filters.has_blocking : '',
  responsible_id: props.filters.responsible_id || '',
});

const reopenModal = reactive({
  show: false,
  record: null,
  reason: '',
});

const formatNumber = (num) => {
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const applyFilters = () => {
  router.get(route('records.index'), localFilters, { preserveScroll: true });
};

const resetFilters = () => {
  localFilters.search = '';
  localFilters.status = '';
  localFilters.sample_type = '';
  localFilters.danger_level = '';
  localFilters.is_archived = '';
  localFilters.has_blocking = '';
  localFilters.responsible_id = '';
  router.get(route('records.index'), {}, { preserveScroll: true });
};

const getVisiblePages = () => {
  const current = props.records.current_page;
  const last = props.records.last_page;
  const pages = [];
  const range = 2;

  for (let i = Math.max(1, current - range); i <= Math.min(last, current + range); i++) {
    pages.push(i);
  }
  return pages;
};

const showReopenModal = (record) => {
  reopenModal.show = true;
  reopenModal.record = record;
  reopenModal.reason = '';
};

const submitReopen = () => {
  if (!reopenModal.record || !reopenModal.reason.trim()) return;

  router.post(
    route('records.reopen', reopenModal.record.id),
    { reason: reopenModal.reason },
    {
      onSuccess: () => {
        reopenModal.show = false;
      }
    }
  );
};
</script>
