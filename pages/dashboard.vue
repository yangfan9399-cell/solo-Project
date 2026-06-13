<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="page-title">📊 看板统计</h1>
      <p class="page-desc">高值耗材追溯数据统计与分析，点击卡片可钻取查看具体记录</p>
    </div>

    <!-- 核心指标 -->
    <div class="stats-grid">
      <div
        class="stat-card large"
        @click="drillToRecords('all')"
      >
        <div class="stat-icon" style="background: #e6f7ff;">
          📋
        </div>
        <div class="stat-content">
          <div class="stat-value" style="color: #1890ff;">{{ stats?.overview?.total || 0 }}</div>
          <div class="stat-label">总记录数</div>
        </div>
        <div class="stat-drill">点击钻取 →</div>
      </div>
      <div
        class="stat-card large"
        @click="drillToRecords('normal')"
      >
        <div class="stat-icon" style="background: #f6ffed;">
          ✅
        </div>
        <div class="stat-content">
          <div class="stat-value" style="color: #52c41a;">{{ stats?.abnormalStats?.normal || 0 }}</div>
          <div class="stat-label">正常核销</div>
        </div>
        <div class="stat-drill">点击钻取 →</div>
      </div>
      <div
        class="stat-card large"
        @click="drillToRecords('abnormal')"
      >
        <div class="stat-icon" style="background: #fff2f0;">
          ⚠️
        </div>
        <div class="stat-content">
          <div class="stat-value" style="color: #ff4d4f;">{{ stats?.abnormalStats?.abnormal || 0 }}</div>
          <div class="stat-label">异常记录</div>
          <div class="stat-sub">异常率 {{ stats?.overview?.abnormalRate || '0%' }}</div>
        </div>
        <div class="stat-drill">点击钻取 →</div>
      </div>
      <div
        class="stat-card large"
        @click="drillToRecords('archived')"
      >
        <div class="stat-icon" style="background: #f9f0ff;">
          📁
        </div>
        <div class="stat-content">
          <div class="stat-value" style="color: #722ed1;">{{ getStatusCount('ARCHIVED') }}</div>
          <div class="stat-label">已归档</div>
        </div>
        <div class="stat-drill">点击钻取 →</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 状态分布 -->
      <div class="card">
        <div class="section-title">
          <span>📊</span> 状态分布
        </div>
        <div class="status-list">
          <div
            v-for="item in statusStatsList"
            :key="item.status"
            class="status-item"
            @click="drillToStatus(item.status)"
          >
            <div class="status-info">
              <span :class="['tag', `tag-${item.color}`]">{{ item.label }}</span>
              <span class="status-count">{{ item.count }} 条</span>
            </div>
            <div class="status-bar">
              <div
                class="status-bar-fill"
                :style="{
                  width: (stats?.overview?.total ? (item.count / stats.overview.total * 100) : 0) + '%',
                  backgroundColor: item.colorValue
                }"
              ></div>
            </div>
            <span class="drill-icon">→</span>
          </div>
        </div>
      </div>

      <!-- 异常类型分布 -->
      <div class="card">
        <div class="section-title">
          <span>🔍</span> 异常类型分布
        </div>
        <div class="abnormal-type-list">
          <div
            v-for="item in abnormalTypeList"
            :key="item.type"
            class="abnormal-type-item"
            @click="drillToAbnormalType(item.type)"
          >
            <div class="abnormal-type-icon" :class="`abnormal-icon-${item.type}`">
              {{ item.icon }}
            </div>
            <div class="abnormal-type-info">
              <div class="abnormal-type-name">{{ item.label }}</div>
              <div class="abnormal-type-count">{{ item.count }} 条</div>
            </div>
            <div class="abnormal-type-bar">
              <div
                class="abnormal-bar-fill"
                :class="`abnormal-bar-${item.type}`"
                :style="{ width: abnormalTotal > 0 ? (item.count / abnormalTotal * 100) + '%' : '0%' }"
              ></div>
            </div>
            <span class="drill-icon">→</span>
          </div>
        </div>
      </div>

      <!-- 科室统计 -->
      <div class="card">
        <div class="section-title">
          <span>🏥</span> 科室统计
        </div>
        <div class="dept-list">
          <div
            v-for="dept in stats?.deptStats || []"
            :key="dept.deptName"
            class="dept-item"
            @click="drillToDept(dept.deptName)"
          >
            <div class="dept-name">{{ dept.deptName }}</div>
            <div class="dept-stats">
              <span class="dept-count">{{ dept.count }} 条</span>
              <span class="dept-amount">¥{{ dept.totalAmount.toFixed(2) }}</span>
            </div>
            <span class="drill-icon">→</span>
          </div>
        </div>
      </div>

      <!-- 金额统计 -->
      <div class="card">
        <div class="section-title">
          <span>💰</span> 金额统计
        </div>
        <div class="amount-stats">
          <div class="amount-item total">
            <div class="amount-label">总金额</div>
            <div class="amount-value">¥{{ formatNumber(stats?.amount?.total || 0) }}</div>
          </div>
          <div class="amount-item avg">
            <div class="amount-label">平均金额</div>
            <div class="amount-value">¥{{ formatNumber(stats?.amount?.average || 0) }}</div>
          </div>
          <div class="amount-item today">
            <div class="amount-label">今日新增</div>
            <div class="amount-value">{{ stats?.today?.count || 0 }} 条</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 流程效率 -->
    <div class="card">
      <div class="section-title">
        <span>⚡</span> 流程节点状态
      </div>
      <div class="pipeline-flow">
        <div class="pipeline-node" @click="drillToStatus('PENDING_ACCEPTANCE')">
          <div class="node-circle pending">
            <span>{{ getStatusCount('PENDING_ACCEPTANCE') }}</span>
          </div>
          <div class="node-label">待受理</div>
        </div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-node" @click="drillToStatus('PROCESSING')">
          <div class="node-circle processing">
            <span>{{ getStatusCount('PROCESSING') + getStatusCount('ACCEPTED') + getStatusCount('REPROCESSING') }}</span>
          </div>
          <div class="node-label">处理中</div>
        </div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-node" @click="drillToStatus('PENDING_REVIEW')">
          <div class="node-circle review">
            <span>{{ getStatusCount('PENDING_REVIEW') }}</span>
          </div>
          <div class="node-label">待复核</div>
        </div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-node" @click="drillToStatus('ARCHIVED')">
          <div class="node-circle archived">
            <span>{{ getStatusCount('ARCHIVED') }}</span>
          </div>
          <div class="node-label">已归档</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const stats = ref<any>(null)

