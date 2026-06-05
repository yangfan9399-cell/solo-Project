<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { applicationApi, merchantApi, shopUnitApi } from '../api'
import type { Merchant, ShopUnit } from '../types'

const router = useRouter()
const merchants = ref<Merchant[]>([])
const shopUnits = ref<ShopUnit[]>([])
const loading = ref(false)
const timeConflict = ref(false)
const conflictMessage = ref('')

const form = reactive({
  merchantId: '',
  shopUnitId: '',
  projectName: '',
  constructionStart: '',
  constructionEnd: '',
  estimatedCost: '',
  projectScope: '',
  responsiblePersons: [
    { name: '', role: '商户负责人', phone: '', email: '' }
  ]
})

const loadData = async () => {
  const [merchs, units] = await Promise.all([
    merchantApi.getAll(),
    shopUnitApi.getAll()
  ])
  merchants.value = merchs
  shopUnits.value = units
}

const checkTimeConflict = async () => {
  if (!form.shopUnitId || !form.constructionStart || !form.constructionEnd) return
  
  try {
    const result = await applicationApi.checkTimeConflict({
      shopUnitId: form.shopUnitId,
      constructionStart: new Date(form.constructionStart).toISOString(),
      constructionEnd: new Date(form.constructionEnd).toISOString()
    })
    timeConflict.value = result.hasConflict
    if (result.hasConflict) {
      conflictMessage.value = `施工时间与「${result.conflictingApplications[0]?.merchant?.name || '其他申请'}」的施工时间冲突，请调整施工时段`
    } else {
      conflictMessage.value = ''
    }
  } catch (error) {
    console.error('检查时间冲突失败:', error)
  }
}

const addResponsiblePerson = () => {
  form.responsiblePersons.push({ name: '', role: '', phone: '', email: '' })
}

const removeResponsiblePerson = (index: number) => {
  form.responsiblePersons.splice(index, 1)
}

const submit = async () => {
  if (timeConflict.value) {
    alert('请先解决施工时间冲突问题')
    return
  }

  if (!form.merchantId || !form.shopUnitId || !form.projectName || 
      !form.constructionStart || !form.constructionEnd || !form.projectScope) {
    alert('请填写必填项')
    return
  }

  try {
    loading.value = true
    await applicationApi.create({
      merchantId: form.merchantId,
      shopUnitId: form.shopUnitId,
      projectName: form.projectName,
      constructionStart: new Date(form.constructionStart).toISOString(),
      constructionEnd: new Date(form.constructionEnd).toISOString(),
      estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
      projectScope: form.projectScope,
      responsiblePersons: form.responsiblePersons.filter(p => p.name && p.phone)
    })
    alert('申请创建成功')
    router.push('/')
  } catch (error: any) {
    alert(error || '创建失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <div class="breadcrumb">
      <a href="#" @click.prevent="goBack">申请列表</a>
      <span class="breadcrumb-separator">/</span>
      <span>新建申请</span>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">新建装修申请</h2>
      </div>

      <div class="row">
        <div class="col">
          <div class="form-group">
            <label class="form-label">商户 <span style="color: #ff4d4f;">*</span></label>
            <select class="form-input" v-model="form.merchantId">
              <option value="">请选择商户</option>
              <option v-for="merchant in merchants" :key="merchant.id" :value="merchant.id">
                {{ merchant.name }} ({{ merchant.businessType }})
              </option>
            </select>
          </div>
        </div>
        <div class="col">
          <div class="form-group">
            <label class="form-label">铺位 <span style="color: #ff4d4f;">*</span></label>
            <select class="form-input" v-model="form.shopUnitId" @change="checkTimeConflict">
              <option value="">请选择铺位</option>
              <option v-for="unit in shopUnits" :key="unit.id" :value="unit.id">
                {{ unit.unitNumber }} - {{ unit.floor }} ({{ unit.area }}㎡)
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">项目名称 <span style="color: #ff4d4f;">*</span></label>
        <input 
          type="text" 
          class="form-input" 
          v-model="form.projectName" 
          placeholder="请输入项目名称，如：XX店铺装修工程"
        >
      </div>

      <div class="row">
        <div class="col">
          <div class="form-group">
            <label class="form-label">施工开始时间 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="datetime-local" 
              class="form-input" 
              v-model="form.constructionStart"
              @change="checkTimeConflict"
            >
          </div>
        </div>
        <div class="col">
          <div class="form-group">
            <label class="form-label">施工结束时间 <span style="color: #ff4d4f;">*</span></label>
            <input 
              type="datetime-local" 
              class="form-input" 
              v-model="form.constructionEnd"
              @change="checkTimeConflict"
            >
          </div>
        </div>
      </div>

      <div v-if="timeConflict" class="alert alert-error">
        ⚠️ {{ conflictMessage }}
      </div>
      <div v-else-if="form.shopUnitId && form.constructionStart && form.constructionEnd && !timeConflict" class="alert alert-info">
        ✅ 施工时间可用
      </div>

      <div class="form-group">
        <label class="form-label">工程预算 (元)</label>
        <input 
          type="number" 
          class="form-input" 
          v-model="form.estimatedCost" 
          placeholder="请输入工程预算"
        >
      </div>

      <div class="form-group">
        <label class="form-label">工程范围 <span style="color: #ff4d4f;">*</span></label>
        <textarea 
          class="form-input form-textarea" 
          v-model="form.projectScope" 
          placeholder="请详细描述工程范围，包括水电改造、装修内容等"
        ></textarea>
      </div>

      <div class="form-group">
        <div class="flex justify-between align-center mb-1">
          <label class="form-label" style="margin-bottom: 0;">责任人</label>
          <button 
            type="button" 
            class="btn btn-default btn-sm" 
            @click="addResponsiblePerson"
          >
            + 添加责任人
          </button>
        </div>
        
        <div 
          v-for="(person, index) in form.responsiblePersons" 
          :key="index"
          class="card" 
          style="background: #fafafa; padding: 16px; margin-bottom: 12px;"
        >
          <div class="flex justify-between align-center mb-1">
            <span style="font-weight: 500;">责任人 {{ index + 1 }}</span>
            <button 
              v-if="form.responsiblePersons.length > 1"
              type="button" 
              class="link-btn" 
              style="color: #ff4d4f;"
              @click="removeResponsiblePerson(index)"
            >
              删除
            </button>
          </div>
          <div class="row" style="margin-bottom: 0;">
            <div class="col">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">姓名</label>
                <input type="text" class="form-input" v-model="person.name">
              </div>
            </div>
            <div class="col">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">角色</label>
                <input type="text" class="form-input" v-model="person.role">
              </div>
            </div>
          </div>
          <div class="row" style="margin-bottom: 0;">
            <div class="col">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">电话</label>
                <input type="text" class="form-input" v-model="person.phone">
              </div>
            </div>
            <div class="col">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">邮箱</label>
                <input type="email" class="form-input" v-model="person.email">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-1" style="margin-top: 24px;">
        <button class="btn btn-default" @click="goBack">取消</button>
        <button 
          class="btn btn-primary" 
          @click="submit" 
          :disabled="loading || timeConflict"
        >
          {{ loading ? '提交中...' : '提交申请' }}
        </button>
      </div>
    </div>
  </div>
</template>
