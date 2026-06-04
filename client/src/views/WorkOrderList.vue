<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import {
  getWorkOrders,
  getOverviewStats,
  submitHandover,
  submitQuality,
  submitRework,
  type HandoverRequest,
  type QualityRequest,
  type ReworkRequest
} from '@/api';
import type { WorkOrder, WorkOrderProcess, HandoverRecord } from '@/types';
import { ProcessStatus, QualityDecision, UserRole, ReworkConclusion } from '@/types';
import dayjs from 'dayjs';

const router = useRouter();
const userStore = useUserStore();
const { currentUser, isOperator, isQualityInspector } = storeToRefs(userStore);

const workOrders = ref<WorkOrder[]>([]);
const overviewStats = ref<any>(null);
const loading = ref(true);

const showHandoverModal = ref(false);
const showQualityModal = ref(false);
const showReworkModal = ref(false);

const selectedProcess = ref<WorkOrderProcess | null>(null);
const selectedHandover = ref<HandoverRecord | null>(null);

const handoverForm = ref<HandoverRequest>({
  workOrderId: '',
  processId: '',
  operatorId: '',
  handoverNote: '',
  quantity: 0
});

const qualityForm = ref<QualityRequest>({
  handoverId: '',
  inspectorId: '',
  decision: 'PASS',
  evidence: '',
  rejectReason: ''
});

const reworkForm = ref<ReworkRequest>({
  processId: '',
  operatorId: '',
  reworkReason: '',
  reworkMaterials: '',
  reworkNote: '',
  reworkConclusion: undefined
});

const alertMessage = ref('');
const alertType = ref<'success' | 'error' | 'warning'>('error');
const showAlert = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const [orders, stats] = await Promise.all([
      getWorkOrders(),
      getOverviewStats()
    ]);
    workOrders.value = orders;
    overviewStats.value = stats;
  } catch (e: any) {
    showAlertMessage(e.message, 'error');
  } finally {
    loading.value = false;
  }
}

function showAlertMessage(message: string, type: 'success' | 'error' | 'warning') {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 3000);
}

function openHandoverModal(order: WorkOrder, process: WorkOrderProcess) {
  if (!currentUser.value) return;
  selectedProcess.value = process;
  handoverForm.value = {
    workOrderId: order.id,
    processId: process.id,
    operatorId: currentUser.value.id,
    handoverNote: '',
    quantity: order.quantity
  };
  showHandoverModal.value = true;
}

async function submitHandoverForm() {
  if (!handoverForm.value.handoverNote.trim()) {
    showAlertMessage('请填写交接说明', 'warning');
    return;
  }
  try {
    await submitHandover(handoverForm.value);
    showAlertMessage('交接提交成功，等待质检', 'success');
    showHandoverModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(e.message, 'error');
  }
}

function openQualityModal(handover: HandoverRecord) {
  if (!currentUser.value) return;
  selectedHandover.value = handover;
  qualityForm.value = {
    handoverId: handover.id,
    inspectorId: currentUser.value.id,
    decision: 'PASS',
    evidence: '',
    rejectReason: ''
  };
  showQualityModal.value = true;
}

async function submitQualityForm() {
  if (qualityForm.value.decision === 'REJECT' && !qualityForm.value.rejectReason?.trim()) {
    showAlertMessage('退回时必须填写退回原因', 'warning');
    return;
  }
  if (qualityForm.value.decision === 'ARCHIVE' && !qualityForm.value.evidence?.trim()) {
    showAlertMessage('归档时必须填写质检证据', 'warning');
    return;
  }
  try {
    await submitQuality(qualityForm.value);
    const decisionText = {
      PASS: '放行',
      REJECT: '退回',
      ARCHIVE: '归档'
    }[qualityForm.value.decision];
    showAlertMessage(`质检${decisionText}成功`, 'success');
    showQualityModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(e.message, 'error');
  }
}

