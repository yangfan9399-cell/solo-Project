<template>
  <div class="repair-list">
    <div class="flex-between mb-16">
      <div>
        <h2 class="page-title">维修工单</h2>
        <p class="page-subtitle">管理车辆故障维修工单</p>
      </div>
    </div>

    <div class="card mb-16">
      <div class="flex gap-16" style="flex-wrap: wrap;">
        <div class="stat-card">
          <div class="stat-value text-primary">{{ totalRepairs }}</div>
          <div class="stat-label">维修总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-warning">{{ pendingRepairs }}</div>
          <div class="stat-label">待维修</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-info">{{ inProgressRepairs }}</div>
          <div class="stat-label">维修中</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-success">{{ completedRepairs }}</div>
          <div class="stat-label">已完成</div>
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
            @change="loadRepairs"
          >
            <el-option label="待维修" value="pending" />
            <el-option label="维修中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="无法维修" value="cannot_repair" />
          </el-select>

          <el-select
            v-model="filterFaultType"
            placeholder="故障类型"
            clearable
            style="width: 150px"
            @change="loadRepairs"
          >
            <el-option label="刹车故障" value="brake" />
            <el-option label="轮胎故障" value="tire" />
            <el-option label="链条故障" value="chain" />
            <el-option label="电气故障" value="electric" />
            <el-option label="结构故障" value="structure" />
            <el-option label="其他故障" value="other" />
          </el-select>

          <el-input
            v-model="searchKeyword"
            placeholder="搜索维修单号或车辆"
            clearable
            style="width: 280px"
            @keyup.enter="loadRepairs"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredRepairs" style="width: 100%" v-loading="loading">
        <el-table-column prop="repairNo" label="维修单号" width="160" />
        <el-table-column label="关联工单" width="160">
          <template #default="{ row }">
            {{ row.dispatchOrder?.orderNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="故障车辆" width="130">
          <template #default="{ row }">
            {{ row.bike?.bikeCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="故障类型" width="120">
          <template #default="{ row }">
            <el-tag type="danger" size="small">
              {{ faultTypeInfo(row.faultType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="faultDescription" label="故障描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="维修员" width="100">
          <template #default="{ row }">
            {{ row.repairerName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusInfo(row.status).color" size="small">
              {{ statusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDispatch(row.dispatchOrderId)">
              查看工单
            </el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, row)">
              <el-button type="primary" link>
                操作
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status === 'pending'" command="start">
                    开始维修
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'in_progress'" command="complete">
                    完成维修
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCompleteDialog" title="完成维修" width="400px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="维修结果">
          <el-radio-group v-model="completeForm.cannotRepair">
            <el-radio :value="false">维修完成</el-radio>
            <el-radio :value="true">无法维修</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="维修备注">
          <el-input v-model="completeForm.repairRemark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="success" @click="completeRepair">确认完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, ArrowDown } from '@element-plus/icons-vue';
import { repairApi } from '@/api';
import type { RepairOrder, RepairStatus, FaultType } from '@/types';
import { repairStatusMap, faultTypeMap } from '@/utils/constants';
import dayjs from 'dayjs';

const router = useRouter();

const repairs = ref<RepairOrder[]>([]);
const loading = ref(false);
const filterStatus = ref<RepairStatus | ''>('');
const filterFaultType = ref<FaultType | ''>('');
const searchKeyword = ref('');

const showCompleteDialog = ref(false);
const currentRepair = ref<RepairOrder | null>(null);
const completeForm = ref({
  repairRemark: '',
  cannotRepair: false,
});

const totalRepairs = computed(() => repairs.value.length);
const pendingRepairs = computed(() => repairs.value.filter((r) => r.status === 'pending').length);
const inProgressRepairs = computed(() => repairs.value.filter((r) => r.status === 'in_progress').length);
const completedRepairs = computed(() => repairs.value.filter((r) => r.status === 'completed').length);

const filteredRepairs = computed(() => {
  let result = repairs.value;

  if (filterStatus.value) {
    result = result.filter((r) => r.status === filterStatus.value);
  }
  if (filterFaultType.value) {
    result = result.filter((r) => r.faultType === filterFaultType.value);
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(
      (r) =>
        r.repairNo.toLowerCase().includes(keyword) ||
        r.bike?.bikeCode.toLowerCase().includes(keyword) ||
        r.dispatchOrder?.orderNo.toLowerCase().includes(keyword)
    );
  }

  return result;
});

function statusInfo(status: string) {
  return repairStatusMap[status as RepairStatus] || { label: status, color: 'info' };
}

function faultTypeInfo(type: string) {
  return faultTypeMap[type as FaultType] || { label: type };
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

async function loadRepairs() {
  loading.value = true;
  try {
    repairs.value = await repairApi.findAll();
  } catch (error) {
    ElMessage.error('加载维修工单失败');
  } finally {
    loading.value = false;
  }
}

function viewDispatch(dispatchOrderId: string) {
  if (dispatchOrderId) {
    router.push(`/dispatch/${dispatchOrderId}`);
  }
}

function handleAction(cmd: string, row: RepairOrder) {
  currentRepair.value = row;
  if (cmd === 'start') {
    startRepair();
  } else if (cmd === 'complete') {
    showCompleteDialog.value = true;
  }
}

async function startRepair() {
  if (!currentRepair.value) return;
  try {
    await repairApi.startRepair(currentRepair.value.id, {
      repairerId: currentRepair.value.repairerId || '',
      repairerName: currentRepair.value.repairerName || '',
    });
    ElMessage.success('开始维修');
    loadRepairs();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function completeRepair() {
  if (!currentRepair.value) return;
  try {
    await repairApi.completeRepair(currentRepair.value.id, {
      repairRemark: completeForm.value.repairRemark,
      cannotRepair: completeForm.value.cannotRepair,
    });
    ElMessage.success(completeForm.value.cannotRepair ? '已标记无法维修' : '维修完成');
    showCompleteDialog.value = false;
    completeForm.value = { repairRemark: '', cannotRepair: false };
    loadRepairs();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

onMounted(() => {
  loadRepairs();
});
</script>

<style lang="scss" scoped>
.repair-list {
  .stat-card {
    flex: 1;
    min-width: 140px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    text-align: center;
  }
}
</style>
