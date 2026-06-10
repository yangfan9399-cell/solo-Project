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
            <a class="nav-link" href="/abnormal-records">异常记录</a>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <h2 class="mb-4">统计概览</h2>
      
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="card-title">总手术数</h5>
              <p class="card-text display-4">{{ stats.total_surgeries }}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="card-title">总随访数</h5>
              <p class="card-text display-4">{{ stats.total_follow_ups }}</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h5 class="card-title">随访完成率</h5>
              <p class="card-text display-4">{{ stats.follow_up_rate }}%</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">医生手术统计</div>
            <div class="card-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>医生</th>
                    <th>手术数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.by_doctor" :key="item.doctor_id">
                    <td>{{ item.doctor?.name || '未知' }}</td>
                    <td>{{ item.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">品牌使用统计</div>
            <div class="card-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>品牌</th>
                    <th>使用数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.by_brand" :key="item.brand">
                    <td>{{ item.brand }}</td>
                    <td>{{ item.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">异常类型统计</div>
            <div class="card-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.by_abnormal_type" :key="item.type">
                    <td>{{ getAbnormalTypeName(item.type) }}</td>
                    <td>{{ item.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">随访状态统计</div>
            <div class="card-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in stats.follow_up_stats" :key="item.status">
                    <td>{{ getFollowUpStatusName(item.status) }}</td>
                    <td>{{ item.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: Object
})

const getAbnormalTypeName = (type) => {
  const types = {
    1: '术后感染',
    2: '病历缺项',
    3: '其他'
  }
  return types[type] || '未知'
}

const getFollowUpStatusName = (status) => {
  const types = {
    1: '正常',
    2: '异常',
    3: '待复核'
  }
  return types[status] || '未知'
}
</script>
