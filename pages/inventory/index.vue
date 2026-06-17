<template>
  <div>
    <h1 class="page-title">📦 库存管理</h1>

    <div class="flex-between mb-8">
      <div class="flex-gap">
        <select v-model="categoryFilter" class="form-select" style="width:120px" @change="loadInventory">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <label class="flex-gap text-sm" style="cursor:pointer">
          <input type="checkbox" v-model="lowOnly" @change="loadInventory" />
          仅显示库存不足
        </label>
      </div>
      <div class="text-muted text-sm">共 {{ inventory.length }} 种香材</div>
    </div>

    <div v-if="lowStockItems.length > 0" class="alert alert-warning mb-16">
      <span>📦</span>
      <div>
        <strong>库存预警：</strong>{{ lowStockItems.length }} 种香材低于最低库存阈值
      </div>
    </div>

    <div class="card">
      <table v-if="inventory.length > 0">
        <thead>
          <tr>
            <th>香材名</th><th>分类</th><th>当前库存</th><th>最低阈值</th><th>库存状态</th><th>单价</th><th>供应商</th><th>最后补货</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in inventory" :key="inv.id" :style="inv.current_stock <= inv.min_threshold ? 'background:var(--danger-light)' : ''">
            <td class="fw-600">{{ inv.material_name }}</td>
            <td><span class="badge badge-draft">{{ inv.category }}</span></td>
            <td>
              <span :class="inv.current_stock <= inv.min_threshold ? 'text-danger fw-600' : ''">
                {{ inv.current_stock }}{{ inv.unit }}
              </span>
            </td>
            <td>{{ inv.min_threshold }}{{ inv.unit }}</td>
            <td>
              <div class="score-bar">
                <div class="score-track">
                  <div
                    :class="inv.current_stock <= inv.min_threshold ? 'score-fill-low' : inv.current_stock <= inv.min_threshold * 1.5 ? 'score-fill-mid' : 'score-fill-high'"
                    :style="{ width: Math.min(100, (inv.current_stock / (inv.min_threshold * 2)) * 100) + '%' }"
                    class="score-fill"
                  ></div>
                </div>
              </div>
            </td>
            <td>¥{{ inv.unit_cost }}</td>
            <td class="text-sm">{{ inv.supplier }}</td>
            <td class="text-sm">{{ inv.last_restocked?.slice(0,10) || '-' }}</td>
            <td>
              <button class="btn btn-sm" @click="openRestock(inv)">补货</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card mt-16">
      <div class="card-title">📊 库存消耗记录</div>
      <table v-if="logs.length > 0">
        <thead>
          <tr><th>香材</th><th>变动量</th><th>类型</th><th>关联批次</th><th>备注</th><th>时间</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="fw-600">{{ log.material_name }}</td>
            <td :class="log.change_amount < 0 ? 'text-danger' : 'text-success'" class="fw-600">
              {{ log.change_amount > 0 ? '+' : '' }}{{ log.change_amount }}{{ log.unit }}
            </td>
            <td>
              <span :class="'badge badge-' + logChangeType(log.change_type)">{{ logChangeLabel(log.change_type) }}</span>
            </td>
            <td>{{ log.batch_code || '-' }}</td>
            <td class="text-sm text-muted">{{ log.notes }}</td>
            <td class="text-sm">{{ log.created_at?.slice(0,16) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="restockItem" class="card" style="position:fixed;bottom:20px;right:20px;width:320px;z-index:200;box-shadow:var(--shadow-lg)">
      <div class="card-title">补货：{{ restockItem.material_name }}</div>
      <div class="form-group">
        <label class="form-label">补货数量({{ restockItem.unit }})</label>
        <input v-model.number="restockAmount" class="form-input" type="number" min="1" />
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input v-model="restockNotes" class="form-input" />
      </div>
      <div class="flex-gap">
        <button class="btn btn-primary btn-sm" @click="doRestock">确认</button>
        <button class="btn btn-sm" @click="restockItem = null">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const inventory = ref<any[]>([])
const logs = ref<any[]>([])
const categories = ref<string[]>([])
const categoryFilter = ref('')
const lowOnly = ref(false)
const restockItem = ref<any>(null)
const restockAmount = ref(0)
const restockNotes = ref('')

const lowStockItems = computed(() => inventory.value.filter(i => i.current_stock <= i.min_threshold))

function logChangeType(type: string) {
  if (type === 'consumption') return 'failed'
  if (type === 'restock') return 'approved'
  return 'testing'
}

function logChangeLabel(type: string) {
  const m: Record<string, string> = { consumption: '消耗', restock: '补货', adjustment: '调整' }
  return m[type] || type
}

function openRestock(item: any) {
  restockItem.value = item
  restockAmount.value = 0
  restockNotes.value = ''
}

async function loadInventory() {
  const params = new URLSearchParams()
  if (categoryFilter.value) params.set('category', categoryFilter.value)
  if (lowOnly.value) params.set('low_only', '1')
  inventory.value = await $fetch(`/api/inventory?${params}`) as any[]

  const cats = new Set(inventory.value.map(i => i.category))
  categories.value = Array.from(cats)
}

async function loadLogs() {
  logs.value = await $fetch('/api/inventory/logs') as any[]
}

async function doRestock() {
  if (!restockItem.value || restockAmount.value <= 0) return
  await $fetch(`/api/inventory/${restockItem.value.id}`, {
    method: 'PUT',
    body: {
      change_amount: restockAmount.value,
      change_type: 'restock',
      notes: restockNotes.value || '补货'
    }
  })
  restockItem.value = null
  await loadInventory()
  await loadLogs()
}

onMounted(() => {
  loadInventory()
  loadLogs()
})
</script>
