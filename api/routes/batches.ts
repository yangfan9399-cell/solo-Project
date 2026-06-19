import express, { type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB, prepare, exec, type Batch, type Reading, type Conflict, type Consultation, type BatchStatus } from '../db/init.js';
import { generateConflicts, recalculateBatchStatus, updateBatchFields } from '../services/conflictService.js';
import {
  submitConsultation,
  checkSupplementOldConflict,
  getSupplementConflictDetail,
  type ConsultationPayload,
} from '../services/consultationService.js';

const router = express.Router();

router.get('/batches', (req: Request, res: Response) => {
  const db = getDB();
  const { status, search } = req.query as { status?: string; search?: string };

  let query = 'SELECT * FROM batches WHERE 1=1';
  const params: unknown[] = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (batch_no LIKE ? OR plaque_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY updated_at DESC';

  const batches = prepare(db, query).all<Batch>(...params);
  res.json({ success: true, data: batches });
});

router.get('/batches/:id', (req: Request, res: Response) => {
  const db = getDB();
  const { id } = req.params;
  const batch = prepare(db, 'SELECT * FROM batches WHERE id = ?').get<Batch>(id);
  if (!batch) {
    res.status(404).json({ success: false, error: '批次不存在' });
    return;
  }
  const readings = prepare(db, 'SELECT * FROM readings WHERE batch_id = ? ORDER BY submitted_at').all<Reading>(id);
  const conflicts = prepare(db, 'SELECT * FROM conflicts WHERE batch_id = ? ORDER BY severity DESC').all<Conflict>(id);
  const consultations = prepare(db, 'SELECT * FROM consultations WHERE batch_id = ? ORDER BY created_at DESC').all<Consultation>(id);
  const supplementDetail = getSupplementConflictDetail(id);

  res.json({
    success: true,
    data: {
      batch,
      readings,
      conflicts,
      consultations,
      supplement_conflict: supplementDetail,
    },
  });
});

router.post('/batches', (req: Request, res: Response) => {
  const db = getDB();
  const { batch_no, plaque_name, old_transcription } = req.body as Partial<Batch>;

  if (!batch_no || !plaque_name) {
    res.status(400).json({ success: false, error: '批次编号和铭牌名称必填' });
    return;
  }

  const exists = prepare(db, 'SELECT id FROM batches WHERE batch_no = ?').get<{ id: string }>(batch_no);
  if (exists) {
    res.status(400).json({ success: false, error: '批次编号已存在' });
    return;
  }

  const id = `b-${Date.now()}`;
  const now = new Date().toISOString();
  prepare(db, `
    INSERT INTO batches (id, batch_no, plaque_name, status, conflict_count, old_transcription, created_at, updated_at)
    VALUES (?, ?, ?, 'missing_evidence', 0, ?, ?, ?)
  `).run(id, batch_no, plaque_name, old_transcription || null, now, now);

  res.json({ success: true, data: { id } });
});

router.post('/readings', (req: Request, res: Response) => {
  const db = getDB();
  const reading = req.body as Omit<Reading, 'id' | 'submitted_at'>;

  if (!reading.batch_id || !reading.observer) {
    res.status(400).json({ success: false, error: '批次ID和观察人必填' });
    return;
  }

  const batch = prepare(db, 'SELECT * FROM batches WHERE id = ?').get<Batch>(reading.batch_id);
  if (!batch) {
    res.status(404).json({ success: false, error: '批次不存在' });
    return;
  }

  const now = new Date().toISOString();

  let insertedId = '';
  let readingsCount = 0;

  const existing = prepare(db, 'SELECT id FROM readings WHERE batch_id = ? AND observer = ?').get<{ id: string }>(reading.batch_id, reading.observer);

  if (existing) {
    prepare(db, `
      UPDATE readings SET
        rubbing_clarity = ?, rust_level = ?, inscription_damage = ?,
        well_ring_direction = ?, rubbing_image = ?, transcription = ?,
        supplement_reading = ?, supplement_basis = ?, submitted_at = ?
      WHERE id = ?
    `).run(
      reading.rubbing_clarity,
      reading.rust_level,
      reading.inscription_damage,
      reading.well_ring_direction,
      reading.rubbing_image || null,
      reading.transcription,
      reading.supplement_reading || null,
      reading.supplement_basis || null,
      now,
      existing.id,
    );
    insertedId = existing.id;
  } else {
    insertedId = `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    prepare(db, `
      INSERT INTO readings (
        id, batch_id, observer, rubbing_clarity, rust_level, inscription_damage,
        well_ring_direction, rubbing_image, transcription, supplement_reading, supplement_basis, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      insertedId,
      reading.batch_id,
      reading.observer,
      reading.rubbing_clarity,
      reading.rust_level,
      reading.inscription_damage,
      reading.well_ring_direction,
      reading.rubbing_image || null,
      reading.transcription,
      reading.supplement_reading || null,
      reading.supplement_basis || null,
      now,
    );
  }

  const readings = prepare(db, 'SELECT * FROM readings WHERE batch_id = ? ORDER BY submitted_at').all<Reading>(reading.batch_id);
  readingsCount = readings.length;

  const observerFields: Partial<Record<'observer_a' | 'observer_b', string>> = {};
  if (readings[0]) observerFields.observer_a = readings[0].observer;
  if (readings[1]) observerFields.observer_b = readings[1].observer;
  updateBatchFields(reading.batch_id, observerFields);

  if (readings.length >= 2) {
    generateConflicts(reading.batch_id, readings[0], readings[1]);
  }

  const status = recalculateBatchStatus(reading.batch_id);
  const supplementCheck = checkSupplementOldConflict(reading.batch_id, {
    ...(reading as Reading),
    id: insertedId,
    submitted_at: now,
  });

  res.json({
    success: true,
    data: {
      id: insertedId,
      status,
      readings_count: readingsCount,
      supplement_conflict_with_old: supplementCheck.hasConflict,
      old_transcription: supplementCheck.oldTranscription,
    },
  });
});

router.post('/consultations', (req: Request, res: Response) => {
  try {
    const payload = req.body as ConsultationPayload;
    if (!payload.batch_id || !payload.consultant || !payload.decision) {
      res.status(400).json({ success: false, error: '批次ID、会诊人、决策类型必填' });
      return;
    }
    const result = submitConsultation(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: '会诊提交失败' });
  }
});

router.get('/consultations/batch/:batchId', (req: Request, res: Response) => {
  const db = getDB();
  const { batchId } = req.params;
  const consultations = prepare(db, 'SELECT * FROM consultations WHERE batch_id = ? ORDER BY created_at DESC').all<Consultation>(batchId);
  res.json({ success: true, data: consultations });
});

router.get('/stats', (_req: Request, res: Response) => {
  const db = getDB();
  const rows = prepare(db, "SELECT status, COUNT(*) as count FROM batches GROUP BY status").all<{ status: BatchStatus; count: number }>();

  const stats: Record<BatchStatus | 'total', number> = {
    consistent: 0,
    minor_deviation: 0,
    severe_conflict: 0,
    missing_evidence: 0,
    merged: 0,
    total: 0,
  };
  for (const r of rows) {
    stats[r.status] = r.count;
    stats.total += r.count;
  }
  res.json({ success: true, data: stats });
});

export default router;
