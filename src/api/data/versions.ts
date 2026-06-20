import type { VersionRecord } from '../../shared/types';
import { ReleaseStatus } from '../../shared/types';

export const versions: VersionRecord[] = [
  {
    id: 'ver-clarity-001',
    packageId: 'pkg-clarity-001',
    version: 'v1.0.0',
    description: '初始版本，基于传统图像处理算法的清晰度评估',
    status: ReleaseStatus.published,
    createdAt: '2024-08-15T10:00:00Z',
    createdBy: '李文博',
    changeLog: [
      '实现基础清晰度评分算法',
      '支持5级清晰度分级',
      '添加批量处理功能'
    ]
  },
  {
    id: 'ver-clarity-002',
    packageId: 'pkg-clarity-001',
    version: 'v2.0.0',
    description: '引入深度学习模型，大幅提升评估准确率',
    status: ReleaseStatus.published,
    createdAt: '2025-03-15T09:00:00Z',
    createdBy: '李文博',
    changeLog: [
      '替换为CNN深度学习模型',
      '准确率提升至92%',
      '新增模糊类型识别',
      '优化处理速度40%'
    ]
  },
  {
    id: 'ver-clarity-003',
    packageId: 'pkg-clarity-001',
    version: 'v2.1.0',
    description: '优化低光照拓片识别，新增局部清晰度检测',
    status: ReleaseStatus.pending,
    createdAt: '2025-06-10T14:30:00Z',
    createdBy: '李文博',
    changeLog: [
      '新增低光照图像增强模块',
      '支持局部清晰度热力图',
      '修复边缘区域误判问题',
      '新增23个训练样本'
    ]
  },
  {
    id: 'ver-rust-001',
    packageId: 'pkg-rust-level-002',
    version: 'v1.0.0',
    description: '锈蚀级别检测初始版本，支持4级分类',
    status: ReleaseStatus.published,
    createdAt: '2024-10-20T11:30:00Z',
    createdBy: '张秋月',
    changeLog: [
      '实现锈蚀区域分割算法',
      '支持轻/中/重/严重四级分类',
      '生成锈蚀程度报告'
    ]
  },
  {
    id: 'ver-rust-002',
    packageId: 'pkg-rust-level-002',
    version: 'v1.2.0',
    description: '增加锈蚀类型识别，优化边界检测精度',
    status: ReleaseStatus.published,
    createdAt: '2025-01-20T10:15:00Z',
    createdBy: '张秋月',
    changeLog: [
      '新增5种锈蚀类型识别',
      '优化锈蚀边界检测精度',
      '支持批量导入导出',
      '修复青铜器误判问题'
    ]
  },
  {
    id: 'ver-rust-003',
    packageId: 'pkg-rust-level-002',
    version: 'v1.3.0',
    description: '新增锈蚀发展预测，整合文物保存建议',
    status: ReleaseStatus.blocked,
    createdAt: '2025-06-12T16:45:00Z',
    createdBy: '张秋月',
    changeLog: [
      '新增锈蚀发展趋势预测',
      '整合文物保存建议库',
      '支持年份维度统计分析',
      '新增45个验证样本'
    ]
  },
  {
    id: 'ver-inscription-001',
    packageId: 'pkg-inscription-003',
    version: 'v1.0.0',
    description: '铭文残缺检测初始版本，支持基本缺失识别',
    status: ReleaseStatus.published,
    createdAt: '2024-06-01T09:00:00Z',
    createdBy: '王思远',
    changeLog: [
      '实现铭文区域提取',
      '支持基本残缺检测',
      '生成残缺位置标注图'
    ]
  },
  {
    id: 'ver-inscription-002',
    packageId: 'pkg-inscription-003',
    version: 'v2.0.0',
    description: '引入OCR辅助，提升残缺文字推断能力',
    status: ReleaseStatus.published,
    createdAt: '2024-09-15T14:00:00Z',
    createdBy: '王思远',
    changeLog: [
      '集成OCR文字识别引擎',
      '新增残缺文字推断功能',
      '支持篆书/隶书字体识别',
      '准确率提升至85%'
    ]
  },
  {
    id: 'ver-inscription-003',
    packageId: 'pkg-inscription-003',
    version: 'v3.0.0',
    description: '重大升级，支持铭文修复建议和历史对照',
    status: ReleaseStatus.published,
    createdAt: '2025-05-20T11:00:00Z',
    createdBy: '王思远',
    changeLog: [
      '新增铭文修复建议生成',
      '支持同朝代铭文对照',
      '整合铭文数据库',
      '新增置信度评分',
      '支持批量处理任务'
    ]
  },
  {
    id: 'ver-orientation-001',
    packageId: 'pkg-orientation-004',
    version: 'v0.8.0',
    description: '井圈方位模型内测版，基础方向识别',
    status: ReleaseStatus.draft,
    createdAt: '2025-04-10T13:00:00Z',
    createdBy: '陈晓东',
    changeLog: [
      '实现基础方位识别算法',
      '支持四方向判定',
      '添加经纬度校准功能'
    ]
  },
  {
    id: 'ver-orientation-002',
    packageId: 'pkg-orientation-004',
    version: 'v0.9.0',
    description: '优化铭文方向检测，增加磁偏角校正',
    status: ReleaseStatus.draft,
    createdAt: '2025-05-01T13:20:00Z',
    createdBy: '陈晓东',
    changeLog: [
      '优化铭文方向检测算法',
      '新增磁偏角自动校正',
      '支持历史时期地磁数据',
      '增加12个验证样本'
    ]
  },
  {
    id: 'ver-orientation-003',
    packageId: 'pkg-orientation-004',
    version: 'v1.0.0',
    description: '首个正式版本，支持精确角度计算和方位报告',
    status: ReleaseStatus.draft,
    createdAt: '2025-06-15T09:10:00Z',
    createdBy: '陈晓东',
    changeLog: [
      '支持精确角度计算（±1°）',
      '新增方位报告生成',
      '整合GIS坐标系统',
      '支持批量方位校准'
    ]
  }
];

export default versions;
