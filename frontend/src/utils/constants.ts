import {
  DispatchStatus,
  RepairStatus,
  StationStatus,
  BikeStatus,
  FaultType,
  NodeType,
  UserRole,
  DispatchSampleType,
} from '@/types';

export const dispatchStatusMap: Record<DispatchStatus, { label: string; color: string }> = {
  [DispatchStatus.PENDING]: { label: '待调度', color: 'warning' },
  [DispatchStatus.DISPATCHING]: { label: '调度中', color: 'primary' },
  [DispatchStatus.ARRIVED]: { label: '已到达', color: 'info' },
  [DispatchStatus.IN_REPAIR]: { label: '维修中', color: 'danger' },
  [DispatchStatus.PENDING_REVIEW]: { label: '待复核', color: 'warning' },
  [DispatchStatus.COMPLETED]: { label: '已完成', color: 'success' },
  [DispatchStatus.RETURNED]: { label: '已退回', color: 'danger' },
  [DispatchStatus.TIMEOUT]: { label: '已超时', color: 'danger' },
  [DispatchStatus.CANCELLED]: { label: '已取消', color: 'info' },
};

export const repairStatusMap: Record<RepairStatus, { label: string; color: string }> = {
  [RepairStatus.PENDING]: { label: '待维修', color: 'warning' },
  [RepairStatus.IN_PROGRESS]: { label: '维修中', color: 'primary' },
  [RepairStatus.COMPLETED]: { label: '已完成', color: 'success' },
  [RepairStatus.CANNOT_REPAIR]: { label: '无法维修', color: 'danger' },
};

export const stationStatusMap: Record<StationStatus, { label: string; color: string }> = {
  [StationStatus.NORMAL]: { label: '正常', color: 'success' },
  [StationStatus.LOW_STOCK]: { label: '缺车', color: 'warning' },
  [StationStatus.FAULTY]: { label: '故障', color: 'danger' },
  [StationStatus.MAINTENANCE]: { label: '维护中', color: 'info' },
};

export const bikeStatusMap: Record<BikeStatus, { label: string; color: string }> = {
  [BikeStatus.NORMAL]: { label: '正常', color: 'success' },
  [BikeStatus.FAULTY]: { label: '故障', color: 'danger' },
  [BikeStatus.MAINTENANCE]: { label: '维护中', color: 'info' },
  [BikeStatus.IN_TRANSIT]: { label: '在途', color: 'warning' },
};

export const faultTypeMap: Record<FaultType, { label: string; icon?: string }> = {
  [FaultType.BRAKE]: { label: '刹车故障' },
  [FaultType.TIRE]: { label: '轮胎故障' },
  [FaultType.CHAIN]: { label: '链条故障' },
  [FaultType.ELECTRIC]: { label: '电气故障' },
  [FaultType.STRUCTURE]: { label: '结构故障' },
  [FaultType.OTHER]: { label: '其他故障' },
};

export const nodeTypeMap: Record<NodeType, { label: string; color: string; icon?: string }> = {
  [NodeType.ALERT]: { label: '缺车告警', color: '#f56c6c' },
  [NodeType.DISPATCH_ASSIGNED]: { label: '调度分配', color: '#409eff' },
  [NodeType.DISPATCH_STARTED]: { label: '开始调度', color: '#409eff' },
  [NodeType.ARRIVED]: { label: '调度到达', color: '#67c23a' },
  [NodeType.FAULT_REPORTED]: { label: '故障上报', color: '#f56c6c' },
  [NodeType.REPAIR_STARTED]: { label: '开始维修', color: '#e6a23c' },
  [NodeType.REPAIR_COMPLETED]: { label: '维修完成', color: '#67c23a' },
  [NodeType.PENDING_REVIEW]: { label: '待复核', color: '#e6a23c' },
  [NodeType.REVIEW_PASSED]: { label: '复核通过', color: '#67c23a' },
  [NodeType.REVIEW_RETURNED]: { label: '复核退回', color: '#f56c6c' },
  [NodeType.TIMEOUT]: { label: '超时预警', color: '#f56c6c' },
  [NodeType.STATION_ERROR]: { label: '站点错误', color: '#f56c6c' },
  [NodeType.STATION_REBIND]: { label: '重新绑定', color: '#409eff' },
  [NodeType.REMARK]: { label: '备注', color: '#909399' },
};

export const userRoleMap: Record<UserRole, { label: string; color: string }> = {
  [UserRole.DISPATCHER]: { label: '调度员', color: 'primary' },
  [UserRole.REPAIRER]: { label: '维修员', color: 'warning' },
  [UserRole.REVIEWER]: { label: '复核人', color: 'success' },
  [UserRole.ADMIN]: { label: '管理员', color: 'danger' },
};

export const sampleTypeMap: Record<DispatchSampleType, { label: string; color: string }> = {
  [DispatchSampleType.NORMAL]: { label: '正常补车', color: 'success' },
  [DispatchSampleType.FAULTY]: { label: '车辆故障', color: 'danger' },
  [DispatchSampleType.STATION_ERROR]: { label: '站点错误', color: 'warning' },
  [DispatchSampleType.TIMEOUT]: { label: '调度超时', color: 'info' },
};
