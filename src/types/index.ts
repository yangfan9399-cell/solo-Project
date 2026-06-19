export interface Anomaly {
  id: string
  sensor_code: string
  tower_position: string
  pre_calibration: number
  post_calibration: number
  deviation: number
  threshold: number
  handler: string
  review_opinion: string | null
  status: 'normal' | 'retest_needed' | 'threshold_exceeded' | 'review_missing' | 'closed'
  closed_reason: string | null
  closed_type: 'fixed' | 'false_alarm' | 'duplicate' | 'other' | null
  created_at: string
  updated_at: string
}

export interface RetestRecord {
  id: string
  anomaly_id: string
  pre_calibration: number
  post_calibration: number
  deviation: number
  retester: string
  created_at: string
}

export interface ThresholdRule {
  id: string
  name: string
  min_value: number
  max_value: number
  threshold: number
  version: number
  is_active: number
  created_at: string
}

export interface StatusTransition {
  id: string
  anomaly_id: string
  from_status: string
  to_status: string
  operator: string
  comment: string | null
  created_at: string
}

export interface CloseAudit {
  id: string
  anomaly_id: string
  closed_type: string
  reason: string
  operator: string
  created_at: string
}

export type AnomalyStatus = Anomaly['status']
export type ClosedType = NonNullable<Anomaly['closed_type']>