const statusLabels: Record<string, string> = {
  PENDING_ACCEPTANCE: '待受理',
  ACCEPTED: '已受理',
  PROCESSING: '处理中',
  PENDING_REVIEW: '待复核',
  REVIEW_PASSED: '复核通过',
  REVIEW_REJECTED: '复核退回',
  ARCHIVED: '已归档',
  REPROCESSING: '重新处理'
}

const statusColors: Record<string, string> = {
  PENDING_ACCEPTANCE: 'default',
  ACCEPTED: 'primary',
  PROCESSING: 'warning',
  PENDING_REVIEW: 'warning',
  REVIEW_PASSED: 'success',
  REVIEW_REJECTED: 'error',
  ARCHIVED: 'default',
  REPROCESSING: 'primary'
}

const statusColorValues: Record<string, string> = {
  PENDING_ACCEPTANCE: '#bfbfbf',
  ACCEPTED: '#1890ff',
  PROCESSING: '#faad14',
  PENDING_REVIEW: '#faad14',
  REVIEW_PASSED: '#52c41a',
  REVIEW_REJECTED: '#ff4d4f',
  ARCHIVED: '#bfbfbf',
  REPROCESSING: '#1890ff'
}

const abnormalTypeLabels: Record<string, string> = {
  NORMAL: '正常核销',
  MISSING_RECORD: '记录漏填',
  ATTACHMENT_VERSION_MISMATCH: '附件版本不一致',
  REPROCESS: '重新处理'
}

const statusStatsList = computed(() => {
  if (!stats.value?.statusStats) return []
  return stats.value.statusStats.map((s: any) => ({
    status: s.status,
    label: statusLabels[s.status] || s.status,
    count: s._count,
    color: statusColors[s.status] || 'default',
    colorValue: statusColorValues[s.status] || '#bfbfbf'
  }))
})

