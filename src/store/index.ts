import { create } from 'zustand';
import type {
  AppState, WorkOrder, PartRequirement, Filters, ApprovalAction, RiskLevel, TowerSection, WorkOrderStatus, AuditLog, ApprovalRecord,
} from '@/types';
import { detectConflicts, sortConflicts } from '@/utils/conflictEngine';
import {
  fetchFullState,
  createWorkOrder as apiCreateWorkOrder,
  updateWorkOrder as apiUpdateWorkOrder,
  deleteWorkOrder as apiDeleteWorkOrder,
  createApproval as apiCreateApproval,
  createAuditLog as apiCreateAuditLog,
  saveConflictSnapshot as apiSaveConflictSnapshot,
  loadConflictSnapshot as apiLoadConflictSnapshot,
  updateUI as apiUpdateUI,
  updateFilters as apiUpdateFilters,
  clearFilters as apiClearFilters,
  resetAllData as apiResetAllData,
} from '@/utils/api';
import {
  seedWorkOrders, seedPartBatches, seedTeams, seedApprovals, seedAuditLogs,
} from '@/data/seed';

const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_USER = { name: '检修主管', role: '检修主管' };
const DEFAULT_UI = {
  selectedDate: new Date('2026-06-20').toISOString(),
  showWorkOrderModal: false,
  showExportModal: false,
  activeTab: 'calendar' as const,
  matrixWeekOffset: 0,
  matrixSelectedPartId: 'all' as const,
  rightPanelTab: 'approvals' as const,
};

/**
 * 后端持久化架构 (Backend Persistence Architecture):
 *
 *   —— 保证「刷新后结果从后端恢复」——
 *
 *   1. initializeStore() 启动时调用，从 /api/state 拉取全景数据
 *      - 工单 / 备件 / 班组 / 审批 / 审计 / 筛选 / UI / 当前用户 / 冲突快照
 *      - 冲突快照优先，缺失则前端重算并回写后端
 *   2. 所有写入操作：
 *      - 先乐观更新本地 state（保证 UI 即时响应）
 *      - 再异步调用后端 API 持久化（不阻塞 UI）
 *   3. 四大域全部落地后端 JSON 文件持久化
 */

const initialState: AppState = {
  workOrders: [],
  partBatches: [],
  teams: [],
  conflicts: [],
  approvals: [],
  auditLogs: [],
  filters: {},
  ui: DEFAULT_UI,
  currentUser: DEFAULT_USER,
};

