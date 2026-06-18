export interface BowArchive {
  id: string;
  name: string;
  bowType: "recurve" | "traditional" | "compound" | "longbow" | string;
  bowLength: number;
  drawWeight: number;
  drawLength: number;
  braceHeight: number;
  upperTipWeight?: number | null;
  lowerTipWeight?: number | null;
  limbRatio?: number | null;
  arrowWeight: number;
  arrowSpine?: number | string | null;
  stringStrands?: number | null;
  stringMaterial?: string | null;
  releaseType: "finger" | "thumb" | "release" | string;
  restType?: string | null;
  sightType?: string | null;
  status: "active" | "archived" | "testing";
  notes?: string | null;
  equipmentId?: string | null;
  nockingPoint?: number | null;
  tillerTop?: number | null;
  tillerBottom?: number | null;
  limbAlignment?: string | null;
  centerShot?: number | null;
  plungerSpring?: string | null;
  plungerTension?: number | null;
  sightMark?: number | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface BowVersion {
  id: string;
  archiveId: string;
  versionNumber: number;
  batchCode: string;
  label: string;
  snapshot: string | Partial<BowArchive> | any;
  changeNote?: string | null;
  changeLog?: string | null;
  createdBy?: string | null;
  createdAt: string;
  [key: string]: any;
}

export interface TargetPoint {
  id: string;
  archiveId: string;
  arrowNumber: number;
  x: number;
  y: number;
  score: number;
  distance?: number | null;
  shotAt?: string | null;
  [key: string]: any;
}

export interface Equipment {
  id: string;
  name: string;
  category: "bow" | "arrow" | "string" | "accessory" | "limb" | "riser" | string;
  status?: "new" | "excellent" | "good" | "fair" | "repair" | string;
  condition?: "new" | "excellent" | "good" | "fair" | "poor" | string;
  spec?: string | null;
  specs?: Record<string, string | number> | string | null;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  [key: string]: any;
}

export interface ExportSummary {
  id: string;
  archiveId: string;
  archiveName?: string;
  format: "text" | "json" | "csv" | string;
  content: string;
  exportedAt: string;
  [key: string]: any;
}

export interface AnomalyAlert {
  id: string;
  archiveId: string;
  field: string;
  value: string | number;
  expectedMin?: number;
  expectedMax?: number;
  severity: "low" | "medium" | "high";
  message: string;
  detectedAt: string;
  [key: string]: any;
}
