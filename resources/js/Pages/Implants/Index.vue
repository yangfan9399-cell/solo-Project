<template>
  <div class="container-fluid">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="/">种植体追踪系统</a>
        <div class="collapse navbar-collapse">
          <div class="navbar-nav">
            <a class="nav-link" href="/statistics">统计概览</a>
            <a class="nav-link active" href="/implants">种植体管理</a>
            <a class="nav-link" href="/patients">患者管理</a>
            <a class="nav-link" href="/surgeries">手术记录</a>
            <a class="nav-link" href="/follow-ups">随访记录</a>
            <a class="nav-link" href="/abnormal-records">异常记录</a>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <div class="d-flex justify-content-between mb-4">
        <h2>种植体管理</h2>
        <a href="/implants/create" class="btn btn-primary">新增种植体</a>
      </div>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>批号</th>
            <th>品牌</th>
            <th>型号</th>
            <th>生产日期</th>
            <th>有效期</th>
            <th>总量</th>
            <th>已使用</th>
            <th>可用</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="implant in implants" :key="implant.id">
            <td>{{ implant.batch_number }}</td>
            <td>{{ implant.brand }}</td>
            <td>{{ implant.model }}</td>
            <td>{{ formatDate(implant.production_date) }}</td>
            <td>{{ formatDate(implant.expiry_date) }}</td>
            <td>{{ implant.quantity }}</td>
            <td>{{ implant.used_quantity }}</td>
            <td>{{ implant.quantity - implant.used_quantity }}</td>
            <td>
              <span v-if="implant.is_recalled" class="badge bg-danger">已召回</span>
              <span v-else class="badge bg-success">正常</span>
            </td>
            <td>
              <button @click="viewImplant(implant.id)" class="btn btn-sm btn-info">查看</button>
              <button v-if="!implant.is_recalled" @click="showRecallModal(implant)" class="btn btn-sm btn-danger">召回</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal fade show" style="display:block" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">批号召回 - {{ selectedImplant?.batch_number }}</h5>
            <button @click="closeModal" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div v-if="relatedPatients.length > 0" class="alert alert-warning mb-4">
              <p>警告：该批次种植体已用于以下患者，召回后将无法继续使用：</p>
              <ul>
                <li v-for="patient in relatedPatients" :key="patient.id">{{ patient.name }} - {{ patient.id_card }}</li>
              </ul>
            </div>
            <div class="form-group">
              <label>召回原因</label>
              <textarea v-model="recallReason" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModal" class="btn btn-secondary">取消</button>
            <button @click="submitRecall" class="btn btn-danger">确认召回</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Inertia } from '@inertiajs/vue3'

defineProps({
  implants: Array
})

const showModal = ref(false)
const selectedImplant = ref(null)
const recallReason = ref('')
const relatedPatients = ref([])

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const viewImplant = (id) => {
  Inertia.visit(`/implants/${id}`)
}

const showRecallModal = async (implant) => {
  selectedImplant.value = implant
  const response = await fetch(`/implants/${implant.id}/patients`)
  relatedPatients.value = await response.json()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedImplant.value = null
  recallReason.value = ''
  relatedPatients.value = []
}

const submitRecall = async () => {
  if (!recallReason.value.trim()) {
    alert('请填写召回原因')
    return
  }
  await fetch(`/implants/${selectedImplant.value.id}/recall`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify({ recall_reason: recallReason.value })
  })
  closeModal()
  Inertia.visit('/implants')
}
</script>
