<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { applicationApi, merchantApi, shopUnitApi } from '../api'
import type { Application, Merchant, ShopUnit } from '../types'
import { statusLabels } from '../types'

const router = useRouter()
const applications = ref<Application[]>([])
const merchants = ref<Merchant[]>([])
const shopUnits = ref<ShopUnit[]>([])
const loading = ref(true)
const statusFilter = ref('')

const getMerchantName = (merchantId: string) => {
  const merchant = merchants.value.find(m => m.id === merchantId)
  return merchant?.name || '-'
}

const getShopUnitNumber = (shopUnitId: string) => {
  const unit = shopUnits.value.find(s => s.id === shopUnitId)
  return unit?.unitNumber || '-'
}

const getStatusClass = (status: string) => {
  if (['FIRE_PASSED', 'ARCHIVED'].includes(status)) return 'status-success'
  if (['FIRE_REJECTED'].includes(status)) return 'status-error'
  if (['DRAWINGS_MISSING'].includes(status)) return 'status-warning'
  return 'status-processing'
}

const filteredApplications = computed(() => {
  if (!statusFilter.value) return applications.value
  return applications.value.filter(app => app.status === statusFilter.value)
})

const loadData = async () => {
  try {
    loading.value = true
    const [apps, merchs, units] = await Promise.all([
      applicationApi.getAll(),
      merchantApi.getAll(),
      shopUnitApi.getAll()
    ])
    applications.value = apps
    merchants.value = merchs
    shopUnits.value = units
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const viewDetail = (id: string) => {
  router.push(`/application/${id}`)
}

const createNew = () => {
  router.push('/create')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="card-header" style="margin-bottom: 16px;">
      <h2 class="card-title">装修申请列表</h2>
      <button class="btn btn-primary" @click="createNew">
        + 新建申请
      </button>
    </div>

    <div class="card">
      <div class="flex justify-between align-center mb-2">
        <div class="flex gap-1">
          <select class="form-input" style="width: 200px;" v-model="statusFilter">
            <option value="">全部状态</option>
            <option value="SUBMITTED">已提交待审核</option>
            <option value="INVESTMENT_REVIEWED">投资主管已审核</option>
            <option value="ENGINEER_INSPECTED">工程人员已检查</option>
            <option value="FIRE_PASSED">消防验收通过</option>
            <option value="FIRE_REJECTED">消防验收驳回</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </div>
        <span class="text-muted">共 {{ filteredApplications.length }} 条记录</span>
      </div>

      <div v-if="loading" class="text-muted" style="text-align: center; padding: 40px;">
        加载中...
      </div>

      <table class="table" v-else>
        <thead>
          <tr>
            <th>项目名称</th>
            <th>商户</th>
            <th>铺位</th>
            <th>施工时间</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in filteredApplications" :key="app.id">
            <td style="font-weight: 500;">{{ app.projectName }}</td>
            <td>{{ getMerchantName(app.merchantId) }}</td>
            <td>{{ getShopUnitNumber(app.shopUnitId) }}</td>
            <td>
              {{ formatDate(app.constructionStart) }} ~ {{ formatDate(app.constructionEnd) }}
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(app.status)">
                {{ statusLabels[app.status as keyof typeof statusLabels] }}
              </span>
            </td>
            <td>{{ formatDate(app.createdAt) }}</td>
            <td>
              <button class="link-btn" @click="viewDetail(app.id)">查看详情</button>
            </td>
          </tr>
          <tr v-if="filteredApplications.length === 0">
            <td colspan="7" style="text-align: center; color: #8c8c8c; padding: 40px;">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
