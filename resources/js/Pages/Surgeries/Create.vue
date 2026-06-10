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
            <a class="nav-link active" href="/surgeries">手术记录</a>
            <a class="nav-link" href="/follow-ups">随访记录</a>
            <a class="nav-link" href="/abnormal-records">异常记录</a>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h2>新增手术记录</h2>
      <form @submit.prevent="submitForm">
        <div class="form-group mb-3">
          <label>患者 *</label>
          <select v-model.number="form.patient_id" class="form-control" required>
            <option value="">请选择患者</option>
            <option v-for="patient in patients" :key="patient.id" :value="patient.id">
              {{ patient.name }} - {{ patient.id_card }}
            </option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label>种植体批号 *</label>
          <select v-model.number="form.implant_id" class="form-control" required>
            <option value="">请选择种植体批号</option>
            <option v-for="implant in implants" :key="implant.id" :value="implant.id">
              {{ implant.batch_number }} - {{ implant.brand }} (可用: {{ implant.quantity - implant.used_quantity }})
            </option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label>医生 *</label>
          <select v-model.number="form.doctor_id" class="form-control" required>
            <option value="">请选择医生</option>
            <option value="1">张医生</option>
            <option value="2">李医生</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label>手术日期 *</label>
          <input v-model="form.surgery_date" type="date" class="form-control" required>
        </div>
        <div class="form-group mb-3">
          <label>手术方案</label>
          <textarea v-model="form.plan" class="form-control" rows="3"></textarea>
        </div>
        <div class="form-group mb-3">
          <label>备注</label>
          <textarea v-model="form.notes" class="form-control" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">保存</button>
        <a href="/surgeries" class="btn btn-secondary ml-2">取消</a>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3'

defineProps({
  patients: Array,
  implants: Array
})

const form = useForm({
  patient_id: null,
  implant_id: null,
  doctor_id: null,
  surgery_date: '',
  plan: '',
  notes: ''
})

const submitForm = () => {
  form.post('/surgeries')
}
</script>