function openReworkModal(process: WorkOrderProcess) {
  if (!currentUser.value) return;
  selectedProcess.value = process;
  reworkForm.value = {
    processId: process.id,
    operatorId: currentUser.value.id,
    reworkReason: '',
    reworkMaterials: '',
    reworkNote: '',
    reworkConclusion: undefined
  };
  showReworkModal.value = true;
}

async function submitReworkForm() {
  if (!reworkForm.value.reworkReason.trim() || !reworkForm.value.reworkMaterials.trim()) {
    showAlertMessage('请填写返修原因和返修材料', 'warning');
    return;
  }
  try {
    await submitRework(reworkForm.value);
    showAlertMessage('返修记录提交成功', 'success');
    showReworkModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(e.message, 'error');
  }
}

function canHandover(process: WorkOrderProcess, order: WorkOrder) {
  if (!isOperator.value) return false;
  if (process.status === ProcessStatus.QUALITY_CHECK) return false;
  if (process.status === ProcessStatus.PASSED || process.status === ProcessStatus.ARCHIVED) return false;
  
  const templateSteps = order.template.steps;
  const currentIdx = templateSteps.findIndex(s => s.id === process.stepId);
  
  if (currentIdx === 0) return true;
  
  const prevStep = templateSteps[currentIdx - 1];
  const prevProcess = order.processes.find(p => p.stepId === prevStep.id);
  
  if (!prevProcess) return false;
  
  const lastHandover = prevProcess.handoverRecords[0];
  if (!lastHandover?.qualityInspection) return false;
  
  if (lastHandover.qualityInspection.decision === QualityDecision.REJECT) {
    const hasCompletedRework = prevProcess.reworkRecords && prevProcess.reworkRecords.length > 0;
    const lastRework = hasCompletedRework ? prevProcess.reworkRecords[0] : null;
    const isPrevProcessPassed = prevProcess.status === ProcessStatus.PASSED || prevProcess.status === ProcessStatus.ARCHIVED;
    
    if (hasCompletedRework && isPrevProcessPassed && lastRework?.reworkConclusion) {
      return true;
    }
    return false;
  }
  
  return true;
}

function getLastHandover(process: WorkOrderProcess) {
  return process.handoverRecords[0];
}

function hasRework(process: WorkOrderProcess) {
  return process.reworkRecords.length > 0;
}

function goToDetail(id: string) {
  router.push(`/work-order/${id}`);
}

const statusText: Record<string, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  HANDED_OVER: '已交接',
  REWORKING: '返修中',
  QUALITY_CHECK: '质检中',
  PASSED: '已通过',
  FAILED: '已失败',
  ARCHIVED: '已归档'
};

onMounted(loadData);
</script>

