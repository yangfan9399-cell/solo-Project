<template>
  <AppLayout :title="`处理台 - ${record.record_no}`">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Link
            :href="route('records.index')"
            class="text-gray-500 hover:text-gray-700"
          >
            ← 返回列表
          </Link>
          <Link
            :href="route('records.show', record.id)"
            class="text-blue-500 hover:text-blue-700"
          >
            📄 查看详情
          </Link>
          <h1 class="text-2xl font-bold text-gray-800">
            ⚙️ 处理台 - {{ record.record_no }}
          </h1>
          <StatusBadge
            :status="record.status"
            :has-blocking="record.has_blocking"
            :is-archived="record.is_archived"
          />
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500">
            当前身份：
            <span
              :class="[
                'px-2 py-1 rounded text-xs font-medium',
                $page.props.auth.user?.role === 'approval_leader' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              ]"
            >
              {{ $page.props.auth.user?.role_label || '-' }}
            </span>
          </span>
        </div>
      </div>

      <div v-if="record.has_blocking" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
        <h3 class="text-red-800 font-semibold mb-2">⚠️ 流程阻断信息</h3>
        <p class="text-red-700 text-sm mb-2">
          <span class="font-medium">阻断原因：</span>{{ record.blocking_reason }}
        </p>
        <div v-if="record.abnormal_records?.length > 0" class="space-y-2">
          <div
            v-for="abnormal in record.abnormal_records.filter(a => a.resolution_status === 'pending')"
            :key="abnormal.id"
            class="bg-white rounded p-3 text-sm"
          >
            <p class="font-medium text-red-700">{{ abnormalTypeLabels[abnormal.abnormal_type] }}</p>
            <p class="text-gray-600 mt-1">
              <span class="font-medium">差异字段：</span>{{ abnormal.difference_fields?.join(', ') || '-' }}
            </p>
            <p class="text-gray-600">
              <span class="font-medium">补救路径：</span>{{ abnormal.remedy_path }}
            </p>
          </div>
        </div>
        <div v-if="canApprove && record.has_blocking" class="mt-3">
          <button
            @click="showResolveModal = true"
            class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            🛠️ 处理阻断
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">📋 基本信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm text-gray-500 mb-1">户主</label>
            <p class="font-medium">{{ record.household_name }}</p>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">电话</label>
            <p class="font-medium">{{ record.household_phone }}</p>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">表号</label>
            <p class="font-medium font-mono">{{ record.gas_meter_no || '-' }}</p>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">隐患等级</label>
            <DangerBadge :level="record.danger_level" />
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-sm text-gray-500 mb-1">隐患描述</label>
          <p class="bg-gray-50 p-3 rounded">{{ record.hidden_danger }}</p>
        </div>
      </div>

      <div v-if="canApprove" class="bg-white rounded-lg shadow p-6 border-2 border-purple-100">
        <h2 class="text-lg font-semibold text-purple-800 mb-4 border-b pb-2">🔐 审批负责人 - 关键字段编辑</h2>
        <p class="text-sm text-gray-500 mb-4">修改以下字段将自动同步更新列表摘要、详情结论和看板统计。</p>
        <form @submit.prevent="submitKeyFieldsUpdate" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">检查时间</label>
              <input
                type="datetime-local"
                v-model="keyFields.inspection_time"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">当前责任人</label>
              <select
                v-model="keyFields.current_responsible_id"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.role_label || user.role }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">涉及金额（元）</label>
              <input
                type="number"
                step="0.01"
                v-model.number="keyFields.involve_amount"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">涉及数量（项）</label>
              <input
                type="number"
                v-model.number="keyFields.involve_quantity"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">证据结论</label>
            <textarea
              v-model="keyFields.evidence_conclusion"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">处理结论</label>
            <textarea
              v-model="keyFields.conclusion"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">采用依据</label>
            <textarea
              v-model="keyFields.handling_basis"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="!hasKeyFieldsChanged"
              class="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💾 保存修改
            </button>
          </div>
        </form>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            📝 业务补充记录
            <span class="text-sm font-normal text-gray-500 ml-2">({{ record.supplements?.length || 0 }} 条)</span>
          </h2>
          <div v-if="canSupplement" class="mb-4 bg-blue-50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-blue-800 mb-2">➕ 添加补充记录</h3>
            <form @submit.prevent="submitSupplement" class="space-y-3">
              <div>
                <select
                  v-model="supplementForm.supplement_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="business_record">业务记录</option>
                  <option value="on_site_explain">现场说明</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <textarea
                  v-model="supplementForm.content"
                  rows="3"
                  placeholder="请输入补充内容..."
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="!supplementForm.content.trim()"
                  class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交补充
                </button>
              </div>
            </form>
          </div>
          <div v-if="!canSupplement" class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
            ⚠️ 业务专员可添加补充记录，当前身份无此权限。
          </div>
          <div v-if="record.supplements?.length === 0" class="text-center py-8 text-gray-500">
            暂无补充记录
          </div>
          <div v-else class="space-y-3 max-h-[400px] overflow-y-auto">
            <div
              v-for="supp in record.supplements"
              :key="supp.id"
              class="border-l-4 border-blue-400 pl-4 py-2"
            >
              <div class="flex items-center space-x-2 mb-1">
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {{ supplementTypeLabels[supp.supplement_type] || supp.supplement_type }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ supp.operator?.name || '-' }} · {{ formatDate(supp.supplemented_at) }}
                </span>
              </div>
              <p class="text-sm text-gray-700">{{ supp.content }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            📎 证据附件
            <span class="text-sm font-normal text-gray-500 ml-2">({{ record.attachments?.length || 0 }} 条)</span>
          </h2>
          <div v-if="canSupplement" class="mb-4 bg-green-50 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-green-800 mb-2">➕ 上传附件</h3>
            <form @submit.prevent="submitAttachment" class="space-y-3">
              <div>
                <select
                  v-model="attachmentForm.attachment_type"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                >
                  <option value="photo">照片</option>
                  <option value="video">视频</option>
                  <option value="document">文档</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  v-model="attachmentForm.file_name"
                  placeholder="文件名（模拟）"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                />
              </div>
              <div>
                <input
                  type="text"
                  v-model="attachmentForm.file_path"
                  placeholder="文件路径（模拟）"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                />
              </div>
              <div>
                <textarea
                  v-model="attachmentForm.description"
                  rows="2"
                  placeholder="描述说明"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                ></textarea>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="!attachmentForm.file_name.trim()"
                  class="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上传
                </button>
              </div>
            </form>
          </div>
          <div v-if="!canSupplement" class="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
            ⚠️ 业务专员可上传附件，当前身份无此权限。
          </div>
          <div v-if="record.attachments?.length === 0" class="text-center py-8 text-gray-500">
            暂无附件
          </div>
          <div v-else class="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            <div
              v-for="att in record.attachments"
              :key="att.id"
              class="border rounded-lg p-3"
            >
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-lg">
                  {{ att.attachment_type === 'photo' ? '🖼️' : att.attachment_type === 'video' ? '🎥' : att.attachment_type === 'document' ? '📄' : '📎' }}
                </span>
                <span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                  {{ attachmentTypeLabels[att.attachment_type] || att.attachment_type }}
                </span>
              </div>
              <p class="text-sm font-medium truncate">{{ att.file_name }}</p>
              <p class="text-xs text-gray-500">{{ att.file_size }}</p>
              <p v-if="att.description" class="text-xs text-gray-600 mt-1 line-clamp-2">
                {{ att.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="canApprove" class="bg-white rounded-lg shadow p-6 border-2 border-orange-100">
        <h2 class="text-lg font-semibold text-orange-800 mb-4 border-b pb-2">🔑 审批操作</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
            <div class="text-3xl mb-2">✅</div>
            <h3 class="font-semibold text-gray-800 mb-1">通过复核</h3>
            <p class="text-sm text-gray-500 mb-3">确认处理结果，流程进入已通过状态</p>
            <div class="mb-3">
              <textarea
                v-model="approveForm.approve_remark"
                rows="2"
                placeholder="审批意见（可选）"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              ></textarea>
            </div>
            <button
              @click="submitApprove('approve')"
              :disabled="record.status !== 'reviewing'"
              class="w-full px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认通过
            </button>
            <p v-if="record.status !== 'reviewing'" class="text-xs text-red-500 mt-1">
              仅"待复核"状态可执行
            </p>
          </div>

          <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors">
            <div class="text-3xl mb-2">🔙</div>
            <h3 class="font-semibold text-gray-800 mb-1">退回补证</h3>
            <p class="text-sm text-gray-500 mb-3">退回补充材料，流程回到处理中</p>
            <div class="mb-3">
              <textarea
                v-model="approveForm.reject_remark"
                rows="2"
                placeholder="请输入退回原因"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              ></textarea>
            </div>
            <button
              @click="submitApprove('reject')"
              :disabled="record.status !== 'reviewing'"
              class="w-full px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认退回
            </button>
            <p v-if="record.status !== 'reviewing'" class="text-xs text-red-500 mt-1">
              仅"待复核"状态可执行
            </p>
          </div>

          <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div class="text-3xl mb-2">📦</div>
            <h3 class="font-semibold text-gray-800 mb-1">只读归档</h3>
            <p class="text-sm text-gray-500 mb-3">归档后记录只读，不可修改</p>
            <div class="mb-3">
              <textarea
                v-model="approveForm.archive_remark"
                rows="2"
                placeholder="归档说明（可选）"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              ></textarea>
            </div>
            <button
              @click="submitApprove('archive')"
              :disabled="!canArchive"
              class="w-full px-4 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认归档
            </button>
            <p v-if="!canArchive" class="text-xs text-red-500 mt-1">
              需"已通过"状态且无阻断
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">📤 提交复核</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">
              当前状态：<StatusBadge
                :status="record.status"
                :has-blocking="record.has_blocking"
                :is-archived="record.is_archived"
              />
            </p>
            <p class="text-xs text-gray-500 mt-1">
              业务专员完成处理后可提交复核，由审批负责人进行审核。
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              v-if="canSupplement"
              @click="showSubmitReviewModal = true"
              :disabled="record.status !== 'processing' || record.has_blocking"
              class="px-6 py-3 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              📤 提交复核
            </button>
          </div>
        </div>
        <p v-if="record.status !== 'processing'" class="text-xs text-red-500 mt-2">
          仅"处理中"状态可提交复核
        </p>
        <p v-if="record.has_blocking" class="text-xs text-red-500 mt-1">
          存在流程阻断，请先处理阻断问题
        </p>
      </div>
    </div>

    <div v-if="showSubmitReviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">提交复核</h3>
        <p class="text-sm text-gray-600 mb-4">
          确定将记录 <strong>{{ record.record_no }}</strong> 提交复核吗？提交后将由审批负责人进行审核。
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">提交说明</label>
          <textarea
            v-model="submitReviewRemark"
            rows="3"
            placeholder="请输入处理说明和提交意见..."
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="showSubmitReviewModal = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="doSubmitReview"
            :disabled="!submitReviewRemark.trim()"
            class="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认提交
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResolveModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">处理阻断</h3>
        <p class="text-sm text-gray-600 mb-4">
          确认已解决阻断问题？请提供处理说明。
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">异常记录</label>
          <select
            v-model="resolveForm.abnormal_id"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          >
            <option
              v-for="abnormal in record.abnormal_records?.filter(a => a.resolution_status === 'pending')"
              :key="abnormal.id"
              :value="abnormal.id"
            >
              {{ abnormalTypeLabels[abnormal.abnormal_type] }} - {{ abnormal.blocking_reason.substring(0, 30) }}...
            </option>
          </select>
          <label class="block text-sm font-medium text-gray-700 mb-1">处理状态</label>
          <select
            v-model="resolveForm.status"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          >
            <option value="resolved">已解决</option>
            <option value="rejected">驳回申诉</option>
          </select>
          <label class="block text-sm font-medium text-gray-700 mb-1">处理说明</label>
          <textarea
            v-model="resolveForm.remark"
            rows="3"
            placeholder="请输入处理说明..."
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="showResolveModal = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="doResolveAbnormal"
            :disabled="!resolveForm.remark.trim()"
            class="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认处理
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import DangerBadge from '../../Components/DangerBadge.vue';

const props = defineProps({
  record: Object,
  users: Array,
});

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

const supplementTypeLabels = {
  business_record: '业务记录',
  on_site_explain: '现场说明',
  other: '其他'
};

const attachmentTypeLabels = {
  photo: '照片',
  video: '视频',
  document: '文档',
  other: '其他'
};

const page = usePage();

const canSupplement = computed(() => {
  return props.record.status !== 'archived' && page.props?.auth?.user?.can_supplement;
});

const canApprove = computed(() => {
  return props.record.status !== 'archived' && page.props?.auth?.user?.can_approve;
});

const canArchive = computed(() => {
  return (props.record.status === 'approved' || props.record.status === 'reviewing') && !props.record.has_blocking;
});

const keyFields = reactive({
  inspection_time: props.record.inspection_time ? props.record.inspection_time.substring(0, 16) : '',
  current_responsible_id: props.record.current_responsible_id || '',
  involve_amount: props.record.involve_amount || 0,
  involve_quantity: props.record.involve_quantity || 0,
  evidence_conclusion: props.record.evidence_conclusion || '',
  conclusion: props.record.conclusion || '',
  handling_basis: props.record.handling_basis || '',
});

const originalKeyFields = ref({ ...keyFields });

const hasKeyFieldsChanged = computed(() => {
  return JSON.stringify(keyFields) !== JSON.stringify(originalKeyFields.value);
});

const supplementForm = reactive({
  supplement_type: 'business_record',
  content: '',
});

const attachmentForm = reactive({
  attachment_type: 'photo',
  file_name: '',
  file_path: '',
  file_size: '1.2 MB',
  description: '',
});

const approveForm = reactive({
  approve_remark: '',
  reject_remark: '',
  archive_remark: '',
});

const showSubmitReviewModal = ref(false);
const showResolveModal = ref(false);
const submitReviewRemark = ref('');
const resolveForm = reactive({
  abnormal_id: '',
  status: 'resolved',
  remark: '',
});

watch(() => props.record, (newVal) => {
  if (newVal) {
    keyFields.inspection_time = newVal.inspection_time ? newVal.inspection_time.substring(0, 16) : '';
    keyFields.current_responsible_id = newVal.current_responsible_id || '';
    keyFields.involve_amount = newVal.involve_amount || 0;
    keyFields.involve_quantity = newVal.involve_quantity || 0;
    keyFields.evidence_conclusion = newVal.evidence_conclusion || '';
    keyFields.conclusion = newVal.conclusion || '';
    keyFields.handling_basis = newVal.handling_basis || '';
    originalKeyFields.value = { ...keyFields };
  }
}, { deep: true });

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

const submitKeyFieldsUpdate = () => {
  if (!hasKeyFieldsChanged.value) return;

  router.put(
    route('records.update', props.record.id),
    {
      ...keyFields,
      inspection_time: keyFields.inspection_time ? new Date(keyFields.inspection_time).toISOString() : null
    },
    {
      onSuccess: () => {
        originalKeyFields.value = { ...keyFields };
      }
    }
  );
};

const submitSupplement = () => {
  if (!supplementForm.content.trim()) return;

  router.post(
    route('records.supplement', props.record.id),
    { ...supplementForm },
    {
      onSuccess: () => {
        supplementForm.content = '';
      }
    }
  );
};

const submitAttachment = () => {
  if (!attachmentForm.file_name.trim()) return;

  router.post(
    route('records.attachment', props.record.id),
    { ...attachmentForm },
    {
      onSuccess: () => {
        attachmentForm.file_name = '';
        attachmentForm.file_path = '';
        attachmentForm.description = '';
      }
    }
  );
};

const submitApprove = (action) => {
  let remark = '';
  if (action === 'approve') remark = approveForm.approve_remark;
  else if (action === 'reject') remark = approveForm.reject_remark;
  else if (action === 'archive') remark = approveForm.archive_remark;

  if (action === 'reject' && !remark.trim()) {
    alert('请输入退回原因');
    return;
  }

  router.post(
    route('records.approve', props.record.id),
    { action, remark },
    {
      onSuccess: () => {
        approveForm.approve_remark = '';
        approveForm.reject_remark = '';
        approveForm.archive_remark = '';
      }
    }
  );
};

const doSubmitReview = () => {
  if (!submitReviewRemark.value.trim()) return;

  router.post(
    route('records.submit', props.record.id),
    { remark: submitReviewRemark.value },
    {
      onSuccess: () => {
        showSubmitReviewModal.value = false;
        submitReviewRemark.value = '';
      }
    }
  );
};

const doResolveAbnormal = () => {
  if (!resolveForm.remark.trim() || !resolveForm.abnormal_id) return;

  router.post(
    route('records.abnormal.resolve', {
      record: props.record.id,
      abnormal: resolveForm.abnormal_id
    }),
    {
      resolution_status: resolveForm.status,
      resolution_remark: resolveForm.remark
    },
    {
      onSuccess: () => {
        showResolveModal.value = false;
        resolveForm.abnormal_id = '';
        resolveForm.remark = '';
      }
    }
  );
};
</script>
