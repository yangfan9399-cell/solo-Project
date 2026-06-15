export interface MasterRecord {
  id: string;
  name: string;
  description: string;
  mapImageData: string;
  mapWidth: number;
  mapHeight: number;
  scaleBarLength: number;
  scaleBarRealDistance: number;
  scaleUnit: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'scaled' | 'processing' | 'completed';
  version: number;
  batchNo: string;
}

export interface DetailRecord {
  id: string;
  masterId: string;
  contourElevation: number;
  contourPoints: ContourPoint[];
  color: string;
  lineWidth: number;
  layerName: string;
  isVisible: boolean;
  createdAt: string;
  version: number;
}

export interface ContourPoint {
  x: number;
  y: number;
}

export interface HistoryRecord {
  id: string;
  masterId: string;
  type: 'ridge' | 'profile' | 'aspect';
  name: string;
  data: RidgeData | ProfileData | AspectData;
  createdAt: string;
  operator: string;
  remark: string;
  version: number;
}

export interface RidgeData {
  points: ContourPoint[];
  direction: string;
}

export interface ProfileData {
  startPoint: ContourPoint;
  endPoint: ContourPoint;
  elevationPoints: { distance: number; elevation: number }[];
  totalDistance: number;
  maxElevation: number;
  minElevation: number;
  status: 'success' | 'error' | 'rollback';
  errorMessage?: string;
}

export interface AspectData {
  direction: number;
  slope: number;
  area: number;
}

export interface ResultRecord {
  id: string;
  masterId: string;
  layerEdits: LayerEdit[];
  pointLabels: PointLabel[];
  errorNotes: ErrorNote[];
  exportImageUrl?: string;
  exportAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'editing' | 'exported' | 'rollback' | 'recalculate';
}

export interface LayerEdit {
  id: string;
  detailId: string;
  action: 'add' | 'modify' | 'delete' | 'visibility';
  timestamp: string;
  beforeData?: any;
  afterData?: any;
}

export interface PointLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  elevation?: number;
  type: 'elevation' | 'landmark' | 'annotation';
}

export interface ErrorNote {
  id: string;
  detailId?: string;
  x: number;
  y: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}
