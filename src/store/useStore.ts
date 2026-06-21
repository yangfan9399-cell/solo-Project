import { create } from 'zustand';
import type {
  Rule,
  Specimen,
  ImpactResult,
  ImpactSummary,
  Approval,
  ReleaseHistory,
  RollbackDraft,
  ThresholdGroup,
} from '@/types';

interface StoreState {
  rules: Rule[];
  specimens: Specimen[];
  impactResults: ImpactResult[];
  impactSummary: ImpactSummary | null;
  approvals: Approval[];
  releaseHistory: ReleaseHistory[];
  rollbackDrafts: RollbackDraft[];
  currentDraftRule: Rule | null;
  currentPublishedRule: Rule | null;
  loading: {
    rules: boolean;
    specimens: boolean;
    impact: boolean;
    approvals: boolean;
    history: boolean;
    rollback: boolean;
  };

  fetchRules: () => Promise<void>;
  fetchSpecimens: () => Promise<void>;
  fetchImpact: () => Promise<void>;
  fetchImpactSummary: () => Promise<void>;
  fetchApprovals: () => Promise<void>;
  fetchReleaseHistory: () => Promise<void>;
  fetchRollbackDrafts: () => Promise<void>;
  updateDraftRule: (thresholds: ThresholdGroup) => Promise<void>;
  submitApproval: (reason: string) => Promise<void>;
  approveApproval: (id: string, comment: string) => Promise<void>;
  rejectApproval: (id: string, comment: string) => Promise<void>;
  createRollback: (targetRuleId: string) => Promise<void>;
  submitRollback: (id: string) => Promise<void>;
  executeRollback: (id: string, comment: string) => Promise<void>;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

export const useStore = create<StoreState>((set, get) => ({
  rules: [],
  specimens: [],
  impactResults: [],
  impactSummary: null,
  approvals: [],
  releaseHistory: [],
  rollbackDrafts: [],
  currentDraftRule: null,
  currentPublishedRule: null,
  loading: {
    rules: false,
    specimens: false,
    impact: false,
    approvals: false,
    history: false,
    rollback: false,
  },

  fetchRules: async () => {
    set((s) => ({ loading: { ...s.loading, rules: true } }));
    try {
      const raw: any[] = await api('/api/rules');
      const rules: Rule[] = raw.map((r) => ({
        id: r.id,
        name: r.name,
        version: r.version,
        thresholds: r.thresholds,
        status: r.status,
        createdAt: r.created_at,
        publishedAt: r.published_at ?? undefined,
      }));
      const draft = rules.find((r) => r.status === 'draft') ?? null;
      const published = rules
        .filter((r) => r.status === 'published')
        .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())[0] ?? null;
      set({ rules, currentDraftRule: draft, currentPublishedRule: published });
    } finally {
      set((s) => ({ loading: { ...s.loading, rules: false } }));
    }
  },

  fetchSpecimens: async () => {
    set((s) => ({ loading: { ...s.loading, specimens: true } }));
    try {
      const raw: any[] = await api('/api/specimens');
      const specimens: Specimen[] = raw.map((s) => ({
        id: s.id,
        code: s.code,
        collectionPoint: s.collection_point,
        season: s.season,
        altitude: s.altitude,
        substrate: s.substrate,
        sporeDensity: s.spore_density,
        humidityExposure: s.humidity_exposure,
        currentStatus: s.current_status,
        linkedSpecimenId: s.linked_specimen_id ?? undefined,
      }));
      set({ specimens });
    } finally {
      set((s) => ({ loading: { ...s.loading, specimens: false } }));
    }
  },

  fetchImpact: async () => {
    set((s) => ({ loading: { ...s.loading, impact: true } }));
    try {
      const raw: any[] = await api('/api/impact');
      const impactResults: ImpactResult[] = raw.map((r) => ({
        specimenId: r.specimen.id,
        code: r.specimen.code,
        collectionPoint: r.specimen.collection_point,
        season: r.specimen.season,
        originalStatus: r.oldStatus,
        newStatus: r.newStatus,
        changedDimensions: r.changedDimensions,
        isCrossSeason: r.isCrossSeason,
      }));
      set({ impactResults });
    } finally {
      set((s) => ({ loading: { ...s.loading, impact: false } }));
    }
  },

  fetchImpactSummary: async () => {
    try {
      const impactSummary: ImpactSummary = await api('/api/impact/summary');
      set({ impactSummary });
    } catch {
      set({ impactSummary: { toWarn: 0, toBlock: 0, warnToBlock: 0, total: 0 } });
    }
  },

  fetchApprovals: async () => {
    set((s) => ({ loading: { ...s.loading, approvals: true } }));
    try {
      const raw: any[] = await api('/api/approvals');
      const currentRules = get().rules;
      const approvals: Approval[] = raw.map((a) => {
        const matchedRule = currentRules.find((r) => r.id === a.rule_id);
        return {
          id: a.id,
          ruleId: a.rule_id,
          ruleName: matchedRule ? `${matchedRule.name} ${matchedRule.version}` : a.rule_id,
          reason: a.reason,
          status: a.status,
          submittedAt: a.submitted_at,
          reviewedAt: a.reviewed_at ?? undefined,
          reviewComment: a.review_comment ?? undefined,
          impactSummary: typeof a.impact_summary === 'string' ? JSON.parse(a.impact_summary) : a.impact_summary,
          thresholdDiff: typeof a.threshold_diff === 'string' ? JSON.parse(a.threshold_diff) : a.threshold_diff,
        };
      });
      set({ approvals });
    } finally {
      set((s) => ({ loading: { ...s.loading, approvals: false } }));
    }
  },

  fetchReleaseHistory: async () => {
    set((s) => ({ loading: { ...s.loading, history: true } }));
    try {
      const raw: any[] = await api('/api/history');
      const releaseHistory: ReleaseHistory[] = raw.map((h) => ({
        id: h.id,
        ruleId: h.rule_id,
        ruleName: h.rule_id,
        version: h.version,
        publishedAt: h.published_at,
        changeSummary: h.change_summary,
        approvalId: h.approval_id,
      }));
      set({ releaseHistory });
    } finally {
      set((s) => ({ loading: { ...s.loading, history: false } }));
    }
  },

  fetchRollbackDrafts: async () => {
    set((s) => ({ loading: { ...s.loading, rollback: true } }));
    try {
      const raw: any[] = await api('/api/history/rollback-drafts');
      const rollbackDrafts: RollbackDraft[] = raw.map((d) => ({
        id: d.id,
        targetRuleId: d.target_rule_id,
        targetVersion: d.target_version,
        status: d.status,
        impactSummary: typeof d.impact_summary === 'string' ? JSON.parse(d.impact_summary) : d.impact_summary,
        createdAt: d.created_at,
      }));
      set({ rollbackDrafts });
    } finally {
      set((s) => ({ loading: { ...s.loading, rollback: false } }));
    }
  },

  updateDraftRule: async (thresholds: ThresholdGroup) => {
    await api('/api/rules/draft', {
      method: 'POST',
      body: JSON.stringify({ thresholds }),
    });
    await get().fetchRules();
    await get().fetchImpact();
    await get().fetchImpactSummary();
  },

  submitApproval: async (reason: string) => {
    await api('/api/approvals', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    await get().fetchApprovals();
  },

  approveApproval: async (id: string, comment: string) => {
    await api(`/api/approvals/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    });
    await get().fetchApprovals();
    await get().fetchRules();
    await get().fetchReleaseHistory();
  },

  rejectApproval: async (id: string, comment: string) => {
    await api(`/api/approvals/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    });
    await get().fetchApprovals();
  },

  createRollback: async (targetRuleId: string) => {
    await api('/api/history/rollback', {
      method: 'POST',
      body: JSON.stringify({ targetRuleId }),
    });
    await get().fetchRollbackDrafts();
  },

  submitRollback: async (id: string) => {
    await api(`/api/history/rollback/${id}/submit`, { method: 'POST' });
    await get().fetchRollbackDrafts();
  },

  executeRollback: async (id: string, comment: string) => {
    await api(`/api/history/rollback/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
    await get().fetchRollbackDrafts();
    await get().fetchRules();
    await get().fetchReleaseHistory();
  },
}));
