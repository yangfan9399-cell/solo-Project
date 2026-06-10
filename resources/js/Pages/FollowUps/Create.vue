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
            <a class="nav-link active" href="/follow-ups">随访记录</a>
            <a class="nav-link" href="/abnormal-records">异常记录</a>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h2>新增随访记录</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group mb-3">
          <label>手术记录 *</label>
          <input v-model="form.surgery_id" type="hidden" :value="surgery?.id">
          <p class="form-control-plaintext">{{ surgery?.patient?.name }} - {{ surgery?.implant?.batch_number }}</p>
        </div>
        <div class="form-group mb-3">
          <label>随访日期 *</label>
          <input v-model="form.follow_up_date" type="date" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>随访类型 *</label>
          <select v-model.number="form.type" class="form-control" required>
            <option value="1">术后1天</option>
            <option value="2">术后7天</option>
            <option value="3">术后1个月</option>
            <option value="4">术后3个月</option>
            <option value="5">术后6个月</option>
            <option value="6">术后1年</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label>护士 *</label>
          <select v-model.number="form.nurse_id" class="form-control" required>
            <option value="3">王护士</option>
            <option value="4">刘护士</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label>随访状态 *</label>
          <select v-model.number="form.status" class="form-control" required @change="handleStatusChange">
            <option value="1">正常</option>
            <option value="2">异常</option>
            <option value="3">待复核</option>
          </select>
        </div>
        <div v-if="form.status !== 1" class="border p-3 mb-3">
          <div class="form-group mb-3">
            <label>异常类型 *</label>
            <select v-model.number="form.abnormal_type" class="form-control">
              <option value="1">术后感染</option>
              <option value="2">病历缺项</option>
              <option value="3">其他</option>
            </select>
          </div>
          <div class="form-group mb-3">
            <label>异常说明 *</label>
            <textarea v-model="form.abnormal_description" class="form-control" rows="3"></textarea>
          </div>
        </div>
        <div class="form-group mb-3">
          <label>随访备注</label>
          <textarea v-model="form.notes" class="form-control" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">保存</button>
        <a :href="'/surgeries/' + surgery.id" class="btn btn-secondary ml-2">取消</a>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3'

defineProps({
  surgery: Object
})

const form = useForm({
  surgery_id: null,
  follow_up_date: '',
  type: 1,
  nurse_id: 3,
  status: 1,
  notes: '',
  abnormal_type: 1,
  abnormal_description: ''
})

const handleStatusChange = () => {
  if (form.status === 1) {
    form.abnormal_type = 1
    form.abnormal_description = ''
  }
}

const submitForm = () => {
  form.post('/follow-ups')
}
</script>
