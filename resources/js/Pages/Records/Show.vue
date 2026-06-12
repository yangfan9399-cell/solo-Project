<template>
  <AppLayout :title="`详情 - ${record.record_no}`">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Link
            :href="route('records.index')"
            class="text-gray-500 hover:text-gray-700"
          >
            ← 返回列表
          </Link>
          <h1 class="text-2xl font-bold text-gray-800">
            📋 {{ record.record_no }}
            <span v-if="record.version > 1" class="text-sm text-gray-500 ml-2">
              v{{ record.version }}
            </span>
          </h1>
          <StatusBadge
            :status="record.status"
            :has-blocking="record.has_blocking"
            :is-archived="record.is_archived"
          />
          <span
            class="px-2 py-1 rounded text-xs font-medium"
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
        <div class="flex space-x-2">
          <template v-if="!record.is_archived">
            <Link
              :href="route('records.handle', record.id)"
              class="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              ⚙️ 进入处理台
            </Link>
          </template>
          <template v-else>
            <button
              v-if="$page.props.auth.user?.can_approve"
              @click="showReopenModal = true"
              class="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              🔄 重新处理
            </button>
          </template>
        </div>
      </div>

      <div v-if="record.has_blocking" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
        <div class="flex items-start">
          <span class="text-2xl mr-3">⚠️</span>
          <div class="flex-1">
            <h3 class="text-red-800 font-semibold mb-1">流程阻断</h3>
            <p class="text-red-700 text-sm">{{ record.blocking_reason }}</p>
          </div>
        </div>
      </div>

      <div v-if="record.is_archived" class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
        <div class="flex items-center">
          <span class="text-2xl mr-3">✅</span>
          <div>
            <h3 class="text-green-800 font-semibold">已归档</h3>
            <p class="text-green-700 text-sm">
              归档时间：{{ formatDate(record.archived_at) }} · 
              归档人：{{ record.archived_by?.name || '-' }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">📝 详情结论</h2>
        <div class="prose prose-sm max-w-none">
          <pre class="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm text-gray-700 font-sans">{{ record.conclusion || '暂无结论' }}</pre>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">🔍 来源信息</h2>
          <dl class="space-y-3">
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">来源渠道</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.source }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">来源编号</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.source_no || '-' }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">创建时间</dt>
              <dd class="flex-1 text-sm font-medium">{{ formatDate(record.created_at) }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">创建人</dt>
              <dd class="flex-1 text-sm font-medium">
                {{ record.created_by?.name || '-' }}
                <span class="text-gray-400 text-xs">({{ record.created_by?.role_label || '-' }})</span>
              </dd>
            </div>
          </dl>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">👤 当前责任人</h2>
          <dl class="space-y-3">
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">姓名</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.current_responsible?.name || '-' }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">角色</dt>
              <dd class="flex-1 text-sm font-medium">
                <span class="px-2 py-0.5 rounded text-xs"
                  :class="record.current_responsible?.role === 'approval_leader' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                >
                  {{ record.current_responsible?.role_label || '-' }}
                </span>
              </dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">部门</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.current_responsible?.department || '-' }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">联系电话</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.current_responsible?.phone || '-' }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">🏠 关键对象信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs text-gray-500 mb-1">户主姓名</p>
            <p class="text-lg font-semibold">{{ record.household_name }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs text-gray-500 mb-1">联系电话</p>
            <p class="text-lg font-semibold">{{ record.household_phone }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs text-gray-500 mb-1">燃气表编号</p>
            <p class="text-lg font-semibold font-mono">{{ record.gas_meter_no || '-' }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs text-gray-500 mb-1">检查时间</p>
            <p class="text-lg font-semibold">{{ formatDate(record.inspection_time) }}</p>
          </div>
        </div>
        <div class="mt-4 bg-gray-50 rounded-lg p-4">
          <p class="text-xs text-gray-500 mb-1">地址</p>
          <p class="text-base font-medium">{{ record.address }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">⚠️ 隐患信息</h2>
          <dl class="space-y-3">
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">隐患等级</dt>
              <dd class="flex-1">
                <DangerBadge :level="record.danger_level" />
              </dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">隐患类型</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.danger_type }}</dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">涉及金额</dt>
              <dd class="flex-1 text-sm font-medium text-red-600">
                ¥{{ formatNumber(record.involve_amount) }}
              </dd>
            </div>
            <div class="flex">
              <dt class="w-24 text-sm text-gray-500">涉及数量</dt>
              <dd class="flex-1 text-sm font-medium">{{ record.involve_quantity }} 项</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 mb-1">隐患描述</dt>
              <dd class="text-sm bg-gray-50 p-3 rounded">{{ record.hidden_danger }}</dd>
            </div>
          </dl>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">📚 采用依据</h2>
          <div class="bg-gray-50 rounded-lg p-4 min-h-[120px]">
            <pre class="whitespace-pre-wrap text-sm text-gray-700 font-sans">{{ record.handling_basis || '暂无' }}</pre>
          </div>
          <h3 class="text-md font-semibold text-gray-800 mt-4 mb-2">🔬 证据结论</h3>
          <div class="bg-gray-50 rounded-lg p-4 min-h-[80px]">
            <pre class="whitespace-pre-wrap text-sm text-gray-700 font-sans">{{ record.evidence_conclusion || '暂无' }}</pre>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          📊 处理前后差异对比
          <span class="text-sm font-normal text-gray-500 ml-2">({{ record.difference_comparisons.length }} 条变更)</span>
        </h2>
        <div v-if="record.difference_comparisons.length === 0" class="text-center py-8 text-gray-500">
          暂无变更记录
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">字段</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">变更类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理前</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">处理后</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="diff in record.difference_comparisons"
                :key="diff.id"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  {{ diff.field_label || diff.field_name }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      diff.change_type === 'create' ? 'bg-green-100 text-green-800' :
                      diff.change_type === 'update' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ changeTypeLabels[diff.change_type] || diff.change_type }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 max-w-[180px]">
                  <span class="line-clamp-2">{{ diff.before_value }}</span>
                </td>
                <td class="px-4 py-3 text-center text-gray-400">→</td>
                <td class="px-4 py-3 text-sm text-gray-900 max-w-[180px]">
                  <span class="line-clamp-2">{{ diff.after_value }}</span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ diff.operator?.name || '-' }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {{ formatDate(diff.compared_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="record.abnormal_records.length > 0" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          🚨 异常记录
          <span class="text-sm font-normal text-gray-500 ml-2">({{ record.abnormal_records.length }} 条)</span>
        </h2>
        <div class="space-y-4">
          <div
            v-for="abnormal in record.abnormal_records"
            :key="abnormal.id"
            class="border rounded-lg p-4"
            :class="{
              'border-red-200 bg-red-50': abnormal.resolution_status === 'pending',
              'border-green-200 bg-green-50': abnormal.resolution_status === 'resolved',
              'border-gray-200 bg-gray-50': abnormal.resolution_status === 'rejected'
            }"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-2">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    abnormal.abnormal_type === 'number_conflict' ? 'bg-yellow-100 text-yellow-800' :
                    abnormal.abnormal_type === 'amount_difference' ? 'bg-orange-100 text-orange-800' :
                    'bg-purple-100 text-purple-800'
                  ]"
                >
                  {{ abnormalTypeLabels[abnormal.abnormal_type] || abnormal.abnormal_type }}
                </span>
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    abnormal.resolution_status === 'pending' ? 'bg-red-200 text-red-800' :
                    abnormal.resolution_status === 'resolved' ? 'bg-green-200 text-green-800' :
                    'bg-gray-200 text-gray-800'
                  ]"
                >
                  {{ abnormalStatusLabels[abnormal.resolution_status] || abnormal.resolution_status }}
                </span>
              </div>
              <span class="text-xs text-gray-500">{{ formatDate(abnormal.created_at) }}</span>
            </div>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium text-gray-700">阻断原因：</span>{{ abnormal.blocking_reason }}</p>
              <p><span class="font-medium text-gray-700">差异字段：</span>{{ abnormal.difference_fields?.join(', ') }}</p>
              <p><span class="font-medium text-gray-700">补救路径：</span>{{ abnormal.remedy_path }}</p>
              <div v-if="abnormal.resolution_remark" class="mt-2 pt-2 border-t border-gray-200">
                <p><span class="font-medium text-gray-700">处理说明：</span>{{ abnormal.resolution_remark }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  处理人：{{ abnormal.handled_by?.name || '-' }} · {{ formatDate(abnormal.handled_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            📝 业务补充记录
            <span class="text-sm font-normal text-gray-500 ml-2">({{ record.supplements.length }} 条)</span>
          </h2>
          <div v-if="record.supplements.length === 0" class="text-center py-8 text-gray-500">
            暂无补充记录
          </div>
          <div v-else class="space-y-3">
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
            <span class="text-sm font-normal text-gray-500 ml-2">({{ record.attachments.length }} 条)</span>
          </h2>
          <div v-if="record.attachments.length === 0" class="text-center py-8 text-gray-500">
            暂无附件
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div
              v-for="att in record.attachments"
              :key="att.id"
              class="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-xl">
                  {{ att.attachment_type === 'photo' ? '🖼️' : att.attachment_type === 'video' ? '🎥' : att.attachment_type === 'document' ? '📄' : '📎' }}
                </span>
                <span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                  {{ attachmentTypeLabels[att.attachment_type] || att.attachment_type }}
                </span>
              </div>
              <p class="text-sm font-medium text-gray-900 truncate" :title="att.file_name">
                {{ att.file_name }}
              </p>
              <p class="text-xs text-gray-500">{{ att.file_size }}</p>
              <p v-if="att.description" class="text-xs text-gray-600 mt-1 line-clamp-2">
                {{ att.description }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {{ att.uploaded_by?.name || '-' }} · {{ formatDate(att.uploaded_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
          🔄 历史节点流转
          <span class="text-sm font-normal text-gray-500 ml-2">({{ record.nodes.length }} 个节点)</span>
        </h2>
        <div v-if="record.nodes.length === 0" class="text-center py-8 text-gray-500">
          暂无节点记录
        </div>
        <div v-else class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div class="space-y-6">
            <div
              v-for="(node, index) in record.nodes"
              :key="node.id"
              class="relative pl-12"
            >
              <div
                class="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow"
                :class="[
                  index === 0 ? 'bg-blue-500' : 
                  index === record.nodes.length - 1 ? 'bg-green-500' : 
                  'bg-gray-400'
                ]"
              >
                <span class="text-white text-xs font-bold">{{ node.node_order }}</span>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <span class="font-semibold text-gray-800">{{ node.node_name }}</span>
                    <span
                      :class="[
                        'px-2 py-0.5 rounded text-xs font-medium',
                        node.action === 'create' ? 'bg-green-100 text-green-700' :
                        node.action === 'update' ? 'bg-blue-100 text-blue-700' :
                        node.action === 'submit' ? 'bg-purple-100 text-purple-700' :
                        node.action === 'approve' ? 'bg-green-100 text-green-700' :
                        node.action === 'reject' ? 'bg-red-100 text-red-700' :
                        node.action === 'archive' ? 'bg-gray-100 text-gray-700' :
                        node.action === 'reopen' ? 'bg-orange-100 text-orange-700' :
                        node.action === 'appeal' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      ]"
                    >
                      {{ actionLabels[node.action] || node.action }}
                    </span>
                  </div>
                  <span class="text-sm text-gray-500">{{ formatDate(node.operated_at) }}</span>
                </div>
                <p v-if="node.description" class="text-sm text-gray-700 mb-2">{{ node.description }}</p>
                <p v-if="node.remark" class="text-sm text-gray-600 bg-white p-2 rounded mb-2">
                  <span class="font-medium">备注：</span>{{ node.remark }}
                </p>
                <div class="flex items-center space-x-2 text-xs text-gray-500">
                  <span>操作人：</span>
                  <span class="font-medium">{{ node.operator?.name || '-' }}</span>
                  <span class="text-gray-300">|</span>
                  <span>{{ node.operator?.role_label || '-' }}</span>
                </div>
                <div v-if="node.changed_fields && Object.keys(node.changed_fields).length > 0" class="mt-2 pt-2 border-t border-gray-200">
                  <p class="text-xs text-gray-500 mb-1">变更字段：</p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(value, field) in node.changed_fields"
                      :key="field"
                      class="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                    >
                      {{ fieldLabels[field] || field }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="record.parent || record.children?.length > 0" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">🔗 关联记录</h2>
        <div v-if="record.parent" class="mb-4">
          <p class="text-sm text-gray-500 mb-2">父记录（基于此记录重开）：</p>
          <Link
            :href="route('records.show', record.parent.id)"
            class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span>←</span>
            <span class="font-medium">{{ record.parent.record_no }}</span>
            <StatusBadge
              :status="record.parent.status"
              :has-blocking="record.parent.has_blocking"
              :is-archived="record.parent.is_archived"
            />
          </Link>
        </div>
        <div v-if="record.children?.length > 0">
          <p class="text-sm text-gray-500 mb-2">子记录（重开产生的新记录）：</p>
          <div class="space-y-2">
            <div
              v-for="child in record.children"
              :key="child.id"
              class="flex items-center space-x-2"
            >
              <Link
                :href="route('records.show', child.id)"
                class="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <span class="font-medium">{{ child.record_no }}</span>
                <span>→</span>
              </Link>
              <StatusBadge
                :status="child.status"
                :has-blocking="child.has_blocking"
                :is-archived="child.is_archived"
              />
              <span class="text-xs text-gray-500">{{ formatDate(child.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReopenModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">重新处理记录</h3>
        <p class="text-sm text-gray-600 mb-4">
          确定要重新处理记录 <strong>{{ record.record_no }}</strong> 吗？
          系统将创建一条新记录，保留原记录归档状态。
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">重开原因</label>
          <textarea
            v-model="reopenReason"
            rows="3"
            placeholder="请输入重新处理的原因..."
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="showReopenModal = false"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="submitReopen"
            :disabled="!reopenReason.trim()"
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
import { ref } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import DangerBadge from '../../Components/DangerBadge.vue';

const props = defineProps({
  record: Object,
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

const abnormalStatusLabels = {
  pending: '待处理',
  resolved: '已解决',
  rejected: '已驳回'
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

const changeTypeLabels = {
  create: '新增',
  update: '修改',
  delete: '删除'
};

const actionLabels = {
  create: '创建',
  update: '更新',
  submit: '提交',
  approve: '通过',
  reject: '驳回',
  archive: '归档',
  reopen: '重开',
  supplement: '补充',
  appeal: '申诉'
};

const fieldLabels = {
  inspection_time: '检查时间',
  household_name: '户主姓名',
  household_phone: '户主电话',
  address: '地址',
  gas_meter_no: '燃气表编号',
  involve_amount: '涉及金额',
  involve_quantity: '涉及数量',
  evidence_conclusion: '证据结论',
  current_responsible_id: '当前责任人',
  hidden_danger: '隐患描述',
  danger_level: '隐患等级',
  handling_basis: '采用依据',
  status: '状态',
  conclusion: '处理结论'
};

const showReopenModal = ref(false);
const reopenReason = ref('');

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

const submitReopen = () => {
  if (!reopenReason.value.trim()) return;

  router.post(
    route('records.reopen', props.record.id),
    { reason: reopenReason.value },
    {
      onSuccess: () => {
        showReopenModal.value = false;
      }
    }
  );
};
</script>
