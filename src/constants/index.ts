export const WorkOrderStatus = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  REPAIRING: 'repairing',
  PENDING_SETTLEMENT: 'pending_settlement',
  DISPUTED: 'disputed',
  ARCHIVED: 'archived'
} as const

export const WorkOrderStatusLabel: Record<string, string> = {
  pending: '待处理',
  assigned: '已分配',
  repairing: '维修中',
  pending_settlement: '待结算',
  disputed: '争议中',
  archived: '已归档'
}

export const WorkOrderStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  repairing: 'bg-orange-100 text-orange-800',
  pending_settlement: 'bg-purple-100 text-purple-800',
  disputed: 'bg-red-100 text-red-800',
  archived: 'bg-green-100 text-green-800'
}

export const FaultSource = {
  MONITOR_ALERT: 'monitor_alert',
  USER_REPORT: 'user_report',
  PATROL_FOUND: 'patrol_found'
} as const

export const FaultSourceLabel: Record<string, string> = {
  monitor_alert: '监控告警',
  user_report: '用户报修',
  patrol_found: '巡检发现'
}

export const FaultType = {
  COMMUNICATION_FAULT: 'communication_fault',
  CHARGING_FAULT: 'charging_fault',
  POWER_FAULT: 'power_fault',
  GUN_FAULT: 'gun_fault',
  SCREEN_FAULT: 'screen_fault',
  OTHER: 'other'
} as const

export const FaultTypeLabel: Record<string, string> = {
  communication_fault: '通信故障',
  charging_fault: '充电故障',
  power_fault: '电源故障',
  gun_fault: '枪头故障',
  screen_fault: '屏幕故障',
  other: '其他故障'
}

export const RepairType = {
  REMOTE_RECOVERY: 'remote_recovery',
  ON_SITE_REPAIR: 'on_site_repair'
} as const

export const RepairTypeLabel: Record<string, string> = {
  remote_recovery: '远程恢复',
  on_site_repair: '现场维修'
}

export const OperatorRoleLabel: Record<string, string> = {
  system: '系统',
  dispatcher: '调度员',
  technician: '技术员',
  finance: '财务'
}

export const TechnicianList = [
  { id: 'USER-ZHANG', name: '张工' },
  { id: 'USER-LI', name: '李工' },
  { id: 'USER-WANG', name: '王工' },
  { id: 'USER-ZHAO', name: '赵工' }
]

export const StationList = [
  { id: 'ST-HD-ZGC', name: '海淀中关村充电站' },
  { id: 'ST-CY-WJ', name: '朝阳望京充电站' },
  { id: 'ST-FT-KJY', name: '丰台科技园充电站' },
  { id: 'ST-SJS-GBD', name: '石景山古城充电站' }
]
