export interface VinylRecord {
  id: number;
  catalog_no: string;
  artist: string;
  album: string;
  year: number | null;
  genre: string | null;
  condition: "M" | "NM" | "VG+" | "VG" | "G+" | "G" | null;
  weight: number | null;
  pressing: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CleaningSolution {
  id: number;
  name: string;
  brand: string | null;
  type: "enzymatic" | "alcohol" | "distilled" | "surfactant" | "mixed" | null;
  ph: number | null;
  dilution_ratio: string | null;
  volume_ml: number | null;
  opened_date: string | null;
  expiry_date: string | null;
  is_active: number;
  notes: string;
  created_at: string;
}

export interface CleaningBatch {
  id: number;
  batch_code: string;
  record_id: number;
  solution_id: number;
  brush_type: string | null;
  brush_count: number;
  ultrasonic_minutes: number;
  ultrasonic_temp_c: number | null;
  rinse_count: number;
  drying_method: string | null;
  drying_minutes: number;
  operator: string | null;
  pre_noise_level: number;
  post_noise_level: number;
  crackle_reduction: number;
  result_rating: 1 | 2 | 3 | 4 | 5;
  anomalies: string;
  notes: string;
  cleaned_at: string;
  created_at: string;
  version: number;
}

export interface BatchVersion {
  id: number;
  batch_id: number;
  version: number;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string | null;
}

export interface AuditionLog {
  id: number;
  record_id: number;
  batch_id: number | null;
  side: "A" | "B";
  track_no: number | null;
  noise_level: number;
  crackles: number;
  pops: number;
  surface_noise: number;
  distortion: number;
  warble: number;
  inner_groove_distortion: number;
  listener: string | null;
  equipment: string | null;
  notes: string;
  auditioned_at: string;
}

export interface MaintenanceReminder {
  id: number;
  type: "brush_replace" | "solution_refill" | "ultrasonic_filter" | "machine_calibration" | "pad_replace";
  target: string;
  threshold_count: number | null;
  threshold_date: string | null;
  current_count: number;
  is_triggered: number;
  last_maintenance: string | null;
  notes: string;
  created_at: string;
}

export interface DataAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  detail?: string;
  related_record_id?: number;
  related_batch_id?: number;
}
