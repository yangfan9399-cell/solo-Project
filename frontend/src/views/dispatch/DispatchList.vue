<template>
  <div class="dispatch-list">
    <div class="flex-between mb-16">
      <div>
      <h2 class="page-title">调度工单</h2>
      <p class="page-subtitle">管理公共自行车调度与维修闭环全流程</p>
      </div>
      <div class="flex gap-8">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          新建调度
        </el-button>
      </div>
    </div>

    <div class="card mb-16">
      <div class="flex gap-16" style="flex-wrap: wrap;">
        <div class="stat-card" v-for="statusStat in statusStats" :key="statusStat.status">
          <div class="stat-value" :style="{ color: statusStat.color }">
            {{ statusStat.count }}
          </div>
          <div class="stat-label">{{ statusStat.label }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex-between mb-16">
        <div class="flex gap-8" style="flex-wrap: wrap;">
          <el-select
            v-model="filterStatus"
            placeholder="状态筛选"
            clearable
            style="width: 150px"
            @change="loadOrders"
          >
            <el-option label="全部状态" value="" />
            <el-option
              v-for="(label, key) in statusOptions"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>

          <el-select
            v-model="filterSampleType"
            placeholder="样本类型"
            clearable
            style="width: 150px"
            @change="loadOrders"
          >
            <el-option label="全部样本" value="" />
            <el-option
              v-for="(label, key) in sampleTypeOptions"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>

          <el-input
            v-model="searchKeyword"
            placeholder="搜索工单编号或站点"
            clearable
            style="width: 280px"
            @keyup.enter="loadOrders"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredOrders" style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNo" label="工单号" width="160">
          <template #default="{ row }">
            <el-link type="primary" @click="goToDetail(row.id)">
              {{ row.orderNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="站点信息" min-width="220">
          <template #default="{ row }">
            <div v-if="row.station">
              <div class="text-bold">{{ row.station.name }}</div>
              <div class="text-info" style="font-size: 12px;">
                {{ row.station.stationCode }} · {{ row.station.district }}
              </div>
            </div>
            <div v-else-if="row.reportedStationCode">
              <div class="flex gap-8 items-center mb-4">
                <el-tag type="danger" size="small">站点编号错误</el-tag>
              </div>
              <div class="text-danger" style="font-size: 12px; margin-bottom: 8px;">
                上报编号：{{ row.reportedStationCode }}
              </div>
              <el-button type="primary" size="small" link @click.stop="openRebindDialog(row)">
                立即绑定站点 →
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="车辆数量" width="140">
          <template #default="{ row }">
            <div>需求：{{ row.requiredQuantity }} 辆</div>
            <div class="text-info" style="font-size: 12px;">
              已调度：{{ row.dispatchedQuantity }} 辆
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
          <el-tag :type="statusInfo(row.status).color">
            {{ statusInfo(row.status).label }}
          </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="样本类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.sampleType" :type="sampleTypeInfo(row.sampleType).color" size="small">
              {{ sampleTypeInfo(row.sampleType).label }}
            </el-tag>
            <span v-else class="text-info">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="dispatcherName" label="调度员" width="100">
          <template #default="{ row }">
            {{ row.dispatcherName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row.id)">
              详情
            </el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, row)">
              <el-button type="primary" link>
              更多
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status === 'pending' && !row.stationCodeError" command="assign">
                分配调度员
              </el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'dispatching'" command="arrive">
                标记到达
              </el-dropdown-item>
              <el-dropdown-item v-if="row.status === 'arrived'" command="pending-review">
                提交复核
              </el-dropdown-item>
              <el-dropdown-item v-if="row.stationCodeError" command="rebind">
                重新绑定站点
              </el-dropdown-item>
              <el-dropdown-item v-if="row.status === 'pending_review'" command="review-pass">
                复核通过
              </el-dropdown-item>
              <el-dropdown-item v-if="row.status === 'pending_review'" command="review-return">
                复核退回
              </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreateDialog" title="新建调度工单" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="站点编号">
          <el-input v-model="createForm.stationCode" placeholder="请输入站点编号" />
        </el-form-item>
        <el-form-item label="需求数量">
          <el-input-number v-model="createForm.requiredQuantity" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="样本类型">
          <el-select v-model="createForm.sampleType" placeholder="选择样本类型" clearable style="width: 100%">
            <el-option label="正常补车" value="normal" />
            <el-option label="车辆故障" value="faulty" />
            <el-option label="站点编号错误" value="station_error" />
            <el-option label="调度超时" value="timeout" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createOrder">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAssignDialog" title="分配调度员" width="400px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="调度员">
          <el-select v-model="assignForm.dispatcherId" placeholder="选择调度员">
            <el-option
              v-for="dispatcher in dispatchers"
              :key="dispatcher.id"
              :label="dispatcher.name"
              :value="dispatcher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调度数量">
          <el-input-number v-model="assignForm.dispatchedQuantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="assignDispatcher">确认分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRebindDialog" title="重新绑定站点" width="400px">
      <el-alert
        title="站点编号错误，请重新绑定正确的站点" type="warning" show-icon class="mb-16" />
      <el-form :model="rebindForm" label-width="100px">
        <el-form-item label="新站点编号">
          <el-input v-model="rebindForm.newStationCode" placeholder="请输入正确的站点编号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRebindDialog = false">取消</el-button>
        <el-button type="primary" @click="rebindStation">确认绑定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReviewDialog" :title="reviewDialogTitle" width="400px">
      <el-form :model="reviewForm" label-width="100px" v-if="isReturnMode">
        <el-form-item label="退回原因">
          <el-input v-model="reviewForm.reason" type="textarea" :rows="3" placeholder="请输入退回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button :type="isReturnMode ? 'danger' : 'success'" @click="submitReview">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Search,
  ArrowDown,
} from '@element-plus/icons-vue';
import { dispatchApi, userApi } from '@/api';
import type { DispatchOrder, DispatchStatus } from '@/types';
import { DispatchSampleType } from '@/types';
import { dispatchStatusMap, sampleTypeMap } from '@/utils/constants';
import dayjs from 'dayjs';

const router = useRouter();

const orders = ref<DispatchOrder[]>([]);
const loading = ref(false);
const filterStatus = ref<DispatchStatus | ''>('');
const filterSampleType = ref<DispatchSampleType | ''>('');
const searchKeyword = ref('');
const dispatchers = ref<any[]>([]);

const showCreateDialog = ref(false);
const showAssignDialog = ref(false);
const showRebindDialog = ref(false);
const showReviewDialog = ref(false);
const isReturnMode = ref(false);
const currentOrder = ref<DispatchOrder | null>(null);

const createForm = ref({
  stationCode: '',
  requiredQuantity: 10,
  sampleType: '' as DispatchSampleType | '',
  remark: '',
});

const assignForm = ref({
  dispatcherId: '',
  dispatchedQuantity: 10,
  dispatcherName: '',
});

const rebindForm = ref({
  newStationCode: '',
});

const reviewForm = ref({
  reason: '',
  reviewerId: '',
  reviewerName: '陈复核',
});

const statusOptions = computed(() => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(dispatchStatusMap)) {
    result[key] = value.label;
  }
  return result;
});

