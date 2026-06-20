import type { BlockerItem } from '../../shared/types';

export const blockers: BlockerItem[] = [
  {
    id: 'blk-rust-001',
    packageId: 'pkg-rust-level-002',
    title: '青铜器锈蚀类型误判问题',
    description: 'v1.3.0版本对青铜器表面氧化层与锈蚀存在误判，将无害氧化层被错误归类为重度锈蚀，影响青铜器文物的评估准确性。',
    severity: 'high',
    status: 'open',
    reporter: '李明辉',
    createdAt: '2025-06-08T10:30:00Z'
  },
  {
    id: 'blk-rust-002',
    packageId: 'pkg-rust-level-002',
    title: '锈蚀发展预测模型数据不足',
    description: '新增加的锈蚀发展预测功能缺乏足够的长期观测数据支撑，预测结果的准确性需要更多历史数据验证。',
    severity: 'medium',
    status: 'open',
    reporter: '王晓燕',
    createdAt: '2025-06-10T14:20:00Z'
  },
  {
    id: 'blk-rust-003',
    packageId: 'pkg-rust-level-002',
    title: '保存建议库内容待审核',
    description: '新增的文物保存建议库内容需要文物保护专家委员会审核通过后才能发布。',
    severity: 'high',
    status: 'open',
    reporter: '张秋月',
    createdAt: '2025-06-12T09:15:00Z'
  },
  {
    id: 'blk-rust-004',
    packageId: 'pkg-rust-level-002',
    title: '年份维度统计功能Bug',
    description: '年份维度统计在处理跨年度数据时存在计算错误，已定位问题待修复。',
    severity: 'low',
    status: 'resolved',
    reporter: '赵建国',
    createdAt: '2025-06-05T11:00:00Z',
    resolvedAt: '2025-06-09T16:30:00Z',
    resolution: '修复了跨年数据统计逻辑，增加了单元测试覆盖'
  },
  {
    id: 'blk-clarity-001',
    packageId: 'pkg-clarity-001',
    title: '低光照样本验证待确认',
    description: '新增加的低光照增强算法在部分极端低光照样本上的表现还需要人工验证确认。',
    severity: 'medium',
    status: 'open',
    reporter: '李文博',
    createdAt: '2025-06-11T08:45:00Z'
  },
  {
    id: 'blk-clarity-002',
    packageId: 'pkg-clarity-001',
    title: '局部清晰度热力图性能优化',
    description: '局部清晰度热力图生成速度较慢，大尺寸拓片处理时间超过预期，需要性能优化。',
    severity: 'low',
    status: 'resolved',
    reporter: '陈志强',
    createdAt: '2025-06-09T13:30:00Z',
    resolvedAt: '2025-06-12T10:00:00Z',
    resolution: '优化了图像分块处理算法，处理速度提升了3倍'
  },
  {
    id: 'blk-inscription-001',
    packageId: 'pkg-inscription-003',
    title: '残缺铭文补读与旧释文冲突',
    description: '【特殊场景】AI补读模型对西安碑林唐井铭拓片的残缺字补读结果（「文远」「士弘」）与2019版人工释文（「文」「士」）存在冲突，涉及姓名和表字的关键字段，需金石学专家委员会复核确认。',
    severity: 'high',
    status: 'open',
    reporter: '王思远',
    createdAt: '2025-06-13T10:20:00Z'
  },
  {
    id: 'blk-inscription-002',
    packageId: 'pkg-inscription-003',
    title: '洛阳出土隋代井栏铭文口径数据冲突',
    description: '残缺补读后的铭文记载井栏口径「三尺五寸」与考古实测数据「三尺」存在偏差，需确认是铭文磨损补读误差还是历史记载与实际尺寸差异。',
    severity: 'high',
    status: 'open',
    reporter: '赵明诚',
    createdAt: '2025-06-13T14:05:00Z'
  },
  {
    id: 'blk-inscription-003',
    packageId: 'pkg-inscription-003',
    title: '篆书字体识别置信度偏低',
    description: '新增的篆书识别模型在处理东周时期鸟虫篆铭文时置信度低于75%阈值，建议增加更多篆书训练样本后再发布。',
    severity: 'medium',
    status: 'open',
    reporter: '王立群',
    createdAt: '2025-06-14T09:30:00Z'
  },
  {
    id: 'blk-inscription-004',
    packageId: 'pkg-inscription-003',
    title: '同朝代铭文对照数据库待更新',
    description: 'v3.0.0新增的同朝代铭文对照功能数据库缺少辽金西夏时期的少数民族文字铭文，建议补充后再正式发布。',
    severity: 'low',
    status: 'resolved',
    reporter: '陈寅格',
    createdAt: '2025-05-10T15:40:00Z',
    resolvedAt: '2025-05-18T11:20:00Z',
    resolution: '补充了127条辽金西夏时期的铭文数据，覆盖契丹文、西夏文、女真文'
  },
  {
    id: 'blk-orientation-001',
    packageId: 'pkg-orientation-004',
    title: '历史时期地磁数据校准争议',
    description: '北宋时期地磁偏角校正参数在学术界存在两种不同模型，当前版本采用的模型需要地球物理学专家确认。',
    severity: 'medium',
    status: 'open',
    reporter: '竺可桢',
    createdAt: '2025-06-15T10:00:00Z'
  },
  {
    id: 'blk-orientation-002',
    packageId: 'pkg-orientation-004',
    title: '曲阜孔庙古井碑文方向待复核',
    description: '曲阜孔庙北宋古井的井圈方位计算结果偏离建筑轴线2.3°，超过允许误差范围，需现场复核测量。',
    severity: 'high',
    status: 'open',
    reporter: '梁思成',
    createdAt: '2025-06-14T16:30:00Z'
  }
];

export default blockers;
