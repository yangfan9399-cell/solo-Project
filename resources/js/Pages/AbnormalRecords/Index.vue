<template>
  <div class="container-fluid">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="/">种植体追踪系统</a>
        <div class="collapse navbar-collapse">
          <div class="navbar-nav">
            <a class="nav-link" href="/statistics">统计概览</a>
            <a class="nav-link" href="/implants">种植体管理</a>
            <a class="nav-link" href="/patients">患者管理</a>
            <a class="nav-link" href="/surgeries">手术记录</a>
            <a class="nav-link" href="/follow-ups">随访记录</a>
            <a class="nav-link active" href="/abnormal-records">异常记录</a>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h2>异常记录</h2>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>患者</th>
            <th>种植体批号</th>
            <th>随访日期</th>
            <th>异常类型</th>
            <th>异常描述</th>
            <th>复核状态</th>
            <th>复核人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.followUp?.surgery?.patient?.name }}</td>
            <td>{{ record.followUp?.surgery?.implant?.batch_number }}</td>
            <td>{{ formatDate(record.followUp?.follow_up_date) }}</td>
            <td>{{ getAbnormalTypeName(record.type) }}</td>
            <td>{{ record.description }}</td>
            <td>
              <span :class="getReviewStatusClass(record.review_status)" class="badge">
                {{ getReviewStatusName(record.review_status) }}
              </span>
            </td>
            <td>{{ record.reviewer?.name || '-' }}</td>
            <td>
              <button v-if="record.review_status === 0" @click="showReviewModal(record)" class="btn btn-sm btn-primary">复核</button>
              <span v-else class="text-muted">已处理</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal fade show" style="display:block; background: rgba(0,0,0,0.5)" @click.self="closeModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">复核异常记录</h5>
            <button @click="closeModal" class="btn-close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <p><strong>患者：</strong>{{ selectedRecord?.followUp?.surgery?.patient?.name }}</p>
              <p><strong>种植体批号：</strong>{{ selectedRecord?.followUp?.surgery?.implant?.batch_number }}</p>
              <p><strong>异常类型：</strong>{{ getAbnormalTypeName(selectedRecord?.type) }}</p>
              <p><strong>异常描述：</strong>{{ selectedRecord?.description }}</p>
            </div>
            <div class="form-group mb-3">
              <label>复核结果 *</label>
              <select v-model.number="reviewForm.review_status" class="form-control" required>
                <option value="1">已通过</option>
                <option value="2">需处理</option>
              </select>
            </div>
            <div class="form-group">
              <label>复核备注</label>
              <textarea v-model="reviewForm.review_notes" class="form-control" rows="2" placeholder="请输入复核意见（可选）"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModal" class="btn btn-secondary">取消</button>
            <button @click="submitReview" :disabled="isSubmitting" class="btn btn-primary">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
              {{ isSubmitting ? '处理中...' : '确认复核' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { router } from '@inertiajs/vue3'

defineProps({
  records: Array
})

const showModal = ref(false)
const selectedRecord = ref(null)
const isSubmitting = ref(false)
const reviewForm = reactive({
  review_status: 1,
  review_notes: ''
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const getAbnormalTypeName = (type) => {
  const types = {
    1: '术后感染',
    2: '病历缺项',
    3: '其他'
  }
  return types[type] || '未知'
}

const getReviewStatusName = (status) => {
  const types = {
    0: '待复核',
    1: '已通过',
    2: '需处理'
  }
  return types[status] || '未知'
}

const getReviewStatusClass = (status) => {
  const classes = {
    0: 'bg-warning',
    1: 'bg-success',
    2: 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

const showReviewModal = (record) => {
  selectedRecord.value = record
  reviewForm.review_status = 1
  reviewForm.review_notes = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedRecord.value = null
}

const submitReview = async () => {
  isSubmitting.value = true
  
  try {
    const response = await fetch(`/abnormal-records/${selectedRecord.value.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({
        review_status: reviewForm.review_status,
        review_notes: reviewForm.review_notes
      })
    })

    if (response.ok) {
      closeModal()
      router.visit('/abnormal-records', { reload: true })
    } else {
      const error = await response.json()
      alert(error.message || '复核失败')
    }
  } catch (error) {
    alert('网络错误，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>
