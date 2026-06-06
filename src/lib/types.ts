export enum Role {
  WAREHOUSE_CLERK = 'WAREHOUSE_CLERK',
  QUALITY_MANAGER = 'QUALITY_MANAGER',
  REVIEWER = 'REVIEWER',
}

export enum ShipmentStatus {
  REGISTERED = 'REGISTERED',
  TEMPERATURE_COLLECTED = 'TEMPERATURE_COLLECTED',
  DEVIATION_JUDGED = 'DEVIATION_JUDGED',
  RELEASED = 'RELEASED',
  ISOLATED = 'ISOLATED',
  RETURNED = 'RETURNED',
}

export enum DeviationType {
  NONE = 'NONE',
  TEMPERATURE_EXCEEDED = 'TEMPERATURE_EXCEEDED',
  PROBE_OFFLINE = 'PROBE_OFFLINE',
  BATCH_MIXED = 'BATCH_MIXED',
}

export enum DeviationLevel {
  NONE = 'NONE',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

export enum DisposalAction {
  PENDING = 'PENDING',
  RELEASE = 'RELEASE',
  ISOLATE = 'ISOLATE',
  RETURN = 'RETURN',
}

export enum ProbeStatus {
  ACTIVE = 'ACTIVE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

export const RoleLabels: Record<Role, string> = {
  [Role.WAREHOUSE_CLERK]: '仓库经办人',
  [Role.QUALITY_MANAGER]: '质量负责人',
  [Role.REVIEWER]: '复核人',
}

export const ShipmentStatusLabels: Record<ShipmentStatus, string> = {
  [ShipmentStatus.REGISTERED]: '已登记',
  [ShipmentStatus.TEMPERATURE_COLLECTED]: '温度已采集',
  [ShipmentStatus.DEVIATION_JUDGED]: '偏差已判定',
  [ShipmentStatus.RELEASED]: '已放行',
  [ShipmentStatus.ISOLATED]: '已隔离',
  [ShipmentStatus.RETURNED]: '已退回',
}

export const DeviationTypeLabels: Record<DeviationType, string> = {
  [DeviationType.NONE]: '无偏差',
  [DeviationType.TEMPERATURE_EXCEEDED]: '温度超标',
  [DeviationType.PROBE_OFFLINE]: '探头离线',
  [DeviationType.BATCH_MIXED]: '批号混装',
}

export const DeviationLevelLabels: Record<DeviationLevel, string> = {
  [DeviationLevel.NONE]: '无',
  [DeviationLevel.MINOR]: '轻微',
  [DeviationLevel.MAJOR]: '严重',
  [DeviationLevel.CRITICAL]: '危急',
}

export const DisposalActionLabels: Record<DisposalAction, string> = {
  [DisposalAction.PENDING]: '待处理',
  [DisposalAction.RELEASE]: '放行',
  [DisposalAction.ISOLATE]: '隔离',
  [DisposalAction.RETURN]: '退回',
}

export const ProbeStatusLabels: Record<ProbeStatus, string> = {
  [ProbeStatus.ACTIVE]: '正常',
  [ProbeStatus.OFFLINE]: '离线',
  [ProbeStatus.MAINTENANCE]: '维护中',
}
