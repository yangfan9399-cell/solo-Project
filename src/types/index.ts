export type BatchStatus =
  | 'consistent'
  | 'minor_deviation'
  | 'severe_conflict'
  | 'missing_evidence'
  | 'merged';

export const STATUS_LABELS: Record<BatchStatus, string> = {
  consistent: '一致',
  minor_deviation: '轻微偏差',
  severe_conflict: '严重冲突',
  missing_evidence: '缺证',
  merged: '已合并',
};

export const STATUS_COLORS: Record<BatchStatus, { bg: string; text: string; border: string; bar: string }> = {
  consistent: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  minor_deviation: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' },
  severe_conflict: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', bar: 'bg-rose-500' },
  missing_evidence: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', bar: 'bg-slate-400' },
  merged: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', bar: 'bg-teal-500' },
};

export interface Batch {
  id: string;
  batch_no: string;
  plaque_name: string;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  observer_a?: string;
  observer_b?: string;
  conflict_count: number;
  old_transcription?: string;
}

export interface Reading {
  id: string;
  batch_id: string;
  observer: string;
  rubbing_clarity: string;
  rust_level: string;
  inscription_damage: string;
  well_ring_direction: string;
  rubbing_image?: string;
  transcription: string;
  supplement_reading?: string;
  supplement_basis?: string;
  submitted_at: string;
}

export const READING_FIELDS: { key: keyof Reading; label: string; type: 'enum' | 'text' }[] = [
  { key: 'rubbing_clarity', label: '拓片清晰度', type: 'enum' },
  { key: 'rust_level', label: '锈蚀级别', type: 'enum' },
  { key: 'inscription_damage', label: '铭文残缺', type: 'enum' },
  { key: 'well_ring_direction', label: '井圈方位', type: 'enum' },
  { key: 'transcription', label: '释文', type: 'text' },
  { key: 'supplement_reading', label: '残缺铭文补读', type: 'text' },
];

export const ENUM_OPTIONS: Record<string, string[]> = {
  rubbing_clarity: ['清晰', '较清晰', '模糊', '极模糊'],
  rust_level: ['无', '轻微', '中度', '重度'],
  inscription_damage: ['无', '局部', '严重', '全损'],
  well_ring_direction: ['东', '南', '西', '北', '东南', '东北', '西南', '西北'],
};

export interface Conflict {
  id: string;
  batch_id: string;
  field_name: string;
  value_a: string;
  value_b: string;
  conflict_type: 'normal' | 'supplement';
  severity: 'minor' | 'severe';
  resolution?: string;
  resolved_value?: string;
  resolved_at?: string;
  resolver?: string;
}

export interface Consultation {
  id: string;
  batch_id: string;
  consultant: string;
  decision: 'merge' | 'keep_divergent' | 'return_for_evidence';
  notes: string;
  decisions_json: string;
  created_at: string;
}

export const CONSULTATION_DECISION_LABELS: Record<Consultation['decision'], string> = {
  merge: '合并冲突',
  keep_divergent: '保留分歧',
  return_for_evidence: '退回补证',
};

export interface FieldDecision {
  decision: 'adopt_a' | 'adopt_b' | 'merge' | 'keep_divergent';
  custom_value?: string;
  reason?: string;
}

export interface ConsultationPayload {
  batch_id: string;
  consultant: string;
  decision: 'merge' | 'keep_divergent' | 'return_for_evidence';
  notes: string;
  field_decisions: Record<string, FieldDecision>;
  return_targets?: ('A' | 'B')[];
  return_reason?: string;
}

export interface BatchDetail {
  batch: Batch;
  readings: Reading[];
  conflicts: Conflict[];
  consultations: Consultation[];
  supplement_conflict: {
    oldTranscription?: string;
    supplementReadings: { observer: string; supplement: string; conflictsWithOld: boolean }[];
  };
}

export type Stats = Record<BatchStatus | 'total', number>;
