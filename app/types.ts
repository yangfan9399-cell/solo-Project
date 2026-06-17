export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";

export type RiverType = "mountain" | "plain" | "transition";

export type FishType = "salmon" | "carp" | "eel" | "catfish" | "general";

export interface Project {
  id: number;
  code: string;
  name: string;
  station_name: string;
  river_name: string;
  river_type: RiverType;
  fish_type: FishType;
  designer: string;
  status: ProjectStatus;
  description: string | null;
  has_anomaly: number;
  anomaly_count: number;
  current_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrossSection {
  id: number;
  project_id: number;
  version_id: number;
  station_no: string;
  name: string;
  width: number;
  depth: number;
  slope: number;
  area: number;
  wetted_perimeter: number;
  hydraulic_radius: number;
  bottom_elevation: number;
  remark: string | null;
  created_at: string;
}

export interface WaterLevel {
  id: number;
  project_id: number;
  version_id: number;
  section_id: number;
  upstream_level: number;
  downstream_level: number;
  water_depth: number;
  flow_rate: number;
  measure_date: string;
  remark: string | null;
  created_at: string;
}

export type RoughnessType = "concrete" | "stone" | "earth" | "vegetation" | "mixed";

export interface Roughness {
  id: number;
  project_id: number;
  version_id: number;
  section_id: number;
  n_value: number;
  type: RoughnessType;
  description: string | null;
  created_at: string;
}

export type ObstacleType = "boulder" | "pier" | "sill" | "step" | "other";

export interface Obstacle {
  id: number;
  project_id: number;
  version_id: number;
  section_id: number;
  type: ObstacleType;
  position_m: number;
  height_m: number;
  width_m: number;
  description: string | null;
  created_at: string;
}

export interface FlowSegment {
  id: number;
  project_id: number;
  version_id: number;
  section_id: number;
  segment_index: number;
  start_m: number;
  end_m: number;
  velocity_ms: number;
  depth_m: number;
  suitability: "safe" | "warning" | "danger";
  created_at: string;
}

export interface UnsuitableZone {
  id: number;
  project_id: number;
  version_id: number;
  section_id: number;
  zone_type: "high_velocity" | "low_depth" | "turbulence" | "dead_zone";
  start_m: number;
  end_m: number;
  max_velocity: number;
  min_depth: number;
  description: string;
  created_at: string;
}

export interface Version {
  id: number;
  project_id: number;
  version_tag: string;
  batch_no: string;
  is_current: number;
  author: string;
  note: string | null;
  created_at: string;
}

export interface AnomalyRecord {
  id: number;
  project_id: number;
  version_id: number;
  section_id: number | null;
  type: "data_inconsistency" | "out_of_range" | "missing_data" | "calculation_error";
  severity: "warning" | "danger";
  field: string | null;
  value: string | null;
  message: string;
  resolved: number;
  created_at: string;
}

export interface FlowSuitabilityThreshold {
  fishType: FishType;
  minVelocity: number;
  maxVelocity: number;
  optimalMin: number;
  optimalMax: number;
  minDepth: number;
}

export const THRESHOLDS: Record<FishType, FlowSuitabilityThreshold> = {
  salmon: {
    fishType: "salmon",
    minVelocity: 0.3,
    maxVelocity: 2.5,
    optimalMin: 0.6,
    optimalMax: 1.5,
    minDepth: 0.5,
  },
  carp: {
    fishType: "carp",
    minVelocity: 0.2,
    maxVelocity: 1.8,
    optimalMin: 0.4,
    optimalMax: 1.0,
    minDepth: 0.4,
  },
  eel: {
    fishType: "eel",
    minVelocity: 0.1,
    maxVelocity: 1.2,
    optimalMin: 0.3,
    optimalMax: 0.8,
    minDepth: 0.3,
  },
  catfish: {
    fishType: "catfish",
    minVelocity: 0.2,
    maxVelocity: 2.0,
    optimalMin: 0.5,
    optimalMax: 1.2,
    minDepth: 0.4,
  },
  general: {
    fishType: "general",
    minVelocity: 0.2,
    maxVelocity: 2.0,
    optimalMin: 0.5,
    optimalMax: 1.2,
    minDepth: 0.4,
  },
};

export function classifyVelocity(
  velocity: number,
  depth: number,
  fishType: FishType
): "safe" | "warning" | "danger" {
  const t = THRESHOLDS[fishType];
  if (
    velocity < t.minVelocity ||
    velocity > t.maxVelocity ||
    depth < t.minDepth
  ) {
    return "danger";
  }
  if (velocity < t.optimalMin || velocity > t.optimalMax) {
    return "warning";
  }
  return "safe";
}
