import type { ReleasePackage } from '../../shared/types';
import { PackageDimension, ReleaseStatus } from '../../shared/types';

export const packages: ReleasePackage[] = [
  {
    id: 'pkg-clarity-001',
    name: '拓片清晰度',
    dimension: PackageDimension.clarity,
    description: '古井铭牌拓片图像清晰度评估模型，用于自动识别和分级拓片的清晰度质量',
    status: ReleaseStatus.pending,
    currentVersion: 'v2.0.0',
    nextVersion: 'v2.1.0',
    sampleCount: 156,
    affectedSampleCount: 23,
    createdAt: '2025-03-15T09:00:00Z',
    updatedAt: '2025-06-10T14:30:00Z',
    author: '李文博'
  },
  {
    id: 'pkg-rust-level-002',
    name: '锈蚀级别',
    dimension: PackageDimension.rust_level,
    description: '金属铭牌锈蚀程度分级模型，根据表面腐蚀情况评估文物保存状态',
    status: ReleaseStatus.blocked,
    currentVersion: 'v1.2.0',
    nextVersion: 'v1.3.0',
    sampleCount: 203,
    affectedSampleCount: 45,
    createdAt: '2025-01-20T10:15:00Z',
    updatedAt: '2025-06-12T16:45:00Z',
    author: '张秋月'
  },
  {
    id: 'pkg-inscription-003',
    name: '铭文残缺',
    dimension: PackageDimension.inscription,
    description: '古井铭牌铭文残缺检测与修复建议模型，自动识别文字缺失区域',
    status: ReleaseStatus.published,
    currentVersion: 'v3.0.0',
    nextVersion: 'v3.0.0',
    sampleCount: 178,
    affectedSampleCount: 0,
    createdAt: '2024-12-01T08:30:00Z',
    updatedAt: '2025-05-20T11:00:00Z',
    publishedAt: '2025-05-20T11:00:00Z',
    author: '王思远'
  },
  {
    id: 'pkg-orientation-004',
    name: '井圈方位',
    dimension: PackageDimension.orientation,
    description: '古井圈方位校准模型，根据地理坐标和铭文方向确定井圈原始朝向',
    status: ReleaseStatus.draft,
    currentVersion: 'v0.9.0',
    nextVersion: 'v1.0.0',
    sampleCount: 89,
    affectedSampleCount: 12,
    createdAt: '2025-05-01T13:20:00Z',
    updatedAt: '2025-06-15T09:10:00Z',
    author: '陈晓东'
  }
];

export default packages;
