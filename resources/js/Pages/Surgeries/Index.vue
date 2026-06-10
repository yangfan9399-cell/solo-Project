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
      <div class="d-flex justify-content-between mb-4">
        <h2>手术记录</h2>
        <a href="/surgeries/create" class="btn btn-primary">新增手术记录</a>
      </div>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>患者</th>
            <th>种植体批号</th>
            <th>品牌</th>
            <th>医生</th>
            <th>手术日期</th>
            <th>随访状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="surgery in surgeries" :key="surgery.id">
            <td>{{ surgery.patient?.name }}</td>
            <td>{{ surgery.implant?.batch_number }}</td>
            <td>{{ surgery.implant?.brand }}</td>
            <td>{{ surgery.doctor?.name }}</td>
            <td>{{ formatDate(surgery.surgery_date) }}</td>
            <td>
              <span :class="getFollowUpStatusClass(surgery)" class="badge">
                {{ getFollowUpStatusText(surgery) }}
              </span>
            </td>
            <td>
              <button @click="viewSurgery(surgery.id)" class="btn btn-sm btn-info">查看详情</button>
              <button @click="addFollowUp(surgery.id)" class="btn btn-sm btn-success ml-1">添加随访</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { Inertia } from '@inertiajs/vue3'

defineProps({
  surgeries: Array
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const viewSurgery = (id) => {
  Inertia.visit(`/surgeries/${id}`)
}

const addFollowUp = (id) => {
  Inertia.visit(`/follow-ups/create?surgery_id=${id}`)
}

const getFollowUpStatusText = (surgery) => {
  if (!surgery.followUps || surgery.followUps.length === 0) {
    return '未随访'
  }
  const abnormalCount = surgery.followUps.filter(f => f.status !== 1).length
  if (abnormalCount > 0) {
    return '异常'
  }
  return '已随访'
}

const getFollowUpStatusClass = (surgery) => {
  if (!surgery.followUps || surgery.followUps.length === 0) {
    return 'bg-warning'
  }
  const abnormalCount = surgery.followUps.filter(f => f.status !== 1).length
  if (abnormalCount > 0) {
    return 'bg-danger'
  }
  return 'bg-success'
}
</script>
