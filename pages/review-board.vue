<template>
  <div class="review-board-page">
    <div class="page-header">
      <h1 class="page-title">🔍 复盘分析</h1>
      <p class="page-desc">对高值耗材追溯记录进行复盘分析，识别问题、总结经验、持续改进</p>
    </div>

    <!-- 四类样本展示 -->
    <div class="sample-categories">
      <div
        v-for="sample in sampleTypes"
        :key="sample.type"
        :class="['sample-card', `sample-${sample.type}`]"
        @click="selectSampleType(sample.type)"
      >
        <div class="sample-icon">{{ sample.icon }}</div>
        <div class="sample-info">
          <div class="sample-title">{{ sample.label }}</div>
          <div class="sample-count">{{ sample.count }} 条记录</div>
        </div>
        <div class="sample-arrow">→</div>
      </div>
    </div>

    <div class="board-grid">
      <!-- 异常趋势分析 -->
      <div class="card">
        <div class="section-title">
          <span>📈</span> 异常类型分析
        </div>
        <div class="abnormal-analysis">
          <div class="analysis-item" v-for="item in abnormalAnalysis" :key="item.type">
            <div class="analysis-header">
              <span class="analysis-label">{{ item.label }}</span>
              <span class="analysis-count">{{ item.count }} 条</span>
            </div>
            <div class="analysis-bar">
              <div
                class="analysis-bar-fill"
                :class="`bar-${item.type}`"
                :style="{ width: totalAbnormal > 0 ? (item.count / totalAbnormal * 100) + '%' : '0%' }"
              ></div>
            </div>
            <div class="analysis-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 问题原因分类 -->
      <div class="card">
        <div class="section-title">
          <span>🎯</span> 问题原因分类
        </div>
        <div class="cause-list">
          <div v-for="cause in causes" :key="cause.name" class="cause-item">
            <div class="cause-header">
              <span class="cause-name">{{ cause.name }}</span>
              <span class="cause-percent">{{ cause.percent }}%</span>
            </div>
            <div class="cause-bar">
              <div class="cause-bar-fill" :style="{ width: cause.percent + '%' }"></div>
            </div>
            <div class="cause-desc">{{ cause.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 改进措施 -->
      <div class="card">
        <div class="section-title">
          <span>💡</span> 改进措施建议
        </div>
        <div class="improvement-list">
          <div v-for="(item, index) in improvements" :key="index" class="improvement-item">
            <div class="improvement-num">{{ index + 1 }}</div>
            <div class="improvement-content">
              <div class="improvement-title">{{ item.title }}</div>
              <div class="improvement-desc">{{ item.desc }}</div>
              <div class="improvement-target">
                <span class="target-label">目标：</span>
                <span class="target-value">{{ item.target }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险预警 -->
      <div class="card">
        <div class="section-title">
          <span>⚠️</span> 风险预警
        </div>
        <div class="risk-list">
          <div v-for="(risk, index) in risks" :key="index" :class="['risk-item', `risk-${risk.level}`]">
            <div class="risk-level">
              <span :class="['risk-dot', `dot-${risk.level}`]"></span>
              {{ risk.levelLabel }}
            </div>
            <div class="risk-title">{{ risk.title }}</div>
            <div class="risk-desc">{{ risk.desc }}</div>
            <button class="btn btn-primary btn-sm" @click="drillToRisk(risk)">查看详情 →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 样本详情列表 -->
    <div class="card">
      <div class="card-header">
        <div class="section-title" style="margin: 0;">
          <span>📋</span>
          {{ currentSampleLabel }} 案例详情
          <span class="tag tag-default" style="margin-left: 8px;">{{ sampleRecords.length }} 条</span>
        </div>
        <div class="filter-actions">
          <button
            :class="['btn', viewMode === 'list' ? 'btn-primary' : 'btn-default']"
            @click="viewMode = 'list'"
          >
            列表视图
          </button>
          <button
            :class="['btn', viewMode === 'card' ? 'btn-primary' : 'btn-default']"
            style="margin-left: 8px;"
            @click="viewMode = 'card'"
          >
            卡片视图
          </button>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="table-container">
        <table>
          <thead>
            <tr>
              <th>记录编号</th>
              <th>患者</th>
              <th>耗材</th>
              <th>异常类型</th>
              <th>问题简述</th>
              <th>当前状态</th>
              <th>责任人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in sampleRecords" :key="record.id" class="cursor-pointer" @click="goToDetail(record.id)">
              <td>
                <span class="record-no">{{ record.recordNo }}</span>
              </td>
              <td>{{ record.patientName }}</td>
              <td>
                <div>{{ record.consumableName }}</div>
                <div class="text-secondary text-sm">{{ record.specification }}</div>
              </td>
              <td>
                <span v-if="record.abnormalType" :class="['tag', `tag-${abnormalTypeColors[record.abnormalType]}`]">
                  {{ abnormalTypeLabels[record.abnormalType] }}
                </span>
                <span v-else class="tag tag-success">正常</span>
              </td>
              <td class="reason-text">{{ record.abnormalReason || record.conclusion || '-' }}</td>
              <td>
                <span :class="['tag', `tag-${statusColors[record.status]}`]">
                  {{ statusLabels[record.status] }}
                </span>
              </td>
              <td>{{ record.currentHandler?.name || '未分配' }}</td>
              <td>
                <button class="btn btn-primary" @click.stop="goToDetail(record.id)">查看详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="card-grid">
        <div
          v-for="record in sampleRecords"
          :key="record.id"
          class="record-card"
          @click="goToDetail(record.id)"
        >
          <div class="card-header-row">
            <span class="record-no">{{ record.recordNo }}</span>
            <span :class="['tag', `tag-${statusColors[record.status]}`]">
              {{ statusLabels[record.status] }}
            </span>
          </div>
          <div class="card-patient">
            <span class="patient-name">{{ record.patientName }}</span>
            <span class="text-secondary text-sm">{{ record.deptName }}</span>
          </div>
          <div class="card-consumable">
            <div class="consumable-name">{{ record.consumableName }}</div>
            <div class="text-secondary text-sm">{{ record.specification }}</div>
          </div>
          <div class="card-amount">
            ¥{{ record.totalAmount.toFixed(2) }}
          </div>
          <div v-if="record.abnormalType" class="card-abnormal">
            <span class="abnormal-icon">⚠️</span>
            <span :class="['tag', `tag-${abnormalTypeColors[record.abnormalType]}`]">
              {{ abnormalTypeLabels[record.abnormalType] }}
            </span>
          </div>
          <div v-if="record.blockingReason" class="card-reason">
            {{ record.blockingReason }}
          </div>
          <div class="card-footer">
            <span class="handler">责任人：{{ record.currentHandler?.name || '未分配' }}</span>
            <span class="view-detail">查看详情 →</span>
          </div>
        </div>
      </div>

      <div v-if="sampleRecords.length === 0" class="empty">
        暂无数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConstants } from '~/composables/useConstants'

const { statusLabels, statusColors, abnormalTypeLabels, abnormalTypeColors } = useConstants()

const currentSampleType = ref<string>('all')
const viewMode = ref<'list' | 'card'>('list')
const allRecords = ref<any[]>([])
const stats = ref<any>(null)

const sampleTypes = computed(() => [
  { type: 'all', label: '全部记录', icon: '📋', count: stats.value?.overview?.total || 0 },
  { type: 'NORMAL', label: '正常核销', icon: '✅', count: stats.value?.abnormalStats?.normal || 0 },
  { type: 'MISSING_RECORD', label: '记录漏填', icon: '📝', count: getAbnormalCount('MISSING_RECORD') },
  { type: 'ATTACHMENT_VERSION_MISMATCH', label: '附件版本不一致', icon: '📎', count: getAbnormalCount('ATTACHMENT_VERSION_MISMATCH') },
  { type: 'REPROCESS', label: '重新处理', icon: '🔄', count: getAbnormalCount('REPROCESS') }
])

const currentSampleLabel = computed(() => {
  const found = sampleTypes.value.find(s => s.type === currentSampleType.value)
  return found?.label || '全部'
})

const totalAbnormal = computed(() => stats.value?.abnormalStats?.abnormal || 0)

const abnormalAnalysis = computed(() => [
  {
    type: 'MISSING_RECORD',
    label: '记录漏填',
    count: getAbnormalCount('MISSING_RECORD'),
    desc: '关键信息缺失，无法完整追溯'
  },
  {
    type: 'ATTACHMENT_VERSION_MISMATCH',
    label: '附件版本不一致',
    count: getAbnormalCount('ATTACHMENT_VERSION_MISMATCH'),
    desc: '提交的证据材料版本与实物不符'
  },
  {
    type: 'REPROCESS',
    label: '重新处理',
    count: getAbnormalCount('REPROCESS'),
    desc: '因信息错误或不完整需重新处理'
  }
])

const causes = [
  { name: '信息录入不完整', percent: 35, desc: '医护人员录入时遗漏关键字段' },
  { name: '证据材料不符', percent: 25, desc: '提交的附件与实物信息不一致' },
  { name: '流程不规范', percent: 20, desc: '未按规定流程执行操作' },
  { name: '系统操作失误', percent: 20, desc: '操作过程中出现人为错误' }
]

const improvements = [
  {
    title: '完善录入校验机制',
    desc: '增加系统必填项校验和逻辑校验，从源头减少信息漏填',
    target: '漏填率降低 50%'
  },
  {
    title: '建立版本管理机制',
    desc: '对附件进行版本管理，确保提交的附件与最新版一致',
    target: '版本不一致率降至 5% 以下'
  },
  {
    title: '优化流程培训',
    desc: '定期开展流程培训，提高操作人员规范意识',
    target: '流程规范度提升至 95%'
  },
  {
    title: '增强复核把关',
    desc: '强化复核环节的检查力度，及时发现问题并纠正',
    target: '复核发现率提升 30%'
  }
]

const risks = [
  {
    level: 'high',
    levelLabel: '高风险',
    title: '骨科耗材追溯完整性不足',
    desc: '骨科高值耗材序列号缺失率较高，存在追溯风险',
    deptName: '骨科'
  },
  {
    level: 'medium',
    levelLabel: '中风险',
    title: '心内科附件版本管理混乱',
    desc: '心内科多次出现附件版本与实物不符的情况',
    deptName: '心内科'
  },
  {
    level: 'low',
    levelLabel: '低风险',
    title: '眼科记录准确率待提升',
    desc: '眼科部分记录存在信息不准确问题',
    deptName: '眼科'
  }
]

const sampleRecords = computed(() => {
  if (currentSampleType.value === 'all') return allRecords.value
  if (currentSampleType.value === 'NORMAL') {
    return allRecords.value.filter((r: any) => r.isAbnormal === false || r.abnormalType === 'NORMAL')
  }
  return allRecords.value.filter((r: any) => r.abnormalType === currentSampleType.value)
})

function getAbnormalCount(type: string) {
  if (!stats.value?.abnormalStats?.byType) return 0
  const found = stats.value.abnormalStats.byType.find((s: any) => s.type === type)
  return found?.count || 0
}

const selectSampleType = (type: string) => {
  currentSampleType.value = type
  if (type === 'all') {
    navigateTo({ path: '/' })
  } else if (type === 'NORMAL') {
    navigateTo({ path: '/', query: { abnormalType: 'NORMAL', isAbnormal: 'false' } })
  } else {
    navigateTo({ path: '/', query: { abnormalType: type, isAbnormal: 'true' } })
  }
}

const goToDetail = (id: number) => {
  navigateTo(`/record/${id}`)
}

const drillToRisk = (risk: any) => {
  navigateTo({
    path: '/',
    query: { deptName: risk.deptName, isAbnormal: 'true' }
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

const loadRecords = async () => {
  try {
    const data: any = await $fetch('/api/records', {
      params: { pageSize: 50 }
    })
    allRecords.value = data.data
  } catch (e) {
    console.error('加载记录失败', e)
  }
}

onMounted(() => {
  loadStats()
  loadRecords()
})
</script>

<style scoped>
.review-board-page {
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

.sample-categories {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.sample-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid transparent;
}

.sample-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.sample-all {
  border-left-color: #1890ff;
}

.sample-NORMAL {
  border-left-color: #52c41a;
}

.sample-MISSING_RECORD {
  border-left-color: #ff4d4f;
}

.sample-ATTACHMENT_VERSION_MISMATCH {
  border-left-color: #faad14;
}

.sample-REPROCESS {
  border-left-color: #722ed1;
}

.sample-icon {
  font-size: 32px;
}

.sample-info {
  flex: 1;
}

.sample-title {
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.sample-count {
  color: #8c8c8c;
  font-size: 13px;
}

.sample-arrow {
  color: #bfbfbf;
  font-size: 18px;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.abnormal-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.analysis-label {
  font-weight: 600;
  color: #262626;
}

.analysis-count {
  color: #8c8c8c;
}

.analysis-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.analysis-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s;
}

.bar-MISSING_RECORD {
  background: #ff4d4f;
}

.bar-ATTACHMENT_VERSION_MISMATCH {
  background: #faad14;
}

.bar-REPROCESS {
  background: #722ed1;
}

.analysis-desc {
  color: #8c8c8c;
  font-size: 12px;
}

.cause-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cause-item {
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.cause-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.cause-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cause-name {
  font-weight: 500;
  color: #262626;
}

.cause-percent {
  color: #1890ff;
  font-weight: 600;
}

.cause-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.cause-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #69c0ff);
  border-radius: 3px;
}

.cause-desc {
  color: #8c8c8c;
  font-size: 12px;
}

.improvement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.improvement-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f6ffed;
  border-radius: 8px;
}

.improvement-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #52c41a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.improvement-content {
  flex: 1;
}

.improvement-title {
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.improvement-desc {
  color: #8c8c8c;
  font-size: 13px;
  margin-bottom: 6px;
}

.improvement-target {
  font-size: 12px;
}

.target-label {
  color: #8c8c8c;
}

.target-value {
  color: #52c41a;
  font-weight: 600;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  border-left: 4px solid;
}

.risk-high {
  border-left-color: #ff4d4f;
  background: #fff2f0;
}

.risk-medium {
  border-left-color: #faad14;
  background: #fffbe6;
}

.risk-low {
  border-left-color: #1890ff;
  background: #e6f7ff;
}

.risk-level {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 13px;
}

.risk-high .risk-level {
  color: #ff4d4f;
}

.risk-medium .risk-level {
  color: #fa8c16;
}

.risk-low .risk-level {
  color: #1890ff;
}

.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-high {
  background: #ff4d4f;
}

.dot-medium {
  background: #faad14;
}

.dot-low {
  background: #1890ff;
}

.risk-title {
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.risk-desc {
  color: #595959;
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-no {
  font-weight: 600;
  color: #1890ff;
}

.filter-actions {
  display: flex;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.record-card {
  background: #fafafa;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.record-card:hover {
  background: white;
  border-color: #bae7ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.card-patient {
  margin-bottom: 8px;
}

.patient-name {
  font-weight: 600;
  margin-right: 8px;
}

.card-consumable {
  margin-bottom: 12px;
}

.consumable-name {
  font-weight: 500;
  color: #262626;
}

.card-amount {
  font-size: 20px;
  font-weight: 700;
  color: #ff4d4f;
  margin-bottom: 12px;
}

.card-abnormal {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.card-reason {
  color: #595959;
  font-size: 13px;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
}

.handler {
  color: #8c8c8c;
  font-size: 12px;
}

.view-detail {
  color: #1890ff;
  font-size: 12px;
}

.reason-text {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #595959;
}

.table-container {
  overflow-x: auto;
}
</style>
