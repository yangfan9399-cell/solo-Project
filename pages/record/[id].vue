<template>
  <div class="detail-page">
    <div class="page-header">
      <div>
        <button class="btn btn-default" @click="goBack">← 返回列表</button>
      </div>
      <div class="page-title-row">
        <h1 class="page-title">
          {{ record?.recordNo }}
          <span :class="['tag', `tag-${statusColors[record?.status || '']}`]" style="margin-left: 12px;">
            {{ statusLabels[record?.status || ''] }}
          </span>
          <span v-if="record?.isAbnormal" class="tag tag-error" style="margin-left: 8px;">
            异常
          </span>
          <span v-if="record?.abnormalType" :class="['tag', `tag-${abnormalTypeColors[record?.abnormalType]}`]" style="margin-left: 8px;">
            {{ abnormalTypeLabels[record?.abnormalType] }}
          </span>
        </h1>
        <div class="page-actions">
          <button
            v-if="canHandle"
            class="btn btn-primary"
            @click="goToReview"
          >
            前往处理
          </button>
          <button
            v-if="isArchived"
            class="btn btn-default"
            disabled
          >
            已归档（只读）
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card loading">
      加载中...
    </div>

    <div v-else-if="record" class="detail-content">
      <!-- 异常阻断提示 -->
      <div v-if="record.isAbnormal && record.blockingReason" class="blocking-banner">
        <div class="blocking-title">
          <span>⚠️</span>
          异常阻断提示
        </div>
        <div class="blocking-content">
          {{ record.blockingReason }}
        </div>
        <div v-if="record.remedialPath" class="remedial-path">
          <div class="remedial-title">💡 补救路径</div>
          <div class="remedial-steps" style="white-space: pre-line;">
            {{ record.remedialPath }}
          </div>
        </div>
      </div>

      <div class="detail-grid">
        <!-- 左侧：基本信息 -->
        <div class="detail-main">
          <!-- 来源信息 -->
          <div class="card">
            <div class="section-title">
              <span>📋</span> 来源信息
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">来源类型</span>
                <span class="info-value">{{ record.sourceType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">来源编号</span>
                <span class="info-value">{{ record.sourceId || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">申请科室</span>
                <span class="info-value">{{ record.applyDept }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">申请人</span>
                <span class="info-value">{{ record.applicantName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">申请时间</span>
                <span class="info-value">{{ formatDate(record.applyTime) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">记录版本</span>
                <span class="info-value">v{{ record.version }}</span>
              </div>
            </div>
          </div>

          <!-- 患者信息 -->
          <div class="card">
            <div class="section-title">
              <span>👤</span> 患者信息
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">患者姓名</span>
                <span class="info-value">{{ record.patientName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">患者ID</span>
                <span class="info-value">{{ record.patientId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">就诊科室</span>
                <span class="info-value">{{ record.deptName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">病区/床位</span>
                <span class="info-value">{{ record.wardName || '-' }} / {{ record.bedNo || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- 耗材信息 -->
          <div class="card">
            <div class="section-title">
              <span>💊</span> 关键对象（耗材信息）
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">耗材名称</span>
                <span class="info-value text-bold">{{ record.consumableName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">耗材编码</span>
                <span class="info-value">{{ record.consumableCode }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">规格型号</span>
                <span class="info-value">{{ record.specification }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">生产厂家</span>
                <span class="info-value">{{ record.manufacturer || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">批次号</span>
                <span class="info-value">{{ record.batchNo }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">序列号</span>
                <span class="info-value">
                  <span :class="{ 'missing-field': !record.serialNo }">
                    {{ record.serialNo || '未填写' }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">数量</span>
                <span class="info-value">{{ record.quantity }} {{ record.unit }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">单价</span>
                <span class="info-value">¥{{ record.unitPrice.toFixed(2) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">总金额</span>
                <span class="info-value text-bold" style="color: #ff4d4f;">
                  ¥{{ record.totalAmount.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 植入信息 -->
          <div class="card">
            <div class="section-title">
              <span>🏥</span> 植入信息
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">植入时间</span>
                <span class="info-value">
                  <span :class="{ 'missing-field': !record.implantDate }">
                    {{ formatDate(record.implantDate) }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">植入部位</span>
                <span class="info-value">{{ record.implantLocation || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">主刀医生</span>
                <span class="info-value">{{ record.surgeonName || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">巡回护士</span>
                <span class="info-value">
                  <span :class="{ 'missing-field': !record.nurseName }">
                    {{ record.nurseName || '未填写' }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- 差异对比 -->
          <div v-if="record.fieldDiffs && record.fieldDiffs.length > 0" class="card">
            <div class="section-title">
              <span>📝</span> 处理前后差异
              <span class="tag tag-warning" style="margin-left: 8px;">{{ record.fieldDiffs.length }} 处变更</span>
            </div>
            <div class="diff-list">
              <div v-for="diff in record.fieldDiffs" :key="diff.id" class="diff-section">
                <div class="diff-type-badge" :class="`diff-type-${diff.diffType}`">
                  {{ diffTypeLabels[diff.diffType] }}
                </div>
                <div class="diff-item">
                  <div class="diff-field">{{ diff.fieldLabel }}</div>
                  <div class="diff-values">
                    <span class="diff-old">{{ diff.oldValue || '（空）' }}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-new">{{ diff.newValue || '（空）' }}</span>
                  </div>
                </div>
                <div class="diff-meta">
                  变更人：{{ diff.changedBy || '系统' }} · {{ formatDate(diff.changedAt) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 结论与依据 -->
          <div v-if="record.conclusion || record.reviewBasis" class="card">
            <div class="section-title">
              <span>📌</span> 采用依据与结论
            </div>
            <div v-if="record.reviewBasis" class="basis-section">
              <div class="basis-label">采用依据：</div>
              <div class="basis-content">{{ record.reviewBasis }}</div>
            </div>
            <div v-if="record.conclusion" class="conclusion-section">
              <div class="conclusion-label">最终结论：</div>
              <div class="conclusion-content">{{ record.conclusion }}</div>
            </div>
          </div>

          <!-- 附件列表 -->
          <div v-if="record.attachments && record.attachments.length > 0" class="card">
            <div class="section-title">
              <span>📎</span> 证据附件
              <span class="tag tag-default" style="margin-left: 8px;">{{ record.attachments.length }} 个</span>
            </div>
            <div class="attachment-list">
              <div v-for="att in record.attachments" :key="att.id" class="attachment-item">
                <span class="attachment-icon">📄</span>
                <span class="attachment-name">{{ att.fileName }}</span>
                <span class="attachment-version">v{{ att.version }}</span>
                <span class="attachment-uploader text-secondary text-sm">{{ att.uploadedBy }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：流程与状态 -->
        <div class="detail-side">
          <!-- 当前责任人 -->
          <div class="card">
            <div class="section-title">
              <span>👨‍💼</span> 当前责任人
            </div>
            <div class="handler-info">
              <div class="handler-avatar">{{ record.currentHandler?.name?.charAt(0) || '?' }}</div>
              <div class="handler-detail">
                <div class="handler-name">{{ record.currentHandler?.name || '待分配' }}</div>
                <div class="handler-role text-secondary text-sm">
                  {{ record.currentHandler ? roleLabels[record.currentHandler.role] : '暂无责任人' }}
                </div>
                <div class="handler-dept text-secondary text-sm">
                  {{ record.currentHandler?.department || '-' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 操作人信息 -->
          <div class="card">
            <div class="section-title">
              <span>👥</span> 操作人
            </div>
            <div class="operators-list">
              <div class="operator-item">
                <span class="operator-label">申请人</span>
                <span class="operator-value">{{ record.applicantName }}</span>
              </div>
              <div v-if="record.acceptTime" class="operator-item">
                <span class="operator-label">受理人</span>
                <span class="operator-value">{{ getNodeOperator('ACCEPTANCE') }}</span>
              </div>
              <div v-if="record.processTime" class="operator-item">
                <span class="operator-label">处理人</span>
                <span class="operator-value">{{ getNodeOperator('PROCESSING') }}</span>
              </div>
              <div v-if="record.reviewTime" class="operator-item">
                <span class="operator-label">复核人</span>
                <span class="operator-value">{{ getNodeOperator('REVIEW') }}</span>
              </div>
              <div v-if="record.archiveTime" class="operator-item">
                <span class="operator-label">归档人</span>
                <span class="operator-value">{{ getNodeOperator('ARCHIVE') }}</span>
              </div>
            </div>
          </div>

          <!-- 处理时间线 -->
          <div class="card">
            <div class="section-title">
              <span>⏱️</span> 关键时间
            </div>
            <div class="time-list">
              <div class="time-item">
                <span class="time-label">申请时间</span>
                <span class="time-value">{{ formatDate(record.applyTime) }}</span>
              </div>
              <div v-if="record.acceptTime" class="time-item">
                <span class="time-label">受理时间</span>
                <span class="time-value">{{ formatDate(record.acceptTime) }}</span>
              </div>
              <div v-if="record.processTime" class="time-item">
                <span class="time-label">处理时间</span>
                <span class="time-value">{{ formatDate(record.processTime) }}</span>
              </div>
              <div v-if="record.reviewTime" class="time-item">
                <span class="time-label">复核时间</span>
                <span class="time-value">{{ formatDate(record.reviewTime) }}</span>
              </div>
              <div v-if="record.archiveTime" class="time-item">
                <span class="time-label">归档时间</span>
                <span class="time-value">{{ formatDate(record.archiveTime) }}</span>
              </div>
            </div>
          </div>

          <!-- 流程节点 -->
          <div class="card">
            <div class="section-title">
              <span>🔄</span> 历史节点
            </div>
            <div class="timeline">
              <div v-for="node in record.reviewNodes" :key="node.id" class="timeline-item">
                <div
                  class="timeline-dot"
                  :class="{
                    success: node.nodeStatus === 'COMPLETED',
                    warning: node.nodeStatus === 'PENDING',
                    error: node.nodeStatus === 'REJECTED'
                  }"
                ></div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ node.nodeName }}</div>
                  <div class="timeline-meta">
                    {{ node.operatorName || '待执行' }} · {{ formatDate(node.completedAt || node.createdAt) }}
                  </div>
                  <div v-if="node.content" class="timeline-desc">{{ node.content }}</div>
                  <div v-if="node.basis" class="timeline-basis">
                    <span class="text-secondary">依据：</span>{{ node.basis }}
                  </div>
                  <div v-if="node.nodeStatus === 'PENDING'" class="timeline-status pending">
                    进行中
                  </div>
                  <div v-else-if="node.nodeStatus === 'REJECTED'" class="timeline-status rejected">
                    已退回
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '~/utils/format'
import { useConstants } from '~/composables/useConstants'

const route = useRoute()
const router = useRouter()

const { statusLabels, statusColors, abnormalTypeLabels, abnormalTypeColors, diffTypeLabels } = useConstants()

const record = ref<any>(null)
const loading = ref(true)

const roleLabels: Record<string, string> = {
  APPLICANT: '申请人',
  PROCESSOR: '处理人',
  REVIEWER: '复核人',
  ARCHIVIST: '归档人'
}

const userState = useState('currentUser', () => ({
  id: 1,
  name: '张医生',
  role: 'APPLICANT',
  department: '骨科'
}))

const isArchived = computed(() => record.value?.status === 'ARCHIVED')

const canHandle = computed(() => {
  if (!record.value) return false
  const role = userState.value.role
  const status = record.value.status

  if (status === 'ARCHIVED') return false
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
})

const getNodeOperator = (nodeType: string) => {
  if (!record.value?.reviewNodes) return '-'
  const node = record.value.reviewNodes.find((n: any) => n.nodeType === nodeType && n.nodeStatus === 'COMPLETED')
  return node?.operatorName || '-'
}

const loadRecord = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const data = await $fetch(`/api/records/${id}`)
    record.value = data
  } catch (e) {
    console.error('加载记录详情失败', e)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToReview = () => {
  navigateTo(`/review?id=${route.params.id}`)
}

onMounted(() => {
  loadRecord()
})
</script>

<style scoped>
.detail-page {
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #262626;
  display: flex;
  align-items: center;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.missing-field {
  color: #ff4d4f;
  font-style: italic;
}

.handler-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.handler-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.handler-detail {
  flex: 1;
}

.handler-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.operators-list, .time-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operator-item, .time-item {
  display: flex;
  justify-content: space-between;
}

.operator-label, .time-label {
  color: #8c8c8c;
  font-size: 13px;
}

.operator-value, .time-value {
  font-weight: 500;
  color: #262626;
  font-size: 13px;
}

.diff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
}

.diff-type-KEY_TIME {
  background: #e6f7ff;
  color: #1890ff;
}

.diff-type-RESPONSIBLE {
  background: #fff7e6;
  color: #fa8c16;
}

.diff-type-AMOUNT_QUANTITY {
  background: #f9f0ff;
  color: #722ed1;
}

.diff-type-EVIDENCE_CONCLUSION {
  background: #fff2f0;
  color: #ff4d4f;
}

.diff-type-OTHER {
  background: #f5f5f5;
  color: #595959;
}

.diff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.diff-field {
  font-weight: 500;
}

.diff-values {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diff-old {
  color: #ff4d4f;
  text-decoration: line-through;
}

.diff-arrow {
  color: #bfbfbf;
}

.diff-new {
  color: #52c41a;
  font-weight: 600;
}

.diff-meta {
  color: #bfbfbf;
  font-size: 12px;
  margin-top: 4px;
}

.basis-section, .conclusion-section {
  margin-bottom: 12px;
}

.basis-label, .conclusion-label {
  font-weight: 500;
  color: #595959;
  margin-bottom: 6px;
}

.basis-content, .conclusion-content {
  background: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
  color: #262626;
  line-height: 1.6;
}

.conclusion-content {
  border-left: 3px solid #52c41a;
}

.timeline-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.timeline-status.pending {
  background: #fffbe6;
  color: #faad14;
}

.timeline-status.rejected {
  background: #fff2f0;
  color: #ff4d4f;
}

.timeline-basis {
  margin-top: 8px;
  font-size: 12px;
}

.attachment-icon {
  font-size: 16px;
}

.attachment-name {
  flex: 1;
}
</style>