const sampleTypeOptions = computed(() => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(sampleTypeMap)) {
    result[key] = value.label;
  }
  return result;
});

const statusStats = computed(() => {
  const stats = [
    { status: 'total', label: '全部工单', count: orders.value.length, color: '#303133' },
    { status: 'pending', label: '待调度', count: 0, color: '#e6a23c' },
    { status: 'dispatching', label: '调度中', count: 0, color: '#409eff' },
    { status: 'in_repair', label: '维修中', count: 0, color: '#f56c6c' },
    { status: 'pending_review', label: '待复核', count: 0, color: '#e6a23c' },
    { status: 'completed', label: '已完成', count: 0, color: '#67c23a' },
  ];

  for (const order of orders.value) {
    const stat = stats.find((s) => s.status === order.status);
    if (stat) {
      stat.count++;
    }
  }

  return stats;
});

const filteredOrders = computed(() => {
  let result = orders.value;

  if (filterStatus.value) {
    result = result.filter((o) => o.status === filterStatus.value);
  }
  if (filterSampleType.value) {
    result = result.filter((o) => o.sampleType === filterSampleType.value);
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter((o) =>
      o.orderNo.toLowerCase().includes(keyword) ||
      o.station?.name.toLowerCase().includes(keyword) ||
      o.reportedStationCode?.toLowerCase().includes(keyword)
    );
  }

  return result;
});

const reviewDialogTitle = computed(() => {
  return isReturnMode.value ? '复核退回' : '复核通过';
});

function statusInfo(status: string) {
  return dispatchStatusMap[status as DispatchStatus] || { label: status, color: 'info' };
}

