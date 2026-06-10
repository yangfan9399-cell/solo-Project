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
      <h2>新增种植体</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group mb-3">
          <label>批号 *</label>
          <input v-model="form.batch_number" type="text" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>品牌 *</label>
          <input v-model="form.brand" type="text" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>型号 *</label>
          <input v-model="form.model" type="text" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>生产日期 *</label>
          <input v-model="form.production_date" type="date" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>有效期 *</label>
          <input v-model="form.expiry_date" type="date" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>数量 *</label>
          <input v-model.number="form.quantity" type="number" class="form-control" min="1" required>
        </div>
        <button type="submit" class="btn btn-primary">保存</button>
        <a href="/implants" class="btn btn-secondary ml-2">取消</a>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useForm } from '@inertiajs/vue3'

const form = useForm({
  batch_number: '',
  brand: '',
  model: '',
  production_date: '',
  expiry_date: '',
  quantity: 1
})

const submitForm = () => {
  form.post('/implants')
}
</script>
