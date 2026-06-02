<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">量具台账</h1>
        <p class="text-gray-500 mt-1">管理所有量具的基本信息</p>
      </div>
      <button v-if="hasRole(['admin'])" @click="showCreateModal = true" class="btn btn-primary">
        + 新增量具
      </button>
    </div>

    <div class="card p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="label">搜索</label>
          <input v-model="searchQuery" type="text" class="input" placeholder="编号、名称、序列号" @input="handleSearch" />
        </div>
        <div>
          <label class="label">状态</label>
          <select v-model="statusFilter" class="input" @change="loadTools">
            <option value="all">全部状态</option>
            <option value="available">可用</option>
            <option value="borrowed">借用中</option>
            <option value="calibrating">校准中</option>
            <option value="maintenance">维护中</option>
            <option value="scrapped">已报废</option>
          </select>
        </div>
        <div>
          <label class="label">部门</label>
          <select v-model="departmentFilter" class="input" @change="loadTools">
            <option value="all">全部部门</option>
            <option value="质量部">质量部</option>
            <option value="生产一部">生产一部</option>
            <option value="生产二部">生产二部</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="loadTools" class="btn btn-secondary w-full">
            刷新
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card p-8">
      <LoadingSpinner text="加载量具列表中..." />
    </div>

    <div v-else-if="error" class="card p-8">
      <ErrorState :message="error" @retry="loadTools" />
    </div>

    <div v-else class="card overflow-hidden">
      <EmptyState v-if="tools.length === 0" title="暂无量具数据" description="点击右上角按钮添加第一个量具" />
      
      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">编号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格型号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下次校准</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="tool in tools" :key="tool.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="font-mono text-sm text-gray-900">{{ tool.code }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="font-medium text-gray-900">{{ tool.name }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ tool.specification || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ tool.department || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center space-x-2">
                <span class="badge" :class="getToolStatusColor(tool.status)">
                  {{ getToolStatusLabel(tool.status) }}
                </span>
                <span v-if="tool.hasPendingBorrow" class="badge badge-yellow">
                  待审批
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span v-if="tool.nextCalibrationDate" :class="isCalibrationOverdue(tool.nextCalibrationDate) ? 'text-red-600 font-medium' : 'text-gray-500'">
                {{ formatDate(tool.nextCalibrationDate) }}
                <span v-if="isCalibrationOverdue(tool.nextCalibrationDate)" class="ml-1 text-xs">(逾期)</span>
              </span>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <button @click="viewTool(tool.id)" class="text-primary-600 hover:text-primary-700 mr-3">查看</button>
              <button v-if="hasRole(['admin'])" @click="editTool(tool)" class="text-primary-600 hover:text-primary-700 mr-3">编辑</button>
              <button v-if="hasRole(['admin']) && tool.status !== 'borrowed' && tool.status !== 'scrapped'" @click="showScrapModal(tool)" class="text-red-600 hover:text-red-700">报废</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="showCreateModal || showEditModal" :title="showCreateModal ? '新增量具' : '编辑量具'" :show="showCreateModal || showEditModal" @close="closeModal">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">量具编号 *</label>
            <input v-model="formData.code" type="text" class="input" required />
          </div>
          <div>
            <label class="label">量具名称 *</label>
            <input v-model="formData.name" type="text" class="input" required />
          </div>
          <div>
            <label class="label">规格型号</label>
            <input v-model="formData.specification" type="text" class="input" />
          </div>
          <div>
            <label class="label">制造厂商</label>
            <input v-model="formData.manufacturer" type="text" class="input" />
          </div>
          <div>
            <label class="label">出厂编号</label>
            <input v-model="formData.serialNumber" type="text" class="input" />
          </div>
          <div>
            <label class="label">测量范围</label>
            <input v-model="formData.measurementRange" type="text" class="input" />
          </div>
          <div>
            <label class="label">精度等级</label>
            <input v-model="formData.accuracy" type="text" class="input" />
          </div>
          <div>
            <label class="label">所属部门</label>
            <select v-model="formData.department" class="input">
              <option value="">请选择</option>
              <option value="质量部">质量部</option>
              <option value="生产一部">生产一部</option>
              <option value="生产二部">生产二部</option>
            </select>
          </div>
          <div>
            <label class="label">存放位置</label>
            <input v-model="formData.location" type="text" class="input" />
          </div>
          <div>
            <label class="label">校准周期(天) *</label>
            <input v-model.number="formData.calibrationCycleDays" type="number" class="input" min="1" required />
          </div>
          <div>
            <label class="label">状态</label>
            <select v-model="formData.status" class="input">
              <option value="available">可用</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
          <div>
            <label class="label">上次校准日期</label>
            <input v-model="formData.lastCalibrationDate" type="date" class="input" />
          </div>
          <div>
            <label class="label">下次校准日期</label>
            <input v-model="formData.nextCalibrationDate" type="date" class="input" />
          </div>
          <div>
            <label class="label">购置日期</label>
            <input v-model="formData.purchaseDate" type="date" class="input" />
          </div>
          <div>
            <label class="label">价格(元)</label>
            <input v-model.number="formData.price" type="number" class="input" min="0" step="0.01" />
          </div>
        </div>
        <div>
          <label class="label">备注</label>
          <textarea v-model="formData.remark" class="input" rows="3"></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="closeModal" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal v-if="showScrap" title="报废量具" :show="showScrap" @close="showScrap = false">
      <div class="mb-4">
        <p class="text-gray-600">确定要报废以下量具吗？</p>
        <p class="font-medium mt-2">{{ scrapTool?.code }} - {{ scrapTool?.name }}</p>
      </div>
      <div class="mb-6">
        <label class="label">报废原因</label>
        <textarea v-model="scrapReason" class="input" rows="3" required></textarea>
      </div>
      <div class="flex justify-end space-x-3">
        <button @click="showScrap = false" class="btn btn-secondary">取消</button>
        <button @click="handleScrap" class="btn btn-danger" :disabled="submitting">
          {{ submitting ? '处理中...' : '确认报废' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { Tool } from '../types'
import { getToolStatusLabel, getToolStatusColor, canBorrowTool } from '../composables/useTools'

const { tools, loading, error, fetchTools, createTool, updateTool, scrapTool: scrapToolApi } = useTools()
const { hasRole } = useAuth()

const searchQuery = ref('')
const statusFilter = ref('all')
const departmentFilter = ref('all')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showScrap = ref(false)
const submitting = ref(false)
const editingTool = ref<Tool | null>(null)
const scrapTool = ref<Tool | null>(null)
const scrapReason = ref('')

const formData = ref({
  code: '',
  name: '',
  specification: '',
  manufacturer: '',
  serialNumber: '',
  measurementRange: '',
  accuracy: '',
  department: '',
  location: '',
  status: 'available' as const,
  calibrationCycleDays: 365,
  lastCalibrationDate: '',
  nextCalibrationDate: '',
  purchaseDate: '',
  price: 0,
  remark: ''
})

let searchTimeout: ReturnType<typeof setTimeout>

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadTools, 300)
}

function loadTools() {
  fetchTools({
    status: statusFilter.value,
    search: searchQuery.value,
    department: departmentFilter.value
  })
}

function viewTool(id: number) {
  navigateTo(`/tools/${id}`)
}

function editTool(tool: Tool) {
  editingTool.value = tool
  formData.value = {
    code: tool.code,
    name: tool.name,
    specification: tool.specification,
    manufacturer: tool.manufacturer,
    serialNumber: tool.serialNumber,
    measurementRange: tool.measurementRange,
    accuracy: tool.accuracy,
    department: tool.department,
    location: tool.location,
    status: tool.status,
    calibrationCycleDays: tool.calibrationCycleDays,
    lastCalibrationDate: tool.lastCalibrationDate || '',
    nextCalibrationDate: tool.nextCalibrationDate || '',
    purchaseDate: tool.purchaseDate,
    price: tool.price,
    remark: tool.remark
  }
  showEditModal.value = true
}

function showScrapModal(tool: Tool) {
  scrapTool.value = tool
  scrapReason.value = ''
  showScrap.value = true
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  editingTool.value = null
  resetForm()
}

function resetForm() {
  formData.value = {
    code: '',
    name: '',
    specification: '',
    manufacturer: '',
    serialNumber: '',
    measurementRange: '',
    accuracy: '',
    department: '',
    location: '',
    status: 'available',
    calibrationCycleDays: 365,
    lastCalibrationDate: '',
    nextCalibrationDate: '',
    purchaseDate: '',
    price: 0,
    remark: ''
  }
}

async function handleSubmit() {
  submitting.value = true
  try {
    if (showEditModal.value && editingTool.value) {
      await updateTool(editingTool.value.id, formData.value)
    } else {
      await createTool(formData.value)
    }
    closeModal()
    loadTools()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleScrap() {
  if (!scrapTool.value || !scrapReason.value) return
  submitting.value = true
  try {
    await scrapToolApi(scrapTool.value.id, scrapReason.value)
    showScrap.value = false
    loadTools()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function isCalibrationOverdue(dateStr: string): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  return date < today
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr
}

loadTools()
</script>
