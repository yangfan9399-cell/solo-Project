import type { ReleasePackage, VersionRecord, AffectedSample, BlockerItem, RollbackDraft, AuditLog, RecalcBatch, ImpactDetailResponse } from '../shared/types';
import { PackageDimension, ReleaseStatus } from '../shared/types';
import { packages as mockPackages } from '../api/data/packages';
import { versions as mockVersions } from '../api/data/versions';
import { samples as mockSamples } from '../api/data/samples';
import { blockers as mockBlockers } from '../api/data/blockers';
import { rollbackDrafts as mockRollbackDrafts } from '../api/data/rollback-drafts';
import { auditLogs as mockAuditLogs } from '../api/data/audit-logs';
import { recalcBatches as mockRecalcBatches } from '../api/data/recalc-batches';

export const api = {
  packages: {
    list: (): Promise<ReleasePackage[]> => {
      return Promise.resolve(mockPackages);
    },

    get: (id: string): Promise<ReleasePackage | undefined> => {
      return Promise.resolve(mockPackages.find(p => p.id === id));
    },

    create: (data: Partial<ReleasePackage>): Promise<ReleasePackage> => {
      const newPackage: ReleasePackage = {
        id: `pkg-${Date.now()}`,
        name: data.name || '',
        dimension: data.dimension || PackageDimension.clarity,
        description: data.description || '',
        status: data.status || ReleaseStatus.draft,
        currentVersion: data.currentVersion || 'v0.0.1',
        nextVersion: data.nextVersion || 'v0.1.0',
        sampleCount: data.sampleCount || 0,
        affectedSampleCount: data.affectedSampleCount || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: data.author || '未知',
      };
      return Promise.resolve(newPackage);
    },

    update: (id: string, data: Partial<ReleasePackage>): Promise<ReleasePackage | undefined> => {
      const pkg = mockPackages.find(p => p.id === id);
      if (pkg) {
        return Promise.resolve({ ...pkg, ...data, updatedAt: new Date().toISOString() });
      }
      return Promise.resolve(undefined);
    },

    publish: (id: string): Promise<ReleasePackage | undefined> => {
      const pkg = mockPackages.find(p => p.id === id);
      if (pkg) {
        return Promise.resolve({
          ...pkg,
          status: ReleaseStatus.published,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      return Promise.resolve(undefined);
    },

    rollback: (id: string): Promise<ReleasePackage | undefined> => {
      const pkg = mockPackages.find(p => p.id === id);
      if (pkg) {
        return Promise.resolve({
          ...pkg,
          status: ReleaseStatus.rolled_back,
          updatedAt: new Date().toISOString(),
        });
      }
      return Promise.resolve(undefined);
    },
  },

  versions: {
    list: (packageId: string): Promise<VersionRecord[]> => {
      return Promise.resolve(mockVersions.filter(v => v.packageId === packageId));
    },

    get: (id: string): Promise<VersionRecord | undefined> => {
      return Promise.resolve(mockVersions.find(v => v.id === id));
    },
  },

  samples: {
    list: (packageId: string): Promise<AffectedSample[]> => {
      return Promise.resolve(mockSamples.filter(s => s.packageId === packageId));
    },

    get: (id: string): Promise<AffectedSample | undefined> => {
      return Promise.resolve(mockSamples.find(s => s.id === id));
    },
  },

  blockers: {
    list: (packageId?: string): Promise<BlockerItem[]> => {
      if (packageId) {
        return Promise.resolve(mockBlockers.filter(b => b.packageId === packageId));
      }
      return Promise.resolve(mockBlockers);
    },

    get: (id: string): Promise<BlockerItem | undefined> => {
      return Promise.resolve(mockBlockers.find(b => b.id === id));
    },

    resolve: (id: string, resolution: string): Promise<BlockerItem | undefined> => {
      const blocker = mockBlockers.find(b => b.id === id);
      if (blocker) {
        return Promise.resolve({
          ...blocker,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolution,
        });
      }
      return Promise.resolve(undefined);
    },
  },

  rollbackDrafts: {
    list: (packageId?: string): Promise<RollbackDraft[]> => {
      if (packageId) {
        return Promise.resolve(mockRollbackDrafts.filter(r => r.packageId === packageId));
      }
      return Promise.resolve(mockRollbackDrafts);
    },

    get: (id: string): Promise<RollbackDraft | undefined> => {
      return Promise.resolve(mockRollbackDrafts.find(r => r.id === id));
    },
  },

  auditLogs: {
    list: (packageId?: string): Promise<AuditLog[]> => {
      if (packageId) {
        return Promise.resolve(mockAuditLogs.filter(a => a.packageId === packageId));
      }
      return Promise.resolve(mockAuditLogs);
    },

    get: (id: string): Promise<AuditLog | undefined> => {
      return Promise.resolve(mockAuditLogs.find(a => a.id === id));
    },
  },

  impact: {
    get: (packageId: string): Promise<ImpactDetailResponse> => {
      const pkgSamples = mockSamples.filter(s => s.packageId === packageId);
      const pkgBatches = mockRecalcBatches.filter(b => b.packageId === packageId);

      const stats = {
        total: pkgSamples.length,
        locked: pkgSamples.filter(s => s.status === 'locked').length,
        conflict: pkgSamples.filter(s => s.status === 'conflict').length,
        recalc_needed: pkgSamples.filter(s => s.status === 'recalc_needed').length,
        normal: pkgSamples.filter(s => s.status === 'normal').length,
      };

      mockAuditLogs.push({
        id: `log-impact-${Date.now()}`,
        packageId,
        action: '影响分析查询',
        description: '前端发起影响明细查询',
        operator: '系统用户',
        timestamp: new Date().toISOString(),
        details: { stats, batchCount: pkgBatches.length }
      });

      return Promise.resolve({
        samples: pkgSamples,
        stats,
        recalcBatches: pkgBatches,
        lockedSampleIds: pkgSamples.filter(s => s.status === 'locked').map(s => s.id),
        conflictSampleIds: pkgSamples.filter(s => s.status === 'conflict').map(s => s.id),
      });
    }
  },

  recalcBatches: {
    list: (packageId: string): Promise<RecalcBatch[]> => {
      return Promise.resolve(mockRecalcBatches.filter(b => b.packageId === packageId));
    }
  }
};

export default api;
