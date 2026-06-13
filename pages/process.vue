<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">处理台</h2>
      <div class="flex items-center gap-2">
        <label class="label mb-0">选择记录：</label>
        <select v-model="selectedId" @change="onRecordChange" class="input w-80">
          <option value="">请选择记录</option>
          <option v-for="r in store.list" :key="r.id" :value="r.id">
            {{ r.recordNo }} - {{ r.title }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="!currentUser" class="card p-12 text-center">
      <div class="text-amber-600 mb-2">⚠️ 请先在右上角选择当前用户</div>
      <div class="text-gray-500 text-sm">系统需要知道您的身份才能执行操作</div>
    </div>

    <div v-else-if="!detail" class="card p-12 text-center text-gray-500">
      请选择要处理的记录
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ detail.title }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <StatusBadge :status="detail.status" />
                <SampleTypeBadge :type="detail.sampleType" />
                <span class="text-sm text-gray-500">{{ detail.recordNo }}</span>
              </div>
            </div>
            <div v-if="detail.isArchived" class="badge bg-gray-100 text-gray-600">
              已归档 - 只读
            </div>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <div class="text-sm text-gray-600">{{ detail.description }}</div>
            <div class="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <span class="text-gray-500">发生时间：</span>
                <span>{{ formatTime(detail.occurrenceTime) }}</span>
              </div>
              <div>
                <span class="text-gray-500">关键对象：</span>
                <span>{{ detail.keyObject }}</span>
              </div>
              <div>
                <span class="text-gray-500">损失金额：</span>
                <span class="font-semibold">¥{{ Number(detail.amount).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div v-if="showApplicantForm" class="space-y-4 border-t pt-4">
            <h4 class="font-semibold text-gray-900">申请人补充资料</h4>

            <div v-if="detail.status === 'REJECTED'" class="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div class="text-sm font-medium text-amber-800 mb-2">⚠️ 退回补证要求</div>
              <div class="text-sm text-amber-700 whitespace-pre-line">
                {{ lastRejectNode?.remedyPath }}
              </div>
            </div>

            <div>
              <label class="label">业务记录 <span class="text-red-500">*</span></label>
              <textarea
                v-model="form.businessRecord"
                class="input h-24"
                placeholder="请填写业务处理记录..."
                :disabled="detail.isArchived"
              />
            </div>

            <div>
              <label class="label">现场说明 <span class="text-red-500">*</span></label>
              <textarea
                v-model="form.siteDescription"
                class="input h-24"
                placeholder="请填写现场情况说明..."
                :disabled="detail.isArchived"
              />
            </div>

            <div>
              <label class="label">证据附件</label>
              <div class="space-y-3">
                <div
                  v-for="(att, idx) in pendingAttachments"
                  :key="idx"
                  class="bg-gray-50 p-3 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <div class="text-xs text-gray-500 mb-1">文件名称</div>
                        <input
                          v-model="att.name"
                          type="text"
                          class="input text-sm"
                          placeholder="文件名称"
                        />
                      </div>
                      <div>
                        <div class="text-xs text-gray-500 mb-1">版本号</div>
                        <input
                          v-model="att.version"
                          type="text"
                          class="input text-sm"
                          placeholder="如 V1"
                        />
                      </div>
                      <div>
                        <div class="text-xs text-gray-500 mb-1">文件类型</div>
                        <select v-model="att.fileType" class="input text-sm">
                          <option value="application/pdf">PDF</option>
                          <option value="image/jpeg">图片(JPG)</option>
                          <option value="image/png">图片(PNG)</option>
                          <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
                          <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500 mb-1">文件路径</div>
                        <input
                          v-model="att.url"
                          type="text"
                          class="input text-sm"
                          placeholder="/attachments/xxx.pdf"
                        />
                      </div>
                    </div>
                    <button
                      @click="pendingAttachments.splice(idx, 1)"
                      type="button"
                      class="text-red-500 hover:text-red-700 text-sm shrink-0 self-start mt-6"
                    >
                      ✕
                    </button>
                  </div>
                  <div v-if="att.size" class="mt-2 text-xs text-gray-500">
                    文件大小：{{ formatFileSize(att.size) }}
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <label class="btn btn-secondary cursor-pointer shrink-0">
                    📁 选择本地文件
                    <input
                      type="file"
                      class="hidden"
                      @change="onFileSelect"
                      multiple
                      :disabled="detail.isArchived"
                    />
                  </label>
                  <button
                    @click="addPendingAttachment"
                    type="button"
                    class="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition"
                  >
                    + 手动添加附件条目
                  </button>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                v-if="detail.status === 'PENDING'"
                @click="handleAccept"
                class="btn btn-primary"
                :disabled="submitting || detail.isArchived"
              >
                {{ submitting ? '提交中...' : '受理登记' }}
              </button>
              <button
                v-if="detail.status === 'PROCESSING' || detail.status === 'REOPENED'"
                @click="handleProcess"
                class="btn btn-primary"
                :disabled="submitting || detail.isArchived"
              >
                {{ submitting ? '提交中...' : '处理完成' }}
              </button>
              <button
                v-if="detail.status === 'REJECTED'"
                @click="handleSupplement"
                class="btn btn-primary"
                :disabled="submitting || detail.isArchived"
              >
                {{ submitting ? '提交中...' : '补充资料' }}
              </button>
            </div>
          </div>

          <div v-if="showReviewerForm" class="space-y-4 border-t pt-4">
            <h4 class="font-semibold text-gray-900">复核人操作</h4>

            <div v-if="detail.sampleType === 'MISSING_FIELDS' || detail.sampleType === 'ATTACHMENT_MISMATCH'" class="space-y-3">
              <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div class="text-sm font-medium text-red-800 mb-2">❌ 阻断原因</div>
                <div class="text-sm text-red-700 whitespace-pre-line">
                  {{ lastRejectNode?.blockReason || '请检查资料完整性' }}
                </div>
              </div>
              <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div class="text-sm font-medium text-amber-800 mb-2">📋 差异字段</div>
                <FieldDiffView :diffs="detail.fieldDiffs" />
              </div>
              <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div class="text-sm font-medium text-green-800 mb-2">🛠️ 补救路径</div>
                <div class="text-sm text-green-700 whitespace-pre-line">
                  {{ lastRejectNode?.remedyPath || '请按要求补充资料' }}
                </div>
              </div>
            </div>

            <div>
              <label class="label">复核意见 <span class="text-red-500">*</span></label>
              <textarea
                v-model="reviewForm.remark"
                class="input h-24"
                placeholder="请填写复核意见..."
                :disabled="detail.isArchived"
              />
            </div>

            <div>
              <label class="label">复核结论 <span class="text-red-500">*</span></label>
              <textarea
                v-model="reviewForm.evidenceConclusion"
                class="input h-20"
                placeholder="请填写复核结论..."
                :disabled="detail.isArchived"
              />
            </div>

            <div>
              <label class="label">复核附件（可选）</label>
              <div class="space-y-3">
                <div
                  v-for="(att, idx) in reviewAttachments"
                  :key="idx"
                  class="bg-gray-50 p-3 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex-1 grid grid-cols-4 gap-3">
                      <div>
                        <div class="text-xs text-gray-500 mb-1">文件名称</div>
                        <input v-model="att.name" type="text" class="input text-sm" placeholder="文件名称" />
                      </div>
                      <div>
                        <div class="text-xs text-gray-500 mb-1">版本号</div>
                        <input v-model="att.version" type="text" class="input text-sm" placeholder="版本号" />
                      </div>
                      <div>
                        <div class="text-xs text-gray-500 mb-1">文件类型</div>
                        <select v-model="att.fileType" class="input text-sm">
                          <option value="application/pdf">PDF</option>
                          <option value="image/jpeg">图片(JPG)</option>
                          <option value="image/png">图片(PNG)</option>
                          <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
                          <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <div class="text-xs text-gray-500 mb-1">文件路径</div>
                        <input v-model="att.url" type="text" class="input text-sm" placeholder="/attachments/xxx.pdf" />
                      </div>
                    </div>
                    <button
                      @click="reviewAttachments.splice(idx, 1)"
                      type="button"
                      class="text-red-500 hover:text-red-700 text-sm shrink-0 self-start mt-6"
                    >
                      ✕
                    </button>
                  </div>
                  <div v-if="att.size" class="mt-2 text-xs text-gray-500">
                    文件大小：{{ formatFileSize(att.size) }}
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <label class="btn btn-secondary cursor-pointer shrink-0">
                    📁 选择本地文件
                    <input
                      type="file"
                      class="hidden"
                      @change="onReviewFileSelect"
                      multiple
                      :disabled="detail.isArchived"
                    />
                  </label>
                  <button
                    @click="addReviewAttachment"
                    type="button"
                    class="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition"
                  >
                    + 手动添加复核附件条目
                  </button>
                </div>
              </div>
            </div>

            <div v-if="detail.status === 'REVIEW' && !detail.isArchived" class="flex gap-3">
              <button
                @click="handleReview"
                class="btn btn-success"
                :disabled="submitting"
              >
                {{ submitting ? '提交中...' : '复核通过' }}
              </button>
              <button
                @click="showRejectModal = true"
                class="btn btn-danger"
                :disabled="submitting"
              >
                退回补证
              </button>
              <button
                @click="showReopenModal = true"
                class="btn btn-secondary"
                :disabled="submitting"
              >
                重新处理
              </button>
            </div>

            <div v-if="detail.status === 'ARCHIVED' && !detail.isArchived" class="flex gap-3">
              <button
                @click="handleArchive"
                class="btn btn-success"
                :disabled="submitting"
              >
                {{ submitting ? '提交中...' : '确认归档' }}
              </button>
              <button
                @click="showReopenModal = true"
                class="btn btn-danger"
                :disabled="submitting"
              >
                重新处理
              </button>
            </div>

            <div v-if="detail.isArchived" class="flex gap-3">
              <button
                @click="showReopenModal = true"
                class="btn btn-danger"
                :disabled="submitting"
              >
                {{ submitting ? '提交中...' : '重新处理（生成新节点）' }}
              </button>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">处理时间线</h3>
          <TimelineView :nodes="detail.nodes" />
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">当前权限</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <span :class="isApplicant ? 'text-green-600' : 'text-gray-400'">
                {{ isApplicant ? '✓' : '○' }}
              </span>
              <span>申请人：补充业务记录、现场说明、证据附件</span>
            </div>
            <div class="flex items-center gap-2">
              <span :class="isReviewer ? 'text-green-600' : 'text-gray-400'">
                {{ isReviewer ? '✓' : '○' }}
              </span>
              <span>复核人：确认结论、退回补证、只读归档</span>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">可操作说明</h3>
          <div class="text-sm text-gray-600 space-y-2">
            <p v-if="!canEdit">❌ 当前状态不可编辑</p>
            <p v-else-if="detail.isArchived">📁 已归档记录仅可重新处理</p>
            <p v-else-if="isApplicant && (detail.status === 'PENDING' || detail.status === 'PROCESSING' || detail.status === 'REJECTED' || detail.status === 'REOPENED')">
              ✏️ 您可以补充业务记录、现场说明和证据附件
            </p>
            <p v-else-if="isReviewer && (detail.status === 'REVIEW' || detail.status === 'ARCHIVED' || detail.isArchived)">
              ✏️ 您可以执行复核、退回、归档或重新处理操作
            </p>
            <p v-else>⏳ 等待其他角色处理</p>
          </div>
        </div>

        <div v-if="isReviewer" class="card p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900">关键字段变更预览</h3>
          <div class="text-xs text-gray-500 mb-3">修改后将同步更新列表摘要、详情结论和复盘统计</div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">发生时间</span>
              <span :class="{ 'text-amber-600 font-medium': form.occurrenceTime !== detail.occurrenceTime.slice(0, 16) }">
                {{ form.occurrenceTime || formatTime(detail.occurrenceTime) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">责任对象</span>
              <span :class="{ 'text-amber-600 font-medium': form.keyObject && form.keyObject !== detail.keyObject }">
                {{ form.keyObject || detail.keyObject }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">金额数量</span>
              <span :class="{ 'text-amber-600 font-medium': form.amount && String(form.amount) !== detail.amount }">
                ¥{{ (form.amount || Number(detail.amount)).toLocaleString() }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">证据结论</span>
              <span :class="['max-w-32 truncate', { 'text-amber-600 font-medium': form.evidenceConclusion || reviewForm.evidenceConclusion }]">
                {{ reviewForm.evidenceConclusion || form.evidenceConclusion || detail.evidenceConclusion }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-semibold mb-4">退回补证</h3>
        <div class="space-y-4">
          <div>
            <label class="label">退回说明 <span class="text-red-500">*</span></label>
            <textarea v-model="rejectForm.remark" class="input h-20" placeholder="请填写退回说明..." />
          </div>
          <div>
            <label class="label">阻断原因 <span class="text-red-500">*</span></label>
            <textarea v-model="rejectForm.blockReason" class="input h-28" placeholder="请详细说明阻断原因..." />
          </div>
          <div>
            <label class="label">补救路径 <span class="text-red-500">*</span></label>
            <textarea v-model="rejectForm.remedyPath" class="input h-28" placeholder="请说明需要补充的资料和整改要求..." />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="handleReject" class="btn btn-danger" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认退回' }}
          </button>
          <button @click="showRejectModal = false" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <div v-if="showReopenModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-semibold mb-4">重新处理（生成新节点）</h3>
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4 text-sm">
          <p class="text-amber-800">⚠️ 此操作将生成新的处理节点，原归档状态保持不变。</p>
          <p class="text-amber-700 mt-1">新节点将记录重新处理的原因和补救路径。</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">重新处理说明 <span class="text-red-500">*</span></label>
            <textarea v-model="reopenForm.remark" class="input h-20" placeholder="请填写重新处理说明..." />
          </div>
          <div>
            <label class="label">重新处理原因 <span class="text-red-500">*</span></label>
            <textarea v-model="reopenForm.blockReason" class="input h-28" placeholder="请详细说明重新处理的原因..." />
          </div>
          <div>
            <label class="label">补救路径 <span class="text-red-500">*</span></label>
            <textarea v-model="reopenForm.remedyPath" class="input h-28" placeholder="请说明补救措施和整改方案..." />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">修正金额（可选）</label>
              <input v-model.number="reopenForm.amount" type="number" class="input" placeholder="重新评估损失金额" />
            </div>
            <div>
              <label class="label">修正结论（可选）</label>
              <input v-model="reopenForm.evidenceConclusion" type="text" class="input" placeholder="新的证据结论" />
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="handleReopen" class="btn btn-danger" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认重新处理' }}
          </button>
          <button @click="showReopenModal = false" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecordsStore } from '~/stores/records'
import { useCurrentUser } from '~/composables/useCurrentUser'
import dayjs from 'dayjs'

const store = useRecordsStore()
const route = useRoute()
const router = useRouter()

const { currentUser, isApplicant, isReviewer } = useCurrentUser()

const selectedId = ref('')
const submitting = ref(false)
const showRejectModal = ref(false)
const showReopenModal = ref(false)

const form = ref({
  businessRecord: '',
  siteDescription: '',
  evidenceConclusion: '',
  occurrenceTime: '',
  keyObject: '',
  amount: null as number | null
})

const reviewForm = ref({
  remark: '',
  evidenceConclusion: ''
})

const rejectForm = ref({
  remark: '',
  blockReason: '',
  remedyPath: ''
})

const reopenForm = ref({
  remark: '',
  blockReason: '',
  remedyPath: '',
  amount: null as number | null,
  evidenceConclusion: ''
})

const pendingAttachments = ref<Array<{
  name: string
  version: string
  fileType: string
  url: string
  size: number
}>>([])

const reviewAttachments = ref<Array<{
  name: string
  version: string
  fileType: string
  url: string
  size: number
}>>([])

const addPendingAttachment = () => {
  pendingAttachments.value.push({
    name: '',
    version: 'V1',
    fileType: 'application/pdf',
    url: '',
    size: 0
  })
}

const addReviewAttachment = () => {
  reviewAttachments.value.push({
    name: '',
    version: 'V1',
    fileType: 'application/pdf',
    url: '',
    size: 0
  })
}

const getValidAttachments = (list: typeof pendingAttachments.value) => {
  return list.filter(att => att.name && att.url).map(att => ({
    name: att.name,
    version: att.version || 'V1',
    fileType: att.fileType || 'application/octet-stream',
    url: att.url,
    size: att.size || Math.floor(Math.random() * 5000000) + 100000
  }))
}

const detail = computed(() => store.detail)

const showApplicantForm = computed(() => {
  if (!detail.value || !currentUser.value) return false
  if (detail.value.isArchived) return false
  if (currentUser.value.role === 'APPLICANT') {
    return ['PENDING', 'PROCESSING', 'REJECTED', 'REOPENED'].includes(detail.value.status)
  }
  return false
})

const showReviewerForm = computed(() => {
  if (!detail.value || !currentUser.value) return false
  return isReviewer.value
})

const canEdit = computed(() => store.canEdit)

const lastRejectNode = computed(() => {
  if (!detail.value) return null
  return [...detail.value.nodes].reverse().find(n => n.nodeType === 'REJECT' || n.nodeType === 'REOPEN')
})

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss')

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) {
    val = val / 1024
    i++
  }
  return `${val.toFixed(1)} ${units[i]}`
}

const guessAttachmentType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain'
  }
  return map[ext] || 'other'
}

const onFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i]
    pendingAttachments.value.push({
      name: file.name,
      version: 'V1',
      fileType: guessAttachmentType(file.name),
      url: `/attachments/${Date.now()}-${file.name}`,
      size: file.size
    })
  }
  target.value = ''
}

const onReviewFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i]
    reviewAttachments.value.push({
      name: file.name,
      version: 'V1',
      fileType: guessAttachmentType(file.name),
      url: `/attachments/${Date.now()}-${file.name}`,
      size: file.size
    })
  }
  target.value = ''
}

const onRecordChange = () => {
  if (selectedId.value) {
    router.replace({ path: '/process', query: { id: selectedId.value } })
    store.fetchDetail(selectedId.value)
    resetForms()
  }
}

const resetForms = () => {
  form.value = {
    businessRecord: '',
    siteDescription: '',
    evidenceConclusion: '',
    occurrenceTime: detail.value?.occurrenceTime.slice(0, 16) || '',
    keyObject: detail.value?.keyObject || '',
    amount: detail.value ? Number(detail.value.amount) : null
  }
  reviewForm.value = {
    remark: '',
    evidenceConclusion: ''
  }
  rejectForm.value = { remark: '', blockReason: '', remedyPath: '' }
  reopenForm.value = { remark: '', blockReason: '', remedyPath: '', amount: null, evidenceConclusion: '' }
  pendingAttachments.value = []
  reviewAttachments.value = []
}

const getUpdatedFields = () => {
  const updated: any = {}
  if (form.value.occurrenceTime && form.value.occurrenceTime !== detail.value?.occurrenceTime.slice(0, 16)) {
    updated.occurrenceTime = new Date(form.value.occurrenceTime).toISOString()
  }
  if (form.value.keyObject && form.value.keyObject !== detail.value?.keyObject) {
    updated.keyObject = form.value.keyObject
  }
  if (form.value.amount !== null && String(form.value.amount) !== detail.value?.amount) {
    updated.amount = form.value.amount
  }
  if (form.value.evidenceConclusion) {
    updated.evidenceConclusion = form.value.evidenceConclusion
  }
  if (reviewForm.value.evidenceConclusion) {
    updated.evidenceConclusion = reviewForm.value.evidenceConclusion
  }
  return Object.keys(updated).length > 0 ? updated : undefined
}

