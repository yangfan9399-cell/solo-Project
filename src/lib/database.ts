import { createSignal } from "solid-js";
import type {
  DatabaseState,
  Channel,
  Entrance,
  Sign,
  Equipment,
  OfflineMap,
  InspectionTask,
  AnyEntity,
  EntityType,
  VersionHistory,
  Anomaly,
  ExportSummary
} from "~/types";
import { seedData } from "~/data/seed";

const [state, setState] = createSignal<DatabaseState>(loadState());

function loadState(): DatabaseState {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("cdms_state");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return seedData;
      }
    }
  }
  return seedData;
}

function saveState(newState: DatabaseState) {
  if (typeof window !== "undefined") {
    localStorage.setItem("cdms_state", JSON.stringify(newState));
  }
}

function updateState(updater: (draft: DatabaseState) => DatabaseState) {
  const current = state();
  const newState = updater(current);
  setState(newState);
  saveState(newState);
  return newState;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateCode(type: EntityType): string {
  const prefix: Record<EntityType, string> = {
    channel: "CH",
    entrance: "EN",
    sign: "SG",
    equipment: "EQ",
    map: "MP",
    inspection: "IN"
  };
  const count = getEntityList(type).length + 1;
  return `${prefix[type]}-${String(count).padStart(4, "0")}`;
}

function getEntityList(type: EntityType): AnyEntity[] {
  const s = state();
  switch (type) {
    case "channel": return s.channels;
    case "entrance": return s.entrances;
    case "sign": return s.signs;
    case "equipment": return s.equipment;
    case "map": return s.maps;
    case "inspection": return s.inspections;
  }
}

function setEntityList(type: EntityType, list: AnyEntity[], draft: DatabaseState): DatabaseState {
  switch (type) {
    case "channel": return { ...draft, channels: list as Channel[] };
    case "entrance": return { ...draft, entrances: list as Entrance[] };
    case "sign": return { ...draft, signs: list as Sign[] };
    case "equipment": return { ...draft, equipment: list as Equipment[] };
    case "map": return { ...draft, maps: list as OfflineMap[] };
    case "inspection": return { ...draft, inspections: list as InspectionTask[] };
  }
}

export function useDatabase() {
  return { state, setState, updateState, generateId, generateCode };
}

export function getEntities<T extends AnyEntity>(type: EntityType): T[] {
  return getEntityList(type) as T[];
}

export function getEntityById<T extends AnyEntity>(type: EntityType, id: string): T | undefined {
  return getEntityList(type).find(e => e.id === id) as T | undefined;
}

export function createEntity<T extends AnyEntity>(type: EntityType, data: Omit<T, "id" | "code" | "createdAt" | "updatedAt" | "version" | "batchId" | "status"> & Partial<T>): T {
  const id = generateId();
  const code = data.code || generateCode(type);
  const now = new Date().toISOString();
  const batchId = state().currentBatchId;

  const entity: AnyEntity = {
    ...data,
    id,
    code,
    status: data.status || "normal",
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy || "system",
    version: 1,
    batchId,
    remarks: data.remarks || ""
  } as unknown as AnyEntity;

  updateState(draft => {
    const list = [...getEntityList(type), entity];
    const updated = setEntityList(type, list, draft);
    const history: VersionHistory = {
      id: generateId(),
      entityId: id,
      entityType: type,
      version: 1,
      batchId,
      changeType: "create",
      changeSummary: `创建 ${type === "channel" ? "通道" : type === "entrance" ? "出入口" : type === "sign" ? "指示牌" : type === "equipment" ? "设备" : type === "map" ? "导览地图" : "巡检任务"}: ${entity.name}`,
      changedBy: data.createdBy || "system",
      changedAt: now,
      currentData: entity as unknown as Record<string, unknown>
    };
    return {
      ...updated,
      versionHistory: [...updated.versionHistory, history]
    };
  });

  detectAnomalies();
  return entity as T;
}

export function updateEntity<T extends AnyEntity>(type: EntityType, id: string, data: Partial<T>): T | undefined {
  let updatedEntity: T | undefined;
  const now = new Date().toISOString();

  updateState(draft => {
    const list = getEntityList(type);
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return draft;

    const oldEntity = list[index];
    updatedEntity = {
      ...oldEntity,
      ...data,
      version: oldEntity.version + 1,
      updatedAt: now
    } as T;

    const newList = [...list];
    newList[index] = updatedEntity;
    const updated = setEntityList(type, newList, draft);

    const history: VersionHistory = {
      id: generateId(),
      entityId: id,
      entityType: type,
      version: updatedEntity.version,
      batchId: draft.currentBatchId,
      changeType: "update",
      changeSummary: `更新 ${type} 属性: ${Object.keys(data).join(", ")}`,
      changedBy: (data as { updatedBy?: string }).updatedBy || "system",
      changedAt: now,
      previousData: oldEntity as unknown as Record<string, unknown>,
      currentData: updatedEntity as unknown as Record<string, unknown>
    };

    return {
      ...updated,
      versionHistory: [...updated.versionHistory, history]
    };
  });

  detectAnomalies();
  return updatedEntity;
}

export function deleteEntity(type: EntityType, id: string): boolean {
  const now = new Date().toISOString();
  const entity = getEntityById(type, id);
  if (!entity) return false;

  updateState(draft => {
    const list = getEntityList(type);
    const newList = list.filter(e => e.id !== id);
    const updated = setEntityList(type, newList, draft);

    const history: VersionHistory = {
      id: generateId(),
      entityId: id,
      entityType: type,
      version: entity.version + 1,
      batchId: draft.currentBatchId,
      changeType: "delete",
      changeSummary: `删除 ${type}: ${entity.name}`,
      changedBy: "system",
      changedAt: now,
      previousData: entity as unknown as Record<string, unknown>
    };

    return {
      ...updated,
      versionHistory: [...updated.versionHistory, history]
    };
  });

  return true;
}

export function getVersionHistory(entityId?: string): VersionHistory[] {
  const history = state().versionHistory;
  if (entityId) {
    return history.filter(h => h.entityId === entityId).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }
  return history.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
}

export function getAnomalies(): Anomaly[] {
  return state().anomalies.filter(a => !a.resolved);
}

export function resolveAnomaly(id: string, resolvedBy: string): boolean {
  const now = new Date().toISOString();
  updateState(draft => ({
    ...draft,
    anomalies: draft.anomalies.map(a =>
      a.id === id ? { ...a, resolved: true, resolvedAt: now, resolvedBy } : a
    )
  }));
  return true;
}

export function detectAnomalies(): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const s = state();
  const now = new Date();

  [...s.channels, ...s.entrances, ...s.signs, ...s.equipment].forEach(entity => {
    if (entity.status === "fault" || entity.status === "offline") {
      anomalies.push({
        id: generateId(),
        entityId: entity.id,
        entityType: entity.type,
        entityName: entity.name,
        anomalyType: "status",
        severity: entity.status === "fault" ? "high" : "medium",
        description: `${entity.status === "fault" ? "设备故障" : "离线"}`,
        detectedAt: now.toISOString(),
        resolved: false
      });
    }

    if (entity.status === "warning") {
      anomalies.push({
        id: generateId(),
        entityId: entity.id,
        entityType: entity.type,
        entityName: entity.name,
        anomalyType: "status",
        severity: "low",
        description: "状态异常警告",
        detectedAt: now.toISOString(),
        resolved: false
      });
    }
  });

  [...s.signs, ...s.equipment].forEach(entity => {
    if ("nextMaintenanceDate" in entity || "nextInspectionDate" in entity) {
      const nextDate = new Date(
        ("nextMaintenanceDate" in entity ? entity.nextMaintenanceDate : undefined) ||
        ("nextInspectionDate" in entity ? entity.nextInspectionDate : "")
      );
      if (nextDate < now) {
        anomalies.push({
          id: generateId(),
          entityId: entity.id,
          entityType: entity.type,
          entityName: entity.name,
          anomalyType: "maintenance_overdue",
          severity: "medium",
          description: `${"nextMaintenanceDate" in entity ? "维护" : "巡检"}已逾期`,
          detectedAt: now.toISOString(),
          resolved: false
        });
      }
    }
  });

  s.inspections.forEach(inspection => {
    if (inspection.result === "failed") {
      anomalies.push({
        id: generateId(),
        entityId: inspection.id,
        entityType: "inspection",
        entityName: inspection.name,
        anomalyType: "inspection_overdue",
        severity: "high",
        description: `巡检发现 ${inspection.anomalies.length} 项异常`,
        detectedAt: (inspection.actualDate || inspection.plannedDate),
        resolved: false
      });
    }
  });

  updateState(draft => {
    const existingUnresolved = draft.anomalies.filter(a => !a.resolved);
    const newAnomalies = anomalies.filter(a =>
      !existingUnresolved.some(ea =>
        ea.entityId === a.entityId && ea.anomalyType === a.anomalyType
      )
    );
    return { ...draft, anomalies: [...existingUnresolved, ...newAnomalies] };
  });

  return anomalies;
}

