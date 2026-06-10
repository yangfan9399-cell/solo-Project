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
      <h2>随访记录</h2>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>患者</th>
            <th>种植体批号</th>
            <th>随访日期</th>
            <th>随访类型</th>
            <th>护士</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="followUp in followUps" :key="followUp.id">
            <td>{{ followUp.surgery?.patient?.name }}</td>
            <td>{{ followUp.surgery?.implant?.batch_number }}</td>
            <td>{{ formatDate(followUp.follow_up_date) }}</td>
            <td>{{ getFollowUpTypeName(followUp.type) }}</td>
            <td>{{ followUp.nurse?.name }}</td>
            <td>
              <span :class="getStatusClass(followUp.status)" class="badge">
                {{ getStatusName(followUp.status) }}
              </span>
            </td>
            <td>{{ followUp.notes || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  followUps: Array
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const getFollowUpTypeName = (type) => {
  const types = {
    1: '术后1天',
    2: '术后7天',
    3: '术后1个月',
    4: '术后3个月',
    5: '术后6个月',
    6: '术后1年'
  }
  return types[type] || '未知'
}

const getStatusName = (status) => {
  const types = {
    1: '正常',
    2: '异常',
    3: '待复核'
  }
  return types[status] || '未知'
}

const getStatusClass = (status) => {
  const classes = {
    1: 'bg-success',
    2: 'bg-danger',
    3: 'bg-warning'
  }
  return classes[status] || 'bg-secondary'
}
</script>
