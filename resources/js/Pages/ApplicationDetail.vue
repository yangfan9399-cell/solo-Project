<template>
  <Layout title="申请详情">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">{{ application.merchant_name }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ application.floor }}F / {{ application.shop_number }} | {{ application.merchant_type }}</p>
      </div>
      <span :class="['px-3 py-1 rounded-full text-sm font-medium', application.status_class]">
        {{ application.status_text }}
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <div class="card-header flex items-center">
            <Store class="w-5 h-5 mr-2 text-primary-500" />
            商户信息
          </div>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">商户名称</span>
              <span class="text-sm text-gray-800 font-medium">{{ application.merchant_name }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">商户类型</span>
              <span class="text-sm text-gray-800">{{ application.merchant_type }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">楼层</span>
              <span class="text-sm text-gray-800">{{ application.floor }}F</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">铺位号</span>
              <span class="text-sm text-gray-800">{{ application.shop_number }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-sm text-gray-500">施工范围</span>
              <span class="text-sm text-gray-800">{{ application.construction_scope || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex items-center">
            <Calendar class="w-5 h-5 mr-2 text-primary-500" />
            施工周期
          </div>
          <div class="flex items-center justify-center py-8">
            <div class="flex items-center space-x-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-800">{{ formatDate(application.start_date) }}</p>
                <p class="text-sm text-gray-500 mt-1">开始日期</p>
              </div>
              <ArrowRight class="w-6 h-6 text-gray-300" />
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-800">{{ formatDate(application.end_date) }}</p>
                <p class="text-sm text-gray-500 mt-1">结束日期</p>
              </div>
              <ArrowRight class="w-6 h-6 text-gray-300" />
              <div class="text-center">
                <p class="text-2xl font-bold text-primary-600">{{ application.duration }}</p>
                <p class="text-sm text-gray-500 mt-1">总天数</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex items-center">
            <Fence class="w-5 h-5 mr-2 text-primary-500" />
            围挡方案
          </div>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">围挡类型</span>
              <span class="text-sm text-gray-800">{{ application.hoarding_type }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">围挡尺寸</span>
              <span class="text-sm text-gray-800">{{ application.hoarding_width }}m × {{ application.hoarding_height }}m</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">尺寸符合要求</span>
              <span :class="['text-sm', application.hoarding_dimension_ok ? 'text-success-600' : 'text-danger-600']">
                {{ application.hoarding_dimension_ok ? '是' : '否' }}
              </span>
            </div>
            <div class="py-2">
              <span class="text-sm text-gray-500 block mb-1">围挡说明</span>
              <p class="text-sm text-gray-800">{{ application.hoarding_description || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex items-center">
            <Flame class="w-5 h-5 mr-2 text-primary-500" />
            消防材料
          </div>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">材料齐全</span>
              <span :class="['text-sm', application.fire_materials_complete ? 'text-success-600' : 'text-danger-600']">
                {{ application.fire_materials_complete ? '是' : '否' }}
              </span>
            </div>
            <div class="py-2">
              <span class="text-sm text-gray-500 block mb-1">材料清单</span>
              <p class="text-sm text-gray-800 whitespace-pre-wrap">{{ application.fire_materials || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex items-center">
            <Clock class="w-5 h-5 mr-2 text-primary-500" />
            限制时段
          </div>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-sm text-gray-500">噪音时段冲突</span>
              <span :class="['text-sm', application.time_conflict ? 'text-danger-600' : 'text-success-600']">
                {{ application.time_conflict ? '存在冲突' : '无冲突' }}
              </span>
            </div>
            <div class="py-2">
              <span class="text-sm text-gray-500 block mb-1">限制说明</span>
              <p class="text-sm text-gray-800">{{ application.restricted_time || '-' }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header flex items-center">
            <History class="w-5 h-5 mr-2 text-primary-500" />
            历史节点
          </div>
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div class="space-y-6">
              <div class="relative pl-10">
                <div class="absolute left-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <FileText class="w-3 h-3 text-white" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">申请提交</p>
                  <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(application.created_at) }}</p>
                </div>
              </div>
              <div v-if="application.engineer_reviewed_at" class="relative pl-10">
                <div :class="['absolute left-2 w-5 h-5 rounded-full flex items-center justify-center', application.status === 'engineer_approved' || application.status === 'fire_approved' || application.status === 'approved' || application.status === 'completed' ? 'bg-success-500' : 'bg-danger-500']">
                  <CheckCircle v-if="application.status !== 'rejected'" class="w-3 h-3 text-white" />
                  <XCircle v-else class="w-3 h-3 text-white" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">工程部审核</p>
                  <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(application.engineer_reviewed_at) }}</p>
                  <p v-if="application.engineer_comment" class="text-sm text-gray-600 mt-1">{{ application.engineer_comment }}</p>
                </div>
              </div>
              <div v-if="application.fire_reviewed_at" class="relative pl-10">
                <div :class="['absolute left-2 w-5 h-5 rounded-full flex items-center justify-center', application.status === 'fire_approved' || application.status === 'approved' || application.status === 'completed' ? 'bg-success-500' : 'bg-danger-500']">
                  <CheckCircle v-if="application.status !== 'rejected'" class="w-3 h-3 text-white" />
                  <XCircle v-else class="w-3 h-3 text-white" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">消防安全员复核</p>
                  <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(application.fire_reviewed_at) }}</p>
                  <p v-if="application.fire_comment" class="text-sm text-gray-600 mt-1">{{ application.fire_comment }}</p>
                </div>
              </div>
              <div v-if="application.manager_approved_at" class="relative pl-10">
                <div :class="['absolute left-2 w-5 h-5 rounded-full flex items-center justify-center', application.status === 'approved' || application.status === 'completed' ? 'bg-success-500' : 'bg-danger-500']">
                  <CheckCircle v-if="application.status !== 'rejected'" class="w-3 h-3 text-white" />
                  <XCircle v-else class="w-3 h-3 text-white" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">运营经理批准</p>
                  <p class="text-sm text-gray-500 mt-1">{{ formatDateTime(application.manager_approved_at) }}</p>
                  <p v-if="application.manager_comment" class="text-sm text-gray-600 mt-1">{{ application.manager_comment }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div v-if="application.status === 'submitted'" class="card">
          <div class="card-header">工程部审核</div>
          <div class="space-y-4">
            <textarea v-model="engineerComment" class="form-input" rows="3" placeholder="请输入审核意见"></textarea>
            <div class="flex space-x-3">
              <button @click="handleEngineerReview(false)" class="btn btn-danger flex-1">退回</button>
              <button @click="handleEngineerReview(true)" class="btn btn-success flex-1">通过</button>
            </div>
          </div>
        </div>

        <div v-if="application.status === 'engineer_approved'" class="card">
          <div class="card-header">消防安全员复核</div>
          <div class="space-y-4">
            <textarea v-model="fireComment" class="form-input" rows="3" placeholder="请输入复核意见"></textarea>
            <div class="flex space-x-3">
              <button @click="handleFireReview(false)" class="btn btn-danger flex-1">退回</button>
              <button @click="handleFireReview(true)" class="btn btn-success flex-1">通过</button>
            </div>
          </div>
        </div>

        <div v-if="application.status === 'fire_approved'" class="card">
          <div class="card-header">运营经理批准</div>
          <div v-if="!application.fire_materials_complete" class="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-danger-700 font-medium">警告：消防材料缺失，禁止开工</p>
          </div>
          <textarea v-model="managerComment" class="form-input" rows="3" placeholder="请输入批准意见"></textarea>
          <div class="flex space-x-3 mt-4">
            <button @click="handleManagerApproval(false)" class="btn btn-danger flex-1">退回</button>
            <button @click="handleManagerApproval(true)" :disabled="!application.fire_materials_complete" class="btn btn-success flex-1" :class="{ 'opacity-50 cursor-not-allowed': !application.fire_materials_complete }">
              批准开工
            </button>
          </div>
        </div>

        <div v-if="application.status === 'rejected'" class="card bg-danger-50">
          <div class="card-header text-danger-700">退回原因</div>
          <p class="text-sm text-gray-600">{{ application.reject_reason || '未填写退回原因' }}</p>
        </div>

        <div v-if="application.status === 'approved'" class="card bg-success-50">
          <div class="card-header text-success-700 flex items-center">
            <CheckCircle class="w-5 h-5 mr-2" />
            已批准开工
          </div>
          <p class="text-sm text-gray-600">该申请已通过所有审批流程，可以开工</p>
        </div>

        <button @click="$inertia.visit('/applications')" class="w-full btn btn-outline">返回列表</button>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref } from 'vue'
import Layout from '../Shared/Layout.vue'
import { Store, Calendar, ArrowRight, Fence, Flame, Clock, History, FileText, CheckCircle, XCircle } from 'lucide-vue-next'
import { router } from '@inertiajs/vue3'

const props = defineProps({
  application: Object
})

const engineerComment = ref('')
const fireComment = ref('')
const managerComment = ref('')

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const handleEngineerReview = (approved) => {
  router.put(`/applications/${props.application.id}/engineer-review`, {
    approved,
    comment: engineerComment.value
  })
}

const handleFireReview = (approved) => {
  router.put(`/applications/${props.application.id}/fire-review`, {
    approved,
    comment: fireComment.value
  })
}

const handleManagerApproval = (approved) => {
  if (!props.application.fire_materials_complete && approved) {
    alert('消防材料缺失，禁止开工')
    return
  }
  router.put(`/applications/${props.application.id}/manager-approval`, {
    approved,
    comment: managerComment.value
  })
}
</script>