<template>
  <div class="work-order-list">
    <div v-if="showAlert" class="alert" :class="`alert-${alertType}`">
      {{ alertMessage }}
    </div>

    <div class="stats-grid" v-if="overviewStats">
      <div class="stat-card">
        <div class="stat-value">{{ overviewStats.workOrders.total }}</div>
        <div class="stat-label">工单总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--success-color)">{{ overviewStats.workOrders.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--warning-color)">{{ overviewStats.reworks.pending }}</div>
        <div class="stat-label">待处理返修</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--text-tertiary)">{{ overviewStats.workOrders.archived }}</div>
        <div class="stat-label">已归档</div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">生产工单列表</h3>
      <div v-if="loading" class="loading">加载中...</div>
      <table v-else>
        <thead>
          <tr>
            <th>工单编号</th>
            <th>产品名称</th>
            <th>数量</th>
            <th>工艺流程</th>
            <th>当前工序</th>
            <th>状态</th>
            <th>最近更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in workOrders" :key="order.id">
            <td>
              <a href="javascript:void(0)" @click="goToDetail(order.id)" style="color: var(--primary-color); text-decoration: none;">
                {{ order.orderNo }}
              </a>
            </td>
            <td>{{ order.productName }}</td>
            <td>{{ order.quantity }}</td>
            <td>
              <span class="tag">{{ order.template.name }}</span>
              <span class="tag">v{{ order.template.version }}</span>
            </td>
            <td>
              <template v-if="order.processes.length > 0">
                <span v-for="(p, idx) in order.processes" :key="p.id">
                  <span class="status-badge" :class="p.status" :title="p.step.name" style="margin-right: 4px;">
                    {{ p.stepNumber }}
                  </span>
                  <span v-if="idx < order.processes.length - 1" style="color: var(--text-tertiary);">→</span>
                </span>
              </template>
              <span v-else style="color: var(--text-tertiary);">未开始</span>
            </td>
            <td>
              <span class="status-badge" :class="order.status">
                {{ statusText[order.status] }}
              </span>
            </td>
            <td style="font-size: 12px; color: var(--text-tertiary);">
              {{ dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm') }}
            </td>
            <td>
              <button class="btn btn-sm btn-primary" @click="goToDetail(order.id)">
                详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 class="card-title">工序快速操作</h3>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="grid-2">
        <div v-for="order in workOrders" :key="order.id" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 600;">{{ order.orderNo }}</span>
            <span class="status-badge" :class="order.status">{{ statusText[order.status] }}</span>
          </div>
          <div v-for="process in order.processes" :key="process.id" style="margin-bottom: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div>
                <span style="font-weight: 500;">工序{{ process.stepNumber }}: {{ process.step.name }}</span>
                <span class="tag" style="margin-left: 8px;">{{ process.step.department }}</span>
                <span v-if="hasRework(process)" class="tag" style="background: #fff1f0; color: #cf1322; margin-left: 4px;">
                  返修{{ process.reworkRecords.length }}次
                </span>
              </div>
              <span class="status-badge" :class="process.status">{{ statusText[process.status] }}</span>
            </div>
            <div v-if="getLastHandover(process)" style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
              最近交接: {{ dayjs(getLastHandover(process)!.handedOverAt).format('MM-DD HH:mm') }}
              由 {{ getLastHandover(process)!.operator.name }} 提交
              <template v-if="getLastHandover(process)!.qualityInspection">
                → 质检: 
                <span :class="{
                  'status-badge PASS': getLastHandover(process)!.qualityInspection.decision === 'PASS',
                  'status-badge REWORKING': getLastHandover(process)!.qualityInspection.decision === 'REJECT',
                  'status-badge ARCHIVED': getLastHandover(process)!.qualityInspection.decision === 'ARCHIVE'
                }">
                  {{ getLastHandover(process)!.qualityInspection.decision === 'PASS' ? '放行' : 
                     getLastHandover(process)!.qualityInspection.decision === 'REJECT' ? '退回' : '归档' }}
                </span>
              </template>
            </div>
            <div style="display: flex; gap: 8px;">
              <button
                v-if="isOperator && canHandover(process, order)"
                class="btn btn-sm btn-primary"
                @click="openHandoverModal(order, process)"
              >
                提交交接
              </button>
              <button
                v-if="isOperator && process.status === ProcessStatus.REWORKING"
                class="btn btn-sm btn-warning"
                @click="openReworkModal(process)"
              >
                提交返修
              </button>
              <button
                v-if="isQualityInspector && getLastHandover(process) && !getLastHandover(process)!.qualityInspection"
                class="btn btn-sm btn-success"
                @click="openQualityModal(getLastHandover(process)!)"
              >
                质检处理
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showHandoverModal" class="modal-overlay" @click.self="showHandoverModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>提交工序交接</h3>
          <button class="modal-close" @click="showHandoverModal = false">×</button>
        </div>
        <div v-if="selectedProcess" style="margin-bottom: 16px;">
          <div class="info-row"><span class="label">工序:</span><span class="value">工序{{ selectedProcess.stepNumber }} - {{ selectedProcess.step.name }}</span></div>
          <div class="info-row"><span class="label">班组:</span><span class="value">{{ selectedProcess.step.department }}</span></div>
        </div>
        <div class="form-group">
          <label>交接数量</label>
          <input type="number" v-model.number="handoverForm.quantity" min="1" />
        </div>
        <div class="form-group">
          <label>交接说明 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="handoverForm.handoverNote" placeholder="请详细描述本工序完成情况、质量状态、注意事项等"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showHandoverModal = false">取消</button>
          <button class="btn btn-primary" @click="submitHandoverForm">提交交接</button>
        </div>
      </div>
    </div>

    <div v-if="showQualityModal" class="modal-overlay" @click.self="showQualityModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>质检处理</h3>
          <button class="modal-close" @click="showQualityModal = false">×</button>
        </div>
        <div v-if="selectedHandover" style="margin-bottom: 16px;">
          <div class="info-row"><span class="label">交接人:</span><span class="value">{{ selectedHandover.operator.name }}</span></div>
          <div class="info-row"><span class="label">交接说明:</span><span class="value">{{ selectedHandover.handoverNote }}</span></div>
          <div class="info-row"><span class="label">数量:</span><span class="value">{{ selectedHandover.quantity }}</span></div>
        </div>
        <div class="form-group">
          <label>质检决策 <span style="color: var(--error-color);">*</span></label>
          <select v-model="qualityForm.decision">
            <option value="PASS">放行 - 质量合格，进入下道工序</option>
            <option value="REJECT">退回 - 质量不合格，需返修</option>
            <option value="ARCHIVE">归档 - 最终工序完成，工单结束</option>
          </select>
        </div>
        <div v-if="qualityForm.decision === 'REJECT'" class="form-group">
          <label>退回原因 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="qualityForm.rejectReason" placeholder="请详细描述不合格项、超差数据、影响范围等"></textarea>
        </div>
        <div class="form-group">
          <label>质检证据 {{ qualityForm.decision === 'ARCHIVE' ? ' *' : '' }}</label>
          <textarea v-model="qualityForm.evidence" placeholder="检测报告编号、三坐标数据、照片编号等"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showQualityModal = false">取消</button>
          <button 
            class="btn" 
            :class="{
              'btn-success': qualityForm.decision === 'PASS',
              'btn-danger': qualityForm.decision === 'REJECT',
              'btn-primary': qualityForm.decision === 'ARCHIVE'
            }"
            @click="submitQualityForm"
          >
            确认提交
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReworkModal" class="modal-overlay" @click.self="showReworkModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>提交返修记录</h3>
          <button class="modal-close" @click="showReworkModal = false">×</button>
        </div>
        <div class="form-group">
          <label>返修原因 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="reworkForm.reworkReason" placeholder="请详细描述缺陷类型、产生原因、影响范围等"></textarea>
        </div>
        <div class="form-group">
          <label>返修材料 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="reworkForm.reworkMaterials" placeholder="请列出使用的刀具、磨料、辅料等"></textarea>
        </div>
        <div class="form-group">
          <label>返修过程说明</label>
          <textarea v-model="reworkForm.reworkNote" placeholder="返修工艺步骤、参数调整、质量控制点等"></textarea>
        </div>
        <div class="form-group">
          <label>返修结论 (如已完成)</label>
          <select v-model="reworkForm.reworkConclusion">
            <option :value="undefined">返修中，暂不填写</option>
            <option :value="ReworkConclusion.REPAIRED">已修复 - 返修后合格</option>
            <option :value="ReworkConclusion.SCRAPPED">报废 - 无法修复</option>
            <option :value="ReworkConclusion.CONCESSION">让步接收 - 需特批</option>
          </select>
        </div>
        <div class="alert alert-info" style="margin-top: 16px;">
          <strong>返修结论说明:</strong> 返修结论根据实际返修结果动态录入，不是静态写死的值。相同的返修原因可能因为返修工艺、材料、操作人员的不同而产生不同的结论。
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showReworkModal = false">取消</button>
          <button class="btn btn-warning" @click="submitReworkForm">提交返修</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.work-order-list {
  position: relative;
}
</style>
