<template>
  <div>
    <div class="flex-between mb-16">
      <h1 class="page-title">📋 项目台账</h1>
      <NuxtLink to="/formula/new" class="btn btn-primary">➕ 新建配方</NuxtLink>
    </div>

    <div v-if="stats" class="grid-4 mb-16">
      <div class="card" style="text-align:center">
        <div style="font-size:28px;font-weight:700;color:var(--accent)">{{ stats.summary.totalFormulas }}</div>
        <div class="text-muted text-sm">总配方数</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:28px;font-weight:700;color:var(--success)">{{ stats.summary.activeFormulas }}</div>
        <div class="text-muted text-sm">活跃配方</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:28px;font-weight:700;color:var(--info)">{{ stats.summary.testingBatches }}</div>
        <div class="text-muted text-sm">测评中批次</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:28px;font-weight:700" :style="{color: stats.lowStock.length > 0 ? 'var(--danger)' : 'var(--success)'}">{{ stats.lowStock.length }}</div>
        <div class="text-muted text-sm">库存预警</div>
      </div>
    </div>

    <div v-if="stats && stats.anomalies.length > 0" class="alert alert-danger mb-16">
      <span>⚠️</span>
      <div>
        <strong>异常数据提示：</strong>
        发现 {{ stats.anomalies.length }} 条异常测评记录（评分&lt;7.0 或燃烧时间/留香不达标）
        <div v-for="a in stats.anomalies.slice(0,3)" :key="a.id" class="mt-8 text-sm">
          · {{ a.formula_name }} ({{ a.batch_code }}) - 评分 {{ a.overall_score }}，实际燃烧 {{ a.burning_time_actual }}分钟
        </div>
      </div>
    </div>

    <div v-if="stats && stats.lowStock.length > 0" class="alert alert-warning mb-16">
      <span>📦</span>
      <div>
        <strong>库存不足：</strong>
        <span v-for="(item, i) in stats.lowStock" :key="item.id">
          {{ i > 0 ? '、' : '' }}{{ item.material_name }}({{ item.current_stock }}{{ item.unit }}/{{ item.min_threshold }}{{ item.unit }})
        </span>
      </div>
    </div>

    <div v-if="stats && stats.failedBatches.length > 0" class="alert alert-danger mb-16">
      <span>❌</span>
      <div>
        <strong>失败批次：</strong>
        <span v-for="(b, i) in stats.failedBatches" :key="b.id">
          {{ i > 0 ? '、' : '' }}{{ b.batch_code }}({{ b.formula_name }})
        </span>
      </div>
    </div>

    <div class="card">
      <div class="flex-between mb-8">
        <div class="flex-gap">
          <input v-model="searchQuery" class="form-input" style="width:220px" placeholder="搜索配方名/描述/香调..." @keyup.enter="loadFormulas" />
          <select v-model="statusFilter" class="form-select" style="width:120px" @change="loadFormulas">
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="testing">测评中</option>
            <option value="approved">已批准</option>
            <option value="archived">已归档</option>
          </select>
          <button class="btn" @click="loadFormulas">🔍 检索</button>
        </div>
        <div class="text-muted text-sm">共 {{ total }} 条</div>
      </div>

      <table v-if="formulas.length > 0">
        <thead>
          <tr>
            <th>配方名</th>
            <th>版本</th>
            <th>状态</th>
            <th>前/中/后调</th>
            <th>燃烧时间</th>
            <th>均分</th>
            <th>批次数</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in formulas" :key="f.id">
            <td>
              <NuxtLink :to="`/formula/${f.id}`" style="color:var(--accent);font-weight:600;text-decoration:none">{{ f.name }}</NuxtLink>
              <div class="text-muted text-sm">{{ f.description?.slice(0, 20) }}{{ f.description?.length > 20 ? '...' : '' }}</div>
            </td>
            <td>v{{ f.version }}</td>
            <td><span :class="'badge badge-' + f.status">{{ statusMap[f.status] }}</span></td>
            <td>
              <div class="flex-gap" style="flex-wrap:wrap">
                <span class="note-tag note-top">{{ f.top_note?.slice(0,6) || '-' }}</span>
                <span class="note-tag note-middle">{{ f.middle_note?.slice(0,6) || '-' }}</span>
                <span class="note-tag note-base">{{ f.base_note?.slice(0,6) || '-' }}</span>
              </div>
            </td>
            <td>{{ f.burning_time_min }}-{{ f.burning_time_max }}分</td>
            <td>
              <span v-if="f.avg_score !== null" :class="f.avg_score < 7 ? 'text-danger' : 'text-accent'" class="fw-600">{{ f.avg_score }}</span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>{{ f.batch_count }}<span v-if="f.testing_count > 0" class="text-muted text-sm"> ({{ f.testing_count }}测)</span></td>
            <td class="text-sm text-muted">{{ f.updated_at?.slice(0, 10) }}</td>
            <td>
              <NuxtLink :to="`/formula/${f.id}`" class="btn btn-sm">详情</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="text-muted" style="padding:40px;text-align:center">
        暂无配方数据，点击右上角"新建配方"开始
      </div>

      <div v-if="total > pageSize" class="flex-between mt-16">
        <div class="text-muted text-sm">第 {{ page }} 页，共 {{ Math.ceil(total / pageSize) }} 页</div>
        <div class="flex-gap">
          <button class="btn btn-sm" :disabled="page <= 1" @click="page--; loadFormulas()">上一页</button>
          <button class="btn btn-sm" :disabled="page >= Math.ceil(total / pageSize)" @click="page++; loadFormulas()">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const statusMap: Record<string, string> = {
  draft: '草稿', testing: '测评中', approved: '已批准', archived: '已归档'
}

const searchQuery = ref('')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = 20
const total = ref(0)
const formulas = ref<any[]>([])
const stats = ref<any>(null)

async function loadFormulas() {
  const params = new URLSearchParams()
  params.set('page', String(page.value))
  params.set('pageSize', String(pageSize))
  if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
  if (searchQuery.value) params.set('search', searchQuery.value)

  const data = await $fetch(`/api/formulas?${params}`)
  formulas.value = data.items
  total.value = data.total
}

async function loadStats() {
  try {
    stats.value = await $fetch('/api/stats')
  } catch {}
}

onMounted(() => {
  loadFormulas()
  loadStats()
})
</script>
