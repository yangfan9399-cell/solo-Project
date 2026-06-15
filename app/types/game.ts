export type WeatherType = 'sunny' | 'rainy' | 'snowy' | 'windy' | 'foggy';

export type PartName = 'pendulum' | 'gearA' | 'gearB' | 'gearC' | 'hammer' | 'spring';

export type StrikeOrderStep = 'gearA' | 'gearB' | 'gearC' | 'hammer';

export interface GameSession {
  id: number;
  session_uuid: string;
  player_name: string;
  created_at: string;
  finished_at: string | null;
  status: 'playing' | 'completed' | 'failed' | 'rolled_back';
  current_day: number;
  total_days: number;
  seed_scenario: 'normal' | 'wear_abnormal' | 'rollback';
  final_score: number | null;
}

export interface AdjustmentDetail {
  id: number;
  session_id: number;
  day: number;
  pendulum_length_before: number;
  pendulum_length_after: number;
  weather_today: WeatherType;
  temperature: number;
  metal_expansion_coeff: number;
  timestamp: string;
  operator_note: string;
}

export interface GearRatioHistory {
  id: number;
  session_id: number;
  day: number;
  gearA_teeth_before: number;
  gearA_teeth_after: number;
  gearB_teeth_before: number;
  gearB_teeth_after: number;
  gearC_teeth_before: number;
  gearC_teeth_after: number;
  timestamp: string;
  reason: string;
}

export interface CalibrationResult {
  id: number;
  session_id: number;
  day: number;
  lubrication_level_before: number;
  lubrication_level_after: number;
  strike_order_before: string;
  strike_order_after: string;
  error_seconds: number;
  target_error: number;
  pass_threshold: boolean;
  timestamp: string;
}

export interface PartState {
  id: number;
  session_id: number;
  day: number;
  part_name: PartName;
  wear_level: number;
  max_wear: number;
  needs_repair: boolean;
  last_repaired_day: number;
}

export interface ErrorDataPoint {
  id: number;
  session_id: number;
  day: number;
  error_seconds: number;
  target: number;
  tolerance: number;
}

export interface MaintenanceEvent {
  id: number;
  session_id: number;
  day: number;
  event_type: 'adjust_pendulum' | 'change_gear_ratio' | 'lubricate' | 'strike_order' | 'repair_part' | 'rollback';
  description: string;
  before_state: string;
  after_state: string;
  timestamp: string;
}

export interface CalibrationReport {
  session_id: number;
  start_summary: {
    initial_error: number;
    initial_parts_condition: Record<PartName, number>;
    initial_weather: WeatherType;
  };
  daily_logs: Array<{
    day: number;
    weather: WeatherType;
    temperature: number;
    morning_error: number;
    adjustments: string[];
    evening_error: number;
    parts_condition: Record<PartName, number>;
  }>;
  final_summary: {
    final_error: number;
    total_adjustments: number;
    parts_repaired: number;
    score: number;
    accuracy: number;
    verdict: 'perfect' | 'pass' | 'fail';
  };
  change_causes: Array<{
    day: number;
    cause: string;
    impact: string;
    error_change: number;
  }>;
}
