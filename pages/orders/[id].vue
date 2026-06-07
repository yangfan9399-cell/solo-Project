<template>
  <div v-if="orderDetail" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          @click="goBack"
          class="text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← 返回列表
        </button>
        <h2 class="text-2xl font-bold text-gray-900">订单详情</h2>
        <span
          class="px-3 py-1 rounded-full text-sm font-medium"
          :class="[getStatusInfo(orderDetail.order.status).color, getStatusInfo(orderDetail.order.status).bgColor]"
        >
          {{ getStatusInfo(orderDetail.order.status).label }}
        </span>
      </div>
      <div class="text-sm text-gray-500">
        订单号：{{ orderDetail.order.orderNo }}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="w-1 h-5 bg-blue-500 rounded mr-2"></span>
            客户信息
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">客户姓名</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.customer.name }}</p>
            </div>
            <div>
              <p class="text-gray-500">联系电话</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.customer.phone }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-gray-500">服务地址</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.order.address }}</p>
            </div>
            <div>
              <p class="text-gray-500">所在城市</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.order.city }}</p>
            </div>
            <div>
              <p class="text-gray-500">服务区域</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.customer.district || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="w-1 h-5 bg-green-500 rounded mr-2"></span>
            服务信息
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">服务项目</p>
              <p class="text-gray-900 font-medium mt-1">{{ getServiceTypeLabel(orderDetail.order.serviceType) }}</p>
            </div>
            <div>
              <p class="text-gray-500">服务时长</p>
              <p class="text-gray-900 font-medium mt-1">{{ formatDuration(orderDetail.order.duration) }}</p>
            </div>
            <div>
              <p class="text-gray-500">预约时间</p>
              <p class="text-gray-900 font-medium mt-1">{{ formatDate(orderDetail.order.scheduledTime) }}</p>
            </div>
            <div>
              <p class="text-gray-500">订单金额</p>
              <p class="text-blue-600 font-bold mt-1 text-lg">¥{{ orderDetail.order.price }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-gray-500">备注</p>
              <p class="text-gray-900 mt-1">{{ orderDetail.order.remark || '无' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="w-1 h-5 bg-purple-500 rounded mr-2"></span>
            保洁员信息
          </h3>
          <div v-if="orderDetail.cleaner" class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">姓名</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.cleaner.name }}</p>
            </div>
            <div>
              <p class="text-gray-500">级别</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.cleaner.level }}</p>
            </div>
            <div>
              <p class="text-gray-500">联系电话</p>
              <p class="text-gray-900 font-medium mt-1">{{ orderDetail.cleaner.phone }}</p>
            </div>
            <div>
              <p class="text-gray-500">评分</p>
              <p class="text-yellow-500 font-medium mt-1">★ {{ orderDetail.cleaner.rating }}</p>
            </div>
          </div>
          <div v-else class="text-gray-500 text-sm">
            暂未派单
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="w-1 h-5 bg-pink-500 rounded mr-2"></span>
            完成照片
            <span v-if="completionPhotos.length === 0" class="ml-2 text-red-500 text-sm font-normal">
              （照片缺失）
            </span>
          </h3>
          <div v-if="completionPhotos.length > 0" class="grid grid-cols-3 gap-3">
            <div
              v-for="photo in completionPhotos"
              :key="photo.id"
              class="aspect-video bg-gray-100 rounded-lg overflow-hidden"
            >
              <img :src="photo.url" alt="完成照片" class="w-full h-full object-cover" />
            </div>
          </div>
          <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
            <p class="text-gray-400 text-sm">暂无完成照片</p>
            <p class="text-gray-400 text-xs mt-1">照片缺失时不能提交验收</p>
          </div>
        </div>

        <div v-if="orderDetail.rework || reworkPhotos.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="w-1 h-5 bg-teal-500 rounded mr-2"></span>
            返工照片
          </h3>
          <div v-if="reworkPhotos.length > 0" class="grid grid-cols-3 gap-3">
            <div
              v-for="photo in reworkPhotos"
              :key="photo.id"
              class="aspect-video bg-gray-100 rounded-lg overflow-hidden"
            >
              <img :src="photo.url" alt="返工照片" class="w-full h-full object-cover" />
            </div>
          </div>
          <div v-else class="text-center py-8 bg-gray-50 rounded-lg">
            <p class="text-gray-400 text-sm">暂无返工照片</p>
          </div>
        </div>

        <div v-if="orderDetail.complaint" class="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h3 class="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <span class="w-1 h-5 bg-red-500 rounded mr-2"></span>
            投诉证据
          </h3>
          <div class="space-y-3">
            <div>
              <p class="text-gray-500 text-sm">投诉标题</p>
              <p class="text-gray-900 font-medium">{{ orderDetail.complaint.title }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">投诉描述</p>
              <p class="text-gray-700">{{ orderDetail.complaint.description }}</p>
            </div>
            <div v-if="orderDetail.complaint.evidencePhotos.length > 0">
              <p class="text-gray-500 text-sm mb-2">证据照片</p>
              <div class="grid grid-cols-3 gap-3">
                <div
                  v-for="(photo, idx) in orderDetail.complaint.evidencePhotos"
                  :key="idx"
                  class="aspect-video bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img :src="photo" alt="证据照片" class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="orderDetail.rework" class="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
          <h3 class="text-lg font-semibold text-orange-600 mb-4 flex items-center">
            <span class="w-1 h-5 bg-orange-500 rounded mr-2"></span>
            返工信息
          </h3>
          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-gray-500">返工原因</p>
                <p class="text-gray-900 font-medium mt-1">{{ getReworkReasonLabel(orderDetail.rework.reason) }}</p>
              </div>
              <div>
                <p class="text-gray-500">截止时间</p>
                <p class="font-medium mt-1" :class="isReworkTimeout ? 'text-red-600' : 'text-gray-900'">
                  {{ formatDate(orderDetail.rework.deadline) }}
                  <span v-if="isReworkTimeout" class="text-xs">(已超时)</span>
                </p>
              </div>
            </div>
            <div>
              <p class="text-gray-500">详细描述</p>
              <p class="text-gray-700 mt-1">{{ orderDetail.rework.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="orderDetail.compensation" class="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
          <h3 class="text-lg font-semibold text-amber-600 mb-4 flex items-center">
            <span class="w-1 h-5 bg-amber-500 rounded mr-2"></span>
            赔付信息
          </h3>
          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-gray-500">赔付金额</p>
                <p class="text-red-600 font-bold text-lg mt-1">¥{{ orderDetail.compensation.amount }}</p>
              </div>
              <div>
                <p class="text-gray-500">赔付类型</p>
                <p class="text-gray-900 font-medium mt-1">
                  {{ getCompensationRuleTypeLabel(orderDetail.compensation.ruleType) }}
                </p>
              </div>
              <div>
                <p class="text-gray-500">状态</p>
                <p class="font-medium mt-1" :class="{
                  'text-amber-600': orderDetail.compensation.status === 'pending',
                  'text-green-600': orderDetail.compensation.status === 'approved',
                  'text-gray-600': orderDetail.compensation.status === 'rejected',
                }">
                  {{ compensationStatusMap[orderDetail.compensation.status] }}
                </p>
              </div>
            </div>
            <div>
              <p class="text-gray-500">赔付原因</p>
              <p class="text-gray-700 mt-1">{{ orderDetail.compensation.reason }}</p>
            </div>
            <div v-if="orderDetail.compensation.reviewRemark">
              <p class="text-gray-500">审批意见</p>
              <p class="text-gray-700 mt-1">{{ orderDetail.compensation.reviewRemark }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="w-1 h-5 bg-gray-500 rounded mr-2"></span>
            历史节点
          </h3>
          <div class="relative">
            <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="space-y-4">
              <div
                v-for="log in orderDetail.logs"
                :key="log.id"
                class="relative pl-8"
              >
                <div class="absolute left-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <span class="font-medium text-gray-900 text-sm">{{ log.action }}</span>
                    <span class="text-xs text-gray-400">{{ formatDate(log.createdAt) }}</span>
                  </div>
                  <p v-if="log.description" class="text-sm text-gray-600 mt-1">{{ log.description }}</p>
                  <p v-if="log.operatorName" class="text-xs text-gray-400 mt-1">操作人：{{ log.operatorName }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">操作面板</h3>
          <div class="space-y-3">
            <div v-if="canAssign">
              <button
                @click="showAssignModal = true"
                class="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                派单
              </button>
            </div>

            <div v-if="canComplete">
              <button
                @click="showCompleteModal = true"
                class="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                提交完成
              </button>
            </div>

            <div v-if="canReworkComplete">
              <button
                @click="showReworkCompleteModal = true; tempPhotos = []"
                class="w-full py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                提交返工完成
              </button>
            </div>

            <div v-if="canInspect">
              <button
                @click="showInspectModal = true"
                class="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                {{ orderDetail?.order.status === 'rework_completed' ? '返工验收' : '验收复核' }}
              </button>
              <p v-if="currentInspectPhotos.length === 0" class="text-xs text-red-500 mt-1">
                ⚠ {{ orderDetail?.order.status === 'rework_completed' ? '返工照片缺失，不能通过验收' : '完成照片缺失，不能通过验收' }}
              </p>
            </div>

            <div v-if="canCreateRework">
              <button
                @click="showReworkModal = true"
                class="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                创建返工
              </button>
            </div>

            <div v-if="canCreateCompensation">
              <button
                @click="showCompensationModal = true"
                class="w-full py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                申请赔付
              </button>
            </div>

            <div v-if="canReviewCompensation">
              <div class="space-y-2">
                <button
                  @click="reviewCompensation(true)"
                  class="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  批准赔付
                </button>
                <button
                  @click="showRejectModal = true"
                  class="w-full py-2.5 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  拒绝赔付
                </button>
              </div>
            </div>

            <div v-if="!hasAnyAction" class="text-center py-4">
              <p class="text-gray-400 text-sm">当前状态无可用操作</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">赔付规则</h3>
          <div class="space-y-3">
            <div
              v-for="rule in compensationRules"
              :key="rule.id"
              class="p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex justify-between items-start">
                <span class="font-medium text-gray-900 text-sm">{{ rule.name }}</span>
                <span class="text-red-600 font-bold text-sm">¥{{ rule.baseAmount }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ rule.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">派单</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择保洁员</label>
            <select
              v-model="selectedCleanerId"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择保洁员</option>
              <option v-for="cleaner in availableCleaners" :key="cleaner.id" :value="cleaner.id">
                {{ cleaner.name }} ({{ cleaner.level }}) - {{ cleaner.city }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showAssignModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleAssign"
            :disabled="!selectedCleanerId"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认派单
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCompleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">提交完成</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">上传完成照片</label>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <div
                v-for="(photo, idx) in tempPhotos"
                :key="idx"
                class="aspect-square bg-gray-100 rounded-lg relative overflow-hidden"
              >
                <img :src="photo" alt="照片预览" class="w-full h-full object-cover" />
                <button
                  @click="removePhoto(idx)"
                  class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
              <button
                v-if="tempPhotos.length < 6"
                @click="addPhoto"
                class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
              >
                + 添加
              </button>
            </div>
            <p class="text-xs text-gray-500">提示：请上传至少1张完成照片，否则无法通过验收</p>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showCompleteModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleComplete"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            提交完成
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReworkCompleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">提交返工完成</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">上传返工完成照片</label>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <div
                v-for="(photo, idx) in tempPhotos"
                :key="idx"
                class="aspect-square bg-gray-100 rounded-lg relative overflow-hidden"
              >
                <img :src="photo" alt="照片预览" class="w-full h-full object-cover" />
                <button
                  @click="removePhoto(idx)"
                  class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
              <button
                v-if="tempPhotos.length < 6"
                @click="addPhoto"
                class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-teal-500 hover:text-teal-500 transition-colors"
              >
                + 添加
              </button>
            </div>
            <p class="text-xs text-gray-500">提示：请上传至少1张返工完成照片，否则无法通过验收</p>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showReworkCompleteModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleReworkComplete"
            class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            提交返工完成
          </button>
        </div>
      </div>
    </div>

    <div v-if="showInspectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ orderDetail?.order.status === 'rework_completed' ? '返工验收' : '验收复核' }}</h3>
        <div v-if="currentInspectPhotos.length === 0" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm font-medium">⚠ {{ orderDetail?.order.status === 'rework_completed' ? '返工照片缺失' : '完成照片缺失' }}</p>
          <p class="text-red-600 text-xs mt-1">根据规定，无照片不能通过验收</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">验收结果</label>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="inspectResult"
                  :value="true"
                  :disabled="currentInspectPhotos.length === 0"
                  class="mr-2"
                />
                <span :class="currentInspectPhotos.length === 0 ? 'text-gray-400' : ''">通过</span>
              </label>
              <label class="flex items-center">
                <input type="radio" v-model="inspectResult" :value="false" class="mr-2" />
                <span>不通过</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">验收意见</label>
            <textarea
              v-model="inspectRemark"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入验收意见..."
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showInspectModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleInspect"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReworkModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">创建返工</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">返工原因</label>
            <select
              v-model="reworkReason"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择原因</option>
              <option value="poor_quality">保洁质量差</option>
              <option value="photo_missing">照片缺失</option>
              <option value="item_damaged">物品损坏</option>
              <option value="missed_area">遗漏区域</option>
              <option value="other">其他原因</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
            <textarea
              v-model="reworkDescription"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入返工详细描述..."
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">返工时限（小时）</label>
            <input
              type="number"
              v-model.number="reworkDeadlineHours"
              min="1"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">指派保洁员</label>
            <select
              v-model="reworkCleanerId"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择保洁员</option>
              <option v-for="cleaner in availableCleaners" :key="cleaner.id" :value="cleaner.id">
                {{ cleaner.name }} ({{ cleaner.level }})
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showReworkModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleCreateRework"
            :disabled="!reworkReason || !reworkDescription || !reworkDeadlineHours || !reworkCleanerId"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建返工
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCompensationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">申请赔付</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">赔付类型</label>
            <select
              v-model="compensationType"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择类型</option>
              <option value="item_damage">物品损坏赔付</option>
              <option value="rework_timeout">返工超时赔付</option>
              <option value="customer_complaint">客户投诉赔付</option>
              <option value="photo_missing">照片缺失处罚</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">赔付金额（元）</label>
            <input
              type="number"
              v-model.number="compensationAmount"
              min="0"
              step="0.01"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">赔付原因</label>
            <textarea
              v-model="compensationReason"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入赔付原因详细说明..."
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showCompensationModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleCreateCompensation"
            :disabled="!compensationType || !compensationAmount || !compensationReason"
            class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交申请
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">拒绝赔付</h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">拒绝原因</label>
          <textarea
            v-model="rejectRemark"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入拒绝原因..."
          ></textarea>
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="showRejectModal = false"
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="reviewCompensation(false)"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            确认拒绝
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { OrderDetail, Cleaner, CompensationRule } from '~/types';
import { formatDate, getStatusInfo, getServiceTypeLabel, getReworkReasonLabel } from '~/utils/format';

const route = useRoute();
const orderId = computed(() => parseInt(route.params.id as string));
const currentRole = useState('currentRole', () => 'customer_service');

const { data: orderData, refresh: refreshOrder, pending: orderPending } = await useFetch(
  () => `/api/orders/${orderId.value}`,
  { watch: [orderId] }
);

const { data: rulesData, refresh: refreshRules } = await useFetch('/api/compensation-rules');

const { data: cleanersData, refresh: refreshCleaners } = await useFetch('/api/cleaners');

const orderDetail = computed<OrderDetail | null>(() => orderData.value?.data || null);
const compensationRules = computed<CompensationRule[]>(() => rulesData.value?.data || []);
const availableCleaners = computed<Cleaner[]>(() => cleanersData.value?.data || []);

const showAssignModal = ref(false);
const showCompleteModal = ref(false);
const showInspectModal = ref(false);
const showReworkModal = ref(false);
const showReworkCompleteModal = ref(false);
const showCompensationModal = ref(false);
const showRejectModal = ref(false);

const selectedCleanerId = ref<number | ''>('');
const tempPhotos = ref<string[]>([]);
const inspectResult = ref<boolean | null>(null);
const inspectRemark = ref('');
const reworkReason = ref('');
const reworkDescription = ref('');
const reworkDeadlineHours = ref(24);
const reworkCleanerId = ref<number | ''>('');
const compensationType = ref('');
const compensationAmount = ref<number | null>(null);
const compensationReason = ref('');
const rejectRemark = ref('');

const compensationStatusMap: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
};

const completionPhotos = computed(() => {
  if (!orderDetail.value) return [];
  return orderDetail.value.photos.filter(p => p.type === 'completion');
});

const reworkPhotos = computed(() => {
  if (!orderDetail.value) return [];
  return orderDetail.value.photos.filter(p => p.type === 'rework');
});

const currentInspectPhotos = computed(() => {
  if (!orderDetail.value) return [];
  return orderDetail.value.order.status === 'rework_completed' ? reworkPhotos.value : completionPhotos.value;
});

const isReworkTimeout = computed(() => {
  if (!orderDetail.value?.rework) return false;
  return new Date(orderDetail.value.rework.deadline) < new Date();
});

const canAssign = computed(() => {
  return currentRole.value === 'customer_service' && orderDetail.value?.order.status === 'pending';
});

const canComplete = computed(() => {
  return currentRole.value === 'cleaner' && orderDetail.value?.order.status === 'assigned';
});

const canReworkComplete = computed(() => {
  return currentRole.value === 'cleaner' && orderDetail.value?.order.status === 'rework';
});

const canInspect = computed(() => {
  return currentRole.value === 'inspector' && (
    orderDetail.value?.order.status === 'completed' ||
    orderDetail.value?.order.status === 'rework_completed'
  );
});

const canCreateRework = computed(() => {
  return currentRole.value === 'inspector' && (
    orderDetail.value?.order.status === 'inspection_failed' ||
    orderDetail.value?.order.status === 'rework_timeout'
  );
});

const canCreateCompensation = computed(() => {
  return currentRole.value === 'inspector' && (
    orderDetail.value?.order.status === 'inspection_failed' ||
    orderDetail.value?.order.status === 'rework_timeout'
  ) && !orderDetail.value?.compensation;
});

const canReviewCompensation = computed(() => {
  return currentRole.value === 'supervisor' && orderDetail.value?.compensation?.status === 'pending';
});

const hasAnyAction = computed(() => {
  return canAssign.value || canComplete.value || canReworkComplete.value || canInspect.value ||
    canCreateRework.value || canCreateCompensation.value || canReviewCompensation.value;
});

function goBack() {
  navigateTo('/');
}

function addPhoto() {
  const seed = `photo_${Date.now()}_${Math.random()}`;
  tempPhotos.value.push(`https://picsum.photos/seed/${seed}/400/300`);
}

function removePhoto(idx: number) {
  tempPhotos.value.splice(idx, 1);
}

async function handleAssign() {
  if (!selectedCleanerId.value) return;

  try {
    const res = await $fetch(`/api/orders/${orderId.value}/assign`, {
      method: 'POST',
      body: { cleanerId: selectedCleanerId.value },
    });
    if (res.success) {
      showAssignModal.value = false;
      selectedCleanerId.value = '';
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}

async function handleComplete() {
  try {
    const res = await $fetch(`/api/orders/${orderId.value}/complete`, {
      method: 'POST',
      body: { photos: tempPhotos.value },
    });
    if (res.success) {
      showCompleteModal.value = false;
      tempPhotos.value = [];
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}

async function handleReworkComplete() {
  if (tempPhotos.value.length === 0) {
    alert('请上传至少一张返工完成照片');
    return;
  }

  try {
    const res = await $fetch(`/api/orders/${orderId.value}/rework-complete`, {
      method: 'POST',
      body: { photos: tempPhotos.value },
    });
    if (res.success) {
      showReworkCompleteModal.value = false;
      tempPhotos.value = [];
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}

async function handleInspect() {
  if (inspectResult.value === null) {
    alert('请选择验收结果');
    return;
  }

  if (inspectResult.value && currentInspectPhotos.value.length === 0) {
    const isRework = orderDetail.value?.order.status === 'rework_completed';
    alert(isRework ? '返工照片缺失，不能通过验收！' : '完成照片缺失，不能通过验收！');
    return;
  }

  try {
    const res = await $fetch(`/api/orders/${orderId.value}/inspect`, {
      method: 'POST',
      body: {
        passed: inspectResult.value,
        remark: inspectRemark.value,
      },
    });
    if (res.success) {
      showInspectModal.value = false;
      inspectResult.value = null;
      inspectRemark.value = '';
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}

async function handleCreateRework() {
  if (!reworkReason.value || !reworkDescription.value || !reworkDeadlineHours.value || !reworkCleanerId.value) {
    return;
  }

  try {
    const res = await $fetch(`/api/orders/${orderId.value}/rework`, {
      method: 'POST',
      body: {
        reason: reworkReason.value,
        description: reworkDescription.value,
        deadlineHours: reworkDeadlineHours.value,
        cleanerId: reworkCleanerId.value,
      },
    });
    if (res.success) {
      showReworkModal.value = false;
      reworkReason.value = '';
      reworkDescription.value = '';
      reworkDeadlineHours.value = 24;
      reworkCleanerId.value = '';
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}

async function handleCreateCompensation() {
  if (!compensationType.value || !compensationAmount.value || !compensationReason.value) {
    return;
  }

  try {
    const res = await $fetch(`/api/orders/${orderId.value}/compensation`, {
      method: 'POST',
      body: {
        ruleType: compensationType.value,
        amount: compensationAmount.value.toString(),
        reason: compensationReason.value,
      },
    });
    if (res.success) {
      showCompensationModal.value = false;
      compensationType.value = '';
      compensationAmount.value = null;
      compensationReason.value = '';
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}

async function reviewCompensation(approved: boolean) {
  if (!orderDetail.value?.compensation) return;

  const remark = approved ? '同意赔付' : rejectRemark.value;
  if (!approved && !remark.trim()) {
    alert('请输入拒绝原因');
    return;
  }

  try {
    const res = await $fetch(`/api/compensations/${orderDetail.value.compensation.id}/review`, {
      method: 'POST',
      body: {
        approved,
        remark,
      },
    });
    if (res.success) {
      showRejectModal.value = false;
      rejectRemark.value = '';
      await refreshOrder();
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || '操作失败');
  }
}
</script>