const abnormalTotal = computed(() => {
  return stats.value?.abnormalStats?.abnormal || 0
})

const abnormalTypeList = computed(() => {
  const types = [
    { type: 'MISSING_RECORD', label: '记录漏填', icon: '📝' },
    { type: 'ATTACHMENT_VERSION_MISMATCH', label: '附件版本不一致', icon: '📎' },
    { type: 'REPROCESS', label: '重新处理', icon: '🔄' }
  ]

  return types.map(t => {
    const found = stats.value?.abnormalStats?.byType?.find((s: any) => s.type === t.type)
    return {
      ...t,
      count: found?.count || 0
    }
  })
})

const getStatusCount = (status: string) => {
  if (!stats.value?.statusStats) return 0
  const found = stats.value.statusStats.find((s: any) => s.status === status)
  return found?._count || 0
}

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const drillToRecords = (type: string) => {
  let query: any = {}
  if (type === 'normal') {
    query.isAbnormal = 'false'
  } else if (type === 'abnormal') {
    query.isAbnormal = 'true'
  } else if (type === 'archived') {
    query.status = 'ARCHIVED'
  }
  navigateTo({
    path: '/',
    query
  })
}

const drillToStatus = (status: string) => {
  navigateTo({
    path: '/',
    query: { status }
  })
}

const drillToAbnormalType = (type: string) => {
  navigateTo({
    path: '/',
    query: { abnormalType: type }
  })
}

const drillToDept = (deptName: string) => {
  navigateTo({
    path: '/',
    query: { deptName }
  })
}

const loadStats = async () => {
  try {
    const data = await $fetch('/api/stats')
    stats.value = data
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-page {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card.large {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.stat-card.large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  color: #8c8c8c;
  font-size: 14px;
  margin-top: 4px;
}

.stat-sub {
  color: #bfbfbf;
  font-size: 12px;
  margin-top: 4px;
}

.stat-drill {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 12px;
  color: #bfbfbf;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.status-item:hover {
  background: #f0f5ff;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 160px;
}

.status-count {
  font-weight: 600;
  color: #262626;
}

.status-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.drill-icon {
  color: #bfbfbf;
  font-size: 14px;
}

.abnormal-type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.abnormal-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.abnormal-type-item:hover {
  background: #fff2f0;
}

.abnormal-type-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.abnormal-icon-MISSING_RECORD {
  background: #fff2f0;
}

.abnormal-icon-ATTACHMENT_VERSION_MISMATCH {
  background: #fffbe6;
}

.abnormal-icon-REPROCESS {
  background: #e6f7ff;
}

.abnormal-type-info {
  min-width: 120px;
}

.abnormal-type-name {
  font-weight: 600;
  color: #262626;
}

.abnormal-type-count {
  color: #8c8c8c;
  font-size: 13px;
}

.abnormal-type-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.abnormal-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.abnormal-bar-MISSING_RECORD {
  background: #ff4d4f;
}

.abnormal-bar-ATTACHMENT_VERSION_MISMATCH {
  background: #faad14;
}

.abnormal-bar-REPROCESS {
  background: #1890ff;
}

.dept-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dept-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.dept-item:hover {
  background: #f0f5ff;
}

.dept-name {
  font-weight: 500;
  color: #262626;
}

.dept-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.dept-count {
  color: #1890ff;
  font-weight: 600;
  font-size: 13px;
}

.dept-amount {
  color: #ff4d4f;
  font-size: 13px;
}

.amount-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.amount-item {
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
}

.amount-item.total {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}

.amount-item.avg {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
}

.amount-item.today {
  background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
}

.amount-label {
  color: #595959;
  font-size: 13px;
  margin-bottom: 8px;
}

.amount-value {
  font-size: 24px;
  font-weight: 700;
  color: #262626;
}

.pipeline-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.pipeline-node {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.pipeline-node:hover {
  transform: scale(1.05);
}

.node-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.node-circle.pending {
  background: linear-gradient(135deg, #bfbfbf 0%, #8c8c8c 100%);
}

.node-circle.processing {
  background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
}

.node-circle.review {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.node-circle.archived {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
}

.node-label {
  font-weight: 600;
  color: #595959;
}

.pipeline-arrow {
  font-size: 24px;
  color: #d9d9d9;
}
</style>
