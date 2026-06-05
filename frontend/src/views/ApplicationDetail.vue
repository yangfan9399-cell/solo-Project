<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applicationApi, userApi } from '../api'
import type { Application, User, InspectionResult } from '../types'
import { statusLabels, resultLabels, fileTypeLabels } from '../types'

const route = useRoute()
const router = useRouter()
const application = ref<Application | null>(null)
const loading = ref(true)
const activeTab = ref('basic')
const showActionModal = ref(false)
const currentAction = ref('')
const actionForm = ref<any>({})
const investmentManagers = ref<User[]>([])
const engineers = ref<User[]>([])
const fireInspectors = ref<User[]>([])
const showRescheduleModal = ref(false)
const rescheduleForm = ref({
  constructionStart: '',
  constructionEnd: ''
})
const timeConflict = ref(false)
const conflictMessage = ref('')

const isArchived = computed(() => application.value?.status === 'ARCHIVED')

const getStatusClass = (status: string) => {
  if (['FIRE_PASSED', 'ARCHIVED'].includes(status)) return 'status-success'
  if (['FIRE_REJECTED'].includes(status)) return 'status-error'
  if (['DRAWINGS_MISSING'].includes(status)) return 'status-warning'
  return 'status-processing'
}

const getResultClass = (result: string | undefined) => {
  if (!result) return 'timeline-dot'
  if (result === 'PASSED') return 'timeline-dot success'
  if (['REJECTED', 'TIME_CONFLICT'].includes(result)) return 'timeline-dot error'
  if (['NEEDS_RECTIFICATION', 'DRAWINGS_MISSING'].includes(result)) return 'timeline-dot warning'
  return 'timeline-dot active'
}

