import React from 'react'
import { Tag } from 'antd'

const STATUS_CONFIG = {
  appointment: {
    scheduled: { color: 'blue', label: '已预约' },
    checked_in: { color: 'green', label: '已签到' },
    completed: { color: 'purple', label: '已完成' },
    cancelled: { color: 'default', label: '已取消' },
    no_show: { color: 'red', label: '未到店' }
  },
  severity: {
    mild: { color: 'gold', label: '轻微' },
    moderate: { color: 'orange', label: '中度' },
    severe: { color: 'red', label: '严重' }
  },
  batch: {
    normal: { color: 'green', label: '正常' },
    quarantine: { color: 'gold', label: '隔离' },
    recalled: { color: 'red', label: '已召回' },
    expired: { color: 'default', label: '已过期' }
  },
  reminder: {
    pending: { color: 'gold', label: '待发送' },
    sent: { color: 'blue', label: '已发送' },
    completed: { color: 'green', label: '已完成' },
    cancelled: { color: 'default', label: '已取消' }
  }
}

export default function StatusBadge({ type, status }) {
  const config = STATUS_CONFIG[type]?.[status]
  if (!config) {
    return <Tag>{status}</Tag>
  }
  return <Tag color={config.color}>{config.label}</Tag>
}
