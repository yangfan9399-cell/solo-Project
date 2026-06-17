export type EntityType =
  | "channel"
  | "entrance"
  | "sign"
  | "equipment"
  | "map"
  | "inspection";

export type EntityStatus = "normal" | "warning" | "fault" | "maintenance" | "offline";

export type InspectionStatus = "pending" | "in_progress" | "completed" | "failed";

export interface BaseEntity {
  id: string;
  code: string;
  name: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  batchId: string;
  remarks: string;
}

export interface Channel extends BaseEntity {
  type: "channel";
  startPoint: string;
  endPoint: string;
  length: number;
  width: number;
  height: number;
  material: string;
  fireResistance: string;
  connectedEntrances: string[];
  connectedChannels: string[];
  maxOccupancy: number;
  currentStatus: string;
}

export interface Entrance extends BaseEntity {
  type: "entrance";
  location: string;
  address: string;
  entranceType: "main" | "emergency" | "personnel" | "equipment" | "vehicular";
  accessControl: string;
  width: number;
  height: number;
  floor: string;
  groundLevel: number;
  connectedChannels: string[];
  hasElevator: boolean;
  hasRamp: boolean;
  emergencyPhone: string;
}

export interface Sign extends BaseEntity {
  type: "sign";
  signType: "direction" | "emergency" | "warning" | "information" | "exit";
  location: string;
  channelId: string;
  position: { x: number; y: number };
  content: string;
  arrowDirection?: "left" | "right" | "up" | "down" | "forward" | "back";
  illuminationType: "illuminated" | "reflective" | "photoluminescent" | "none";
  installationDate: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
}

export interface Equipment extends BaseEntity {
  type: "equipment";
  equipmentType: "fire" | "ventilation" | "power" | "communication" | "lighting" | "waterSupply" | "drainage" | "door" | "airtight" | "filter";
  location: string;
  channelId: string;
  position: { x: number; y: number };
  model: string;
  manufacturer: string;
  installationDate: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceCycle: string;
  specification: Record<string, string | number | boolean>;
}

export interface OfflineMap extends BaseEntity {
  type: "map";
  mapVersion: string;
  mapData: string;
  area: { x: number; y: number; width: number; height: number };
  scale: string;
  format: string;
  zones: MapZone[];
  paths: MapPath[];
  pois: MapPOI[];
}

export interface MapZone {
  id: string;
  name: string;
  type: string;
  polygon: Array<{ x: number; y: number }>;
  area: number;
}

export interface MapPath {
  id: string;
  type: string;
  points: Array<{ x: number; y: number }>;
}

export interface MapPOI {
  id: string;
  entityId: string;
  entityType: EntityType;
  position: { x: number; y: number };
}

export interface InspectionTask extends BaseEntity {
  type: "inspection";
  inspectionType: "routine" | "emergency" | "special" | "acceptance";
  plannedDate: string;
  actualDate?: string;
  inspector: string;
  items: InspectionItem[];
  result?: InspectionStatus;
  anomalies: string[];
  attachments: string[];
}

export interface InspectionItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  checkItem: string;
  standard: string;
  result: "pass" | "fail" | "pending";
  remarks: string;
  photos: string[];
}

export interface VersionHistory {
  id: string;
  entityId: string;
  entityType: EntityType;
  version: number;
  batchId: string;
  changeType: "create" | "update" | "delete" | "import";
  changeSummary: string;
  changedBy: string;
  changedAt: string;
  previousData?: Record<string, unknown>;
  currentData?: Record<string, unknown>;
}

export interface ExportSummary {
  id: string;
  exportType: string;
  exportedAt: string;
  exportedBy: string;
  filters: Record<string, unknown>;
  recordCount: number;
  fileName: string;
  fileSize: string;
  summary: {
    totalEntities: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    anomalies: number;
    maintenanceDue: number;
  };
}

export interface Anomaly {
  id: string;
  entityId: string;
  entityType: EntityType;
  entityName: string;
  anomalyType: "status" | "maintenance_overdue" | "inspection_overdue" | "data_inconsistency" | "equipment_fault";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AnyEntity = Channel | Entrance | Sign | Equipment | OfflineMap | InspectionTask;

export interface DatabaseState {
  channels: Channel[];
  entrances: Entrance[];
  signs: Sign[];
  equipment: Equipment[];
  maps: OfflineMap[];
  inspections: InspectionTask[];
  versionHistory: VersionHistory[];
  exportSummaries: ExportSummary[];
  anomalies: Anomaly[];
  currentBatchId: string;
}