const loadApplication = async () => {
  try {
    loading.value = true
    const id = route.params.id as string
    application.value = await applicationApi.getById(id)
  } catch (error) {
    console.error('加载申请详情失败:', error)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  const [managers, engs, inspectors] = await Promise.all([
    userApi.getByRole('INVESTMENT_MANAGER'),
    userApi.getByRole('ENGINEER'),
    userApi.getByRole('FIRE_INSPECTOR')
  ])
  investmentManagers.value = managers
  engineers.value = engs
  fireInspectors.value = inspectors
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const pendingRectificationNode = computed(() => {
  if (!application.value || isArchived.value) return null
  return application.value.inspectionNodes.find(
    node => !node.result && 
            node.nodeType.includes('整改') &&
            node.rectificationRequirements
  ) || application.value.inspectionNodes.find(
    node => node.result === 'NEEDS_RECTIFICATION' && 
            node.rectifications.some(r => r.status === 'pending')
  )
})

const pendingEngineerNode = computed(() => {
  if (!application.value || isArchived.value) return null
  return application.value.inspectionNodes.find(
    node => !node.result && node.nodeType.includes('工程人员现场检查')
  )
})

const pendingFireNode = computed(() => {
  if (!application.value || isArchived.value) return null
  return application.value.inspectionNodes.find(
    node => !node.result && node.nodeType.includes('消防复核')
  )
})

const canDoInvestmentReview = computed(() => {
  if (isArchived.value || !application.value) return false
  const pendingNode = application.value.inspectionNodes.find(
    node => !node.result && node.nodeType === '投资主管审核'
  )
  return application.value.status === 'SUBMITTED' && !!pendingNode
})

const canDoEngineerInspection = computed(() => {
  if (isArchived.value || !application.value) return false
  return application.value.status === 'INVESTMENT_REVIEWED' && !!pendingEngineerNode.value
})

const canDoFireInspection = computed(() => {
  if (isArchived.value || !application.value) return false
  return application.value.status === 'ENGINEER_INSPECTED' && !!pendingFireNode.value
})

const canArchive = computed(() => {
  return application.value?.status === 'FIRE_PASSED' && !isArchived.value
})

const canRectify = computed(() => {
  return !!pendingRectificationNode.value
})

const openAction = (action: string) => {
  currentAction.value = action
  actionForm.value = {}
  showActionModal.value = true
}

const getActionUsers = () => {
  if (currentAction.value === 'investment') return investmentManagers.value
  if (currentAction.value === 'engineer') return engineers.value
  if (currentAction.value === 'fire') return fireInspectors.value
  if (currentAction.value === 'archive') return fireInspectors.value
  if (currentAction.value === 'rectify') return fireInspectors.value
  return []
}

const checkTimeConflict = async () => {
  if (!rescheduleForm.value.constructionStart || !rescheduleForm.value.constructionEnd) return
  try {
    const result = await applicationApi.checkTimeConflict({
      shopUnitId: application.value!.shopUnitId,
      constructionStart: new Date(rescheduleForm.value.constructionStart).toISOString(),
      constructionEnd: new Date(rescheduleForm.value.constructionEnd).toISOString(),
      excludeApplicationId: application.value!.id
    })
    timeConflict.value = result.hasConflict
    if (result.hasConflict) {
      conflictMessage.value = `施工时间与「${result.conflictingApplications[0]?.merchant?.name || '其他申请'}」的施工时间冲突，请调整`
    } else {
      conflictMessage.value = ''
    }
  } catch (error) {
    console.error('检查时间冲突失败:', error)
  }
}

const submitReschedule = async () => {
  if (timeConflict.value) {
    alert('请先解决时间冲突问题')
    return
  }
  try {
    await applicationApi.reschedule(application.value!.id, {
      constructionStart: new Date(rescheduleForm.value.constructionStart).toISOString(),
      constructionEnd: new Date(rescheduleForm.value.constructionEnd).toISOString()
    })
    showRescheduleModal.value = false
    loadApplication()
    alert('施工时间已更新')
  } catch (error: any) {
    alert(error || '更新失败')
  }
}

const submitAction = async () => {
  if (!application.value) return
  
  try {
    if (currentAction.value === 'investment') {
      await applicationApi.investmentReview(application.value.id, {
        investmentManagerId: actionForm.value.handlerId,
        drawings: actionForm.value.drawings
      })
    } else if (currentAction.value === 'engineer') {
      await applicationApi.engineerInspection(application.value.id, actionForm.value)
    } else if (currentAction.value === 'fire') {
      await applicationApi.fireInspection(application.value.id, actionForm.value)
    } else if (currentAction.value === 'archive') {
      await applicationApi.archive(application.value.id, actionForm.value)
    } else if (currentAction.value === 'rectify') {
      if (pendingRectificationNode.value) {
        await applicationApi.rectificationComplete(application.value.id, {
          handlerId: actionForm.value.handlerId,
          nodeId: pendingRectificationNode.value.id
        })
      }
    }
    
    showActionModal.value = false
    loadApplication()
    alert('操作成功')
  } catch (error: any) {
    alert(error || '操作失败')
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  loadApplication()
  loadUsers()
})
</script>

<template>
  <div>
    <div class="breadcrumb">
      <a href="#" @click.prevent="goBack">申请列表</a>
      <span class="breadcrumb-separator">/</span>
      <span>申请详情</span>
    </div>

    <div v-if="loading" class="card" style="text-align: center; padding: 60px;">
      加载中...
    </div>

    <div v-else-if="application" class="application-detail">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">{{ application.projectName }}</h2>
            <div class="text-muted mt-1">
              申请编号: {{ application.id.slice(0, 8).toUpperCase() }}
            </div>
          </div>
          <div class="flex gap-1 align-center">
            <span class="status-badge" :class="getStatusClass(application.status)">
              {{ statusLabels[application.status as keyof typeof statusLabels] }}
            </span>
            <button class="btn btn-default btn-sm" @click="goBack">返回列表</button>
          </div>
        </div>

        <div class="alert-info alert" v-if="isArchived">
          <strong>📦 已归档</strong> 该申请已完成所有流程并归档，当前为只读状态。
        </div>

        <div class="flex gap-2 mb-2" v-if="!isArchived">
          <button 
            v-if="canDoInvestmentReview" 
            class="btn btn-primary"
            @click="openAction('investment')"
          >
            投资主管审核
          </button>
          <button 
            v-if="canDoEngineerInspection" 
            class="btn btn-primary"
            @click="openAction('engineer')"
          >
            工程人员检查
          </button>
          <button 
            v-if="canDoFireInspection" 
            class="btn btn-primary"
            @click="openAction('fire')"
          >
            消防复核
          </button>
          <button 
            v-if="canRectify" 
            class="btn btn-warning"
            @click="openAction('rectify')"
          >
            完成整改
          </button>
          <button 
            v-if="canArchive" 
            class="btn btn-success"
            @click="openAction('archive')"
          >
            归档
          </button>
          <button 
            class="btn btn-default"
            @click="showRescheduleModal = true"
          >
            调整施工时间
          </button>
        </div>
      </div>

      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: activeTab === 'basic' }"
          @click="activeTab = 'basic'"
        >
          基本信息
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'drawings' }"
          @click="activeTab = 'drawings'"
        >
          图纸资料 ({{ application.drawings.length }})
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'timeline' }"
          @click="activeTab = 'timeline'"
        >
          验收节点
        </div>
        <div 
          class="tab" 
          :class="{ active: activeTab === 'persons' }"
          @click="activeTab = 'persons'"
        >
          责任人 ({{ application.responsiblePersons.length }})
        </div>
      </div>

      <div v-show="activeTab === 'basic'" class="card">
        <h3 class="card-title mb-2">项目信息</h3>
        <div class="grid grid-2">
          <div class="info-item">
            <div class="info-label">商户名称</div>
            <div class="info-value">{{ application.merchant.name }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">商户类型</div>
            <div class="info-value">{{ application.merchant.businessType }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">铺位编号</div>
            <div class="info-value">{{ application.shopUnit.unitNumber }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">所在楼层</div>
            <div class="info-value">{{ application.shopUnit.floor }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">铺位面积</div>
            <div class="info-value">{{ application.shopUnit.area }} ㎡</div>
          </div>
          <div class="info-item">
            <div class="info-label">工程预算</div>
            <div class="info-value">
              {{ application.estimatedCost ? '¥' + application.estimatedCost.toLocaleString() : '-' }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">施工开始</div>
            <div class="info-value">{{ formatDate(application.constructionStart) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">施工结束</div>
            <div class="info-value">{{ formatDate(application.constructionEnd) }}</div>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <div class="info-label">工程范围</div>
            <div class="info-value">{{ application.projectScope }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">招商主管</div>
            <div class="info-value">{{ application.investmentManager?.name || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ formatDateTime(application.createdAt) }}</div>
          </div>
        </div>

        <h3 class="card-title mt-3 mb-2">商户联系人</h3>
        <div class="grid grid-2">
          <div class="info-item">
            <div class="info-label">联系人</div>
            <div class="info-value">{{ application.merchant.contactName }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">联系电话</div>
            <div class="info-value">{{ application.merchant.phone }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ application.merchant.email }}</div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'drawings'" class="card">
        <h3 class="card-title mb-2">图纸资料</h3>
        <div v-if="application.drawings.length === 0" class="text-muted" style="text-align: center; padding: 40px;">
          暂无图纸资料
        </div>
        <ul class="file-list" v-else>
          <li v-for="drawing in application.drawings" :key="drawing.id" class="file-item">
            <div class="file-icon">📄</div>
            <div class="file-info">
              <div class="file-name">{{ drawing.name }}</div>
              <div class="file-meta">
                类型: {{ fileTypeLabels[drawing.type] }} | 
                上传人: {{ drawing.uploadedBy.name }} | 
                上传时间: {{ formatDateTime(drawing.uploadedAt) }}
              </div>
              <div class="file-meta" v-if="drawing.description">
                说明: {{ drawing.description }}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div v-show="activeTab === 'timeline'" class="card">
        <h3 class="card-title mb-2">验收节点流程</h3>
        <div class="timeline">
          <div 
            v-for="node in application.inspectionNodes" 
            :key="node.id" 
            class="timeline-item"
          >
            <div :class="getResultClass(node.result)"></div>
            <div class="timeline-content">
              <div class="timeline-title flex justify-between align-center">
                <span>{{ node.nodeType }}</span>
                <span 
                  v-if="node.result" 
                  class="status-badge"
                  :class="{
                    'status-success': node.result === 'PASSED',
                    'status-error': ['REJECTED', 'TIME_CONFLICT'].includes(node.result),
                    'status-warning': ['NEEDS_RECTIFICATION', 'DRAWINGS_MISSING'].includes(node.result)
                  }"
                >
                  {{ resultLabels[node.result as InspectionResult] }}
                </span>
                <span v-else class="status-badge status-default">待处理</span>
              </div>
              <div class="timeline-desc" v-if="node.remarks">
                {{ node.remarks }}
              </div>
              <div class="timeline-desc" v-if="node.rectificationRequirements">
                <strong>整改要求:</strong> {{ node.rectificationRequirements }}
              </div>
              <div class="timeline-desc" v-if="node.rectificationDeadline">
                <strong>整改截止:</strong> {{ formatDateTime(node.rectificationDeadline) }}
              </div>
              <div class="timeline-time" v-if="node.handler">
                处理人: {{ node.handler.name }} | 
                处理时间: {{ formatDateTime(node.handledAt) }}
              </div>
              
              <div v-if="node.rectifications.length > 0" class="mt-1">
                <div 
                  v-for="rect in node.rectifications" 
                  :key="rect.id"
                  class="alert"
                  :class="rect.status === 'completed' ? 'alert-info' : 'alert-warning'"
                >
                  <strong>{{ rect.status === 'completed' ? '✅ 已整改' : '⚠️ 待整改' }}:</strong>
                  {{ rect.description }}
                  <span v-if="rect.completedAt" class="text-muted" style="font-size: 12px; margin-left: 8px;">
                    完成时间: {{ formatDateTime(rect.completedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeTab === 'persons'" class="card">
        <h3 class="card-title mb-2">项目责任人</h3>
        <div v-if="application.responsiblePersons.length === 0" class="text-muted" style="text-align: center; padding: 40px;">
          暂无责任人信息
        </div>
        <div v-else>
          <div 
            v-for="person in application.responsiblePersons" 
            :key="person.id"
            class="person-card"
          >
            <div class="person-avatar">{{ person.name[0] }}</div>
            <div class="person-info">
              <div class="person-name">{{ person.name }}</div>
              <div class="person-role">{{ person.role }}</div>
              <div class="person-contact">
                📞 {{ person.phone }}
                <span v-if="person.email" style="margin-left: 16px;">📧 {{ person.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showActionModal" class="modal-overlay" @click.self="showActionModal = false">
      <div class="modal">
        <div class="modal-header">
          {{ 
            currentAction === 'investment' ? '投资主管审核' :
            currentAction === 'engineer' ? '工程人员现场检查' :
            currentAction === 'fire' ? '消防复核' :
            currentAction === 'rectify' ? '完成整改' :
            '归档确认'
          }}
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              {{ 
                currentAction === 'investment' ? '招商主管' :
                currentAction === 'engineer' ? '工程人员' :
                currentAction === 'rectify' ? '消防复核人' :
                '消防复核人'
              }}
            </label>
            <select class="form-input" v-model="actionForm.handlerId">
              <option value="">请选择</option>
              <option v-for="user in getActionUsers()" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>

          <div class="form-group" v-if="currentAction === 'investment'">
            <label class="form-label">上传图纸 (可选)</label>
            <div class="text-muted mb-1" style="font-size: 12px;">
              当前仅演示，实际项目中需实现文件上传功能
            </div>
          </div>

          <div class="form-group" v-if="['engineer', 'fire'].includes(currentAction)">
            <label class="form-label">检查结果</label>
            <select class="form-input" v-model="actionForm.result">
              <option value="">请选择</option>
              <option value="PASSED">通过</option>
              <option v-if="currentAction === 'engineer'" value="DRAWINGS_MISSING">图纸缺失</option>
              <option v-if="currentAction === 'engineer'" value="TIME_CONFLICT">施工时间冲突</option>
              <option value="NEEDS_RECTIFICATION">需整改</option>
              <option value="REJECTED">驳回</option>
            </select>
          </div>

          <div class="form-group" v-if="['engineer', 'fire'].includes(currentAction)">
            <label class="form-label">意见/备注</label>
            <textarea 
              class="form-input form-textarea" 
              v-model="actionForm.remarks"
              placeholder="请输入检查意见..."
            ></textarea>
          </div>

          <div class="form-group" v-if="currentAction === 'fire' && actionForm.result === 'NEEDS_RECTIFICATION'">
            <label class="form-label">整改要求</label>
            <textarea 
              class="form-input form-textarea" 
              v-model="actionForm.rectificationRequirements"
              placeholder="请详细说明整改要求..."
            ></textarea>
          </div>

          <div class="form-group" v-if="currentAction === 'fire' && actionForm.result === 'NEEDS_RECTIFICATION'">
            <label class="form-label">整改截止日期</label>
            <input 
              type="datetime-local" 
              class="form-input" 
              v-model="actionForm.rectificationDeadline"
            >
          </div>

          <div v-if="currentAction === 'rectify'" class="alert alert-info">
            确认整改已完成，提交后将标记整改为已完成状态
          </div>

          <div v-if="currentAction === 'archive'" class="alert alert-info">
            归档后申请将变为只读状态，不可再修改。确认归档？
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showActionModal = false">取消</button>
          <button class="btn btn-primary" @click="submitAction">确认提交</button>
        </div>
      </div>
    </div>

    <div v-if="showRescheduleModal" class="modal-overlay" @click.self="showRescheduleModal = false">
      <div class="modal">
        <div class="modal-header">调整施工时间</div>
        <div class="modal-body">
          <div class="alert alert-info">
            原施工时间: {{ formatDate(application?.constructionStart || '') }} ~ {{ formatDate(application?.constructionEnd || '') }}
          </div>
          
          <div class="form-group">
            <label class="form-label">新施工开始时间</label>
            <input 
              type="datetime-local" 
              class="form-input" 
              v-model="rescheduleForm.constructionStart"
              @change="checkTimeConflict"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">新施工结束时间</label>
            <input 
              type="datetime-local" 
              class="form-input" 
              v-model="rescheduleForm.constructionEnd"
              @change="checkTimeConflict"
            >
          </div>

          <div v-if="timeConflict" class="alert alert-error">
            ⚠️ {{ conflictMessage }}
          </div>
          <div v-else-if="rescheduleForm.constructionStart && rescheduleForm.constructionEnd && !timeConflict" class="alert alert-info">
            ✅ 施工时间可用
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showRescheduleModal = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="submitReschedule"
            :disabled="timeConflict"
          >
            确认调整
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.application-detail {
  padding-bottom: 40px;
}
</style>
