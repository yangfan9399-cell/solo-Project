import { v4 as uuidv4 } from 'uuid';
import { getDB, prepare, exec, type Reading, type Conflict, type BatchStatus } from '../db/init.js';

export const COMPARABLE_FIELDS: { key: keyof Reading; label: string; type: 'enum' | 'text' }[] = [
  { key: 'rubbing_clarity', label: '拓片清晰度', type: 'enum' },
  { key: 'rust_level', label: '锈蚀级别', type: 'enum' },
  { key: 'inscription_damage', label: '铭文残缺', type: 'enum' },
  { key: 'well_ring_direction', label: '井圈方位', type: 'enum' },
  { key: 'transcription', label: '释文', type: 'text' },
  { key: 'supplement_reading', label: '残缺铭文补读', type: 'text' },
];

export const ENUM_SEVERITY: Record<string, Record<string, number>> = {
  rubbing_clarity: { 清晰: 4, 较清晰: 3, 模糊: 2, 极模糊: 1 },
  rust_level: { 无: 4, 轻微: 3, 中度: 2, 重度: 1 },
  inscription_damage: { 无: 4, 局部: 3, 严重: 2, 全损: 1 },
};

export function levenshteinDistance(a: string, b: string): number {
  if (!a || !b) return (a?.length || 0) + (b?.length || 0);
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function isSupplementConflictsWithOld(
  supplement: string | undefined,
  oldTranscription: string | undefined,
): boolean {
  if (!supplement || !oldTranscription) return false;
  const cleanSupp = supplement.replace(/[「」『』补缺原碑所缺年号等\s]/g, '');
  if (!cleanSupp) return false;
  const distance = levenshteinDistance(cleanSupp, oldTranscription);
  const maxLen = Math.max(cleanSupp.length, oldTranscription.length);
  const ratio = distance / maxLen;
  return ratio > 0.4;
}

export function determineSeverity(
  field: keyof Reading,
  valueA: string,
  valueB: string,
): 'minor' | 'severe' {
  if (field === 'transcription' || field === 'supplement_reading') {
    const distance = levenshteinDistance(valueA || '', valueB || '');
    const maxLen = Math.max(valueA?.length || 0, valueB?.length || 0, 1);
    const ratio = distance / maxLen;
    return ratio > 0.3 ? 'severe' : 'minor';
  }
  if (field === 'well_ring_direction') {
    const directions = ['东', '南', '西', '北', '东南', '东北', '西南', '西北'];
    const idxA = directions.indexOf(valueA);
    const idxB = directions.indexOf(valueB);
    if (idxA === -1 || idxB === -1) return 'minor';
    const diff = Math.abs(idxA - idxB);
    return diff > 2 ? 'severe' : 'minor';
  }
  if (ENUM_SEVERITY[field as string]) {
    const a = ENUM_SEVERITY[field as string][valueA] ?? 0;
    const b = ENUM_SEVERITY[field as string][valueB] ?? 0;
    return Math.abs(a - b) >= 2 ? 'severe' : 'minor';
  }
  return 'minor';
}

export function generateConflicts(batchId: string, readingA: Reading, readingB: Reading): Conflict[] {
  const db = getDB();
  prepare(db, 'DELETE FROM conflicts WHERE batch_id = ? AND resolution IS NULL').run(batchId);

  const conflicts: Conflict[] = [];
  const insertStmt = prepare(db, `
    INSERT INTO conflicts (id, batch_id, field_name, value_a, value_b, conflict_type, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const field of COMPARABLE_FIELDS) {
    const valA = readingA[field.key] as string | undefined;
    const valB = readingB[field.key] as string | undefined;

    if (field.type === 'text') {
      if ((valA?.trim() || '') === (valB?.trim() || '')) continue;
      if (!valA && !valB) continue;
    } else {
      if (valA === valB) continue;
    }

    const isSupplement = field.key === 'supplement_reading';
    const severity = determineSeverity(field.key, valA || '', valB || '');

    const conflict: Conflict = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      batch_id: batchId,
      field_name: field.key as string,
      value_a: valA || '',
      value_b: valB || '',
      conflict_type: isSupplement ? 'supplement' : 'normal',
      severity,
    };
    conflicts.push(conflict);
    insertStmt.run(
      conflict.id,
      conflict.batch_id,
      conflict.field_name,
      conflict.value_a,
      conflict.value_b,
      conflict.conflict_type,
      conflict.severity,
    );
  }

  return conflicts;
}

export function recalculateBatchStatus(batchId: string): BatchStatus {
  const db = getDB();
  const readings = prepare(db, 'SELECT * FROM readings WHERE batch_id = ?').all<Reading>(batchId);

  if (readings.length < 2) {
    updateBatchFields(batchId, { status: 'missing_evidence' as BatchStatus, conflict_count: 0 });
    return 'missing_evidence';
  }

  const unresolvedConflicts = prepare(
    db,
    'SELECT * FROM conflicts WHERE batch_id = ? AND resolution IS NULL',
  ).all<Conflict>(batchId);

  const conflictCount = unresolvedConflicts.length;
  let status: BatchStatus;

  if (conflictCount === 0) {
    status = 'consistent';
  } else {
    const hasSevere = unresolvedConflicts.some((c) => c.severity === 'severe');
    status = hasSevere ? 'severe_conflict' : 'minor_deviation';
  }

  updateBatchFields(batchId, { status, conflict_count: conflictCount });
  return status;
}

export function updateBatchFields(
  batchId: string,
  fields: Partial<{ status: BatchStatus; conflict_count: number; observer_a: string; observer_b: string; updated_at: string }>,
): void {
  const db = getDB();
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  prepare(db, `UPDATE batches SET ${sets}, updated_at = ? WHERE id = ?`).run(
    ...values,
    new Date().toISOString(),
    batchId,
  );
}
