export interface MasterRecord {
  id: string;
  name: string;
  batch: string;
  version: string;
  status: 'draft' | 'processing' | 'completed' | 'error';
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  scale: number;
  scaleUnit: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  terrainType: string;
}

export interface ContourPoint {
  x: number;
  y: number;
  elevation: number;
}

export interface DetailRecord {
  id: string;
  masterId: string;
  contourIndex: number;
  elevation: number;
  points: ContourPoint[];
  isSmooth: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RidgeData {
  id: string;
  points: ContourPoint[];
  name: string;
}

export interface ProfileData {
  id: string;
  name: string;
  startPoint: ContourPoint;
  endPoint: ContourPoint;
  elevationData: { distance: number; elevation: number }[];
  maxElevation: number;
  minElevation: number;
  totalDistance: number;
}

export interface AspectData {
  id: string;
  direction: number;
  slope: number;
  position: ContourPoint;
}

export interface HistoryRecord {
  id: string;
  masterId: string;
  type: 'ridge' | 'profile' | 'aspect';
  data: RidgeData | ProfileData | AspectData;
  version: string;
  createdAt: string;
  operator: string;
  remark: string;
}

export interface PointLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'elevation' | 'landmark' | 'annotation';
  elevation?: number;
}

export interface ErrorNote {
  id: string;
  x: number;
  y: number;
  message: string;
  severity: 'high' | 'medium' | 'low';
  resolved: boolean;
  createdAt: string;
}

export interface LayerEdit {
  id: string;
  layerId: string;
  visible: boolean;
  opacity: number;
  color: string;
}

export interface ResultRecord {
  id: string;
  masterId: string;
  version: string;
  status: 'pending' | 'ready' | 'exported' | 'rolled_back';
  layers: LayerEdit[];
  pointLabels: PointLabel[];
  errorNotes: ErrorNote[];
  exportImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  masterId: string;
  version: string;
  name: string;
  createdAt: string;
  masterData: MasterRecord;
  details: DetailRecord[];
  histories: HistoryRecord[];
  result: ResultRecord;
}

export interface Database {
  masters: MasterRecord[];
  details: DetailRecord[];
  histories: HistoryRecord[];
  results: ResultRecord[];
  snapshots: Snapshot[];
}
