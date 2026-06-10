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
      <h2>手术详情</h2>
      <a href="/surgeries" class="btn btn-secondary mb-4">返回列表</a>

      <div class="row">
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header bg-info text-white">患者信息</div>
            <div class="card-body">
              <p><strong>姓名：</strong>{{ surgery.patient?.name }}</p>
              <p><strong>身份证号：</strong>{{ surgery.patient?.id_card }}</p>
              <p><strong>手机号：</strong>{{ surgery.patient?.phone }}</p>
              <p><strong>性别：</strong>{{ surgery.patient?.gender === 1 ? '男' : '女' }}</p>
              <p><strong>出生日期：</strong>{{ formatDate(surgery.patient?.birth_date) }}</p>
            </div>
          </div>

          <div class="card mb-4">
            <div class="card-header bg-success text-white">种植体信息</div>
            <div class="card-body">
              <p><strong>批号：</strong>{{ surgery.implant?.batch_number }}</p>
              <p><strong>品牌：</strong>{{ surgery.implant?.brand }}</p>
              <p><strong>型号：</strong>{{ surgery.implant?.model }}</p>
              <p><strong>生产日期：</strong>{{ formatDate(surgery.implant?.production_date) }}</p>
              <p><strong>有效期：</strong>{{ formatDate(surgery.implant?.expiry_date) }}</p>
              <p v-if="surgery.implant?.is_recalled" class="text-danger">
                <strong>状态：已召回 - {{ surgery.implant.recall_reason }}</strong>
              </p>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">手术信息</div>
            <div class="card-body">
              <p><strong>医生：</strong>{{ surgery.doctor?.name }}</p>
              <p><strong>手术日期：</strong>{{ formatDate(surgery.surgery_date) }}</p>
              <p><strong>手术方案：</strong>{{ surgery.plan || '-' }}</p>
              <p><strong>备注：</strong>{{ surgery.notes || '-' }}</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header bg-warning text-white">随访记录</div>
            <div class="card-body">
              <table class="table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>类型</th>
                    <th>护士</th>
                    <th>状态</th>
                    <th>异常说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="followUp in surgery.followUps" :key="followUp.id">
                    <td>{{ formatDate(followUp.follow_up_date) }}</td>
                    <td>{{ getFollowUpTypeName(followUp.type) }}</td>
                    <td>{{ followUp.nurse?.name }}</td>
                    <td>
                      <span :class="getStatusClass(followUp.status)" class="badge">
                        {{ getStatusName(followUp.status) }}
                      </span>
                    </td>
                    <td>
                      <div v-for="abnormal in followUp.abnormalRecords" :key="abnormal.id">
                        <span class="text-danger">{{ getAbnormalTypeName(abnormal.type) }}: {{ abnormal.description }}</span>
                        <div v-if="abnormal.review_status !== 0" class="text-sm">
                          复核: {{ getReviewStatusName(abnormal.review_status) }}
                        </div>
                      </div>
                      <span v-if="!followUp.abnormalRecords || followUp.abnormalRecords.length === 0">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header bg-dark text-white">历史节点</div>
        <div class="card-body">
          <div class="timeline">
            <div class="timeline-item">
              <span class="timeline-dot bg-success"></span>
              <div>
                <strong>种植体入库</strong>
                <p>{{ formatDate(surgery.implant?.created_at) }}</p>
              </div>
            </div>
            <div class="timeline-item">
              <span class="timeline-dot bg-primary"></span>
              <div>
                <strong>手术使用</strong>
                <p>{{ formatDate(surgery.surgery_date) }}</p>
              </div>
            </div>
            <div v-for="followUp in surgery.followUps" :key="followUp.id">
              <div class="timeline-item">
                <span :class="getStatusDotClass(followUp.status)"></span>
                <div>
                  <strong>随访 - {{ getFollowUpTypeName(followUp.type) }}</strong>
                  <p>{{ formatDate(followUp.follow_up_date) }} - {{ getStatusName(followUp.status) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  surgery: Object
})

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
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

const getStatusDotClass = (status) => {
  const classes = {
    1: 'timeline-dot bg-success',
    2: 'timeline-dot bg-danger',
    3: 'timeline-dot bg-warning'
  }
  return classes[status] || 'timeline-dot bg-secondary'
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
</script>

<style scoped>
.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ddd;
}

.timeline-item {
  position: relative;
  padding: 10px 0;
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #333;
}
</style>
