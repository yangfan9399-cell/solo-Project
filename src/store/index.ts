import { create } from 'zustand';
import type {
  AppState, WorkOrder, PartRequirement, Filters, ApprovalAction, RiskLevel, TowerSection, WorkOrderStatus, AuditLog, ApprovalRecord,
} from '@/types';
import {
  STORAGE_KEYS, saveToStorage, loadFromStorage, isInitialized, markInitialized,
} from '@/utils/storage';
import { detectConflicts, sortConflicts } from '@/utils/conflictEngine';
import {
  seedWorkOrders, seedPartBatches, seedTeams, seedApprovals, seedAuditLogs,
} from '@/data/seed';

const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_USER = { name: '检修主管', role: '检修主管' };

function loadInitialState(): Partial<AppState> {
  if (!isInitialized()) {
    return {
      workOrders: seedWorkOrders,
      partBatches: seedPartBatches,
      teams: seedTeams,
      approvals: seedApprovals,
      auditLogs: seedAuditLogs,
      filters: {},
      ui: {
        selectedDate: new Date('2026-06-20').toISOString(),
        showWorkOrderModal: false,
        showExportModal: false,
        activeTab: 'calendar',
      },
      currentUser: DEFAULT_USER,
    };
  }
  return {
    workOrders: loadFromStorage(STORAGE_KEYS.workOrders, seedWorkOrders),
    partBatches: loadFromStorage(STORAGE_KEYS.partBatches, seedPartBatches),
    teams: loadFromStorage(STORAGE_KEYS.teams, seedTeams),
    approvals: loadFromStorage(STORAGE_KEYS.approvals, seedApprovals),
    auditLogs: loadFromStorage(STORAGE_KEYS.auditLogs, seedAuditLogs),
    filters: loadFromStorage<Filters>(STORAGE_KEYS.filters, {}),
    ui: loadFromStorage(STORAGE_KEYS.ui, {
      selectedDate: new Date().toISOString(),
      showWorkOrderModal: false,
      showExportModal: false,
      activeTab: 'calendar' as const,
    }),
    currentUser: loadFromStorage(STORAGE_KEYS.currentUser, DEFAULT_USER),
  };
}