function sampleTypeInfo(type: string) {
  return sampleTypeMap[type as DispatchSampleType] || { label: type, color: 'info' };
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

async function loadOrders() {
  loading.value = true;
  try {
    orders.value = await dispatchApi.findAll();
  } catch (error) {
    ElMessage.error('加载调度工单失败');
  } finally {
    loading.value = false;
  }
}

async function loadDispatchers() {
  try {
    dispatchers.value = await userApi.getDispatchers();
  } catch (error) {
    console.error('加载调度员失败', error);
  }
}

function goToDetail(id: string) {
  router.push(`/dispatch/${id}`);
}

async function createOrder() {
  try {
    const isStationError = createForm.value.sampleType === DispatchSampleType.STATION_ERROR;
    const stationCode = createForm.value.stationCode;
    const reportedCode = stationCode || 'ST999';

    const data: any = {
      stationCode: stationCode,
      reportedStationCode: isStationError ? reportedCode : stationCode,
      requiredQuantity: createForm.value.requiredQuantity,
      remark: createForm.value.remark,
    };

    if (createForm.value.sampleType) {
      data.sampleType = createForm.value.sampleType;
    }

    await dispatchApi.create(data);
    ElMessage.success('创建调度工单创建成功');
    showCreateDialog.value = false;
    createForm.value = { stationCode: '', requiredQuantity: 10, sampleType: '', remark: '' };
    loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '创建失败');
  }
}

function openRebindDialog(row: DispatchOrder) {
  currentOrder.value = row;
  showRebindDialog.value = true;
}

function handleAction(cmd: string, row: DispatchOrder) {
  currentOrder.value = row;
  switch (cmd) {
    case 'assign':
      showAssignDialog.value = true;
      break;
    case 'arrive':
      arriveStation();
      break;
    case 'pending-review':
      markAsPendingReview();
      break;
    case 'rebind':
      showRebindDialog.value = true;
      break;
    case 'review-pass':
      isReturnMode.value = false;
      showReviewDialog.value = true;
      break;
    case 'review-return':
      isReturnMode.value = true;
      showReviewDialog.value = true;
      break;
  }
}

async function assignDispatcher() {
  if (!currentOrder.value) return;
  try {
    const dispatcher = dispatchers.value.find((d) => d.id === assignForm.value.dispatcherId);
    await dispatchApi.assignDispatcher(currentOrder.value.id, {
      dispatcherId: assignForm.value.dispatcherId,
      dispatcherName: dispatcher?.name || '',
      dispatchedQuantity: assignForm.value.dispatchedQuantity,
    });
    ElMessage.success('调度员分配成功');
    showAssignDialog.value = false;
    loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '分配失败');
  }
}

async function arriveStation() {
  if (!currentOrder.value) return;
  try {
    await dispatchApi.arriveStation(currentOrder.value.id);
    ElMessage.success('已标记到达');
    loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function markAsPendingReview() {
  if (!currentOrder.value) return;
  try {
    await dispatchApi.markAsPendingReview(currentOrder.value.id);
    ElMessage.success('已提交复核');
    loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function rebindStation() {
  if (!currentOrder.value) return;
  try {
    await dispatchApi.rebindStation(currentOrder.value.id, rebindForm.value.newStationCode);
    ElMessage.success('站点重新绑定成功');
    showRebindDialog.value = false;
    rebindForm.value.newStationCode = '';
    loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '绑定失败');
  }
}

async function submitReview() {
  if (!currentOrder.value) return;
  try {
    if (isReturnMode.value) {
      await dispatchApi.reviewReturn(currentOrder.value.id, {
        reviewerId: reviewForm.value.reviewerId,
        reviewerName: reviewForm.value.reviewerName,
        reason: reviewForm.value.reason,
      });
      ElMessage.success('已退回');
    } else {
      await dispatchApi.reviewPass(currentOrder.value.id, {
        reviewerId: reviewForm.value.reviewerId,
        reviewerName: reviewForm.value.reviewerName,
      });
      ElMessage.success('复核通过');
    }
    showReviewDialog.value = false;
    reviewForm.value.reason = '';
    loadOrders();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

onMounted(() => {
  loadOrders();
  loadDispatchers();
});
</script>

<style lang="scss" scoped>
.dispatch-list {
  .stat-card {
    flex: 1;
    min-width: 150px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    text-align: center;
  }
}
</style>
