export interface Ship {
  id: number;
  name: string;
  imo_number: string | null;
  call_sign: string | null;
  flag: string | null;
  ship_type: string | null;
  gross_tonnage: number | null;
  built_year: number | null;
  compass_type: string | null;
  compass_model: string | null;
  compass_install_date: string | null;
  home_port: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DeviationPoint = {
  id: number;
  record_id: number;
  ship_heading: number;
  magnetic_heading: number | null;
  true_heading: number | null;
  deviation: number;
  deviation_direction: 'E' | 'W';
  measured: boolean;
  notes: string | null;
};

export interface DeviationRecord {
  id: number;
  ship_id: number;
  version: number;
  batch_code: string;
  record_date: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  magnetic_variation: number | null;
  variation_direction: 'E' | 'W' | null;
  weather_condition: string | null;
  sea_state: string | null;
  ship_speed: number | null;
  ship_draft: number | null;
  trim: number | null;
  corrector_fore_and_aft: number | null;
  corrector_athwartship: number | null;
  corrector_vertical: number | null;
  corrector_quadrantal: number | null;
  corrector_heeling: number | null;
  inspector_name: string | null;
  inspector_certificate: string | null;
  survey_company: string | null;
  status: 'draft' | 'verified' | 'approved' | 'archived';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DeviationRecordWithPoints = DeviationRecord & {
  points: DeviationPoint[];
};

export type CorrectionTableEntry = {
  id: number;
  record_id: number;
  heading: number;
  ship_heading_range: string;
  correction_value: number;
  correction_direction: 'E' | 'W';
  apply_rule: string | null;
};

export interface VersionHistory {
  id: number;
  record_id: number;
  version_number: number;
  action: 'create' | 'update' | 'submit' | 'verify' | 'approve' | 'archive' | 'restore';
  changed_by: string | null;
  change_summary: string | null;
  changed_fields: string | null;
  created_at: string;
}

export interface AnomalyReport {
  record_id: number;
  type: 'deviation_excessive' | 'missing_points' | 'inconsistent_direction' | 'abnormal_jump' | 'curve_discontinuity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: Record<string, unknown> | null;
}

export type FilterOptions = {
  keyword?: string;
  status?: DeviationRecord['status'];
  shipType?: string;
  flag?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAnomaly?: boolean;
};

export type LedgerSummary = {
  totalShips: number;
  totalRecords: number;
  verifiedRecords: number;
  pendingRecords: number;
  abnormalRecords: number;
  archivedRecords: number;
  lastUpdateDate: string;
};
