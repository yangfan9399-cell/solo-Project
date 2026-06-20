import { create } from 'zustand';
import type { ReleasePackage, VersionRecord, AffectedSample, BlockerItem, RollbackDraft, AuditLog, RecalcBatch, ImpactDetailResponse } from '../shared/types';
import { ReleaseStatus } from '../shared/types';
import api from '../services/api';

interface AppState {
  packages: ReleasePackage[];
  selectedPackageId: string | null;
  versions: VersionRecord[];
  samples: AffectedSample[];
  blockers: BlockerItem[];
  rollbackDrafts: RollbackDraft[];
  auditLogs: AuditLog[];
  recalcBatches: RecalcBatch[];
  impactCache: Record<string, ImpactDetailResponse>;
  loading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;

  fetchPackages: () => Promise<void>;
  selectPackage: (id: string | null) => void;
  fetchPackageVersions: (packageId: string) => Promise<void>;
  fetchPackageSamples: (packageId: string) => Promise<void>;
  fetchPackageBlockers: (packageId: string) => Promise<void>;
  fetchPackageRollbackDrafts: (packageId: string) => Promise<void>;
  fetchPackageAuditLogs: (packageId: string) => Promise<void>;
  fetchPackageImpact: (packageId: string) => Promise<ImpactDetailResponse | null>;
  fetchPackageRecalcBatches: (packageId: string) => Promise<void>;
  publishPackage: (id: string) => Promise<boolean>;
  rollbackPackage: (id: string) => Promise<boolean>;
  resolveBlocker: (id: string, resolution: string) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  getSelectedPackage: () => ReleasePackage | undefined;
  getPackagesByStatus: (status: ReleaseStatus) => ReleasePackage[];
  getStats: () => {
    total: number;
    published: number;
    pending: number;
    blocked: number;
    draft: number;
    rolledBack: number;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  packages: [],
  selectedPackageId: null,
  versions: [],
  samples: [],
  blockers: [],
  rollbackDrafts: [],
  auditLogs: [],
  recalcBatches: [],
  impactCache: {},
  loading: false,
  error: null,
  sidebarCollapsed: false,

  fetchPackages: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.packages.list();
      set({ packages: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  selectPackage: (id: string | null) => {
    set({ selectedPackageId: id });
  },

  fetchPackageVersions: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.versions.list(packageId);
      set(state => ({
        versions: [
          ...state.versions.filter(v => v.packageId !== packageId),
          ...data
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPackageSamples: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.samples.list(packageId);
      set(state => ({
        samples: [
          ...state.samples.filter(s => s.packageId !== packageId),
          ...data
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPackageBlockers: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.blockers.list(packageId);
      set(state => ({
        blockers: [
          ...state.blockers.filter(b => b.packageId !== packageId),
          ...data
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPackageRollbackDrafts: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.rollbackDrafts.list(packageId);
      set(state => ({
        rollbackDrafts: [
          ...state.rollbackDrafts.filter(r => r.packageId !== packageId),
          ...data
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPackageAuditLogs: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.auditLogs.list(packageId);
      set(state => ({
        auditLogs: [
          ...state.auditLogs.filter(a => a.packageId !== packageId),
          ...data
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPackageImpact: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const impact = await api.impact.get(packageId);
      set(state => ({
        samples: [
          ...state.samples.filter(s => s.packageId !== packageId),
          ...impact.samples
        ],
        recalcBatches: [
          ...state.recalcBatches.filter(b => b.packageId !== packageId),
          ...impact.recalcBatches
        ],
        impactCache: {
          ...state.impactCache,
          [packageId]: impact
        },
        loading: false,
      }));
      return impact;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  fetchPackageRecalcBatches: async (packageId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await api.recalcBatches.list(packageId);
      set(state => ({
        recalcBatches: [
          ...state.recalcBatches.filter(b => b.packageId !== packageId),
          ...data
        ],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  publishPackage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.packages.publish(id);
      if (updated) {
        const auditLog: AuditLog = {
          id: `log-publish-${Date.now()}`,
          packageId: id,
          action: '版本发布',
          description: `发布包【${updated.name}】${updated.nextVersion} 正式发布`,
          operator: '系统管理员',
          timestamp: new Date().toISOString(),
          details: {
            fromVersion: updated.currentVersion,
            toVersion: updated.nextVersion,
            affectedSamples: updated.affectedSampleCount,
            publishedAt: updated.publishedAt
          }
        };
        set(state => ({
          packages: state.packages.map(p => p.id === id ? updated : p),
          auditLogs: [auditLog, ...state.auditLogs],
          loading: false,
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return false;
    }
  },

  rollbackPackage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.packages.rollback(id);
      if (updated) {
        const auditLog: AuditLog = {
          id: `log-rollback-${Date.now()}`,
          packageId: id,
          action: '版本回滚',
          description: `发布包【${updated.name}】已回滚至前一稳定版`,
          operator: '系统管理员',
          timestamp: new Date().toISOString(),
          details: {
            rollbackFrom: updated.nextVersion,
            rollbackTo: updated.currentVersion
          }
        };
        set(state => ({
          packages: state.packages.map(p => p.id === id ? updated : p),
          auditLogs: [auditLog, ...state.auditLogs],
          loading: false,
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return false;
    }
  },

  resolveBlocker: async (id: string, resolution: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.blockers.resolve(id, resolution);
      if (updated) {
        set(state => ({
          blockers: state.blockers.map(b => b.id === id ? updated : b),
          loading: false,
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  getSelectedPackage: () => {
    const { packages, selectedPackageId } = get();
    return packages.find(p => p.id === selectedPackageId);
  },

  getPackagesByStatus: (status: ReleaseStatus) => {
    return get().packages.filter(p => p.status === status);
  },

  getStats: () => {
    const { packages } = get();
    return {
      total: packages.length,
      published: packages.filter(p => p.status === ReleaseStatus.published).length,
      pending: packages.filter(p => p.status === ReleaseStatus.pending).length,
      blocked: packages.filter(p => p.status === ReleaseStatus.blocked).length,
      draft: packages.filter(p => p.status === ReleaseStatus.draft).length,
      rolledBack: packages.filter(p => p.status === ReleaseStatus.rolled_back).length,
    };
  },
}));

export default useAppStore;
