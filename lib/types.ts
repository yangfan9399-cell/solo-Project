export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'completed';
export type AnomalyLevel = 'none' | 'minor' | 'moderate' | 'severe';

export interface Project {
  id: number;
  code: string;
  name: string;
  origin: string;
  artist: string;
  dynasty: string;
  description: string;
  status: ProjectStatus;
  total_versions: number;
  avg_offset_px: number;
  max_offset_px: number;
  anomaly_level: AnomalyLevel;
  anomaly_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScanVersion {
  id: number;
  project_id: number;
  version_no: string;
  batch_no: string;
  scanned_at: string;
  scanner: string;
  resolution_dpi: number;
  notes: string;
  created_at: string;
}

export interface ColorLayer {
  id: number;
  version_id: number;
  project_id: number;
  layer_name: string;
  color_code: string;
  color_name: string;
  order_index: number;
  image_path: string;
  image_width: number;
  image_height: number;
  opacity: number;
  offset_x: number;
  offset_y: number;
  rotation: number;
  is_aligned: boolean;
}

export interface ControlPoint {
  id: number;
  layer_id: number;
  project_id: number;
  version_id: number;
  label: string;
  ref_x: number;
  ref_y: number;
  cur_x: number;
  cur_y: number;
  delta_x: number;
  delta_y: number;
  distance: number;
}

export interface RepairRecord {
  id: number;
  project_id: number;
  version_id: number;
  layer_id: number | null;
  action_type: 'align' | 'retrim' | 'reprint' | 'note' | 'block_repair';
  description: string;
  operator: string;
  before_offset: number;
  after_offset: number;
  created_at: string;
}

export interface OffsetStat {
  id?: number;
  project_id: number;
  version_id: number;
  layer_count: number;
  point_count: number;
  avg_delta_x: number;
  avg_delta_y: number;
  avg_distance: number;
  max_distance: number;
  min_distance: number;
  std_distance: number;
  aligned_count: number;
  misaligned_count: number;
  analyzed_at: string;
}

export interface ExportSummary {
  project: Project;
  latest_version: ScanVersion | null;
  layers: ColorLayer[];
  stats: OffsetStat | null;
  repairs: RepairRecord[];
  control_points: ControlPoint[];
}
