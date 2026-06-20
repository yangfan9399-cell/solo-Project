import type { RollbackDraft } from '../../shared/types';

export const rollbackDrafts: RollbackDraft[] = [
  {
    id: 'rb-inscription-001',
    packageId: 'pkg-inscription-003',
    targetVersion: 'v3.0.0',
    rollbackVersion: 'v2.0.0',
    reason: 'v3.0.0版本发布后发现部分篆书铭文识别准确率下降，需回滚至v2.0.0稳定版进行问题排查',
    steps: [
      {
        id: 'step-001',
        order: 1,
        title: '回滚前数据备份',
        description: '备份当前v3.0.0版本的所有评估数据和模型配置，确保回滚失败时可恢复',
        estimatedDuration: 30,
        status: 'completed'
      },
      {
        id: 'step-002',
        order: 2,
        title: '暂停新任务处理',
        description: '暂停铭文残缺检测模块的新任务处理，避免回滚过程中产生不一致数据',
        estimatedDuration: 5,
        status: 'completed'
      },
      {
        id: 'step-003',
        order: 3,
        title: '模型版本切换',
        description: '将生产环境模型从v3.0.0切换至v2.0.0，更新配置文件',
        estimatedDuration: 15,
        status: 'pending'
      },
      {
        id: 'step-004',
        order: 4,
        title: '受影响样本重算',
        description: '对v3.0.0版本发布后处理过的156个样本使用v2.0.0重新评估',
        estimatedDuration: 120,
        status: 'pending'
      },
      {
        id: 'step-005',
        order: 5,
        title: '数据一致性校验',
        description: '校验回滚后的数据与历史数据的一致性，确保无异常',
        estimatedDuration: 20,
        status: 'pending'
      },
      {
        id: 'step-006',
        order: 6,
        title: '恢复服务并通知',
        description: '恢复铭文检测服务正常运行，通知相关团队回滚完成',
        estimatedDuration: 10,
        status: 'pending'
      }
    ],
    status: 'draft',
    createdBy: '王思远',
    createdAt: '2025-05-25T14:00:00Z'
  },
  {
    id: 'rb-clarity-001',
    packageId: 'pkg-clarity-001',
    targetVersion: 'v2.0.0',
    rollbackVersion: 'v1.0.0',
    reason: '应急预案：如v2.0.0深度学习模型出现严重问题，可回滚至v1.0.0传统算法版本',
    steps: [
      {
        id: 'cl-step-001',
        order: 1,
        title: '确认回滚必要性',
        description: '确认问题严重性，评估是否必须回滚',
        estimatedDuration: 15,
        status: 'pending'
      },
      {
        id: 'cl-step-002',
        order: 2,
        title: '备份当前数据',
        description: '备份v2.0.0版本的评估结果和模型参数',
        estimatedDuration: 20,
        status: 'pending'
      },
      {
        id: 'cl-step-003',
        order: 3,
        title: '切换至v1.0.0模型',
        description: '将清晰度评估模块切换回传统算法版本',
        estimatedDuration: 10,
        status: 'pending'
      },
      {
        id: 'cl-step-004',
        order: 4,
        title: '关键样本重算验证',
        description: '选取关键样本用v1.0.0重算，验证回滚后功能正常',
        estimatedDuration: 45,
        status: 'pending'
      },
      {
        id: 'cl-step-005',
        order: 5,
        title: '通知相关方',
        description: '通知考古团队和研究人员版本回退情况',
        estimatedDuration: 10,
        status: 'pending'
      }
    ],
    status: 'cancelled',
    createdBy: '李文博',
    createdAt: '2025-04-10T10:00:00Z'
  },
  {
    id: 'rb-rust-001',
    packageId: 'pkg-rust-level-002',
    targetVersion: 'v1.2.0',
    rollbackVersion: 'v1.0.0',
    reason: 'v1.3.0版本阻断项迟迟无法解决，考虑回滚至v1.2.0稳定版，先恢复核心锈蚀检测服务',
    steps: [
      {
        id: 'rs-step-001',
        order: 1,
        title: 'v1.3.0阻断项确认',
        description: '确认青铜器误判、锈蚀预测、保存建议三项阻断的解决进度，评估继续等待的风险',
        estimatedDuration: 20,
        status: 'pending'
      },
      {
        id: 'rs-step-002',
        order: 2,
        title: 'v1.2.0环境校验',
        description: '确认v1.2.0模型文件、依赖环境、配置模板完整可用',
        estimatedDuration: 15,
        status: 'pending'
      },
      {
        id: 'rs-step-003',
        order: 3,
        title: '暂存v1.3.0增量数据',
        description: '将v1.3.0发布后新增的45个验证样本数据单独暂存，供后续修复版本使用',
        estimatedDuration: 18,
        status: 'pending'
      },
      {
        id: 'rs-step-004',
        order: 4,
        title: '切换模型版本至v1.2.0',
        description: '配置中心切换锈蚀级别评估模型版本，同步至所有计算节点',
        estimatedDuration: 12,
        status: 'pending'
      },
      {
        id: 'rs-step-005',
        order: 5,
        title: '203个样本批量重算',
        description: '对受v1.3.0影响的全部203个样本重新执行锈蚀级别评估',
        estimatedDuration: 90,
        status: 'pending'
      },
      {
        id: 'rs-step-006',
        order: 6,
        title: '与人工抽检结果对账',
        description: '抽取30个人工检测样本对账，确认回滚后数据准确',
        estimatedDuration: 25,
        status: 'pending'
      }
    ],
    status: 'draft',
    createdBy: '张秋月',
    createdAt: '2025-06-14T11:30:00Z'
  },
  {
    id: 'rb-orientation-001',
    packageId: 'pkg-orientation-004',
    targetVersion: 'v0.9.0',
    rollbackVersion: 'v0.8.0',
    reason: 'v1.0.0正式版发布前的安全预案，如地磁校正参数确认问题可安全回退至v0.9.0',
    steps: [
      {
        id: 'or-step-001',
        order: 1,
        title: '封存v0.9.0基线快照',
        description: '对v0.9.0版本的地磁模型、GIS配置、训练权重进行完整镜像备份',
        estimatedDuration: 22,
        status: 'completed'
      },
      {
        id: 'or-step-002',
        order: 2,
        title: '暂停方位校准队列',
        description: '暂停井圈方位精校计算队列，标记进行中的任务状态',
        estimatedDuration: 5,
        status: 'pending'
      },
      {
        id: 'or-step-003',
        order: 3,
        title: '回滚磁偏角校正配置',
        description: '将9个历史时期的地磁偏角配置表恢复至v0.9.0版本',
        estimatedDuration: 12,
        status: 'pending'
      },
      {
        id: 'or-step-004',
        order: 4,
        title: '89个基准样本重算',
        description: '对所有89个基准井圈方位样本使用v0.9.0重新计算',
        estimatedDuration: 40,
        status: 'pending'
      },
      {
        id: 'or-step-005',
        order: 5,
        title: 'GIS坐标系统对接验证',
        description: '检查回滚后与GIS系统坐标转换接口数据一致性',
        estimatedDuration: 15,
        status: 'pending'
      },
      {
        id: 'or-step-006',
        order: 6,
        title: '考古测量专家组联合验收',
        description: '邀请考古测量专家组对关键遗址的方位数据抽检验收',
        estimatedDuration: 30,
        status: 'pending'
      }
    ],
    status: 'draft',
    createdBy: '陈晓东',
    createdAt: '2025-06-16T09:45:00Z'
  }
];

export default rollbackDrafts;
