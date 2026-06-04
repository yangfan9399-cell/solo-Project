import { RepairStatus, DeviceType, UserRole } from '@prisma/client'

export const STATUS_LABELS: Record<RepairStatus, string> = {
  [RepairStatus.SUBMITTED]: '已提交',
  [RepairStatus.ASSIGNED]: '已派工',
  [RepairStatus.IN_PROGRESS]: '维修中',
  [RepairStatus.PARTS_SHORTAGE]: '配件缺货',
  [RepairStatus.PENDING_ACCEPTANCE]: '待验收',
  [RepairStatus.ACCEPTED]: '已验收',
  [RepairStatus.REJECTED]: '验收不通过',
  [RepairStatus.ARCHIVED]: '已归档',
}

export const STATUS_COLORS: Record<RepairStatus, string> = {
  [RepairStatus.SUBMITTED]: 'bg-gray-100 text-gray-800',
  [RepairStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [RepairStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [RepairStatus.PARTS_SHORTAGE]: 'bg-orange-100 text-orange-800',
  [RepairStatus.PENDING_ACCEPTANCE]: 'bg-purple-100 text-purple-800',
  [RepairStatus.ACCEPTED]: 'bg-green-100 text-green-800',
  [RepairStatus.REJECTED]: 'bg-red-100 text-red-800',
  [RepairStatus.ARCHIVED]: 'bg-slate-100 text-slate-800',
}

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  [DeviceType.PROJECTOR]: '投影仪',
  [DeviceType.COMPUTER]: '电脑',
  [DeviceType.AIR_CONDITIONER]: '空调',
  [DeviceType.LIGHTING]: '照明',
  [DeviceType.OTHER]: '其他',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUBMITTER]: '报修人',
  [UserRole.TECHNICIAN]: '维修员',
  [UserRole.INSPECTOR]: '验收员',
  [UserRole.ADMIN]: '管理员',
}
