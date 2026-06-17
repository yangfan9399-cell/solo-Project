<template>
  <div>
    <h1 class="page-title">📤 导出摘要</h1>

    <div class="card">
      <div class="card-title">导出设置</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">导出格式</label>
          <select v-model="format" class="form-select">
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">配方范围</label>
          <select v-model="scope" class="form-select">
            <option value="all">全部配方</option>
            <option v-for="f in formulas" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">包含内容</label>
        <div class="flex-gap" style="flex-wrap:wrap">
          <label class="flex-gap text-sm"><input type="checkbox" v-model="includeMaterials" disabled /> 香材配伍</label>
          <label class="flex-gap text-sm"><input type="checkbox" v-model="includeBatches" disabled /> 批次记录</label>
          <label class="flex-gap text-sm"><input type="checkbox" v-model="includeEvals" disabled /> 测评摘要</label>
        </div>
        <div class="text-muted text-sm mt-8">当前版本导出包含完整数据（香材+批次+测评）</div>
      </div>
      <button class="btn btn-primary mt-8" @click="doExport" :disabled="exporting">
        {{ exporting ? '导出中...' : '📥 导出' }}
      </button>
    </div>

    <div v-if="preview" class="card mt-16">
      <div class="flex-between">
        <div class="card-title" style="border:none;padding:0;margin:0">预览</div>
        <button class="btn btn-sm" @click="copyResult">📋 复制</button>
      </div>
      <div v-if="format === 'json'">
        <div v-for="item in preview" :key="item.id" class="card mb-8" style="background:var(--bg)">
          <div class="flex-between mb-8">
            <div><strong>{{ item.name }}</strong> <span :class="'badge badge-' + item.status">{{ statusMap[item.status] }}</span> v{{ item.version }}</div>
          </div>
          <div class="text-sm text-muted mb-8">{{ item.description }}</div>
          <div class="grid-3 text-sm">
            <div><span class="note-tag note-top">前调</span> {{ item.notes?.top }}</div>
            <div><span class="note-tag note-middle">中调</span> {{ item.notes?.middle }}</div>
            <div><span class="note-tag note-base">后调</span> {{ item.notes?.base }}</div>
          </div>
          <div class="mt-8">
            <div class="text-sm fw-600 mb-8">香材配伍：</div>
            <div class="material-ratio-bar">
              <div
                v-for="(seg, i) in getSegments(item.materials)"
                :key="i"
                class="material-ratio-segment"
                :style="{ width: seg.pct + '%', background: segColors[i % segColors.length] }"
                :title="seg.name + ': ' + seg.pct + '%'"
              >{{ seg.pct > 8 ? seg.name.slice(0,2) : '' }}</div>
            </div>
            <table style="font-size:12px">
              <tr v-for="m in item.materials" :key="m.material_name">
                <td>{{ m.material_name }}</td>
                <td>{{ m.ratio }}{{ m.unit }}</td>
                <td>{{ m.percentage }}%</td>
                <td><span :class="'note-tag note-' + m.note_type" style="font-size:10px">{{ noteMap[m.note_type] }}</span></td>
              </tr>
            </table>
          </div>
          <div class="grid-3 mt-8 text-sm">
            <div>设计燃烧：{{ item.burning_time_design?.min }}-{{ item.burning_time_design?.max }}分</div>
            <div>设计留香：{{ item.longevity_design }}时</div>
            <div>平均评分：<span :class="item.evaluation_summary?.avg_score < 7 ? 'text-danger' : 'text-accent'" class="fw-600">{{ item.evaluation_summary?.avg_score ?? '-' }}</span></div>
          </div>
          <div v-if="item.batches?.length" class="mt-8 text-sm">
            <div class="fw-600 mb-4">批次：</div>
            <span v-for="b in item.batches" :key="b.batch_code" class="badge badge-draft" style="margin:2px">{{ b.batch_code }}({{ b.status }})</span>
          </div>
        </div>
      </div>
      <div v-else>
        <pre style="background:var(--bg);padding:16px;border-radius:var(--radius);overflow-x:auto;font-size:12px;line-height:1.8">{{ preview }}</pre>
      </div>
    </div>

    <div v-if="copied" class="alert alert-success mt-8">已复制到剪贴板</div>
  </div>
</template>

<script setup lang="ts">
const format = ref('json')
const scope = ref('all')
const includeMaterials = ref(true)
const includeBatches = ref(true)
const includeEvals = ref(true)
const preview = ref<any>(null)
const exporting = ref(false)
const copied = ref(false)
const formulas = ref<any[]>([])

const statusMap: Record<string, string> = { draft: '草稿', testing: '测评中', approved: '已批准', archived: '已归档' }
const noteMap: Record<string, string> = { top: '前调', middle: '中调', base: '后调' }
const segColors = ['#b8860b','#8b6914','#6b4c11','#a0522d','#cd853f','#d2b48c','#deb887','#c4a882','#e8c97a','#bfa36d']

function getSegments(materials: any[]) {
  const total = (materials || []).reduce((s: number, m: any) => s + (m.ratio || 0), 0)
  return (materials || []).map(m => ({
    name: m.material_name,
    pct: total > 0 ? Math.round((m.ratio / total) * 1000) / 10 : 0
  }))
}

async function loadFormulas() {
  const data = await $fetch('/api/formulas?pageSize=100') as any
  formulas.value = data.items
}

async function doExport() {
  exporting.value = true
  try {
    const params = new URLSearchParams()
    params.set('format', format.value)
    if (scope.value !== 'all') params.set('formula_id', scope.value)

    if (format.value === 'csv') {
      preview.value = await $fetch(`/api/export?${params}`)
    } else {
      preview.value = await $fetch(`/api/export?${params}`)
    }
  } finally {
    exporting.value = false
  }
}

function copyResult() {
  const text = typeof preview.value === 'string' ? preview.value : JSON.stringify(preview.value, null, 2)
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(loadFormulas)
</script>
