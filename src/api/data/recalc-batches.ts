import type { RecalcBatch } from '../../shared/types';

export const recalcBatches: RecalcBatch[] = [
  {
    id: 'batch-clarity-001',
    packageId: 'pkg-clarity-001',
    name: '拓片清晰度评估报告-2025Q2',
    description: '基于v2.1.0深度学习模型，对12份唐碑宋碣拓片生成季度评估报告',
    sampleCount: 12,
    estimatedTimeMinutes: 150,
    exportFormat: 'pdf',
    batchType: 'report',
    priority: 'high',
    createdAt: '2025-06-10T09:00:00Z'
  },
  {
    id: 'batch-clarity-002',
    packageId: 'pkg-clarity-001',
    name: '局部清晰度热力图生成批次',
    description: '对8份低光照拍摄的清代碑刻拓片生成逐字清晰度热力图',
    sampleCount: 8,
    estimatedTimeMinutes: 75,
    exportFormat: 'json',
    batchType: 'heatmap',
    priority: 'medium',
    createdAt: '2025-06-11T14:20:00Z'
  },
  {
    id: 'batch-clarity-003',
    packageId: 'pkg-clarity-001',
    name: '低光照增强对比数据集导出',
    description: '对5份特殊拍摄条件拓片导出增强前后对比CSV数据集',
    sampleCount: 5,
    estimatedTimeMinutes: 45,
    exportFormat: 'csv',
    batchType: 'dataset',
    priority: 'low',
    createdAt: '2025-06-12T10:30:00Z'
  },
  {
    id: 'batch-rust-001',
    packageId: 'pkg-rust-level-002',
    name: '青铜器锈蚀等级年度报告-2025H1',
    description: '基于v1.3.0模型对203件馆藏青铜器生成半年度锈蚀评估报告',
    sampleCount: 42,
    estimatedTimeMinutes: 180,
    exportFormat: 'pdf',
    batchType: 'report',
    priority: 'high',
    createdAt: '2025-06-05T08:00:00Z'
  },
  {
    id: 'batch-rust-002',
    packageId: 'pkg-rust-level-002',
    name: '粉状锈发展趋势预测Excel',
    description: '对15件出现粉状锈迹象的青铜器导出36个月预测数据',
    sampleCount: 15,
    estimatedTimeMinutes: 90,
    exportFormat: 'excel',
    batchType: 'dataset',
    priority: 'high',
    createdAt: '2025-06-08T11:30:00Z'
  },
  {
    id: 'batch-rust-003',
    packageId: 'pkg-rust-level-002',
    name: '文物保存建议方案库更新',
    description: '根据v1.3.0锈蚀分级重算89件文物的个性化保存环境参数',
    sampleCount: 89,
    estimatedTimeMinutes: 120,
    exportFormat: 'json',
    batchType: 'annotation',
    priority: 'medium',
    createdAt: '2025-06-10T15:45:00Z'
  },
  {
    id: 'batch-rust-004',
    packageId: 'pkg-rust-level-002',
    name: '省级文物重点保护单位批次',
    description: '23件省级文保单位青铜器锈蚀复检数据重算',
    sampleCount: 23,
    estimatedTimeMinutes: 60,
    exportFormat: 'excel',
    batchType: 'report',
    priority: 'medium',
    createdAt: '2025-06-12T09:20:00Z'
  },
  {
    id: 'batch-ins-001',
    packageId: 'pkg-inscription-003',
    name: '残缺铭文补读标注集-2025年中版',
    description: '基于v3.0.0OCR模型对67处新发现残缺铭文生成专家复核标注集',
    sampleCount: 67,
    estimatedTimeMinutes: 240,
    exportFormat: 'json',
    batchType: 'annotation',
    priority: 'high',
    createdAt: '2025-05-18T10:00:00Z'
  },
  {
    id: 'batch-ins-002',
    packageId: 'pkg-inscription-003',
    name: '唐碑补读释文对比报告',
    description: '对12份唐代碑刻新旧释文差异生成金石学家复核PDF报告',
    sampleCount: 12,
    estimatedTimeMinutes: 180,
    exportFormat: 'pdf',
    batchType: 'report',
    priority: 'high',
    createdAt: '2025-05-20T14:00:00Z'
  },
  {
    id: 'batch-ins-003',
    packageId: 'pkg-inscription-003',
    name: '历代金石著录对照CSV',
    description: '将补读结果与《金石萃编》《八琼室金石补正》等历代著录对照导出',
    sampleCount: 34,
    estimatedTimeMinutes: 100,
    exportFormat: 'csv',
    batchType: 'dataset',
    priority: 'medium',
    createdAt: '2025-05-22T09:30:00Z'
  },
  {
    id: 'batch-ins-004',
    packageId: 'pkg-inscription-003',
    name: '篆书·八分书残字识别置信度重算',
    description: '对38处篆隶残字重算识别置信度，供二次人工审核',
    sampleCount: 38,
    estimatedTimeMinutes: 90,
    exportFormat: 'excel',
    batchType: 'dataset',
    priority: 'medium',
    createdAt: '2025-05-24T11:15:00Z'
  },
  {
    id: 'batch-orient-001',
    packageId: 'pkg-orientation-004',
    name: '井圈方位地磁校正GIS数据集',
    description: '基于v1.0.0磁偏角校正算法对89处遗址井圈方位重新生成GIS坐标',
    sampleCount: 89,
    estimatedTimeMinutes: 60,
    exportFormat: 'json',
    batchType: 'dataset',
    priority: 'high',
    createdAt: '2025-06-15T09:00:00Z'
  },
  {
    id: 'batch-orient-002',
    packageId: 'pkg-orientation-004',
    name: '古建筑中轴线对齐复核报告',
    description: '对21处与现存建筑轴线有偏离的古井方位生成考古测量复核报告',
    sampleCount: 21,
    estimatedTimeMinutes: 150,
    exportFormat: 'pdf',
    batchType: 'report',
    priority: 'high',
    createdAt: '2025-06-15T14:30:00Z'
  },
  {
    id: 'batch-orient-003',
    packageId: 'pkg-orientation-004',
    name: '北宋皇陵陵区方位对照Excel',
    description: '对巩义宋陵7处帝后陵的井圈方位与陵区轴线对照导出',
    sampleCount: 7,
    estimatedTimeMinutes: 40,
    exportFormat: 'excel',
    batchType: 'dataset',
    priority: 'medium',
    createdAt: '2025-06-16T08:45:00Z'
  }
];

export default recalcBatches;