export const useAppStore = create<AppState & {
  // UI actions
  setSelectedDate: (iso: string) => void;
  setActiveTab: (tab: 'calendar' | 'queue' | 'matrix') => void;
  openWorkOrderModal: (editingId?: string) => void;
  closeWorkOrderModal: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  selectWorkOrder: (id?: string) => void;

  // Filter actions
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;

  // Work order CRUD
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

  // Workflow actions
  submitForApproval: (id: string) => void;
  approveWorkOrder: (id: string, comment?: string) => void;
  rejectWorkOrder: (id: string, reason: string) => void;
  lockWorkOrder: (id: string) => void;
  unlockWorkOrder: (id: string) => void;
  confirmSafety: (id: string) => void;
  markDelayed: (id: string, comment?: string) => void;
  markCompleted: (id: string) => void;

  // System
  recalculateConflicts: () => void;
  addAuditLog: (action: string, entityType: AuditLog['entityType'], details: Record<string, unknown>, entityId?: string) => void;
  resetAllData: () => void;
}>((set, get) => {
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
    saveToStorage(STORAGE_KEYS.approvals, approvals);
  };

  const initial = loadInitialState();
  const initialConflicts = sortConflicts(
    detectConflicts(initial.workOrders ?? [], initial.partBatches ?? []),
  );

  if (!isInitialized()) {
    markInitialized();
    saveToStorage(STORAGE_KEYS.workOrders, initial.workOrders);
    saveToStorage(STORAGE_KEYS.partBatches, initial.partBatches);
    saveToStorage(STORAGE_KEYS.teams, initial.teams);
    saveToStorage(STORAGE_KEYS.approvals, initial.approvals);
    saveToStorage(STORAGE_KEYS.auditLogs, initial.auditLogs);
    saveToStorage(STORAGE_KEYS.filters, initial.filters);
    saveToStorage(STORAGE_KEYS.ui, initial.ui);
    saveToStorage(STORAGE_KEYS.currentUser, initial.currentUser);
  }

  return {
    workOrders: initial.workOrders ?? [],
    partBatches: initial.partBatches ?? [],
    teams: initial.teams ?? [],
    conflicts: initialConflicts,
    approvals: initial.approvals ?? [],
    auditLogs: initial.auditLogs ?? [],
    filters: initial.filters ?? {},
    ui: initial.ui ?? {
      selectedDate: new Date().toISOString(),
      showWorkOrderModal: false,
      showExportModal: false,
      activeTab: 'calendar',
    },
    currentUser: initial.currentUser ?? DEFAULT_USER,

    // ========== UI Actions ==========
    setSelectedDate: (iso) => {
      const ui = { ...get().ui, selectedDate: iso };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },
    setActiveTab: (tab) => {
      const ui = { ...get().ui, activeTab: tab };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },
    openWorkOrderModal: (editingId) => {
      const ui = { ...get().ui, showWorkOrderModal: true, editingWorkOrderId: editingId };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },
    closeWorkOrderModal: () => {
      const ui = { ...get().ui, showWorkOrderModal: false, editingWorkOrderId: undefined };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },
    openExportModal: () => {
      const ui = { ...get().ui, showExportModal: true };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },
    closeExportModal: () => {
      const ui = { ...get().ui, showExportModal: false };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },
    selectWorkOrder: (id) => {
      const ui = { ...get().ui, selectedWorkOrderId: id };
      set({ ui });
      saveToStorage(STORAGE_KEYS.ui, ui);
    },

    // ========== Filters ==========
    setFilters: (f) => {
      const filters = { ...get().filters, ...f };
      set({ filters });
      saveToStorage(STORAGE_KEYS.filters, filters);
    },
    clearFilters: () => {
      set({ filters: {} });
      saveToStorage(STORAGE_KEYS.filters, {});
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
      const auditLogs = [log, ...get().auditLogs];
      set({ auditLogs });
      saveToStorage(STORAGE_KEYS.auditLogs, auditLogs);
    },

    recalculateConflicts: () => {
      const { workOrders, partBatches } = get();
      const conflicts = sortConflicts(detectConflicts(workOrders, partBatches));
      set({ conflicts });
      get().addAuditLog('conflict_recalc', 'conflict_recalc', { count: conflicts.length });
    },

    // ========== Work Order CRUD ==========
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
      saveToStorage(STORAGE_KEYS.workOrders, workOrders);
      get().addAuditLog('create_work_order', 'work_order', { code: newWo.code }, newWo.id);
      get().recalculateConflicts();
    },

    updateWorkOrder: (id, patch) => {
      const workOrders = get().workOrders.map((w) =>
        w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w,
      );
      set({ workOrders });
      saveToStorage(STORAGE_KEYS.workOrders, workOrders);
      get().addAuditLog('update_work_order', 'work_order', { patch: Object.keys(patch) }, id);
      get().recalculateConflicts();
    },

    deleteWorkOrder: (id) => {
      const workOrders = get().workOrders.filter((w) => w.id !== id);
      set({ workOrders });
      saveToStorage(STORAGE_KEYS.workOrders, workOrders);
      get().addAuditLog('delete_work_order', 'work_order', { id });
      get().recalculateConflicts();
    },

    // ========== Workflow ==========
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

    resetAllData: () => {
      saveToStorage(STORAGE_KEYS.workOrders, seedWorkOrders);
      saveToStorage(STORAGE_KEYS.partBatches, seedPartBatches);
      saveToStorage(STORAGE_KEYS.teams, seedTeams);
      saveToStorage(STORAGE_KEYS.approvals, seedApprovals);
      saveToStorage(STORAGE_KEYS.auditLogs, seedAuditLogs);
      saveToStorage(STORAGE_KEYS.filters, {});
      const defaultUI = {
        selectedDate: new Date('2026-06-20').toISOString(),
        showWorkOrderModal: false,
        showExportModal: false,
        activeTab: 'calendar' as const,
      };
      saveToStorage(STORAGE_KEYS.ui, defaultUI);
      const conflicts = sortConflicts(detectConflicts(seedWorkOrders, seedPartBatches));
      set({
        workOrders: seedWorkOrders,
        partBatches: seedPartBatches,
        teams: seedTeams,
        approvals: seedApprovals,
        auditLogs: seedAuditLogs,
        filters: {},
        ui: defaultUI,
        conflicts,
      });
    },
  };
});
