<template>
  <div>
    <h1 class="page-title">📝 测评管理</h1>

    <div class="card">
      <div class="flex-between mb-8">
        <div class="card-title" style="border:none;padding:0;margin:0">全部测评记录</div>
        <div class="flex-gap">
          <input v-model="searchText" class="form-input" style="width:200px" placeholder="搜索评测人/配方..." />
          <select v-model="filterBlind" class="form-select" style="width:100px">
            <option value="all">全部</option>
            <option value="blind">盲评</option>
            <option value="normal">常规</option>
          </select>
        </div>
      </div>

      <table v-if="filteredEvals.length > 0">
        <thead>
          <tr>
            <th>配方</th><th>批次</th><th>评测人</th><th>综合</th><th>香气</th><th>留香</th><th>稳定</th>
            <th>前/中/后</th><th>实际燃烧</th><th>实际留香</th><th>类型</th><th>评语</th><th>时间</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filteredEvals" :key="e.id" :style="e.overall_score < 7 ? 'background:var(--danger-light)' : ''">
            <td class="fw-600">
              <NuxtLink :to="`/formula/${e.formula_id}`" style="color:var(--accent);text-decoration:none">{{ e.formula_name }}</NuxtLink>
            </td>
            <td>{{ e.batch_code }}</td>
            <td>{{ e.evaluator }}</td>
            <td><span :class="e.overall_score < 7 ? 'text-danger fw-600' : 'text-accent fw-600'">{{ e.overall_score }}</span></td>
            <td>{{ e.scent_score }}</td>
            <td>{{ e.longevity_score }}</td>
            <td>{{ e.stability_score }}</td>
            <td class="text-sm">{{ e.top_note_rating }}/{{ e.middle_note_rating }}/{{ e.base_note_rating }}</td>
            <td>{{ e.burning_time_actual }}分</td>
            <td>{{ e.longevity_actual_hours }}时</td>
            <td>
              <span v-if="e.is_blind" class="badge badge-testing">盲评</span>
              <span v-else class="badge badge-draft">常规</span>
            </td>
            <td class="text-sm text-muted" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.comments }}</td>
            <td class="text-sm">{{ e.evaluated_at?.slice(0,10) }}</td>
            <td><NuxtLink :to="`/formula/${e.formula_id}`" class="btn btn-sm">详情</NuxtLink></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="text-muted" style="padding:20px;text-align:center">暂无测评数据</div>
    </div>

    <div v-if="anomalies.length > 0" class="card mt-16">
      <div class="card-title">⚠️ 异常数据提示</div>
      <div v-for="a in anomalies" :key="a.id" class="alert alert-danger" style="margin-bottom:8px">
        <span>❗</span>
        <div>
          <strong>{{ a.formula_name }}</strong> ({{ a.batch_code }}) — 评分 {{ a.overall_score }}
          <span v-if="a.burning_time_actual">，燃烧 {{ a.burning_time_actual }}分</span>
          <span v-if="a.longevity_actual_hours">，留香 {{ a.longevity_actual_hours }}时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const evaluations = ref<any[]>([])
const anomalies = ref<any[]>([])
const searchText = ref('')
const filterBlind = ref('all')

const filteredEvals = computed(() => {
  let list = evaluations.value
  if (searchText.value) {
    const s = searchText.value.toLowerCase()
    list = list.filter(e => e.evaluator?.toLowerCase().includes(s) || e.formula_name?.toLowerCase().includes(s) || e.batch_code?.toLowerCase().includes(s))
  }
  if (filterBlind.value === 'blind') list = list.filter(e => e.is_blind)
  if (filterBlind.value === 'normal') list = list.filter(e => !e.is_blind)
  return list
})

async function loadData() {
  const stats = await $fetch('/api/stats') as any
  anomalies.value = stats.anomalies || []

  const formulas = await $fetch('/api/formulas?pageSize=100') as any
  const allEvals: any[] = []
  for (const f of formulas.items) {
    const detail = await $fetch(`/api/formulas/${f.id}`) as any
    for (const e of detail.evaluations) {
      allEvals.push({ ...e, formula_name: f.name, formula_id: f.id })
    }
  }
  evaluations.value = allEvals
}

onMounted(loadData)
</script>
