<template>
  <div class="station-list">
    <div class="flex-between mb-16">
      <div>
        <h2 class="page-title">站点管理</h2>
        <p class="page-subtitle">查看和管理所有公共自行车站点</p>
      </div>
    </div>

    <div class="card mb-16">
      <div class="flex gap-16" style="flex-wrap: wrap;">
        <div class="stat-card">
          <div class="stat-value text-primary">{{ totalStations }}</div>
          <div class="stat-label">站点总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-success">{{ normalStations }}</div>
          <div class="stat-label">正常站点</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-warning">{{ lowStockStations }}</div>
          <div class="stat-label">缺车站点</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-danger">{{ faultyStations }}</div>
          <div class="stat-label">故障站点</div>
        </div>
        <div class="stat-card">
          <div class="stat-value text-info">{{ totalBikes }}</div>
          <div class="stat-label">车辆总数</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex-between mb-16">
        <div class="flex gap-8" style="flex-wrap: wrap;">
          <el-select
            v-model="filterDistrict"
            placeholder="区域筛选"
            clearable
            style="width: 150px"
            @change="loadStations"
          >
            <el-option
              v-for="d in districts"
              :key="d"
              :label="d"
              :value="d"
            />
          </el-select>

          <el-select
            v-model="filterStatus"
            placeholder="状态筛选"
            clearable
            style="width: 150px"
            @change="loadStations"
          >
            <el-option label="正常" value="normal" />
            <el-option label="缺车" value="low_stock" />
            <el-option label="故障" value="faulty" />
            <el-option label="维护中" value="maintenance" />
          </el-select>

          <el-input
            v-model="searchKeyword"
            placeholder="搜索站点名称或编号"
            clearable
            style="width: 280px"
            @keyup.enter="loadStations"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredStations" style="width: 100%" v-loading="loading">
        <el-table-column prop="stationCode" label="站点编号" width="120" />
        <el-table-column prop="name" label="站点名称" min-width="180" />
        <el-table-column prop="district" label="所属区域" width="120" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="车辆情况" width="180">
          <template #default="{ row }">
            <div>
              <el-progress
                :percentage="Math.round((row.currentBikes / row.capacity) * 100)"
                :status="row.currentBikes / row.capacity < 0.3 ? 'exception' : 'success'"
                :stroke-width="10"
              />
              <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                {{ row.currentBikes }} / {{ row.capacity }} 辆
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusInfo(row.status).color" size="small">
              {{ statusInfo(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="showDetailDrawer" title="站点详情" size="500px">
      <template v-if="currentStation">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="站点编号">
            {{ currentStation.stationCode }}
          </el-descriptions-item>
          <el-descriptions-item label="站点名称">
            {{ currentStation.name }}
          </el-descriptions-item>
          <el-descriptions-item label="所属区域">
            {{ currentStation.district }}
          </el-descriptions-item>
          <el-descriptions-item label="详细地址">
            {{ currentStation.address }}
          </el-descriptions-item>
          <el-descriptions-item label="站点容量">
            {{ currentStation.capacity }} 辆
          </el-descriptions-item>
          <el-descriptions-item label="当前车辆">
            {{ currentStation.currentBikes }} 辆
          </el-descriptions-item>
          <el-descriptions-item label="站点状态">
            <el-tag :type="statusInfo(currentStation.status).color">
              {{ statusInfo(currentStation.status).label }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-24 mb-12">站点车辆 ({{ currentStation.bikes?.length || 0 }})</h4>
        <el-table :data="currentStation.bikes || []" size="small">
          <el-table-column prop="bikeCode" label="车辆编号" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="bikeStatusInfo(row.status).color" size="small">
                {{ bikeStatusInfo(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="model" label="车型" width="100" />
          <el-table-column prop="mileage" label="里程(km)" width="100" />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { stationApi } from '@/api';
import type { Station, StationStatus, BikeStatus } from '@/types';
import { stationStatusMap, bikeStatusMap } from '@/utils/constants';

const router = useRouter();

const stations = ref<Station[]>([]);
const districts = ref<string[]>([]);
const loading = ref(false);
const filterDistrict = ref('');
const filterStatus = ref('');
const searchKeyword = ref('');
const showDetailDrawer = ref(false);
const currentStation = ref<Station | null>(null);

const totalStations = computed(() => stations.value.length);
const normalStations = computed(() => stations.value.filter((s) => s.status === 'normal').length);
const lowStockStations = computed(() => stations.value.filter((s) => s.status === 'low_stock').length);
const faultyStations = computed(() => stations.value.filter((s) => s.status === 'faulty' || s.status === 'maintenance').length);
const totalBikes = computed(() => stations.value.reduce((sum, s) => sum + s.currentBikes, 0));

const filteredStations = computed(() => {
  let result = stations.value;

  if (filterDistrict.value) {
    result = result.filter((s) => s.district === filterDistrict.value);
  }
  if (filterStatus.value) {
    result = result.filter((s) => s.status === filterStatus.value);
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(keyword) ||
        s.stationCode.toLowerCase().includes(keyword)
    );
  }

  return result;
});

function statusInfo(status: string) {
  return stationStatusMap[status as StationStatus] || { label: status, color: 'info' };
}

function bikeStatusInfo(status: string) {
  return bikeStatusMap[status as BikeStatus] || { label: status, color: 'info' };
}

async function loadStations() {
  loading.value = true;
  try {
    stations.value = await stationApi.findAll();
  } catch (error) {
    ElMessage.error('加载站点列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadDistricts() {
  try {
    districts.value = await stationApi.getDistricts();
  } catch (error) {
    console.error('加载区域列表失败', error);
  }
}

async function viewDetail(station: Station) {
  try {
    currentStation.value = await stationApi.findOne(station.id);
    showDetailDrawer.value = true;
  } catch (error) {
    ElMessage.error('加载站点详情失败');
  }
}

onMounted(() => {
  loadStations();
  loadDistricts();
});
</script>

<style lang="scss" scoped>
.station-list {
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
