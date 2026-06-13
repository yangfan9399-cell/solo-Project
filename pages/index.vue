<template>
  <div class="records-page">
    <div class="page-header">
      <h1 class="page-title">高值耗材追溯记录</h1>
      <p class="page-desc">管理医院高值耗材领用植入登记与追溯复核全流程</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" @click="filterByStatus('all')" style="cursor: pointer;">
        <div class="stat-value" style="color: #1890ff;">{{ stats?.overview?.total || 0 }}</div>
        <div class="stat-label">总记录数</div>
        <div class="stat-change up">今日新增 {{ stats?.today?.count || 0 }} 条</div>
      </div>
      <div class="stat-card" @click="filterByAbnormal(false)" style="cursor: pointer;">
        <div class="stat-value" style="color: #52c41a;">{{ stats?.abnormalStats?.normal || 0 }}</div>
        <div class="stat-label">正常核销</div>
        <div class="stat-change up">占比 {{ normalRate }}%</div>
      </div>
      <div class="stat-card" @click="filterByAbnormal(true)" style="cursor: pointer;">
        <div class="stat-value" style="color: #ff4d4f;">{{ stats?.abnormalStats?.abnormal || 0 }}</div>
        <div class="stat-label">异常记录</div>
        <div class="stat-change down">异常率 {{ stats?.overview?.abnormalRate || '0%' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #722ed1;">{{ formatMoney(stats?.amount?.total) }}</div>
        <div class="stat-label">总金额</div>
        <div class="stat-change">平均 {{ formatMoney(stats?.amount?.average) }}</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label class="filter-label">状态筛选</label>
          <select v-model="filters.status" class="form-select" @change="loadRecords">
            <option value="all">全部状态</option>
            <option value="PENDING_ACCEPTANCE">待受理</option>
            <option value="ACCEPTED">已受理</option>
            <option value="PROCESSING">处理中</option>
            <option value="PENDING_REVIEW">待复核</option>
            <option value="REVIEW_PASSED">复核通过</option>
            <option value="REVIEW_REJECTED">复核退回</option>
            <option value="ARCHIVED">已归档</option>
            <option value="REPROCESSING">重新处理</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">异常类型</label>
          <select v-model="filters.abnormalType" class="form-select" @change="loadRecords">
            <option value="all">全部类型</option>
            <option value="NORMAL">正常核销</option>
            <option value="MISSING_RECORD">记录漏填</option>
            <option value="ATTACHMENT_VERSION_MISMATCH">附件版本不一致</option>
            <option value="REPROCESS">重新处理</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">科室</label>
          <select v-model="filters.deptName" class="form-select" @change="loadRecords">
            <option value="all">全部科室</option>
            <option v-for="dept in deptList" :key="dept" :value="dept">{{ dept }}</option>
          </select>
        </div>
        <div class="filter-item flex-1">
          <label class="filter-label">关键词搜索</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="form-input"
            placeholder="搜索记录编号、患者姓名、耗材名称..."
            @keyup.enter="loadRecords"
          />
        </div>
        <div class="filter-item">
          <label class="filter-label">&nbsp;</label>
          <button class="btn btn-primary" @click="loadRecords">查询</button>
        </div>
      </div>
    </div>

    <!-- 记录列表 -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">记录列表</div>
        <div class="list-actions">
          <span class="text-secondary text-sm">共 {{ total }} 条记录</span>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>记录编号</th>
              <th>患者信息</th>
              <th>耗材信息</th>
              <th>数量/金额</th>
              <th>状态</th>
              <th>异常类型</th>
              <th>当前责任人</th>
              <th>申请时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id" class="cursor-pointer" @click="goToDetail(record.id)">
              <td>
                <span class="record-no">{{ record.recordNo }}</span>
                <span v-if="record.isAbnormal" class="abnormal-badge">!</span>
              </td>
              <td>
                <div class="patient-name">{{ record.patientName }}</div>
                <div class="text-secondary text-sm">{{ record.deptName }} · {{ record.sourceType }}</div>
              </td>
              <td>
                <div class="consumable-name">{{ record.consumableName }}</div>
                <div class="text-secondary text-sm">{{ record.specification }}</div>
              </td>
              <td>
                <div>{{ record.quantity }} {{ record.unit }}</div>
                <div class="text-secondary text-sm">¥{{ record.totalAmount.toFixed(2) }}</div>
              </td>
              <td>
                <span :class="['tag', `tag-${statusColors[record.status]}`]">
                  {{ statusLabels[record.status] }}
                </span>
              </td>
              <td>
                <span v-if="record.abnormalType" :class="['tag', `tag-${abnormalTypeColors[record.abnormalType]}`]">
                  {{ abnormalTypeLabels[record.abnormalType] }}
                </span>
                <span v-else class="tag tag-default">-</span>
              </td>
              <td>
                <span v-if="record.currentHandler">{{ record.currentHandler.name }}</span>
                <span v-else class="text-secondary">未分配</span>
              </td>
              <td>{{ formatDate(record.applyTime) }}</td>
              <td>
                <button class="btn btn-default" @click.stop="goToDetail(record.id)">详情</button>
                <button
                  v-if="canHandle(record)"
                  class="btn btn-primary"
                  style="margin-left: 8px;"
                  @click.stop="goToReview(record.id)"
                >
                  处理
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="records.length === 0" class="empty">
          暂无数据
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <button class="btn btn-default" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="btn btn-default" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate, formatMoney } from '~/utils/format'
import { useConstants } from '~/composables/useConstants'

const route = useRoute()
const { statusLabels, statusColors, abnormalTypeLabels, abnormalTypeColors } = useConstants()

const records = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const stats = ref<any>(null)
const deptList = ref<string[]>([])

const filters = ref({
  status: 'all',
  abnormalType: 'all',
  deptName: 'all',
  keyword: ''
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const normalRate = computed(() => {
  if (!stats.value?.overview?.total) return 0
  return ((stats.value.abnormalStats.normal / stats.value.overview.total) * 100).toFixed(1)
})

const userState = useState('currentUser', () => ({
  id: 1,
  name: '张医生',
  role: 'APPLICANT',
  department: '骨科'
}))

const canHandle = (record: any) => {
  const role = userState.value.role
  const status = record.status

  if (role === 'PROCESSOR') {
    return ['PENDING_ACCEPTANCE', 'ACCEPTED', 'REPROCESSING'].includes(status)
  }
  if (role === 'REVIEWER') {
    return status === 'PENDING_REVIEW'
  }
  if (role === 'ARCHIVIST') {
    return status === 'REVIEW_PASSED'
  }
  return false
}

const loadStats = async () => {
  try {
    const data = await $fetch('/api/stats')
    stats.value = data
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const loadRecords = async () => {
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filters.value.status && filters.value.status !== 'all') {
      params.status = filters.value.status
    }
    if (filters.value.abnormalType && filters.value.abnormalType !== 'all') {
      params.abnormalType = filters.value.abnormalType
    }
    if (filters.value.deptName && filters.value.deptName !== 'all') {
      params.deptName = filters.value.deptName
    }
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword
    }
    if (route.query.isAbnormal) {
      params.isAbnormal = route.query.isAbnormal
    }
    const data: any = await $fetch('/api/records', { params })
    records.value = data.data
    total.value = data.total
  } catch (e) {
    console.error('加载记录列表失败', e)
  }
}

const loadDeptList = async () => {
  try {
    const data: any = await $fetch('/api/stats')
    if (data.deptStats) {
      deptList.value = data.deptStats.map((d: any) => d.deptName)
    }
  } catch (e) {
    console.error('加载科室列表失败', e)
  }
}

const filterByStatus = (status: string) => {
  filters.value.status = status
  filters.value.abnormalType = 'all'
  filters.value.deptName = 'all'
  page.value = 1
  loadRecords()
}

const filterByAbnormal = (isAbnormal: boolean) => {
  filters.value.abnormalType = 'all'
  filters.value.status = 'all'
  filters.value.deptName = 'all'
  if (isAbnormal) {
    // 通过 isAbnormal 参数筛选
    navigateTo(`/?isAbnormal=true`)
  }
  page.value = 1
  loadRecords()
}

const changePage = (newPage: number) => {
  page.value = newPage
  loadRecords()
}

const goToDetail = (id: number) => {
  navigateTo(`/record/${id}`)
}

const goToReview = (id: number) => {
  navigateTo(`/review?id=${id}`)
}

const initFiltersFromUrl = () => {
  const query = route.query
  if (query.status && query.status !== 'all') {
    filters.value.status = String(query.status)
  }
  if (query.abnormalType && query.abnormalType !== 'all') {
    filters.value.abnormalType = String(query.abnormalType)
  }
  if (query.deptName && query.deptName !== 'all') {
    filters.value.deptName = String(query.deptName)
  }
  if (query.keyword) {
    filters.value.keyword = String(query.keyword)
  }
  if (query.isAbnormal === 'true') {
    filters.value.abnormalType = 'all'
  }
  if (query.page) {
    page.value = parseInt(String(query.page)) || 1
  }
}

const applyFilters = () => {
  page.value = 1
  loadRecords()
}

watch(() => route.query, () => {
  initFiltersFromUrl()
  loadRecords()
}, { immediate: false })

onMounted(() => {
  loadStats()
  loadDeptList()
  initFiltersFromUrl()
  loadRecords()
})
</script>

<style scoped>
.records-page {
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 4px;
}

.page-desc {
  color: #8c8c8c;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.filter-item.flex-1 {
  flex: 1;
  min-width: 240px;
}

.filter-label {
  font-size: 13px;
  color: #595959;
  font-weight: 500;
}

.record-no {
  font-weight: 600;
  color: #1890ff;
  font-size: 13px;
}

.abnormal-badge {
  display: inline-block;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  background: #ff4d4f;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-left: 6px;
}

.patient-name {
  font-weight: 500;
}

.consumable-name {
  font-weight: 500;
  color: #262626;
}

.table-container {
  overflow-x: auto;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-info {
  color: #8c8c8c;
  font-size: 13px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