export function createExportSummary(exportType: string, filters: Record<string, unknown>, recordCount: number, fileName: string, fileSize: string): ExportSummary {
  const s = state();
  const allEntities = [...s.channels, ...s.entrances, ...s.signs, ...s.equipment, ...s.maps, ...s.inspections];

  const summary: ExportSummary = {
    id: generateId(),
    exportType,
    exportedAt: new Date().toISOString(),
    exportedBy: "system",
    filters,
    recordCount,
    fileName,
    fileSize,
    summary: {
      totalEntities: allEntities.length,
      byType: {
        channel: s.channels.length,
        entrance: s.entrances.length,
        sign: s.signs.length,
        equipment: s.equipment.length,
        map: s.maps.length,
        inspection: s.inspections.length
      },
      byStatus: allEntities.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      anomalies: s.anomalies.filter(a => !a.resolved).length,
      maintenanceDue: s.equipment.filter(e => new Date(e.nextMaintenanceDate) < new Date()).length
    }
  };

  updateState(draft => ({
    ...draft,
    exportSummaries: [...draft.exportSummaries, summary]
  }));

  return summary;
}

export function getExportSummaries(): ExportSummary[] {
  return state().exportSummaries.sort((a, b) =>
    new Date(b.exportedAt).getTime() - new Date(a.exportedAt).getTime()
  );
}

export function resetToSeed() {
  setState(seedData);
  saveState(seedData);
}

export function startNewBatch() {
  const batchId = "BATCH-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).substr(2, 4).toUpperCase();
  updateState(draft => ({ ...draft, currentBatchId: batchId }));
  return batchId;
}
