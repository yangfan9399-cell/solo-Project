export interface MainRecord {
  id: number;
  work_no: string;
  work_name: string;
  silversmith: string;
  chisel_set: string | null;
  main_chisels: string | null;
  material: string;
  material_weight: number;
  start_date: string;
  version: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnealingRecord {
  id: number;
  main_record_id: number;
  seq_no: number;
  annealing_time: string;
  temperature: number;
  duration: number;
  cooling_method: string;
  hardness_before: number | null;
  hardness_after: number | null;
  operator: string | null;
  notes: string | null;
  created_at: string;
}

export interface PatternProgress {
  id: number;
  main_record_id: number;
  pattern_stage: string;
  pattern_name: string;
  progress_pct: number;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  chisels_used: string | null;
  issues: string | null;
  snapshot_image: string | null;
  created_at: string;
}

export interface ResultRecord {
  id: number;
  main_record_id: number;
  surface_defects: string | null;
  defect_severity: string | null;
  rework_count: number;
  final_weight: number | null;
  delivery_requirements: string | null;
  packaging: string | null;
  delivery_date: string | null;
  inspector: string | null;
  acceptance: string | null;
  acceptance_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolInventory {
  id: number;
  tool_code: string;
  tool_name: string;
  tool_type: string;
  spec: string | null;
  status: string;
  usage_count: number;
  last_maintenance: string | null;
  maintenance_cycle: number;
  manufacturer: string | null;
  version: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoAnnotation {
  id: number;
  main_record_id: number;
  pattern_progress_id: number | null;
  photo_url: string;
  annotation_type: string;
  annotation_text: string | null;
  annotator: string | null;
  annotation_time: string | null;
  resolved: number;
  resolved_note: string | null;
  created_at: string;
}

export interface DeliveryOrder {
  id: number;
  main_record_id: number;
  order_no: string;
  version: number;
  previous_version_id: number | null;
  content_snapshot: string;
  issued_by: string | null;
  issued_at: string;
  recipient: string | null;
  signoff: number;
}

export interface ChangeLog {
  id: number;
  main_record_id: number;
  table_name: string;
  record_id: number | null;
  change_type: string;
  change_reason: string | null;
  before_data: string | null;
  after_data: string | null;
  operator: string | null;
  created_at: string;
}

export interface DBData {
  main_records: MainRecord[];
  annealing_records: AnnealingRecord[];
  pattern_progress: PatternProgress[];
  result_records: ResultRecord[];
  tool_inventory: ToolInventory[];
  photo_annotations: PhotoAnnotation[];
  delivery_orders: DeliveryOrder[];
  change_logs: ChangeLog[];
  sequences: Record<string, number>;
}

export type TableName = keyof Omit<DBData, 'sequences'>;
