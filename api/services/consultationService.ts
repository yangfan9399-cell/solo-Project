import { v4 as uuidv4 } from 'uuid';
import { getDB, prepare, type BatchStatus, type Reading, type Conflict } from '../db/init.js';
import {
  recalculateBatchStatus,
  updateBatchFields,
  isSupplementConflictsWithOld,
} from './conflictService.js';

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

export function submitConsultation(payload: ConsultationPayload) {
  const db = getDB();
  const now = new Date().toISOString();

  const consultationId = `con-${Date.now()}`;
  const insertConsult = prepare(db, `
    INSERT INTO consultations (id, batch_id, consultant, decision, notes, decisions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertConsult.run(
    consultationId,
    payload.batch_id,
    payload.consultant,
    payload.decision,
    payload.notes || '',
    JSON.stringify(payload.field_decisions || {}),
    now,
  );

  if (payload.decision === 'merge') {
    applyMergeDecision(payload.batch_id, payload.field_decisions, payload.consultant, now);
    updateBatchFields(payload.batch_id, { status: 'merged' as BatchStatus });
  } else if (payload.decision === 'keep_divergent') {
    applyKeepDivergent(payload.batch_id, payload.field_decisions, payload.consultant, now);
    recalculateBatchStatus(payload.batch_id);
  } else if (payload.decision === 'return_for_evidence') {
    updateBatchFields(payload.batch_id, { status: 'missing_evidence' as BatchStatus });
  }

  const finalStatus = recalculateBatchStatus(payload.batch_id);
  return { consultationId, finalStatus };
}

function applyMergeDecision(
  batchId: string,
  fieldDecisions: Record<string, FieldDecision>,
  consultant: string,
  now: string,
) {
  const db = getDB();
  const conflicts = prepare(db, 'SELECT * FROM conflicts WHERE batch_id = ?').all<Conflict>(batchId);
  const updateConflict = prepare(db, `
    UPDATE conflicts
    SET resolution = ?, resolved_value = ?, resolved_at = ?, resolver = ?
    WHERE id = ?
  `);

  for (const conflict of conflicts) {
    const fd = fieldDecisions[conflict.field_name];
    let resolution: string = fd?.decision || 'merge';
    let resolvedValue: string;

    if (fd?.decision === 'adopt_a') {
      resolvedValue = conflict.value_a;
    } else if (fd?.decision === 'adopt_b') {
      resolvedValue = conflict.value_b;
    } else if (fd?.decision === 'keep_divergent') {
      resolution = 'keep_divergent';
      resolvedValue = '';
    } else {
      resolvedValue = fd?.custom_value || conflict.value_a || conflict.value_b;
    }

    updateConflict.run(resolution, resolvedValue, now, consultant, conflict.id);
  }
}

function applyKeepDivergent(
  batchId: string,
  fieldDecisions: Record<string, FieldDecision>,
  consultant: string,
  now: string,
) {
  const db = getDB();
  const conflicts = prepare(db, 'SELECT * FROM conflicts WHERE batch_id = ?').all<Conflict>(batchId);
  const updateConflict = prepare(db, `
    UPDATE conflicts
    SET resolution = ?, resolved_value = ?, resolved_at = ?, resolver = ?
    WHERE id = ?
  `);

  for (const conflict of conflicts) {
    const fd = fieldDecisions[conflict.field_name];
    if (fd && (fd.decision === 'adopt_a' || fd.decision === 'adopt_b')) {
      const resolvedValue = fd.decision === 'adopt_a' ? conflict.value_a : conflict.value_b;
      updateConflict.run(fd.decision, resolvedValue, now, consultant, conflict.id);
    }
  }
}

export function checkSupplementOldConflict(batchId: string, reading: Reading): { hasConflict: boolean; oldTranscription?: string } {
  const db = getDB();
  const batch = prepare(db, 'SELECT old_transcription FROM batches WHERE id = ?').get<{ old_transcription?: string }>(batchId);
  const oldTranscription = batch?.old_transcription;
  const hasConflict = isSupplementConflictsWithOld(reading.supplement_reading, oldTranscription);
  return { hasConflict, oldTranscription };
}

export function getSupplementConflictDetail(batchId: string) {
  const db = getDB();
  const batch = prepare(db, 'SELECT old_transcription FROM batches WHERE id = ?').get<{ old_transcription?: string }>(batchId);
  const readings = prepare(db, 'SELECT * FROM readings WHERE batch_id = ?').all<Reading>(batchId);

  const result: { observer: string; supplement: string; conflictsWithOld: boolean }[] = [];
  for (const r of readings) {
    if (r.supplement_reading) {
      result.push({
        observer: r.observer,
        supplement: r.supplement_reading,
        conflictsWithOld: isSupplementConflictsWithOld(r.supplement_reading, batch?.old_transcription),
      });
    }
  }

  return {
    oldTranscription: batch?.old_transcription,
    supplementReadings: result,
  };
}
