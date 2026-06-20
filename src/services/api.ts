import type { ReleasePackage, VersionRecord, AffectedSample, BlockerItem, RollbackDraft, AuditLog, RecalcBatch, ImpactDetailResponse } from '../shared/types';
import { PackageDimension, ReleaseStatus } from '../shared/types';
import { packages as mockPackages } from '../api/data/packages';
import { versions as mockVersions } from '../api/data/versions';
import { samples as mockSamples } from '../api/data/samples';
import { blockers as mockBlockers } from '../api/data/blockers';
import { rollbackDrafts as mockRollbackDrafts } from '../api/data/rollback-drafts';
import { auditLogs as mockAuditLogs } from '../api/data/audit-logs';
import { recalcBatches as mockRecalcBatches } from '../api/data/recalc-batches';

const API_BASE = '/api';

function logApi(method: string, url: string, source: 'backend' | 'mock-fallback', extra?: unknown) {
  const label = source === 'backend' ? '✅ [真实后端]' : '⚠️ [Mock回退]';
  console.log(`${label} ${method} ${url}`, extra ?? '');
}

async function request<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: unknown,
  mockFallback?: () => T | Promise<T>
): Promise<T> {
  const fullUrl = `${API_BASE}${url}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const data = (json?.data ?? json) as T;
    logApi(method, fullUrl, 'backend', { status: res.status });
    return data;
  } catch (err) {
    if (!mockFallback) {
      console.error(`[API 失败 无回退] ${method} ${fullUrl}`, err);
      throw err;
    }
    const fallback = await mockFallback();
    logApi(method, fullUrl, 'mock-fallback', { reason: (err as Error).message });
    return fallback;
  }
}

const api = {
  packages: {
    list: async (dimension?: PackageDimension, status?: ReleaseStatus): Promise<ReleasePackage[]> => {
      let url = '/packages';
      const params = new URLSearchParams();
      if (dimension) params.set('dimension', dimension);
      if (status) params.set('status', status);
      if (params.toString()) url += `?${params.toString()}`;
      return request('GET', url, undefined, () => {
        let filtered = mockPackages;
        if (dimension) filtered = filtered.filter(p => p.dimension === dimension);
        if (status) filtered = filtered.filter(p => p.status === status);
        return filtered;
      });
    },

    get: async (id: string): Promise<ReleasePackage | undefined> => {
      return request('GET', `/packages/${id}`, undefined, () =>
        mockPackages.find(p => p.id === id)
      );
    },

    publish: async (id: string): Promise<ReleasePackage | undefined> => {
      return request('POST', `/packages/${id}/publish`, undefined, () => {
        const pkg = mockPackages.find(p => p.id === id);
        if (pkg) {
          const now = new Date().toISOString();
          const updated: ReleasePackage = {
            ...pkg,
            status: ReleaseStatus.published,
            publishedAt: now,
          };
          const idx = mockPackages.findIndex(p => p.id === id);
          if (idx >= 0) mockPackages[idx] = updated;
          mockAuditLogs.unshift({
            id: `log-publish-${Date.now()}`,
            packageId: id,
            action: '版本发布',
            description: `发布包【${pkg.name}】${pkg.nextVersion} 正式发布（Mock Fallback）`,
            operator: '系统管理员',
            timestamp: now,
            details: { fromVersion: pkg.currentVersion, toVersion: pkg.nextVersion, affectedSamples: pkg.affectedSampleCount }
          });
          return updated;
        }
        return undefined;
      });
    },

    rollback: async (id: string): Promise<ReleasePackage | undefined> => {
      return request('POST', `/packages/${id}/rollback`, undefined, () => {
        const pkg = mockPackages.find(p => p.id === id);
        if (pkg) {
          const now = new Date().toISOString();
          const updated: ReleasePackage = {
            ...pkg,
            status: ReleaseStatus.rolled_back,
            rolledBackAt: now,
          };
          const idx = mockPackages.findIndex(p => p.id === id);
          if (idx >= 0) mockPackages[idx] = updated;
          mockAuditLogs.unshift({
            id: `log-rollback-${Date.now()}`,
            packageId: id,
            action: '版本回滚',
            description: `发布包【${pkg.name}】已回滚至前一稳定版（Mock Fallback）`,
            operator: '系统管理员',
            timestamp: now,
            details: { rollbackFrom: pkg.nextVersion, rollbackTo: pkg.currentVersion }
          });
          return updated;
        }
        return undefined;
      });
    },
  },

  versions: {
    list: async (packageId: string): Promise<VersionRecord[]> => {
      return request('GET', `/versions?packageId=${packageId}`, undefined, () =>
        mockVersions.filter(v => v.packageId === packageId)
      );
    },
  },

  samples: {
    list: async (packageId: string): Promise<AffectedSample[]> => {
      return request('GET', `/samples?packageId=${packageId}`, undefined, () =>
        mockSamples.filter(s => s.packageId === packageId)
      );
    },
  },

  blockers: {
    list: async (packageId: string): Promise<BlockerItem[]> => {
      return request('GET', `/blockers?packageId=${packageId}`, undefined, () =>
        mockBlockers.filter(b => b.packageId === packageId)
      );
    },

    resolve: async (id: string, resolution: string): Promise<BlockerItem | undefined> => {
      return request('POST', `/blockers/${id}/resolve`, { resolution }, () => {
        const blocker = mockBlockers.find(b => b.id === id);
        if (blocker) {
          blocker.status = 'resolved';
          blocker.resolution = resolution;
          blocker.resolvedAt = new Date().toISOString();
        }
        return blocker;
      });
    },
  },

  impact: {
    get: async (packageId: string): Promise<ImpactDetailResponse> => {
      return request('GET', `/packages/${packageId}/impact`, undefined, () => {
        const pkgSamples = mockSamples.filter(s => s.packageId === packageId);
        const pkgBatches = mockRecalcBatches.filter(b => b.packageId === packageId);
        const stats = {
          total: pkgSamples.length,
          locked: pkgSamples.filter(s => s.status === 'locked').length,
          conflict: pkgSamples.filter(s => s.status === 'conflict').length,
          recalc_needed: pkgSamples.filter(s => s.status === 'recalc_needed').length,
          normal: pkgSamples.filter(s => s.status === 'normal').length,
        };
        mockAuditLogs.unshift({
          id: `log-impact-${Date.now()}`,
          packageId,
          action: '影响分析查询',
          description: '前端发起影响明细查询（Mock Fallback）',
          operator: '系统用户',
          timestamp: new Date().toISOString(),
          details: { stats, batchCount: pkgBatches.length }
        });
        return {
          samples: pkgSamples,
          stats,
          recalcBatches: pkgBatches,
          lockedSampleIds: pkgSamples.filter(s => s.status === 'locked').map(s => s.id),
          conflictSampleIds: pkgSamples.filter(s => s.status === 'conflict').map(s => s.id),
        };
      });
    }
  },

  rollbackDrafts: {
    list: async (packageId: string): Promise<RollbackDraft[]> => {
      return request('GET', `/packages/${packageId}/rollback-draft`, undefined, () =>
        mockRollbackDrafts.filter(r => r.packageId === packageId)
      ).then((data: unknown) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return [(data as { data?: RollbackDraft; success?: boolean }).data || (data as RollbackDraft)];
        }
        return Array.isArray(data) ? data : [];
      });
    },

    get: async (id: string): Promise<RollbackDraft | undefined> => {
      return request('GET', `/packages/${id}/rollback-draft`, undefined, () =>
        mockRollbackDrafts.find(r => r.id === id)
      ).then((data: unknown) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return (data as { data?: RollbackDraft }).data || (data as RollbackDraft);
        }
        return undefined;
      });
    },

    generate: async (packageId: string, opts?: { reason?: string }): Promise<RollbackDraft | undefined> => {
      return request('POST', `/packages/${packageId}/generate-rollback-draft`, opts, () => {
        const pkg = mockPackages.find(p => p.id === packageId);
        if (!pkg) return undefined;
        const now = new Date().toISOString();
        const rollbackVer = pkg.currentVersion.replace(/(\d+)$/, (m) => String(Math.max(0, parseInt(m) - 1)));
        const affectedCount = pkg.affectedSampleCount || 50;
        const newDraft: RollbackDraft = {
          id: `rb-${packageId}-${Date.now()}`,
          packageId,
          targetVersion: pkg.currentVersion,
          rollbackVersion: rollbackVer,
          reason: opts?.reason || `自动生成的回滚草案：从 ${pkg.currentVersion} 回退至 ${rollbackVer}（Mock Fallback）`,
          steps: [
            {
              id: `gen-step-${Date.now()}-1`, order: 1, title: '回滚前数据快照备份',
              description: `对 ${pkg.name} 当前版本 ${pkg.currentVersion} 的所有评估数据、模型参数、配置文件进行完整快照备份，确保回滚失败时可完整恢复。`,
              estimatedDuration: 25, status: 'pending'
            },
            {
              id: `gen-step-${Date.now()}-2`, order: 2, title: '暂停相关任务队列',
              description: `暂停 ${pkg.dimension} 维度的所有新任务处理，锁定写入操作，避免回滚过程中产生数据不一致。`,
              estimatedDuration: 8, status: 'pending'
            },
            {
              id: `gen-step-${Date.now()}-3`, order: 3, title: `模型版本切换至 ${rollbackVer}`,
              description: `将生产环境的模型版本从当前 ${pkg.currentVersion} 切换至目标版本 ${rollbackVer}，同步更新配置中心和缓存。`,
              estimatedDuration: 15, status: 'pending'
            },
            {
              id: `gen-step-${Date.now()}-4`, order: 4, title: `受影响样本批量重算`,
              description: `对 ${pkg.currentVersion} 发布后处理过的约 ${affectedCount} 个样本，使用 ${rollbackVer} 模型重新评估计算。`,
              estimatedDuration: Math.max(15, Math.min(120, Math.round(affectedCount * 0.8))), status: 'pending'
            },
            {
              id: `gen-step-${Date.now()}-5`, order: 5, title: '数据一致性抽样校验',
              description: '随机抽取10%样本进行人工比对校验，确认回滚后数据与历史记录一致，无异常波动。',
              estimatedDuration: 25, status: 'pending'
            },
            {
              id: `gen-step-${Date.now()}-6`, order: 6, title: '恢复服务并通知相关方',
              description: '恢复任务队列正常运行，通过邮件和站内信通知考古研究员、数据管理员回滚完成，同步更新发布看板状态。',
              estimatedDuration: 12, status: 'pending'
            }
          ],
          status: 'draft',
          createdBy: '系统自动生成',
          createdAt: now
        };
        mockRollbackDrafts.unshift(newDraft);
        mockAuditLogs.unshift({
          id: `log-rollback-draft-${Date.now()}`,
          packageId,
          action: '回滚草案创建',
          description: `自动生成 ${pkg.name} 回滚草案（${pkg.currentVersion} → ${rollbackVer}）（Mock Fallback）`,
          operator: '系统',
          timestamp: now,
          details: {
            rollbackId: newDraft.id,
            targetVersion: rollbackVer,
            reason: newDraft.reason,
            stepsCount: newDraft.steps.length
          }
        });
        return newDraft;
      }).then((data: unknown) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return (data as { data?: RollbackDraft; success?: boolean }).data || (data as RollbackDraft);
        }
        return data as RollbackDraft | undefined;
      });
    }
  },

  auditLogs: {
    list: async (packageId?: string): Promise<AuditLog[]> => {
      let url = '/audit-logs';
      const params = new URLSearchParams();
      if (packageId) params.set('packageId', packageId);
      params.set('pageSize', '100');
      if (params.toString()) url += `?${params.toString()}`;
      return request('GET', url, undefined, () => {
        if (packageId) return mockAuditLogs.filter(a => a.packageId === packageId);
        return mockAuditLogs;
      }).then((data: unknown) => {
        if (data && typeof data === 'object' && 'logs' in data) {
          return (data as { logs: AuditLog[] }).logs;
        }
        if (data && typeof data === 'object' && 'data' in data) {
          const inner = (data as { data: unknown }).data;
          if (inner && typeof inner === 'object' && 'logs' in inner) {
            return (inner as { logs: AuditLog[] }).logs;
          }
          if (Array.isArray(inner)) return inner as AuditLog[];
        }
        return Array.isArray(data) ? data : [] as AuditLog[];
      });
    },

    get: async (id: string): Promise<AuditLog | undefined> => {
      return request('GET', `/audit-logs/${id}`, undefined, () =>
        mockAuditLogs.find(a => a.id === id)
      ).then((data: unknown) => {
        if (data && typeof data === 'object' && 'data' in data) {
          return (data as { data?: AuditLog }).data;
        }
        return data as AuditLog | undefined;
      });
    },
  },

  recalcBatches: {
    list: async (packageId: string): Promise<RecalcBatch[]> => {
      return request('GET', `/packages/${packageId}/impact`, undefined, () =>
        mockRecalcBatches.filter(b => b.packageId === packageId)
      ).then((data: unknown) => {
        if (data && typeof data === 'object' && 'recalcBatches' in data) {
          return (data as ImpactDetailResponse).recalcBatches;
        }
        return data as RecalcBatch[];
      });
    }
  }
};

export default api;
