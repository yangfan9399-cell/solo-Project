<template>
  <div v-if="data">
    <div class="flex-between mb-16">
      <h1 class="page-title">
        <NuxtLink to="/" style="color:var(--muted);text-decoration:none;font-size:14px">台账</NuxtLink>
        <span style="color:var(--muted)">/</span>
        {{ data.formula.name }}
        <span :class="'badge badge-' + data.formula.status" style="font-size:12px">{{ statusMap[data.formula.status] }}</span>
      </h1>
      <div class="flex-gap">
        <button v-if="!editing" class="btn" @click="editing = true">✏️ 编辑</button>
        <button v-if="editing" class="btn btn-primary" @click="saveFormula">💾 保存</button>
        <button v-if="editing" class="btn" @click="cancelEdit">取消</button>
        <button class="btn btn-danger btn-sm" @click="deleteFormula">🗑️ 删除</button>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <div class="card">
        <div class="card-title">基本信息</div>
        <div v-if="!editing">
          <div class="form-group"><span class="form-label">描述</span><div>{{ data.formula.description || '无' }}</div></div>
          <div class="form-group"><span class="form-label">版本</span><div>v{{ data.formula.version }}</div></div>
          <div class="form-group"><span class="form-label">设计燃烧时间</span><div>{{ data.formula.burning_time_min }}-{{ data.formula.burning_time_max }} 分钟</div></div>
          <div class="form-group"><span class="form-label">设计留香时长</span><div>{{ data.formula.longevity_hours }} 小时</div></div>
        </div>
        <div v-else>
          <div class="form-group">
            <label class="form-label">配方名</label>
            <input v-model="editForm.name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="editForm.description" class="form-textarea"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">燃烧时间(最小/分钟)</label>
              <input v-model.number="editForm.burning_time_min" class="form-input" type="number" />
            </div>
            <div class="form-group">
              <label class="form-label">燃烧时间(最大/分钟)</label>
              <input v-model.number="editForm.burning_time_max" class="form-input" type="number" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">设计留香时长(小时)</label>
            <input v-model.number="editForm.longevity_hours" class="form-input" type="number" />
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="editForm.status" class="form-select">
              <option value="draft">草稿</option>
              <option value="testing">测评中</option>
              <option value="approved">已批准</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">变更说明</label>
            <input v-model="editForm.change_note" class="form-input" placeholder="本次修改说明..." />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">前/中/后调</div>
        <div v-if="!editing">
          <div class="form-group">
            <span class="note-tag note-top">前调</span>
            <span style="margin-left:8px">{{ data.formula.top_note || '-' }}</span>
          </div>
          <div class="form-group">
            <span class="note-tag note-middle">中调</span>
            <span style="margin-left:8px">{{ data.formula.middle_note || '-' }}</span>
          </div>
          <div class="form-group">
            <span class="note-tag note-base">后调</span>
            <span style="margin-left:8px">{{ data.formula.base_note || '-' }}</span>
          </div>
        </div>
        <div v-else>
          <div class="form-group">
            <label class="form-label">前调</label>
            <input v-model="editForm.top_note" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">中调</label>
            <input v-model="editForm.middle_note" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">后调</label>
            <input v-model="editForm.base_note" class="form-input" />
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-16">
      <div class="flex-between">
        <div class="card-title" style="border:none;padding:0;margin:0">🧪 香材配伍</div>
        <button v-if="editing" class="btn btn-sm" @click="addMaterial">➕ 添加香材</button>
      </div>
      <div class="material-ratio-bar">
        <div
          v-for="(seg, i) in materialSegments"
          :key="i"
          :class="'material-ratio-segment'"
          :style="{ width: seg.pct + '%', background: segmentColors[i % segmentColors.length] }"
          :title="seg.name + ': ' + seg.pct + '%'"
        >{{ seg.pct > 8 ? seg.name.slice(0,2) : '' }}</div>
      </div>
      <table v-if="displayMaterials.length > 0">
        <thead>
          <tr><th>香材</th><th>用量</th><th>比例</th><th>占比</th><th>调性</th><th v-if="editing">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in displayMaterials" :key="i">
            <td v-if="!editing">{{ m.material_name }}</td>
            <td v-else><input v-model="m.material_name" class="form-input" style="width:120px" /></td>
            <td v-if="!editing">{{ m.ratio }}{{ m.unit }}</td>
            <td v-else class="flex-gap"><input v-model.number="m.ratio" class="form-input" style="width:60px" type="number" /><input v-model="m.unit" class="form-input" style="width:50px" /></td>
            <td class="fw-600">{{ m.percentage }}%</td>
            <td>
              <span v-if="!editing" :class="'note-tag note-' + m.note_type">{{ noteMap[m.note_type] }}</span>
              <select v-else v-model="m.note_type" class="form-select" style="width:80px">
                <option value="top">前调</option>
                <option value="middle">中调</option>
                <option value="base">后调</option>
              </select>
            </td>
            <td v-if="editing"><button class="btn btn-sm btn-danger" @click="displayMaterials.splice(i,1)">删除</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="tabs">
      <button :class="['tab', activeTab === 'batches' ? 'tab-active' : '']" @click="activeTab = 'batches'">📦 批次历史 ({{ data.batches.length }})</button>
      <button :class="['tab', activeTab === 'evaluations' ? 'tab-active' : '']" @click="activeTab = 'evaluations'">📝 测评记录 ({{ data.evaluations.length }})</button>
      <button :class="['tab', activeTab === 'versions' ? 'tab-active' : '']" @click="activeTab = 'versions'">📚 版本历史 ({{ data.versions.length }})</button>
      <button :class="['tab', activeTab === 'blind' ? 'tab-active' : '']" @click="activeTab = 'blind'">🫣 盲评表 ({{ data.blindReviews.length }})</button>
    </div>

    <div v-if="activeTab === 'batches'" class="card">
      <div class="flex-between mb-8">
        <div class="card-title" style="border:none;padding:0;margin:0">批次记录</div>
        <button class="btn btn-sm btn-primary" @click="showBatchForm = true">➕ 新建批次</button>
      </div>
      <div v-if="showBatchForm" class="card mb-8" style="background:var(--accent-light)">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">批次编号</label>
            <input v-model="batchForm.batch_code" class="form-input" placeholder="如: TJ-2025-004" />
          </div>
          <div class="form-group">
            <label class="form-label">生产日期</label>
            <input v-model="batchForm.production_date" class="form-input" type="date" />
          </div>
          <div class="form-group">
            <label class="form-label">数量</label>
            <input v-model.number="batchForm.quantity" class="form-input" type="number" />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input v-model="batchForm.notes" class="form-input" />
          </div>
        </div>
        <div class="flex-gap mt-8">
          <button class="btn btn-primary btn-sm" @click="createBatch">确认创建</button>
          <button class="btn btn-sm" @click="showBatchForm = false">取消</button>
        </div>
      </div>
      <table v-if="data.batches.length > 0">
        <thead>
          <tr><th>批次号</th><th>配方版本</th><th>日期</th><th>数量</th><th>状态</th><th>备注</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="b in data.batches" :key="b.id">
            <td class="fw-600">{{ b.batch_code }}</td>
            <td>v{{ b.formula_version }}</td>
            <td>{{ b.production_date }}</td>
            <td>{{ b.quantity }}</td>
            <td><span :class="'badge badge-' + b.status">{{ batchStatusMap[b.status] }}</span></td>
            <td class="text-sm">{{ b.notes }}</td>
            <td>
              <select v-if="b.status !== 'completed' && b.status !== 'failed'" class="form-select btn-sm" style="width:100px;font-size:11px" @change="updateBatchStatus(b, ($event.target as HTMLSelectElement).value)">
                <option value="">更改状态</option>
                <option value="producing">生产中</option>
                <option value="testing">测评中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'evaluations'" class="card">
      <div class="flex-between mb-8">
        <div class="card-title" style="border:none;padding:0;margin:0">测评记录</div>
        <button class="btn btn-sm btn-primary" @click="showEvalForm = true">➕ 新增测评</button>
      </div>
      <div v-if="showEvalForm" class="card mb-8" style="background:var(--accent-light)">
        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">评测人</label>
            <input v-model="evalForm.evaluator" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">批次</label>
            <select v-model="evalForm.batch_id" class="form-select">
              <option v-for="b in data.batches" :key="b.id" :value="b.id">{{ b.batch_code }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">盲评</label>
            <select v-model="evalForm.is_blind" class="form-select">
              <option :value="false">否</option>
              <option :value="true">是</option>
            </select>
          </div>
        </div>
        <div class="grid-3">
          <div class="form-group"><label class="form-label">香气评分(0-10)</label><input v-model.number="evalForm.scent_score" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
          <div class="form-group"><label class="form-label">留香评分(0-10)</label><input v-model.number="evalForm.longevity_score" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
          <div class="form-group"><label class="form-label">稳定评分(0-10)</label><input v-model.number="evalForm.stability_score" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
        </div>
        <div class="grid-3">
          <div class="form-group"><label class="form-label">综合评分(0-10)</label><input v-model.number="evalForm.overall_score" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
          <div class="form-group"><label class="form-label">实际燃烧(分钟)</label><input v-model.number="evalForm.burning_time_actual" class="form-input" type="number" /></div>
          <div class="form-group"><label class="form-label">实际留香(小时)</label><input v-model.number="evalForm.longevity_actual_hours" class="form-input" type="number" step="0.1" /></div>
        </div>
        <div class="grid-3">
          <div class="form-group"><label class="form-label">前调评分</label><input v-model.number="evalForm.top_note_rating" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
          <div class="form-group"><label class="form-label">中调评分</label><input v-model.number="evalForm.middle_note_rating" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
          <div class="form-group"><label class="form-label">后调评分</label><input v-model.number="evalForm.base_note_rating" class="form-input" type="number" min="0" max="10" step="0.1" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">评语</label>
          <textarea v-model="evalForm.comments" class="form-textarea"></textarea>
        </div>
        <div class="flex-gap mt-8">
          <button class="btn btn-primary btn-sm" @click="createEvaluation">确认提交</button>
          <button class="btn btn-sm" @click="showEvalForm = false">取消</button>
        </div>
      </div>
      <table v-if="data.evaluations.length > 0">
        <thead>
          <tr><th>评测人</th><th>批次</th><th>综合</th><th>香气</th><th>留香</th><th>稳定</th><th>前/中/后</th><th>实际燃烧</th><th>实际留香</th><th>盲评</th><th>评语</th></tr>
        </thead>
        <tbody>
          <tr v-for="e in data.evaluations" :key="e.id" :style="e.overall_score < 7 ? 'background:var(--danger-light)' : ''">
            <td class="fw-600">{{ e.evaluator }}</td>
            <td>{{ e.batch_code }}</td>
            <td><span :class="e.overall_score < 7 ? 'text-danger' : 'text-accent'" class="fw-600">{{ e.overall_score }}</span></td>
            <td>{{ e.scent_score }}</td>
            <td>{{ e.longevity_score }}</td>
            <td>{{ e.stability_score }}</td>
            <td class="text-sm">{{ e.top_note_rating }}/{{ e.middle_note_rating }}/{{ e.base_note_rating }}</td>
            <td>{{ e.burning_time_actual }}分</td>
            <td>{{ e.longevity_actual_hours }}时</td>
            <td>{{ e.is_blind ? '✅' : '—' }}</td>
            <td class="text-sm text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ e.comments }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'versions'" class="card">
      <div class="card-title">版本历史</div>
      <table v-if="data.versions.length > 0">
        <thead>
          <tr><th>版本</th><th>变更说明</th><th>快照摘要</th><th>时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="v in data.versions" :key="v.id">
            <td><span class="badge badge-approved">v{{ v.version }}</span></td>
            <td>{{ v.change_note }}</td>
            <td class="text-sm text-muted" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ versionSummary(v.snapshot) }}</td>
            <td class="text-sm">{{ v.created_at?.slice(0,10) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'blind'" class="card">
      <div class="card-title">盲评表</div>
      <table v-if="data.blindReviews.length > 0">
        <thead>
          <tr><th>评审人</th><th>猜测配方</th><th>准确度</th><th>偏好分</th><th>评注</th><th>时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="br in data.blindReviews" :key="br.id">
            <td class="fw-600">{{ br.reviewer_name }}</td>
            <td>{{ br.guess_formula }}</td>
            <td>
              <span :class="'badge badge-' + blindAccuracyClass(br.guess_accuracy)">{{ blindAccuracyMap[br.guess_accuracy] }}</span>
            </td>
            <td>{{ br.preference_score }}</td>
            <td class="text-sm text-muted">{{ br.notes }}</td>
            <td class="text-sm">{{ br.reviewed_at?.slice(0,10) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="text-muted" style="padding:20px;text-align:center">暂无盲评数据</div>
    </div>
  </div>
  <div v-else style="padding:40px;text-align:center;color:var(--muted)">加载中...</div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = route.params.id

const statusMap: Record<string, string> = { draft: '草稿', testing: '测评中', approved: '已批准', archived: '已归档' }
const noteMap: Record<string, string> = { top: '前调', middle: '中调', base: '后调' }
const batchStatusMap: Record<string, string> = { pending: '待生产', producing: '生产中', testing: '测评中', completed: '已完成', failed: '失败' }
const blindAccuracyMap: Record<string, string> = { correct: '正确', partial: '部分正确', wrong: '错误' }

const segmentColors = ['#b8860b','#8b6914','#6b4c11','#a0522d','#cd853f','#d2b48c','#deb887','#c4a882','#e8c97a','#bfa36d']

const data = ref<any>(null)
const editing = ref(false)
const activeTab = ref('batches')
const showBatchForm = ref(false)
const showEvalForm = ref(false)

const editForm = ref<any>({})
const batchForm = ref({ batch_code: '', production_date: '', quantity: 1, notes: '' })
const evalForm = ref<any>({
  evaluator: '', batch_id: null as number | null, is_blind: false,
  scent_score: 0, longevity_score: 0, stability_score: 0, overall_score: 0,
  top_note_rating: 0, middle_note_rating: 0, base_note_rating: 0,
  burning_time_actual: 0, longevity_actual_hours: 0, comments: ''
})

const displayMaterials = ref<any[]>([])

const materialSegments = computed(() => {
  const total = displayMaterials.value.reduce((s, m) => s + (m.ratio || 0), 0)
  return displayMaterials.value.map(m => ({
    name: m.material_name,
    pct: total > 0 ? Math.round((m.ratio / total) * 1000) / 10 : 0
  }))
})

function blindAccuracyClass(acc: string) {
  if (acc === 'correct') return 'approved'
  if (acc === 'partial') return 'testing'
  return 'failed'
}

function versionSummary(snapshot: string) {
  try {
    const parsed = JSON.parse(snapshot)
    const names = (parsed.materials || []).map((m: any) => `${m.name}:${m.ratio}`).join(', ')
    return names
  } catch {
    return snapshot.slice(0, 60)
  }
}

async function loadData() {
  data.value = await $fetch(`/api/formulas/${id}`)
  displayMaterials.value = (data.value.materials || []).map((m: any) => {
    const total = data.value.materials.reduce((s: number, mm: any) => s + mm.ratio, 0)
    return { ...m, percentage: total > 0 ? Math.round((m.ratio / total) * 1000) / 10 : 0 }
  })
}

function cancelEdit() {
  editing.value = false
}

function addMaterial() {
  displayMaterials.value.push({ material_name: '', ratio: 0, unit: 'g', note_type: 'middle', percentage: 0 })
}

async function saveFormula() {
  const payload = {
    ...editForm.value,
    materials: displayMaterials.value.map(m => ({
      material_name: m.material_name,
      ratio: m.ratio,
      unit: m.unit,
      note_type: m.note_type
    }))
  }
  await $fetch(`/api/formulas/${id}`, { method: 'PUT', body: payload })
  editing.value = false
  await loadData()
}

async function deleteFormula() {
  if (confirm('确定删除此配方？所有关联数据将被清除。')) {
    await $fetch(`/api/formulas/${id}`, { method: 'DELETE' })
    navigateTo('/')
  }
}

async function createBatch() {
  await $fetch('/api/batches', {
    method: 'POST',
    body: { ...batchForm.value, formula_id: Number(id), formula_version: data.value.formula.version }
  })
  showBatchForm.value = false
  batchForm.value = { batch_code: '', production_date: '', quantity: 1, notes: '' }
  await loadData()
}

async function updateBatchStatus(batch: any, status: string) {
  if (!status) return
  await $fetch(`/api/batches/${batch.id}`, { method: 'PUT', body: { status } })
  await loadData()
}

async function createEvaluation() {
  await $fetch('/api/evaluations', {
    method: 'POST',
    body: { ...evalForm.value, formula_id: Number(id), is_blind: evalForm.value.is_blind ? 1 : 0 }
  })
  showEvalForm.value = false
  evalForm.value = {
    evaluator: '', batch_id: null, is_blind: false,
    scent_score: 0, longevity_score: 0, stability_score: 0, overall_score: 0,
    top_note_rating: 0, middle_note_rating: 0, base_note_rating: 0,
    burning_time_actual: 0, longevity_actual_hours: 0, comments: ''
  }
  await loadData()
}

watch(editing, (val) => {
  if (val && data.value) {
    editForm.value = {
      name: data.value.formula.name,
      description: data.value.formula.description,
      top_note: data.value.formula.top_note,
      middle_note: data.value.formula.middle_note,
      base_note: data.value.formula.base_note,
      burning_time_min: data.value.formula.burning_time_min,
      burning_time_max: data.value.formula.burning_time_max,
      longevity_hours: data.value.formula.longevity_hours,
      status: data.value.formula.status,
      change_note: ''
    }
  }
})

onMounted(loadData)
</script>
