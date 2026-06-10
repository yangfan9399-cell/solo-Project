<template>
  <Layout title="申请列表">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-800">装修申请列表</h2>
      <button @click="showForm = true" class="btn btn-primary flex items-center">
        <Plus class="w-5 h-5 mr-2" />
        新增申请
      </button>
    </div>

    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">商户名称</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">楼层/铺位</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">施工周期</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">消防材料</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in applications" :key="item.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 text-sm text-gray-800">{{ item.merchant_name }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ item.merchant_type }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ item.floor }}F / {{ item.shop_number }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}</td>
              <td class="py-3 px-4">
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', item.fire_materials_complete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']">
                  {{ item.fire_materials_complete ? '已齐全' : '缺失' }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', item.status_class]">
                  {{ item.status_text }}
                </span>
              </td>
              <td class="py-3 px-4">
                <button @click="$inertia.visit(`/applications/${item.id}`)" class="text-sm text-primary-600 hover:text-primary-700 mr-3">
                  详情
                </button>
                <button @click="deleteApplication(item.id)" class="text-sm text-danger-600 hover:text-danger-700">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showForm = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">新增装修申请</h3>
        </div>
        <div class="p-6">
          <form @submit.prevent="submitForm">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">商户名称 *</label>
                <input v-model="form.merchant_name" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">商户类型 *</label>
                <select v-model="form.merchant_type" class="form-select" required>
                  <option value="">请选择</option>
                  <option value="餐饮">餐饮</option>
                  <option value="零售">零售</option>
                  <option value="娱乐">娱乐</option>
                  <option value="服务">服务</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">楼层 *</label>
                <select v-model="form.floor" class="form-select" required>
                  <option value="">请选择</option>
                  <option value="B1">B1</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">铺位号 *</label>
                <input v-model="form.shop_number" type="text" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">开始日期 *</label>
                <input v-model="form.start_date" type="date" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">结束日期 *</label>
                <input v-model="form.end_date" type="date" class="form-input" required />
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">施工范围</label>
                <textarea v-model="form.construction_scope" class="form-input" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">围挡类型 *</label>
                <select v-model="form.hoarding_type" class="form-select" required>
                  <option value="">请选择</option>
                  <option value="标准围挡">标准围挡</option>
                  <option value="广告围挡">广告围挡</option>
                  <option value="透明围挡">透明围挡</option>
                  <option value="临时围挡">临时围挡</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">围挡宽度(m) *</label>
                <input v-model.number="form.hoarding_width" type="number" step="0.1" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">围挡高度(m) *</label>
                <input v-model.number="form.hoarding_height" type="number" step="0.1" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">围挡尺寸符合要求</label>
                <label class="flex items-center cursor-pointer mt-1">
                  <input v-model="form.hoarding_dimension_ok" type="checkbox" class="w-4 h-4 text-primary-500" />
                  <span class="ml-2 text-sm text-gray-700">符合要求</span>
                </label>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">围挡说明</label>
                <textarea v-model="form.hoarding_description" class="form-input" rows="2"></textarea>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">消防材料清单</label>
                <textarea v-model="form.fire_materials" class="form-input" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">消防材料齐全</label>
                <label class="flex items-center cursor-pointer mt-1">
                  <input v-model="form.fire_materials_complete" type="checkbox" class="w-4 h-4 text-primary-500" />
                  <span class="ml-2 text-sm text-gray-700">已齐全</span>
                </label>
              </div>
              <div class="form-group">
                <label class="form-label">噪音限制时段冲突</label>
                <label class="flex items-center cursor-pointer mt-1">
                  <input v-model="form.time_conflict" type="checkbox" class="w-4 h-4 text-primary-500" />
                  <span class="ml-2 text-sm text-gray-700">存在冲突</span>
                </label>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">限制时段说明</label>
                <textarea v-model="form.restricted_time" class="form-input" rows="2"></textarea>
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" @click="showForm = false" class="btn btn-outline">取消</button>
              <button type="submit" class="btn btn-primary">提交申请</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Layout from '../Shared/Layout.vue'
import { Plus } from 'lucide-vue-next'
import { router } from '@inertiajs/vue3'

defineProps({
  applications: Array
})

const showForm = ref(false)
const form = reactive({
  merchant_name: '',
  merchant_type: '',
  floor: '',
  shop_number: '',
  start_date: '',
  end_date: '',
  construction_scope: '',
  hoarding_type: '',
  hoarding_width: 0,
  hoarding_height: 0,
  hoarding_description: '',
  fire_materials: '',
  fire_materials_complete: false,
  restricted_time: '',
  time_conflict: false,
  hoarding_dimension_ok: true,
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const submitForm = () => {
  router.post('/applications', form)
}

const deleteApplication = (id) => {
  if (confirm('确定要删除该申请吗？')) {
    router.delete(`/applications/${id}`)
  }
}
</script>
