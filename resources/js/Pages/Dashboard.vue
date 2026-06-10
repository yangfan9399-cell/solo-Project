<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-800">门店巡检整改闭环平台</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ currentUser?.name }} ({{ userRole }})</span>
          <button @click="logout" class="text-red-600 hover:text-red-700">退出</button>
        </div>
      </div>
    </header>

    <nav class="bg-gray-800 text-white">
      <div class="max-w-7xl mx-auto px-4">
        <ul class="flex gap-6 py-3">
          <li><a href="#overview" @click.prevent="activeTab = 'overview'" :class="['cursor-pointer', activeTab === 'overview' ? 'text-blue-400' : 'hover:text-gray-300']">概览</a></li>
          <li><a href="#issues" @click.prevent="activeTab = 'issues'" :class="['cursor-pointer', activeTab === 'issues' ? 'text-blue-400' : 'hover:text-gray-300']">问题列表</a></li>
          <li><a href="#kanban" @click.prevent="activeTab = 'kanban'" :class="['cursor-pointer', activeTab === 'kanban' ? 'text-blue-400' : 'hover:text-gray-300']">看板</a></li>
          <li v-if="currentUser.is_supervisor"><a href="#report" @click.prevent="activeTab = 'report'" :class="['cursor-pointer', activeTab === 'report' ? 'text-blue-400' : 'hover:text-gray-300']">上报问题</a></li>
        </ul>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div v-if="activeTab === 'overview'">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-gray-500 text-sm">总问题数</div>
            <div class="text-2xl font-bold text-gray-800">{{ overview?.total || 0 }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-gray-500 text-sm">待整改</div>
            <div class="text-2xl font-bold text-yellow-600">{{ overview?.pending || 0 }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-gray-500 text-sm">整改中</div>
            <div class="text-2xl font-bold text-blue-600">{{ overview?.rectifying || 0 }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-gray-500 text-sm">已闭环</div>
            <div class="text-2xl font-bold text-green-600">{{ overview?.closed || 0 }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold text-gray-800 mb-4">问题类型分布</h3>
            <div class="space-y-2">
              <div v-for="item in problemTypes" :key="item.problem_type_id" class="flex justify-between">
                <span>{{ item.problemType?.name }}</span>
                <span class="font-medium">{{ item.count }}</span>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold text-gray-800 mb-4">区域分布</h3>
            <div class="space-y-2">
              <div v-for="item in regions" :key="item.region" class="flex justify-between">
                <span>{{ item.region }}</span>
                <span class="font-medium">{{ item.issues }} 个问题</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 bg-white rounded-lg shadow p-4">
          <h3 class="font-semibold text-gray-800 mb-4">最近问题</h3>
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">门店</th>
                <th class="text-left py-2">问题类型</th>
                <th class="text-left py-2">描述</th>
                <th class="text-left py-2">状态</th>
                <th class="text-left py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="issue in recentIssues" :key="issue.id" class="border-b hover:bg-gray-50">
                <td class="py-2">{{ issue.store?.name }}</td>
                <td class="py-2">{{ issue.problemType?.name }}</td>
                <td class="py-2">{{ issue.description }}</td>
                <td class="py-2">
                  <span :class="statusClass(issue.status)">{{ statusText(issue.status) }}</span>
                </td>
                <td class="py-2">
                  <button @click="viewIssue(issue.id)" class="text-blue-600 hover:text-blue-800">查看</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activeTab === 'issues'">
        <div class="flex gap-4 mb-4">
          <select v-model="filter.status" class="px-4 py-2 border rounded-lg">
            <option value="">全部状态</option>
            <option value="pending">待整改</option>
            <option value="rectifying">整改中</option>
            <option value="reviewing">待复查</option>
            <option value="reviewed">已复查</option>
            <option value="closed">已闭环</option>
            <option value="rejected">已退回</option>
          </select>
          <select v-model="filter.store_id" class="px-4 py-2 border rounded-lg">
            <option value="">全部门店</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
          </select>
          <button @click="loadIssues" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">筛选</button>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left py-3 px-4">门店</th>
                <th class="text-left py-3 px-4">问题类型</th>
                <th class="text-left py-3 px-4">描述</th>
                <th class="text-left py-3 px-4">整改人</th>
                <th class="text-left py-3 px-4">截止时间</th>
                <th class="text-left py-3 px-4">状态</th>
                <th class="text-left py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="issue in issues" :key="issue.id" class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">{{ issue.store?.name }}</td>
                <td class="py-3 px-4">{{ issue.problemType?.name }}</td>
                <td class="py-3 px-4">{{ issue.description }}</td>
                <td class="py-3 px-4">{{ issue.rectifier?.name || '-' }}</td>
                <td class="py-3 px-4" :class="{ 'text-red-600': isOverdue(issue) }">{{ formatDate(issue.deadline) }}</td>
                <td class="py-3 px-4">
                  <span :class="statusClass(issue.status)">{{ statusText(issue.status) }}</span>
                </td>
                <td class="py-3 px-4">
                  <button @click="viewIssue(issue.id)" class="text-blue-600 hover:text-blue-800 mr-2">查看</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activeTab === 'kanban'">
        <div class="grid grid-cols-6 gap-4">
          <div v-for="status in kanbanStatuses" :key="status.value" class="bg-gray-50 rounded-lg p-4">
            <div class="font-semibold text-gray-800 mb-4">{{ status.label }} ({{ getStatusCount(status.value) }})</div>
            <div class="space-y-3">
              <div v-for="issue in getIssuesByStatus(status.value)" :key="issue.id" 
                   class="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md"
                   @click="viewIssue(issue.id)">
                <div class="font-medium text-gray-800">{{ issue.store?.name }}</div>
                <div class="text-sm text-gray-600">{{ issue.description }}</div>
                <div class="text-xs text-gray-500 mt-1">截止: {{ formatDate(issue.deadline) }}</div>
                <div v-if="isOverdue(issue)" class="text-xs text-red-600 mt-1">已超期</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'report'">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-800 mb-4">上报巡检问题</h3>
          <form @submit.prevent="submitIssue">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-gray-700 text-sm font-medium mb-2">门店</label>
                <select v-model="newIssue.store_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">请选择门店</option>
                  <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-700 text-sm font-medium mb-2">问题类型</label>
                <select v-model="newIssue.problem_type_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">请选择问题类型</option>
                  <option v-for="type in problemTypeList" :key="type.id" :value="type.id">{{ type.name }}</option>
                </select>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-medium mb-2">问题描述</label>
              <textarea v-model="newIssue.description" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-medium mb-2">整改截止时间</label>
              <input v-model="newIssue.deadline" type="datetime-local" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              提交
            </button>
          </form>
        </div>
      </div>
    </main>

    <div v-if="selectedIssue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">问题详情</h3>
            <button @click="selectedIssue = null" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-gray-500 text-sm">门店</label>
              <div class="font-medium">{{ selectedIssue.store?.name }}</div>
            </div>
            <div>
              <label class="block text-gray-500 text-sm">问题类型</label>
              <div class="font-medium">{{ selectedIssue.problemType?.name }}</div>
            </div>
            <div>
              <label class="block text-gray-500 text-sm">整改人</label>
              <div class="font-medium">{{ selectedIssue.rectifier?.name || '-' }}</div>
            </div>
            <div>
              <label class="block text-gray-500 text-sm">截止时间</label>
              <div class="font-medium" :class="{ 'text-red-600': isOverdue(selectedIssue) }">{{ formatDate(selectedIssue.deadline) }}</div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-gray-500 text-sm">问题描述</label>
            <div class="bg-gray-50 p-3 rounded-lg">{{ selectedIssue.description }}</div>
          </div>

          <div v-if="selectedIssue.photos && selectedIssue.photos.length" class="mb-6">
            <label class="block text-gray-500 text-sm">整改照片</label>
            <div class="flex gap-2 flex-wrap">
              <div v-for="(photo, index) in selectedIssue.photos" :key="index" 
                   class="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <span class="text-gray-500 text-xs">{{ photo }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="selectedIssue.status === 'rectifying'" class="mb-6">
            <label class="block text-gray-500 text-sm">整改照片</label>
            <div class="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <span class="text-gray-500 text-xs">暂无照片</span>
            </div>
          </div>

          <div v-if="selectedIssue.rectify_note" class="mb-4">
            <label class="block text-gray-500 text-sm">整改说明</label>
            <div class="bg-gray-50 p-3 rounded-lg">{{ selectedIssue.rectify_note }}</div>
          </div>

          <div v-if="selectedIssue.review_note" class="mb-4">
            <label class="block text-gray-500 text-sm">复查意见</label>
            <div class="bg-gray-50 p-3 rounded-lg">{{ selectedIssue.review_note }}</div>
          </div>

          <div v-if="selectedIssue.close_note" class="mb-6">
            <label class="block text-gray-500 text-sm">闭环意见</label>
            <div class="bg-gray-50 p-3 rounded-lg">{{ selectedIssue.close_note }}</div>
          </div>

          <div class="mb-6">
            <label class="block text-gray-500 text-sm">处理历史</label>
            <div class="space-y-2">
              <div v-for="history in selectedIssue.histories" :key="history.id" class="flex gap-3">
                <div class="text-gray-500 text-sm">{{ formatDate(history.created_at) }}</div>
                <div>{{ history.operator?.name }}: {{ history.note }}</div>
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <button v-if="canAssign(selectedIssue)" @click="showAssignModal = true" 
                    class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              分配整改
            </button>
            <button v-if="canRectify(selectedIssue)" @click="showRectifyModal = true" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              提交整改
            </button>
            <button v-if="canReview(selectedIssue)" @click="showReviewModal = true" 
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              复查确认
            </button>
            <button v-if="canClose(selectedIssue)" @click="showCloseModal = true" 
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              确认闭环
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">分配整改人</h3>
        <select v-model="assignData.rectifier_id" class="w-full px-4 py-2 border rounded-lg mb-4">
          <option value="">请选择整改人</option>
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>
        <div class="flex gap-4">
          <button @click="showAssignModal = false" class="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
          <button @click="assignIssue" class="px-4 py-2 bg-blue-600 text-white rounded-lg">确认</button>
        </div>
      </div>
    </div>

    <div v-if="showRectifyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">提交整改</h3>
        <textarea v-model="rectifyData.note" rows="3" class="w-full px-4 py-2 border rounded-lg mb-4" placeholder="整改说明"></textarea>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm mb-2">整改照片（以逗号分隔）</label>
          <input v-model="rectifyData.photos" type="text" class="w-full px-4 py-2 border rounded-lg" placeholder="如: photo1.jpg, photo2.jpg" />
        </div>
        <div class="flex gap-4">
          <button @click="showRectifyModal = false" class="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
          <button @click="rectifyIssue" class="px-4 py-2 bg-blue-600 text-white rounded-lg">提交</button>
        </div>
      </div>
    </div>

    <div v-if="showReviewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">复查确认</h3>
        <textarea v-model="reviewData.note" rows="3" class="w-full px-4 py-2 border rounded-lg mb-4" placeholder="复查意见"></textarea>
        <div class="flex gap-4 mb-4">
          <label class="flex items-center gap-2">
            <input v-model="reviewData.approved" type="radio" :value="true" /> 通过
          </label>
          <label class="flex items-center gap-2">
            <input v-model="reviewData.approved" type="radio" :value="false" /> 不通过
          </label>
        </div>
        <div class="flex gap-4">
          <button @click="showReviewModal = false" class="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
          <button @click="reviewIssue" class="px-4 py-2 bg-green-600 text-white rounded-lg">确认</button>
        </div>
      </div>
    </div>

    <div v-if="showCloseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">确认闭环</h3>
        <textarea v-model="closeData.note" rows="3" class="w-full px-4 py-2 border rounded-lg mb-4" placeholder="闭环意见"></textarea>
        <div class="flex gap-4">
          <button @click="showCloseModal = false" class="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
          <button @click="closeIssue" class="px-4 py-2 bg-purple-600 text-white rounded-lg">确认闭环</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';

const activeTab = ref('overview');
const overview = ref({});
const issues = ref([]);
const stores = ref([]);
const problemTypes = ref([]);
const problemTypeList = ref([]);
const regions = ref([]);
const recentIssues = ref([]);
const users = ref([]);

const selectedIssue = ref(null);
const showAssignModal = ref(false);
const showRectifyModal = ref(false);
const showReviewModal = ref(false);
const showCloseModal = ref(false);

const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user') || '{}');
});

const userRole = computed(() => {
  if (currentUser.value.is_supervisor) return '督导';
  if (currentUser.value.is_store_manager) return '店长';
  if (currentUser.value.is_region_manager) return '区域经理';
  if (currentUser.value.is_operation) return '运营负责人';
  return '未知';
});

const filter = reactive({
  status: '',
  store_id: ''
});

const newIssue = reactive({
  store_id: '',
  problem_type_id: '',
  description: '',
  deadline: ''
});

const assignData = reactive({
  rectifier_id: ''
});

const rectifyData = reactive({
  note: '',
  photos: ''
});

const reviewData = reactive({
  note: '',
  approved: true
});

const closeData = reactive({
  note: ''
});

const kanbanStatuses = [
  { value: 'pending', label: '待整改' },
  { value: 'rectifying', label: '整改中' },
  { value: 'reviewing', label: '待复查' },
  { value: 'reviewed', label: '已复查' },
  { value: 'rejected', label: '已退回' },
  { value: 'closed', label: '已闭环' }
];

const statusText = (status) => {
  const map = {
    pending: '待整改',
    rectifying: '整改中',
    reviewing: '待复查',
    reviewed: '已复查',
    closed: '已闭环',
    rejected: '已退回'
  };
  return map[status] || status;
};

const statusClass = (status) => {
  const map = {
    pending: 'px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm',
    rectifying: 'px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm',
    reviewing: 'px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm',
    reviewed: 'px-2 py-1 bg-green-100 text-green-800 rounded text-sm',
    closed: 'px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm',
    rejected: 'px-2 py-1 bg-red-100 text-red-800 rounded text-sm'
  };
  return map[status] || '';
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const isOverdue = (issue) => {
  if (!issue.deadline) return false;
  return new Date(issue.deadline) < new Date();
};

const getStatusCount = (status) => {
  return issues.value.filter(i => i.status === status).length;
};

const getIssuesByStatus = (status) => {
  return issues.value.filter(i => i.status === status);
};

const canAssign = (issue) => {
  return issue.status === 'pending' && currentUser.value.is_store_manager;
};

const canRectify = (issue) => {
  return issue.status === 'rectifying' && issue.rectifier_id === currentUser.value.id;
};

const canReview = (issue) => {
  return issue.status === 'reviewing' && currentUser.value.is_region_manager;
};

const canClose = (issue) => {
  return issue.status === 'reviewed' && currentUser.value.is_operation;
};

const loadOverview = async () => {
  try {
    const response = await window.axios.get('/api/dashboard/overview');
    overview.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const loadIssues = async () => {
  try {
    let url = '/api/issues';
    const params = [];
    if (filter.status) params.push(`status=${filter.status}`);
    if (filter.store_id) params.push(`store_id=${filter.store_id}`);
    if (params.length) url += '?' + params.join('&');
    const response = await window.axios.get(url);
    issues.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const loadStores = async () => {
  try {
    const response = await window.axios.get('/api/stores');
    stores.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const loadProblemTypes = async () => {
  try {
    const response = await window.axios.get('/api/dashboard/by-problem-type');
    problemTypes.value = response.data;
    
    const typesResponse = await window.axios.get('/api/problem-types');
    problemTypeList.value = typesResponse.data;
  } catch (e) {
    console.error(e);
  }
};

const loadRegions = async () => {
  try {
    const response = await window.axios.get('/api/dashboard/by-region');
    regions.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const loadRecentIssues = async () => {
  try {
    const response = await window.axios.get('/api/dashboard/recent-issues');
    recentIssues.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const loadUsers = async () => {
  try {
    const response = await window.axios.get('/api/users');
    users.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const viewIssue = async (id) => {
  try {
    const response = await window.axios.get(`/api/issues/${id}`);
    selectedIssue.value = response.data;
  } catch (e) {
    console.error(e);
  }
};

const submitIssue = async () => {
  try {
    await window.axios.post('/api/issues', newIssue);
    activeTab.value = 'issues';
    loadIssues();
    newIssue.store_id = '';
    newIssue.problem_type_id = '';
    newIssue.description = '';
    newIssue.deadline = '';
  } catch (e) {
    console.error(e);
  }
};

const assignIssue = async () => {
  try {
    await window.axios.post(`/api/issues/${selectedIssue.value.id}/assign`, { rectifier_id: assignData.rectifier_id });
    showAssignModal.value = false;
    await viewIssue(selectedIssue.value.id);
    loadIssues();
    assignData.rectifier_id = '';
  } catch (e) {
    console.error(e);
  }
};

const rectifyIssue = async () => {
  if (!rectifyData.photos || rectifyData.photos.trim() === '') {
    alert('请先上传整改照片');
    return;
  }
  
  try {
    await window.axios.post(`/api/issues/${selectedIssue.value.id}/upload-photos`, { 
      photos: rectifyData.photos.split(',').map(p => p.trim()) 
    });
    await window.axios.post(`/api/issues/${selectedIssue.value.id}/rectify`, { rectify_note: rectifyData.note });
    showRectifyModal.value = false;
    await viewIssue(selectedIssue.value.id);
    loadIssues();
    rectifyData.note = '';
    rectifyData.photos = '';
  } catch (e) {
    alert(e.response?.data?.error || '整改失败');
  }
};

const reviewIssue = async () => {
  try {
    await window.axios.post(`/api/issues/${selectedIssue.value.id}/review`, {
      review_note: reviewData.note,
      approved: reviewData.approved
    });
    showReviewModal.value = false;
    await viewIssue(selectedIssue.value.id);
    loadIssues();
    reviewData.note = '';
    reviewData.approved = true;
  } catch (e) {
    console.error(e);
  }
};

const closeIssue = async () => {
  try {
    await window.axios.post(`/api/issues/${selectedIssue.value.id}/close`, { close_note: closeData.note });
    showCloseModal.value = false;
    await viewIssue(selectedIssue.value.id);
    loadIssues();
    closeData.note = '';
  } catch (e) {
    console.error(e);
  }
};

const logout = async () => {
  try {
    await window.axios.post('/api/logout');
  } catch (e) {
    console.error(e);
  } finally {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};

onMounted(async () => {
  if (!localStorage.getItem('user')) {
    window.location.href = '/';
    return;
  }
  
  await loadOverview();
  await loadIssues();
  await loadStores();
  await loadProblemTypes();
  await loadRegions();
  await loadRecentIssues();
  await loadUsers();
});
</script>