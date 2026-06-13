<template>
  <div class="review-page">
    <div class="page-header">
      <div>
        <button class="btn btn-default" @click="goBack">← 返回</button>
      </div>
      <h1 class="page-title">处理台</h1>
      <p class="page-desc">处理高值耗材追溯记录，完成受理、处理、复核和归档操作</p>
    </div>

    <div v-if="loading" class="card loading">加载中...</div>

    <div v-else-if="record" class="review-content">
      <div class="review-grid">
        <!-- 左侧：记录信息 -->
        <div class="review-main">
          <!-- 记录摘要 -->
          <div class="card record-summary">
            <div class="summary-header">
              <div>
                <span class="record-no">{{ record.recordNo }}</span>
                <span :class="['tag', `tag-${statusColors[record.status]}`]" style="margin-left: 12px;">
                  {{ statusLabels[record.status] }}
                </span>
              </div>
              <div class="summary-patient">
                <span class="patient-name">{{ record.patientName }}</span>
                <span class="text-secondary text-sm">{{ record.deptName }}</span>
              </div>
            </div>
            <div class="summary-info">
              <div class="info-row">
                <span class="info-label">耗材：</span>
                <span class="info-value">{{ record.consumableName }} - {{ record.specification }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">数量/金额：</span>
                <span class="info-value">{{ record.quantity }} {{ record.unit }} / ¥{{ record.totalAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 异常阻断展示 -->
          <div v-if="record.isAbnormal && record.blockingReason" class="card">
            <div class="section-title" style="color: #ff4d4f;">
              <span>🚫</span> 阻断原因
            </div>
            <div class="blocking-content">
              {{ record.blockingReason }}
            </div>
          </div>

          <!-- 差异字段展示 -->
          <div v-if="record.fieldDiffs && record.fieldDiffs.length > 0" class="card">
            <div class="section-title">
              <span>📊</span> 差异字段
              <span class="tag tag-warning" style="margin-left: 8px;">{{ record.fieldDiffs.length }} 处</span>
            </div>
            <div class="diff-table">
              <table>
                <thead>
                  <tr>
                    <th>字段名称</th>
                    <th>变更类型</th>
                    <th>原值</th>
                    <th>新值</th>
                    <th>变更人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="diff in record.fieldDiffs" :key="diff.id">
                    <td>{{ diff.fieldLabel }}</td>
                    <td>
                      <span :class="['tag', `diff-tag-${diff.diffType}`]">
                        {{ diffTypeLabels[diff.diffType] }}
                      </span>
                    </td>
                    <td class="diff-old">{{ diff.oldValue || '（空）' }}</td>
                    <td class="diff-new">{{ diff.newValue || '（空）' }}</td>
                    <td>{{ diff.changedBy || '系统' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 补救路径 -->
          <div v-if="record.remedialPath" class="card">
            <div class="section-title" style="color: #52c41a;">
              <span>💡</span> 补救路径
            </div>
            <div class="remedial-steps" style="white-space: pre-line; line-height: 2;">
              {{ record.remedialPath }}
            </div>
          </div>

          <!-- 当前节点操作区 -->
          <div class="card action-section">
            <div class="section-title">
              <span>⚙️</span> {{ currentNodeTitle }}
            </div>

            <!-- 受理操作 -->
            <div v-if="currentAction === 'accept'" class="action-form">
              <div class="form-item">
                <label class="form-label">处理内容</label>
                <textarea v-model="formData.content" class="form-textarea" placeholder="请输入受理意见..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">受理依据</label>
                <input v-model="formData.basis" class="form-input" placeholder="请输入受理依据" />
              </div>
              <div class="form-actions">
                <button class="btn btn-default" @click="goBack">取消</button>
                <button class="btn btn-primary" @click="handleAccept" :disabled="submitting">
                  {{ submitting ? '提交中...' : '确认受理' }}
                </button>
              </div>
            </div>

            <!-- 处理操作 -->
            <div v-else-if="currentAction === 'process'" class="action-form">
              <div class="form-item">
                <label class="form-label">处理内容</label>
                <textarea v-model="formData.content" class="form-textarea" placeholder="请输入处理意见..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">处理依据</label>
                <input v-model="formData.basis" class="form-input" placeholder="请输入处理依据" />
              </div>
              <div class="form-item">
                <label class="form-label">
                  <input type="checkbox" v-model="formData.isAbnormal" /> 标记为异常
                </label>
              </div>
              <div v-if="formData.isAbnormal" class="abnormal-form">
                <div class="form-item">
                  <label class="form-label">异常类型</label>
                  <select v-model="formData.abnormalType" class="form-select">
                    <option value="MISSING_RECORD">记录漏填</option>
                    <option value="ATTACHMENT_VERSION_MISMATCH">附件版本不一致</option>
                    <option value="REPROCESS">重新处理</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>
                <div class="form-item">
                  <label class="form-label">阻断原因</label>
                  <textarea v-model="formData.blockingReason" class="form-textarea" placeholder="请描述阻断原因..."></textarea>
                </div>
                <div class="form-item">
                  <label class="form-label">补救路径</label>
                  <textarea v-model="formData.remedialPath" class="form-textarea" placeholder="请描述补救路径..."></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-default" @click="goBack">取消</button>
                <button class="btn btn-primary" @click="handleProcess" :disabled="submitting">
                  {{ submitting ? '提交中...' : '提交复核' }}
                </button>
              </div>
            </div>

            <!-- 复核操作 -->
            <div v-else-if="currentAction === 'review'" class="action-form">
              <div class="form-item">
                <label class="form-label">复核结论</label>
                <textarea v-model="formData.conclusion" class="form-textarea" placeholder="请输入复核结论..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">复核依据</label>
                <input v-model="formData.basis" class="form-input" placeholder="请输入复核依据" />
              </div>
              <div class="form-item">
                <label class="form-label">复核结果</label>
                <div class="review-result-options">
                  <label class="result-option">
                    <input type="radio" v-model="reviewResult" value="pass" />
                    <span class="result-pass">✓ 通过</span>
                  </label>
                  <label class="result-option">
                    <input type="radio" v-model="reviewResult" value="reject" />
                    <span class="result-reject">✗ 退回</span>
                  </label>
                </div>
              </div>
              <div v-if="reviewResult === 'reject'" class="reject-form">
                <div class="form-item">
                  <label class="form-label">退回原因（阻断原因）</label>
                  <textarea v-model="formData.blockingReason" class="form-textarea" placeholder="请描述退回原因..."></textarea>
                </div>
                <div class="form-item">
                  <label class="form-label">补证要求（补救路径）</label>
                  <textarea v-model="formData.remedialPath" class="form-textarea" placeholder="请描述补证要求..."></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-default" @click="goBack">取消</button>
                <button
                  :class="['btn', reviewResult === 'pass' ? 'btn-success' : 'btn-danger']"
                  @click="handleReview"
                  :disabled="submitting"
                >
                  {{ submitting ? '提交中...' : (reviewResult === 'pass' ? '确认通过' : '确认退回') }}
                </button>
              </div>
            </div>

            <!-- 归档操作 -->
            <div v-else-if="currentAction === 'archive'" class="action-form">
              <div class="form-item">
                <label class="form-label">归档结论确认</label>
                <textarea v-model="formData.content" class="form-textarea" placeholder="请确认归档结论..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">归档依据</label>
                <input v-model="formData.basis" class="form-input" placeholder="请输入归档依据" />
              </div>
              <div class="archive-notice">
                <p>⚠️ 归档后记录将变为只读状态，不能再进行修改。如需退回，请点击下方"退回补证"按钮。</p>
              </div>
              <div class="form-actions">
                <button class="btn btn-default" @click="goBack">取消</button>
                <button class="btn btn-warning" @click="handleReturnForSupplement" :disabled="submitting" style="margin-right: 8px;">
                  {{ submitting ? '退回中...' : '退回补证' }}
                </button>
                <button class="btn btn-primary" @click="handleArchive" :disabled="submitting">
                  {{ submitting ? '归档中...' : '确认归档' }}
                </button>
              </div>
            </div>

            <!-- 重新处理操作（复核退回后） -->
            <div v-else-if="currentAction === 'reprocess'" class="action-form">
              <div class="form-item">
                <label class="form-label">重新处理说明</label>
                <textarea v-model="formData.content" class="form-textarea" placeholder="请描述重新处理的原因和更正内容..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">重新处理依据</label>
                <input v-model="formData.basis" class="form-input" placeholder="请输入重新处理依据" />
              </div>
              <div class="form-item">
                <label class="form-label">异常类型</label>
                <select v-model="formData.abnormalType" class="form-select">
                  <option value="REPROCESS">重新处理</option>
                  <option value="MISSING_RECORD">记录漏填</option>
                  <option value="ATTACHMENT_VERSION_MISMATCH">附件版本不一致</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">阻断原因说明</label>
                <textarea v-model="formData.blockingReason" class="form-textarea" placeholder="请描述问题原因..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">补救路径</label>
                <textarea v-model="formData.remedialPath" class="form-textarea" placeholder="请描述补救措施..."></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-default" @click="goBack">取消</button>
                <button class="btn btn-primary" @click="handleReprocess" :disabled="submitting">
                  {{ submitting ? '提交中...' : '确认重新处理' }}
                </button>
              </div>
            </div>

            <!-- 补充材料（申请人） -->
            <div v-else-if="currentAction === 'supplement'" class="action-form">
              <div class="form-item">
                <label class="form-label">业务记录补充</label>
                <textarea v-model="formData.businessRecord" class="form-textarea" placeholder="请补充业务记录信息..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">现场说明</label>
                <textarea v-model="formData.siteNote" class="form-textarea" placeholder="请描述现场情况说明..."></textarea>
              </div>
              <div class="form-item">
                <label class="form-label">证据附件</label>
                <div class="attachment-uploader">
                  <div class="upload-tip">
                    点击或拖拽上传附件（模拟）
                  </div>
                  <button class="btn btn-default" @click="addMockAttachment">添加模拟附件</button>
                </div>
                <div v-if="mockAttachments.length > 0" class="attachment-list mt-8">
                  <div v-for="(att, index) in mockAttachments" :key="index" class="attachment-item">
                    <span class="attachment-icon">📄</span>
                    <span class="attachment-name">{{ att.fileName }}</span>
                    <span class="attachment-version">v{{ att.version }}</span>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-default" @click="goBack">取消</button>
                <button class="btn btn-primary" @click="handleSupplement" :disabled="submitting">
                  {{ submitting ? '提交中...' : '提交补充材料' }}
                </button>
              </div>
            </div>

            <!-- 无操作权限 -->
            <div v-else class="no-action">
              <div class="no-action-icon">🔒</div>
              <div class="no-action-text">当前状态无需处理，或您没有处理权限</div>
              <button class="btn btn-primary mt-16" @click="goToDetail">查看详情</button>
            </div>
          </div>

          <!-- 历史节点 -->
          <div class="card">
            <div class="section-title">
              <span>📜</span> 历史节点
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
                  <div class="timeline-title">
                    {{ node.nodeName }}
                    <span
                      v-if="node.nodeStatus === 'PENDING'"
                      class="tag tag-warning"
                      style="margin-left: 8px;"
                    >
                      进行中
                    </span>
                    <span
                      v-else-if="node.nodeStatus === 'REJECTED'"
                      class="tag tag-error"
                      style="margin-left: 8px;"
                    >
                      已退回
                    </span>
                  </div>
                  <div class="timeline-meta">
                    {{ node.operatorName || '待执行' }} · {{ formatDate(node.completedAt || node.createdAt) }}
                  </div>
                  <div v-if="node.content" class="timeline-desc">{{ node.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：信息摘要 -->
        <div class="review-side">
          <div class="card">
            <div class="section-title">
              <span>📋</span> 关键信息
            </div>
            <div class="key-info-list">
              <div class="key-info-item">
                <span class="key-info-label">记录编号</span>
                <span class="key-info-value text-bold">{{ record.recordNo }}</span>
              </div>
              <div class="key-info-item">
                <span class="key-info-label">患者姓名</span>
                <span class="key-info-value">{{ record.patientName }}</span>
              </div>
              <div class="key-info-item">
                <span class="key-info-label">耗材名称</span>
                <span class="key-info-value">{{ record.consumableName }}</span>
              </div>
              <div class="key-info-item">
                <span class="key-info-label">总金额</span>
                <span class="key-info-value" style="color: #ff4d4f; font-weight: 600;">
                  ¥{{ record.totalAmount.toFixed(2) }}
                </span>
              </div>
              <div class="key-info-item">
                <span class="key-info-label">申请科室</span>
                <span class="key-info-value">{{ record.applyDept }}</span>
              </div>
              <div class="key-info-item">
                <span class="key-info-label">申请人</span>
                <span class="key-info-value">{{ record.applicantName }}</span>
              </div>
            </div>
          </div>

          <div v-if="record.attachments && record.attachments.length > 0" class="card">
            <div class="section-title">
              <span>📎</span> 附件列表
            </div>
            <div class="attachment-list">
              <div v-for="att in record.attachments" :key="att.id" class="attachment-item">
                <span class="attachment-icon">📄</span>
                <div class="attachment-info">
                  <div class="attachment-name">{{ att.fileName }}</div>
                  <div class="text-secondary text-sm">
                    v{{ att.version }} · {{ att.uploadedBy }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '~/utils/format'
import { useConstants } from '~/composables/useConstants'

const route = useRoute()
const router = useRouter()

const { statusLabels, statusColors, diffTypeLabels } = useConstants()

const record = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const reviewResult = ref<'pass' | 'reject'>('pass')
const mockAttachments = ref<any[]>([])

const formData = ref({
  content: '',
  basis: '',
  conclusion: '',
  isAbnormal: false,
  abnormalType: 'MISSING_RECORD',
  blockingReason: '',
  remedialPath: '',
  businessRecord: '',
  siteNote: ''
})

const initFormDefaults = () => {
  if (!record.value) return
  const status = record.value.status
  if (status === 'PENDING_ACCEPTANCE') {
    formData.value.content = '已受理高值耗材核销申请，信息初步核对无误。'
    formData.value.basis = '《高值医用耗材管理规范》'
  } else if (status === 'REVIEW_PASSED') {
    formData.value.content = '已完成归档，所有材料齐全。'
    formData.value.basis = '《医院病案管理规定》'
  }
}

const userState = useState('currentUser', () => ({
  id: 1,
  name: '张医生',
  role: 'APPLICANT',
  department: '骨科'
}))

const currentAction = computed(() => {
  if (!record.value) return ''
  const role = userState.value.role
  const status = record.value.status
  const isArchived = status === 'ARCHIVED'

  if (isArchived) return ''

  if (role === 'PROCESSOR' && status === 'PENDING_ACCEPTANCE') return 'accept'
  if (role === 'PROCESSOR' && ['ACCEPTED', 'REPROCESSING'].includes(status)) return 'process'
  if (role === 'PROCESSOR' && status === 'REVIEW_REJECTED') return 'reprocess'
  if (role === 'REVIEWER' && status === 'PENDING_REVIEW') return 'review'
  if (role === 'ARCHIVIST' && status === 'REVIEW_PASSED') return 'archive'
  if (role === 'APPLICANT' && !['PENDING_ACCEPTANCE', 'ARCHIVED'].includes(status)) return 'supplement'
  return ''
})

const currentNodeTitle = computed(() => {
  const titles: Record<string, string> = {
    accept: '受理操作',
    process: '处理操作',
    review: '复核操作',
    archive: '归档操作',
    supplement: '补充材料',
    reprocess: '重新处理操作'
  }
  return titles[currentAction.value] || '处理操作'
})

const loadRecord = async () => {
  loading.value = true
  try {
    const id = route.query.id
    if (id) {
      const data = await $fetch(`/api/records/${id}`)
      record.value = data
      initFormDefaults()
    }
  } catch (e) {
    console.error('加载记录失败', e)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToDetail = () => {
  navigateTo(`/record/${record.value.id}`)
}

const addMockAttachment = () => {
  const versions = ['v1', 'v2', 'v3']
  const names = ['产品合格证.pdf', '手术记录单.pdf', '质检报告.pdf', '注册证.pdf']
  mockAttachments.value.push({
    fileName: names[Math.floor(Math.random() * names.length)],
    fileType: 'pdf',
    fileUrl: '/mock.pdf',
    version: Math.floor(Math.random() * 3) + 1,
    uploadedBy: userState.value.name,
    isEvidence: true
  })
}

const handleAccept = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/accept`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        handlerId: userState.value.id,
        handlerName: userState.value.name,
        content: formData.value.content,
        basis: formData.value.basis
      }
    })
    alert('受理成功！')
    await loadRecord()
  } catch (e: any) {
    alert('受理失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const handleProcess = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/process`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        content: formData.value.content,
        basis: formData.value.basis,
        isAbnormal: formData.value.isAbnormal,
        abnormalType: formData.value.isAbnormal ? formData.value.abnormalType : null,
        abnormalReason: formData.value.isAbnormal ? abnormalTypeLabels[formData.value.abnormalType] : null,
        blockingReason: formData.value.isAbnormal ? formData.value.blockingReason : null,
        remedialPath: formData.value.isAbnormal ? formData.value.remedialPath : null,
        attachments: mockAttachments.value
      }
    })
    alert('处理完成，已提交复核！')
    await loadRecord()
  } catch (e: any) {
    alert('处理失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const handleReview = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/review`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        passed: reviewResult.value === 'pass',
        content: formData.value.conclusion,
        conclusion: formData.value.conclusion,
        basis: formData.value.basis,
        blockingReason: reviewResult.value === 'reject' ? formData.value.blockingReason : null,
        remedialPath: reviewResult.value === 'reject' ? formData.value.remedialPath : null
      }
    })
    alert(reviewResult.value === 'pass' ? '复核通过！' : '已退回处理！')
    await loadRecord()
  } catch (e: any) {
    alert('复核失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const handleArchive = async () => {
  if (submitting.value) return
  if (!confirm('确认归档吗？归档后记录将变为只读状态。')) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/archive`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        content: formData.value.content,
        basis: formData.value.basis
      }
    })
    alert('归档成功！')
    await loadRecord()
  } catch (e: any) {
    alert('归档失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const handleReturnForSupplement = async () => {
  if (submitting.value) return
  if (!confirm('确认退回补证吗？记录将回到处理中状态。')) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/reprocess`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        handlerId: 2,
        handlerName: '李护士',
        content: '归档复核人退回补证：' + (formData.value.content || '需补充材料'),
        reason: '归档复核退回，需补充材料或更正信息'
      }
    })
    alert('已退回补证！')
    await loadRecord()
  } catch (e: any) {
    alert('退回失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const handleReprocess = async () => {
  if (submitting.value) return
  if (!confirm('确认重新处理吗？将生成新的处理节点。')) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/reprocess`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        handlerId: userState.value.id,
        handlerName: userState.value.name,
        content: formData.value.content,
        reason: formData.value.basis || '复核退回重新处理'
      }
    })
    alert('重新处理已启动！')
    await loadRecord()
  } catch (e: any) {
    alert('重新处理失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const handleSupplement = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    await $fetch(`/api/records/${record.value.id}/supplement`, {
      method: 'POST',
      body: {
        operatorId: userState.value.id,
        operatorName: userState.value.name,
        content: formData.value.businessRecord + '\n' + formData.value.siteNote,
        businessRecord: formData.value.businessRecord,
        siteNote: formData.value.siteNote,
        attachments: mockAttachments.value
      }
    })
    alert('补充材料已提交！')
    await loadRecord()
  } catch (e: any) {
    alert('提交失败：' + (e?.data?.message || e.message))
  } finally {
    submitting.value = false
  }
}

const abnormalTypeLabels: Record<string, string> = {
  NORMAL: '正常核销',
  MISSING_RECORD: '记录漏填',
  ATTACHMENT_VERSION_MISMATCH: '附件版本不一致',
  REPROCESS: '重新处理',
  OTHER: '其他'
}

onMounted(() => {
  loadRecord()
})

watch(() => route.query.id, () => {
  loadRecord()
})
</script>

<style scoped>
.review-page {
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #262626;
  margin: 16px 0 4px 0;
}

.page-desc {
  color: #8c8c8c;
  font-size: 14px;
}

.review-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.review-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-summary {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #bae7ff;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-no {
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}

.summary-patient {
  text-align: right;
}

.patient-name {
  font-size: 16px;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.summary-info {
  display: flex;
  gap: 32px;
}

.info-row {
  font-size: 14px;
}

.info-label {
  color: #8c8c8c;
}

.info-value {
  color: #262626;
  font-weight: 500;
}

.action-section {
  border-left: 4px solid #1890ff;
}

.action-form {
  margin-top: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.abnormal-form {
  background: #fffbe6;
  padding: 16px;
  border-radius: 6px;
  margin-top: 12px;
}

.review-result-options {
  display: flex;
  gap: 24px;
}

.result-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.result-pass {
  color: #52c41a;
  font-weight: 600;
}

.result-reject {
  color: #ff4d4f;
  font-weight: 600;
}

.reject-form {
  background: #fff2f0;
  padding: 16px;
  border-radius: 6px;
  margin-top: 12px;
}

.archive-notice {
  background: #fffbe6;
  padding: 12px 16px;
  border-radius: 6px;
  color: #fa8c16;
  font-size: 13px;
  margin-top: 16px;
}

.attachment-uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  background: #fafafa;
}

.upload-tip {
  color: #8c8c8c;
  margin-bottom: 12px;
}

.no-action {
  text-align: center;
  padding: 40px 20px;
}

.no-action-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-action-text {
  color: #8c8c8c;
  margin-bottom: 16px;
}

.key-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.key-info-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.key-info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.key-info-label {
  color: #8c8c8c;
  font-size: 13px;
}

.key-info-value {
  color: #262626;
  font-size: 13px;
}

.diff-table {
  overflow-x: auto;
}

.diff-old {
  color: #ff4d4f;
  text-decoration: line-through;
}

.diff-new {
  color: #52c41a;
  font-weight: 500;
}

.diff-tag-KEY_TIME {
  background: #e6f7ff;
  color: #1890ff;
}

.diff-tag-RESPONSIBLE {
  background: #fff7e6;
  color: #fa8c16;
}

.diff-tag-AMOUNT_QUANTITY {
  background: #f9f0ff;
  color: #722ed1;
}

.diff-tag-EVIDENCE_CONCLUSION {
  background: #fff2f0;
  color: #ff4d4f;
}

.diff-tag-OTHER {
  background: #f5f5f5;
  color: #595959;
}

.attachment-info {
  flex: 1;
}

.blocking-content {
  background: #fff2f0;
  padding: 12px 16px;
  border-radius: 6px;
  color: #ff4d4f;
  line-height: 1.6;
}

.remedial-steps {
  background: #f6ffed;
  padding: 12px 16px;
  border-radius: 6px;
  color: #389e0d;
}
</style>
