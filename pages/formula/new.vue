<template>
  <div>
    <h1 class="page-title">➕ 新建配方</h1>

    <div class="card">
      <div class="card-title">基本信息</div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">配方名 *</label>
          <input v-model="form.name" class="form-input" placeholder="如：檀静安神" />
        </div>
        <div class="form-group">
          <label class="form-label">设计留香(小时)</label>
          <input v-model.number="form.longevity_hours" class="form-input" type="number" step="0.5" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">描述</label>
        <textarea v-model="form.description" class="form-textarea" placeholder="配方用途、灵感来源等"></textarea>
      </div>
      <div class="grid-3">
        <div class="form-group">
          <label class="form-label">前调</label>
          <input v-model="form.top_note" class="form-input" placeholder="佛手柑、甜橙" />
        </div>
        <div class="form-group">
          <label class="form-label">中调</label>
          <input v-model="form.middle_note" class="form-input" placeholder="檀香、乳香" />
        </div>
        <div class="form-group">
          <label class="form-label">后调</label>
          <input v-model="form.base_note" class="form-input" placeholder="沉香、安息香" />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">燃烧时间(最小/分钟)</label>
          <input v-model.number="form.burning_time_min" class="form-input" type="number" />
        </div>
        <div class="form-group">
          <label class="form-label">燃烧时间(最大/分钟)</label>
          <input v-model.number="form.burning_time_max" class="form-input" type="number" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex-between">
        <div class="card-title" style="border:none;padding:0;margin:0">🧪 香材配伍</div>
        <button class="btn btn-sm" @click="addMaterial">➕ 添加香材</button>
      </div>
      <div v-if="form.materials.length > 0" class="mt-8">
        <div v-for="(m, i) in form.materials" :key="i" class="flex-gap mb-8" style="align-items:end">
          <div class="form-group" style="margin:0;flex:2">
            <label class="form-label">香材名</label>
            <input v-model="m.material_name" class="form-input" />
          </div>
          <div class="form-group" style="margin:0;flex:1">
            <label class="form-label">用量</label>
            <input v-model.number="m.ratio" class="form-input" type="number" step="0.1" />
          </div>
          <div class="form-group" style="margin:0;width:60px">
            <label class="form-label">单位</label>
            <input v-model="m.unit" class="form-input" />
          </div>
          <div class="form-group" style="margin:0;width:90px">
            <label class="form-label">调性</label>
            <select v-model="m.note_type" class="form-select">
              <option value="top">前调</option>
              <option value="middle">中调</option>
              <option value="base">后调</option>
            </select>
          </div>
          <button class="btn btn-sm btn-danger" @click="form.materials.splice(i,1)">✕</button>
        </div>
      </div>
      <div v-else class="text-muted mt-8">尚未添加香材，点击右上角添加</div>
    </div>

    <div class="flex-gap mt-16">
      <button class="btn btn-primary" @click="submit" :disabled="submitting">{{ submitting ? '提交中...' : '✅ 创建配方' }}</button>
      <NuxtLink to="/" class="btn">取消</NuxtLink>
    </div>

    <div v-if="error" class="alert alert-danger mt-8">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  name: '',
  description: '',
  top_note: '',
  middle_note: '',
  base_note: '',
  burning_time_min: 0,
  burning_time_max: 0,
  longevity_hours: 0,
  materials: [] as { material_name: string; ratio: number; unit: string; note_type: string }[]
})

const submitting = ref(false)
const error = ref('')

function addMaterial() {
  form.value.materials.push({ material_name: '', ratio: 0, unit: 'g', note_type: 'middle' })
}

async function submit() {
  error.value = ''
  if (!form.value.name.trim()) {
    error.value = '配方名不能为空'
    return
  }

  submitting.value = true
  try {
    const result = await $fetch('/api/formulas', {
      method: 'POST',
      body: form.value
    })
    navigateTo(`/formula/${(result as any).id}`)
  } catch (e: any) {
    error.value = e.data?.statusMessage || '创建失败'
  } finally {
    submitting.value = false
  }
}
</script>
