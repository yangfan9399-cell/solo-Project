export type PersonRole = "visitor" | "maintenance" | "nightwatch";

export type TimeSlot = "morning" | "afternoon" | "evening" | "night";

export type EventType =
  | "ASSIGN_OK"
  | "THEFT"
  | "LOCKED_IN"
  | "DUPLICATION_RISK"
  | "KEY_GROUP_OK"
  | "ROLLBACK"
  | "PUZZLE_SOLVED"
  | "TRACE_COMPLETE";

export interface Room {
  id: string;
  name: string;
  floor: number;
  zone: string;
  security_level: number;
  x: number;
  y: number;
  description: string;
}

export interface Key {
  id: string;
  label: string;
  room_ids: string[];
  allowed_slots: TimeSlot[];
  duplication_risk: number;
  color: string;
  ring_group_id: string | null;
}

export interface KeyRingGroup {
  id: string;
  name: string;
  key_ids: string[];
  description: string;
}

export interface Person {
  id: string;
  name: string;
  role: PersonRole;
  purpose: string;
  requested_room_ids: string[];
  preferred_slot: TimeSlot;
  trust_level: number;
  scheduled_minutes: number;
}

export interface GameSession {
  id: string;
  puzzle_level: number;
  status: "active" | "completed" | "failed";
  current_step: number;
  total_steps: number;
  created_at: string;
  completed_at: string | null;
  final_score: number | null;
  notes: string | null;
}

export interface AssignmentDetail {
  id: string;
  session_id: string;
  step_index: number;
  person_id: string;
  key_id: string;
  assigned_slot: TimeSlot;
  created_at: string;
}

export interface HistoryRecord {
  id: string;
  session_id: string;
  step_index: number;
  person_id: string;
  action: string;
  slot: TimeSlot;
  success: boolean;
  created_at: string;
}

export interface ResultRecord {
  id: string;
  session_id: string;
  key_id: string;
  rooms_covered: string[];
  allowed_slots_used: TimeSlot[];
  duplication_triggered: boolean;
  created_at: string;
}

export interface AccessLog {
  id: string;
  session_id: string;
  timestamp: string;
  room_id: string | null;
  person_id: string | null;
  key_id: string | null;
  event_type: EventType;
  message: string;
  before_state: string;
  after_state: string;
}

export interface LockState {
  room_id: string;
  is_locked: boolean;
  last_access: string | null;
  accessed_by: string | null;
}

export interface PuzzleLevel {
  id: number;
  name: string;
  description: string;
  scenario: string;
  people_ids: string[];
  expected_assignments: { person_id: string; key_id: string; slot: TimeSlot }[];
  trace_required: boolean;
}