const handleAccept = async () => {
  if (!selectedId.value) return
  submitting.value = true
  try {
    await store.acceptRecord(selectedId.value, form.value.businessRecord || '已受理')
    alert('受理成功！')
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleProcess = async () => {
  if (!selectedId.value) return
  if (!form.value.businessRecord || !form.value.siteDescription) {
    alert('请填写业务记录和现场说明')
    return
  }
  submitting.value = true
  try {
    await store.processRecord(selectedId.value, {
      remark: `业务记录：${form.value.businessRecord}\n现场说明：${form.value.siteDescription}`,
      attachments: getValidAttachments(pendingAttachments.value)
    })
    alert('处理完成，已提交复核！')
    resetForms()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleSupplement = async () => {
  if (!selectedId.value) return
  if (!form.value.businessRecord || !form.value.siteDescription) {
    alert('请填写业务记录和现场说明')
    return
  }
  submitting.value = true
  try {
    await store.supplementRecord(selectedId.value, {
      businessRecord: form.value.businessRecord,
      siteDescription: form.value.siteDescription,
      attachments: getValidAttachments(pendingAttachments.value)
    })
    alert('资料已补充，已提交复核！')
    resetForms()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleReview = async () => {
  if (!selectedId.value) return
  if (!reviewForm.value.remark || !reviewForm.value.evidenceConclusion) {
    alert('请填写复核意见和结论')
    return
  }
  submitting.value = true
  try {
    await store.reviewRecord(selectedId.value, {
      remark: reviewForm.value.remark,
      evidenceConclusion: reviewForm.value.evidenceConclusion,
      attachments: getValidAttachments(reviewAttachments.value)
    })
    alert('复核通过！')
    resetForms()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleArchive = async () => {
  if (!selectedId.value) return
  submitting.value = true
  try {
    await store.archiveRecord(selectedId.value, '复核通过，同意归档')
    alert('归档成功！')
    resetForms()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleReject = async () => {
  if (!selectedId.value) return
  if (!rejectForm.value.blockReason || !rejectForm.value.remedyPath) {
    alert('请填写阻断原因和补救路径')
    return
  }
  submitting.value = true
  try {
    await store.rejectRecord(selectedId.value, rejectForm.value)
    alert('已退回补证！')
    showRejectModal.value = false
    resetForms()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleReopen = async () => {
  if (!selectedId.value) return
  if (!reopenForm.value.blockReason || !reopenForm.value.remedyPath) {
    alert('请填写重新处理原因和补救路径')
    return
  }
  submitting.value = true
  try {
    const updatedFields: any = {}
    if (reopenForm.value.amount !== null) updatedFields.amount = reopenForm.value.amount
    if (reopenForm.value.evidenceConclusion) updatedFields.evidenceConclusion = reopenForm.value.evidenceConclusion
    await store.reopenRecord(selectedId.value, {
      remark: reopenForm.value.remark,
      blockReason: reopenForm.value.blockReason,
      remedyPath: reopenForm.value.remedyPath,
      updatedFields: Object.keys(updatedFields).length > 0 ? updatedFields : undefined
    })
    alert('已重新处理，生成新节点！')
    showReopenModal.value = false
    resetForms()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const initPage = async () => {
  await store.fetchList()
  const queryId = route.query.id as string
  if (queryId) {
    selectedId.value = queryId
    await store.fetchDetail(queryId)
    resetForms()
  }
}

if (process.server) {
  await initPage()
} else {
  onMounted(() => initPage())
}
</script>