export const useAppStore = create<AppState & {
  initialized: boolean;
  initializeStore: () => Promise<void>;
  setSelectedDate: (iso: string) => void;
  setActiveTab: (tab: 'calendar' | 'queue' | 'matrix') => void;
  openWorkOrderModal: (editingId?: string) => void;
  closeWorkOrderModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  selectWorkOrder: (id?: string) => void;
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;
  createWorkOrder: (data: {
    turbineId: string;
    towerSection: TowerSection;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    parts: PartRequirement[];
    teamId: string;
    riskLevel: RiskLevel;
    riskDescription: string;
    safetyConfirmed: boolean;
    status?: WorkOrderStatus;
  }) => void;
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  submitForApproval: (id: string) => void;
  approveWorkOrder: (id: string, comment?: string) => void;
  rejectWorkOrder: (id: string, reason: string) => void;
  lockWorkOrder: (id: string) => void;
  unlockWorkOrder: (id: string) => void;
  confirmSafety: (id: string) => void;
  markDelayed: (id: string, comment?: string) => void;
  markCompleted: (id: string) => void;
  recalculateConflicts: () => void;
  addAuditLog: (action: string, entityType: AuditLog['entityType'], details: Record<string, unknown>, entityId?: string) => void;
  resetAllData: () => Promise<void>;
  setMatrixWeekOffset: (offset: number) => void;
  setMatrixSelectedPartId: (partId: string | 'all') => void;
  setRightPanelTab: (tab: 'approvals' | 'audit') => void;
  _persistUI: (ui: AppState['ui']) => void;
}>((set, get) => {
  // 内部：UI 变更后异步持久化到后端
  const _persistUI = (ui: AppState['ui']) => {
    apiUpdateUI(ui).catch((err) => console.warn('[api] persist UI failed:', err));
  };

  // 内部：审批记录新增后异步持久化
  const addApproval = (workOrderId: string, action: ApprovalAction, comment: string) => {
    const user = get().currentUser;
    const record: ApprovalRecord = {
      id: genId('ap'),
      workOrderId,
      action,
      operator: user.name,
      operatorRole: user.role,
      timestamp: new Date().toISOString(),
      comment: comment || action,
    };
    const approvals = [...get().approvals, record];
    set({ approvals });
    apiCreateApproval(record).catch((err) => console.warn('[api] create approval failed:', err));
  };

  return {
    ...initialState,
    initialized: false,

    /**
     * 初始化：从后端拉取全量状态
     *  - 若后端有冲突快照则直接使用（保证 ID/排序一致）
     *  - 若无冲突快照则前端重算并回写后端
     */
    initializeStore: async () => {
      try {
        const state = await fetchFullState();

        // 冲突快照优先，缺失则即时重算并写回后端
        let conflicts = state.conflicts || [];
        if (!conflicts || conflicts.length === 0) {
          conflicts = sortConflicts(detectConflicts(state.workOrders, state.partBatches));
          apiSaveConflictSnapshot(conflicts).catch((err) =>
            console.warn('[api] save initial conflict snapshot failed:', err),
          );
        }

        set({
          workOrders: state.workOrders || seedWorkOrders,
          partBatches: state.partBatches || seedPartBatches,
          teams: state.teams || seedTeams,
          approvals: state.approvals || seedApprovals,
          auditLogs: state.auditLogs || seedAuditLogs,
          filters: state.filters || {},
          conflicts,
          ui: { ...DEFAULT_UI, ...(state.ui || {}) },
          currentUser: state.currentUser || DEFAULT_USER,
          initialized: true,
        });
      } catch (err) {
        console.error('[api] Failed to initialize store from backend:', err);
        // 后端不可用时降级使用本地预置数据
        const conflicts = sortConflicts(detectConflicts(seedWorkOrders, seedPartBatches));
        set({
          workOrders: seedWorkOrders,
          partBatches: seedPartBatches,
          teams: seedTeams,
          approvals: seedApprovals,
          auditLogs: seedAuditLogs,
          filters: {},
          conflicts,
          ui: DEFAULT_UI,
          currentUser: DEFAULT_USER,
          initialized: true,
        });
      }
    },

    /* ========== UI Actions（乐观更新 + 异步持久化）========== */
    setSelectedDate: (iso) => {
      const ui = { ...get().ui, selectedDate: iso };
      set({ ui });
      _persistUI(ui);
    },
    setActiveTab: (tab) => {
      const ui = { ...get().ui, activeTab: tab };
      set({ ui });
      _persistUI(ui);
    },
    openWorkOrderModal: (editingId) => {
      const ui = { ...get().ui, showWorkOrderModal: true, editingWorkOrderId: editingId };
      set({ ui });
      _persistUI(ui);
    },
    closeWorkOrderModal: () => {
      const ui = { ...get().ui, showWorkOrderModal: false, editingWorkOrderId: undefined };
      set({ ui });
      _persistUI(ui);
    },
    openExportModal: () => {
      const ui = { ...get().ui, showExportModal: true };
      set({ ui });
      _persistUI(ui);
    },
    closeExportModal: () => {
      const ui = { ...get().ui, showExportModal: false };
      set({ ui });
      _persistUI(ui);
    },
    selectWorkOrder: (id) => {
      const ui = { ...get().ui, selectedWorkOrderId: id };
      set({ ui });
      _persistUI(ui);
    },
    setMatrixWeekOffset: (offset) => {
      const ui = { ...get().ui, matrixWeekOffset: offset };
      set({ ui });
      _persistUI(ui);
    },
    setMatrixSelectedPartId: (partId) => {
      const ui = { ...get().ui, matrixSelectedPartId: partId };
      set({ ui });
      _persistUI(ui);
    },
    setRightPanelTab: (tab) => {
      const ui = { ...get().ui, rightPanelTab: tab };
      set({ ui });
      _persistUI(ui);
    },

    /* ========== Filters ========== */
    setFilters: (f) => {
      const filters = { ...get().filters, ...f };
      set({ filters });
      apiUpdateFilters(filters).catch((err) => console.warn('[api] update filters failed:', err));
      get().addAuditLog('set_filters', 'work_order', { applied: Object.keys(f) });
    },
    clearFilters: () => {
      set({ filters: {} });
      apiClearFilters().catch((err) => console.warn('[api] clear filters failed:', err));
      get().addAuditLog('clear_filters', 'work_order', {});
    },

    addAuditLog: (action, entityType, details, entityId) => {
      const user = get().currentUser;
      const log: AuditLog = {
        id: genId('log'),
        action,
        entityType,
        entityId,
        operator: user.name,
        timestamp: new Date().toISOString(),
        details,
      };
      const auditLogs = [log, ...get().auditLogs].slice(0, 500);
      set({ auditLogs });
      apiCreateAuditLog(log).catch((err) => console.warn('[api] create audit log failed:', err));
    },

    recalculateConflicts: () => {
      const { workOrders, partBatches } = get();
      const conflicts = sortConflicts(detectConflicts(workOrders, partBatches));
      set({ conflicts });
      // 关键：重算结果写入后端「冲突域」快照，刷新后保留相同 ID/排序
      apiSaveConflictSnapshot(conflicts).catch((err) =>
        console.warn('[api] save conflict snapshot failed:', err),
      );
      const byType: Record<string, number> = {};
      conflicts.forEach((c) => { byType[c.type] = (byType[c.type] ?? 0) + 1; });
      get().addAuditLog('conflict_recalc', 'conflict_recalc', {
        total: conflicts.length,
        byType,
      });
    },

    /* ========== Work Order CRUD ========== */
    createWorkOrder: (data) => {
      const lastNum = get().workOrders.reduce((max, w) => {
        const m = w.code.match(/(\d+)$/);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 0);
      const now = new Date().toISOString();
      const newWo: WorkOrder = {
        id: genId('wo'),
        code: `WG-2026-${String(lastNum + 1).padStart(4, '0')}`,
        turbineId: data.turbineId,
        towerSection: data.towerSection,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        parts: data.parts,
        teamId: data.teamId,
        riskLevel: data.riskLevel,
        riskDescription: data.riskDescription,
        safetyConfirmed: data.safetyConfirmed,
        status: data.status ?? 'draft',
        createdAt: now,
        updatedAt: now,
        createdBy: get().currentUser.name,
      };
      const workOrders = [...get().workOrders, newWo];
      set({ workOrders });
      apiCreateWorkOrder(newWo).catch((err) => console.warn('[api] create work order failed:', err));
      get().addAuditLog('create_work_order', 'work_order', {
        code: newWo.code,
        turbineId: newWo.turbineId,
        status: newWo.status,
      }, newWo.id);
      get().recalculateConflicts();
    },

    updateWorkOrder: (id, patch) => {
      const workOrders = get().workOrders.map((w) =>
        w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w,
      );
      set({ workOrders });
      apiUpdateWorkOrder(id, patch).catch((err) => console.warn('[api] update work order failed:', err));
      get().addAuditLog('update_work_order', 'work_order', {
        patchKeys: Object.keys(patch),
        toStatus: patch.status ?? undefined,
      }, id);
      get().recalculateConflicts();
    },

    deleteWorkOrder: (id) => {
      const wo = get().workOrders.find((x) => x.id === id);
      const workOrders = get().workOrders.filter((w) => w.id !== id);
      set({ workOrders });
      apiDeleteWorkOrder(id).catch((err) => console.warn('[api] delete work order failed:', err));
      get().addAuditLog('delete_work_order', 'work_order', {
        code: wo?.code,
        reason: 'manual_delete',
      }, id);
      get().recalculateConflicts();
    },

    /* ========== Workflow ========== */
    submitForApproval: (id) => {
      get().updateWorkOrder(id, { status: 'pending' });
      addApproval(id, 'submit', '提交审批');
    },
    approveWorkOrder: (id, comment) => {
      const patch: Partial<WorkOrder> = {
        status: 'approved',
        approvedBy: get().currentUser.name,
        approvedAt: new Date().toISOString(),
      };
      get().updateWorkOrder(id, patch);
      addApproval(id, 'approve', comment || '审批通过');
    },
    rejectWorkOrder: (id, reason) => {
      get().updateWorkOrder(id, { status: 'rejected', rejectionReason: reason });
      addApproval(id, 'reject', reason);
    },
    lockWorkOrder: (id) => {
      get().updateWorkOrder(id, { status: 'locked', lockedAt: new Date().toISOString() });
      addApproval(id, 'lock', '排程已锁定');
    },
    unlockWorkOrder: (id) => {
      get().updateWorkOrder(id, { status: 'approved' });
      addApproval(id, 'unlock', '解除锁定');
    },
    confirmSafety: (id) => {
      get().updateWorkOrder(id, { safetyConfirmed: true });
      addApproval(id, 'safety_confirm', '高风险作业安全确认完成');
    },
    markDelayed: (id, comment) => {
      get().updateWorkOrder(id, { status: 'delayed' });
      addApproval(id, 'delay', comment || '工单延期');
    },
    markCompleted: (id) => {
      get().updateWorkOrder(id, { status: 'completed' });
      addApproval(id, 'complete', '工单已完成');
    },

    /**
     * 重置所有数据：调用后端 /api/reset
     * 后端会重建 db.json 为预置种子数据
     */
    resetAllData: async () => {
      try {
        await apiResetAllData();
        // 重置后重新拉取状态
        await get().initializeStore();
        // 补一条重置审计日志（放在最前面）
        const resetLog: AuditLog = {
          id: genId('log'),
          action: 'reset_all_data',
          entityType: 'system',
          entityId: 'system',
          operator: get().currentUser.name,
          timestamp: new Date().toISOString(),
          details: { note: '用户触发系统重置，所有数据恢复预置' },
        };
        set((state) => ({ auditLogs: [resetLog, ...state.auditLogs].slice(0, 500) }));
        apiCreateAuditLog(resetLog).catch(() => {});
      } catch (err) {
        console.error('[api] reset failed:', err);
        // 降级：前端本地重置
        const conflicts = sortConflicts(detectConflicts(seedWorkOrders, seedPartBatches));
        set({
          workOrders: seedWorkOrders,
          partBatches: seedPartBatches,
          teams: seedTeams,
          approvals: seedApprovals,
          auditLogs: [
            {
              id: genId('log'),
              action: 'reset_all_data',
              entityType: 'system',
              entityId: 'system',
              operator: DEFAULT_USER.name,
              timestamp: new Date().toISOString(),
              details: { note: '用户触发系统重置，所有数据恢复预置（本地降级）' },
            },
            ...seedAuditLogs,
          ],
          filters: {},
          ui: DEFAULT_UI,
          conflicts,
          currentUser: DEFAULT_USER,
        });
      }
    },

    _persistUI,
  };
});
