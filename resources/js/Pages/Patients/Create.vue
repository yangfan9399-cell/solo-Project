<template>
  <div class="container-fluid">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="/">种植体追踪系统</a>
        <div class="collapse navbar-collapse">
          <div class="navbar-nav">
            <a class="nav-link" href="/statistics">统计概览</a>
            <a class="nav-link" href="/implants">种植体管理</a>
            <a class="nav-link active" href="/patients">患者管理</a>
            <a class="nav-link" href="/surgeries">手术记录</a>
            <a class="nav-link" href="/follow-ups">随访记录</a>
            <a class="nav-link" href="/abnormal-records">异常记录</a>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h2>新增患者</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group mb-3">
          <label>姓名 *</label>
          <input v-model="form.name" type="text" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>身份证号 *</label>
          <input v-model="form.id_card" type="text" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>手机号 *</label>
          <input v-model="form.phone" type="text" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>性别 *</label>
          <select v-model.number="form.gender" class="form-control" required>
            <option value="1">男</option>
            <option value="2">女</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label>出生日期 *</label>
          <input v-model="form.birth_date" type="date" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>地址</label>
          <textarea v-model="form.address" class="form-control" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">保存</button>
        <a href="/patients" class="btn btn-secondary ml-2">取消</a>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({
  name: '',
  id_card: '',
  phone: '',
  gender: 1,
  birth_date: '',
  address: ''
})

const submitForm = () => {
  form.post('/patients')
}
</script>
