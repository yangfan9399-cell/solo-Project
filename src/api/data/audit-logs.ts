import type { AuditLog } from '../../shared/types';

export const auditLogs: AuditLog[] = [
  {
    id: 'log-001',
    packageId: 'pkg-inscription-003',
    action: '版本发布',
    description: '铭文残缺检测模型 v3.0.0 正式发布',
    operator: '王思远',
    timestamp: '2025-05-20T11:00:00Z',
    details: {
      fromVersion: 'v2.0.0',
      toVersion: 'v3.0.0',
      affectedSamples: 156
    }
  },
  {
    id: 'log-002',
    packageId: 'pkg-inscription-003',
    action: '发布审批通过',
    description: '铭文残缺 v3.0.0 版本发布审批通过',
    operator: '张主任',
    timestamp: '2025-05-19T16:30:00Z',
    details: {
      approvalType: 'release',
      version: 'v3.0.0'
    }
  },
  {
    id: 'log-003',
    packageId: 'pkg-rust-level-002',
    action: '阻断项创建',
    description: '发现青铜器锈蚀类型误判问题',
    operator: '李明辉',
    timestamp: '2025-06-08T10:30:00Z',
    details: {
      blockerId: 'blk-rust-001',
      severity: 'high'
    }
  },
  {
    id: 'log-004',
    packageId: 'pkg-rust-level-002',
    action: '版本状态变更',
    description: '锈蚀级别 v1.3.0 状态变更为待阻断',
    operator: '系统',
    timestamp: '2025-06-08T10:35:00Z',
    details: {
      fromStatus: 'pending',
      toStatus: 'blocked',
      reason: '发现高优先级阻断项'
    }
  },
  {
    id: 'log-005',
    packageId: 'pkg-clarity-001',
    action: '版本创建',
    description: '创建拓片清晰度 v2.1.0 版本',
    operator: '李文博',
    timestamp: '2025-06-10T14:30:00Z',
    details: {
      version: 'v2.1.0',
      changeLogCount: 4
    }
  },
  {
    id: 'log-006',
    packageId: 'pkg-clarity-001',
    action: '样本锁定',
    description: '锁定西安碑林唐井铭拓片样本',
    operator: '李文博',
    timestamp: '2025-06-11T09:30:00Z',
    details: {
      sampleId: 'smp-clarity-001',
      reason: '人工复核中'
    }
  },
  {
    id: 'log-007',
    packageId: 'pkg-orientation-004',
    action: '草稿创建',
    description: '创建井圈方位 v1.0.0 草稿版本',
    operator: '陈晓东',
    timestamp: '2025-06-15T09:10:00Z',
    details: {
      version: 'v1.0.0',
      status: 'draft'
    }
  },
  {
    id: 'log-008',
    packageId: 'pkg-rust-level-002',
    action: '阻断项解决',
    description: '年份维度统计功能Bug已修复',
    operator: '赵建国',
    timestamp: '2025-06-09T16:30:00Z',
    details: {
      blockerId: 'blk-rust-004',
      resolution: '修复跨年数据统计逻辑'
    }
  },
  {
    id: 'log-009',
    packageId: 'pkg-clarity-001',
    action: '阻断项解决',
    description: '局部清晰度热力图性能优化完成',
    operator: '陈志强',
    timestamp: '2025-06-12T10:00:00Z',
    details: {
      blockerId: 'blk-clarity-002',
      improvement: '处理速度提升3倍'
    }
  },
  {
    id: 'log-010',
    packageId: 'pkg-inscription-003',
    action: '回滚草案创建',
    description: '创建 v3.0.0 回滚至 v2.0.0 的回滚草案',
    operator: '王思远',
    timestamp: '2025-05-25T14:00:00Z',
    details: {
      rollbackId: 'rb-inscription-001',
      targetVersion: 'v2.0.0'
    }
  },
  {
    id: 'log-011',
    packageId: 'pkg-inscription-003',
    action: '阻断项创建',
    description: '发现残缺铭文补读与旧释文冲突（西安碑林唐井铭）',
    operator: '王思远',
    timestamp: '2025-06-13T10:20:00Z',
    details: {
      blockerId: 'blk-inscription-001',
      severity: 'high',
      type: 'inscription_conflict'
    }
  },
  {
    id: 'log-012',
    packageId: 'pkg-inscription-003',
    action: '阻断项创建',
    description: '洛阳隋代井栏铭文口径数据与考古实测冲突',
    operator: '赵明诚',
    timestamp: '2025-06-13T14:05:00Z',
    details: {
      blockerId: 'blk-inscription-002',
      severity: 'high',
      sample: '洛阳出土隋代井栏铭文'
    }
  },
  {
    id: 'log-013',
    packageId: 'pkg-inscription-003',
    action: '阻断项解决',
    description: '辽金西夏铭文数据补充完成，对照数据库阻断解决',
    operator: '陈寅格',
    timestamp: '2025-05-18T11:20:00Z',
    details: {
      blockerId: 'blk-inscription-004',
      resolution: '补充127条辽金西夏铭文'
    }
  },
  {
    id: 'log-014',
    packageId: 'pkg-inscription-003',
    action: '样本锁定',
    description: '锁定苏州园林清代井栏题字（一级文物拓片）',
    operator: '文保审核组',
    timestamp: '2025-06-10T09:45:00Z',
    details: {
      sampleId: 'smp-ins-005',
      reason: '一级文物二次审核'
    }
  },
  {
    id: 'log-015',
    packageId: 'pkg-inscription-003',
    action: '样本锁定',
    description: '锁定拉萨布达拉宫藏汉双语铭文（宗教事务审批）',
    operator: '西藏文保中心',
    timestamp: '2025-06-08T13:00:00Z',
    details: {
      sampleId: 'smp-ins-010',
      reason: '藏文释读需宗教审批'
    }
  },
  {
    id: 'log-016',
    packageId: 'pkg-orientation-004',
    action: '阻断项创建',
    description: '北宋地磁偏角校正参数学术争议需确认',
    operator: '竺可桢',
    timestamp: '2025-06-15T10:00:00Z',
    details: {
      blockerId: 'blk-orientation-001',
      severity: 'medium'
    }
  },
  {
    id: 'log-017',
    packageId: 'pkg-orientation-004',
    action: '阻断项创建',
    description: '曲阜孔庙古井方位偏离建筑轴线超阈值需现场复核',
    operator: '梁思成',
    timestamp: '2025-06-14T16:30:00Z',
    details: {
      blockerId: 'blk-orientation-002',
      severity: 'high',
      deviation: '2.3°'
    }
  },
  {
    id: 'log-018',
    packageId: 'pkg-orientation-004',
    action: '版本创建',
    description: '创建井圈方位 v0.8.0 内测版',
    operator: '陈晓东',
    timestamp: '2025-04-10T13:00:00Z',
    details: {
      version: 'v0.8.0',
      changeLogCount: 3
    }
  },
  {
    id: 'log-019',
    packageId: 'pkg-orientation-004',
    action: '版本创建',
    description: '创建井圈方位 v0.9.0 优化版（增加磁偏角校正）',
    operator: '陈晓东',
    timestamp: '2025-05-01T13:20:00Z',
    details: {
      version: 'v0.9.0',
      changeLogCount: 4
    }
  },
  {
    id: 'log-020',
    packageId: 'pkg-rust-level-002',
    action: '版本创建',
    description: '创建锈蚀级别 v1.0.0 初始版本',
    operator: '张秋月',
    timestamp: '2024-10-20T11:30:00Z',
    details: {
      version: 'v1.0.0',
      changeLogCount: 3
    }
  },
  {
    id: 'log-021',
    packageId: 'pkg-rust-level-002',
    action: '版本发布',
    description: '锈蚀级别 v1.2.0 正式发布',
    operator: '张秋月',
    timestamp: '2025-01-20T10:15:00Z',
    details: {
      fromVersion: 'v1.0.0',
      toVersion: 'v1.2.0',
      affectedSamples: 203
    }
  },
  {
    id: 'log-022',
    packageId: 'pkg-rust-level-002',
    action: '阻断项创建',
    description: '锈蚀发展预测缺乏长期观测数据',
    operator: '王晓燕',
    timestamp: '2025-06-10T14:20:00Z',
    details: {
      blockerId: 'blk-rust-002',
      severity: 'medium'
    }
  },
  {
    id: 'log-023',
    packageId: 'pkg-rust-level-002',
    action: '阻断项创建',
    description: '文物保存建议库待专家委员会审核',
    operator: '张秋月',
    timestamp: '2025-06-12T09:15:00Z',
    details: {
      blockerId: 'blk-rust-003',
      severity: 'high'
    }
  },
  {
    id: 'log-024',
    packageId: 'pkg-rust-level-002',
    action: '回滚草案创建',
    description: '创建锈蚀级别回滚预案（v1.2.0→v1.0.0）',
    operator: '张秋月',
    timestamp: '2025-06-14T11:30:00Z',
    details: {
      rollbackId: 'rb-rust-001',
      targetVersion: 'v1.0.0'
    }
  },
  {
    id: 'log-025',
    packageId: 'pkg-clarity-001',
    action: '版本创建',
    description: '创建拓片清晰度 v1.0.0 初始版本',
    operator: '李文博',
    timestamp: '2024-08-15T10:00:00Z',
    details: {
      version: 'v1.0.0',
      changeLogCount: 3
    }
  },
  {
    id: 'log-026',
    packageId: 'pkg-clarity-001',
    action: '版本发布',
    description: '拓片清晰度 v2.0.0（深度学习版）正式发布',
    operator: '李文博',
    timestamp: '2025-03-15T09:00:00Z',
    details: {
      fromVersion: 'v1.0.0',
      toVersion: 'v2.0.0',
      affectedSamples: 156,
      accuracy: '92%'
    }
  },
  {
    id: 'log-027',
    packageId: 'pkg-clarity-001',
    action: '阻断项创建',
    description: '低光照极端样本算法表现待确认',
    operator: '李文博',
    timestamp: '2025-06-11T08:45:00Z',
    details: {
      blockerId: 'blk-clarity-001',
      severity: 'medium'
    }
  },
  {
    id: 'log-028',
    packageId: 'pkg-inscription-003',
    action: '版本创建',
    description: '创建铭文残缺 v1.0.0 初始版本',
    operator: '王思远',
    timestamp: '2024-06-01T09:00:00Z',
    details: {
      version: 'v1.0.0',
      changeLogCount: 3
    }
  },
  {
    id: 'log-029',
    packageId: 'pkg-inscription-003',
    action: '版本发布',
    description: '铭文残缺 v2.0.0（OCR辅助版）正式发布',
    operator: '王思远',
    timestamp: '2024-09-15T14:00:00Z',
    details: {
      fromVersion: 'v1.0.0',
      toVersion: 'v2.0.0',
      affectedSamples: 178,
      accuracy: '85%'
    }
  },
  {
    id: 'log-030',
    packageId: 'pkg-orientation-004',
    action: '回滚草案创建',
    description: '创建方位v1.0.0发布前安全回滚预案',
    operator: '陈晓东',
    timestamp: '2025-06-16T09:45:00Z',
    details: {
      rollbackId: 'rb-orientation-001',
      targetVersion: 'v0.8.0'
    }
  },
  {
    id: 'log-031',
    packageId: 'pkg-inscription-003',
    action: '样本锁定',
    description: '锁定河北满城中山靖王墓铜井铭文（特级文物）',
    operator: '国家文物局专家组',
    timestamp: '2025-06-05T10:00:00Z',
    details: {
      sampleId: 'smp-ins-013',
      reason: '特级文物需国家级审核'
    }
  },
  {
    id: 'log-032',
    packageId: 'pkg-clarity-001',
    action: '样本锁定',
    description: '锁定拉萨布达拉宫古井（特殊文物）',
    operator: '文保中心',
    timestamp: '2025-06-07T15:00:00Z',
    details: {
      sampleId: 'smp-clarity-020',
      reason: '特殊文物数据访问受限'
    }
  },
  {
    id: 'log-033',
    packageId: 'pkg-rust-level-002',
    action: '样本锁定',
    description: '锁定陕西秦始皇陵铜井（特级文物数据访问受限）',
    operator: '文物局',
    timestamp: '2025-06-01T09:00:00Z',
    details: {
      sampleId: 'smp-rust-016',
      reason: '特级文物数据受限'
    }
  }
];

export default auditLogs;
