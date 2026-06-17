import { getDb, getAll, getOne, run, saveDb } from '../connection';
import type { DeviationRecord, DeviationRecordWithPoints, DeviationPoint, FilterOptions, CorrectionTableEntry, VersionHistory } from '../../types';

export async function listRecords(filter: FilterOptions = {}): Promise<Array<DeviationRecord & { ship_name: string; ship_flag: string | null; ship_type: string | null; point_count: number; max_deviation: number }>> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filter.keyword) {
    conditions.push(`(s.name LIKE $kw OR s.imo_number LIKE $kw OR dr.batch_code LIKE $kw OR dr.location LIKE $kw OR dr.inspector_name LIKE $kw)`);
    params.$kw = `%${filter.keyword}%`;
  }
  if (filter.status) {
    conditions.push('dr.status = $status');
    params.$status = filter.status;
  }
  if (filter.shipType) {
    conditions.push('s.ship_type = $shipType');
    params.$shipType = filter.shipType;
  }
  if (filter.flag) {
    conditions.push('s.flag = $flag');
    params.$flag = filter.flag;
  }
  if (filter.dateFrom) {
    conditions.push('dr.record_date >= $dateFrom');
    params.$dateFrom = filter.dateFrom;
  }
  if (filter.dateTo) {
    conditions.push('dr.record_date <= $dateTo');
    params.$dateTo = filter.dateTo;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT dr.*, s.name as ship_name, s.flag as ship_flag, s.ship_type as ship_type,
      (SELECT COUNT(*) FROM deviation_points dp WHERE dp.record_id = dr.id) as point_count,
      COALESCE((SELECT MAX(dp.deviation) FROM deviation_points dp WHERE dp.record_id = dr.id), 0) as max_deviation
    FROM deviation_records dr
    JOIN ships s ON s.id = dr.ship_id
    ${where}
    ORDER BY dr.record_date DESC, dr.id DESC
  `;
  const rows = getAll<DeviationRecord & { ship_name: string; ship_flag: string | null; ship_type: string | null; point_count: number; max_deviation: number }>(db, sql, params);
  type RowType = typeof rows[0];
  if (filter.hasAnomaly) {
    return rows.filter((r: RowType) => r.max_deviation > 10 || r.point_count < 24);
  }
  return rows;
}

export async function getRecordById(id: number): Promise<DeviationRecord | undefined> {
  const db = await getDb();
  return getOne<DeviationRecord>(db, 'SELECT * FROM deviation_records WHERE id = $id', { $id: id });
}

export async function getRecordWithPoints(id: number): Promise<DeviationRecordWithPoints | undefined> {
  const record = await getRecordById(id);
  if (!record) return undefined;
  const points = await getDeviationPoints(id);
  return { ...record, points };
}

export async function getDeviationPoints(recordId: number): Promise<DeviationPoint[]> {
  const db = await getDb();
  return getAll<DeviationPoint>(db, 'SELECT * FROM deviation_points WHERE record_id = $rid ORDER BY ship_heading ASC', { $rid: recordId });
}

export async function getRecordsByShipId(shipId: number): Promise<DeviationRecord[]> {
  const db = await getDb();
  return getAll<DeviationRecord>(db, 'SELECT * FROM deviation_records WHERE ship_id = $sid ORDER BY record_date DESC, id DESC', { $sid: shipId });
}

export async function getCorrectionTable(recordId: number): Promise<CorrectionTableEntry[]> {
  const db = await getDb();
  return getAll<CorrectionTableEntry>(db, 'SELECT * FROM correction_tables WHERE record_id = $rid ORDER BY heading ASC', { $rid: recordId });
}

export async function getVersionHistory(recordId: number): Promise<VersionHistory[]> {
  const db = await getDb();
  return getAll<VersionHistory>(db, 'SELECT * FROM version_history WHERE record_id = $rid ORDER BY id DESC', { $rid: recordId });
}

export async function createRecord(
  data: Omit<DeviationRecord, 'id' | 'created_at' | 'updated_at'>,
  points: Omit<DeviationPoint, 'id' | 'record_id'>[],
  corrections: Omit<CorrectionTableEntry, 'id' | 'record_id'>[]
): Promise<number> {
  const db = await getDb();
  return (async function tx() {
    const r1 = run(db, `
      INSERT INTO deviation_records (ship_id, version, batch_code, record_date, location, latitude, longitude,
        magnetic_variation, variation_direction, weather_condition, sea_state, ship_speed, ship_draft, trim,
        corrector_fore_and_aft, corrector_athwartship, corrector_vertical, corrector_quadrantal, corrector_heeling,
        inspector_name, inspector_certificate, survey_company, status, notes)
      VALUES ($ship_id, $version, $batch_code, $record_date, $location, $latitude, $longitude,
        $magnetic_variation, $variation_direction, $weather_condition, $sea_state, $ship_speed, $ship_draft, $trim,
        $corrector_fore_and_aft, $corrector_athwartship, $corrector_vertical, $corrector_quadrantal, $corrector_heeling,
        $inspector_name, $inspector_certificate, $survey_company, $status, $notes)
    `, dollar(data));
    const recordId = r1.lastInsertRowid;

    for (const p of points) {
      run(db, `
        INSERT INTO deviation_points (record_id, ship_heading, magnetic_heading, true_heading,
          deviation, deviation_direction, measured, notes)
        VALUES ($record_id, $ship_heading, $magnetic_heading, $true_heading,
          $deviation, $deviation_direction, $measured, $notes)
      `, dollar({ ...p, record_id: recordId }));
    }

    for (const c of corrections) {
      run(db, `
        INSERT INTO correction_tables (record_id, heading, ship_heading_range, correction_value,
          correction_direction, apply_rule)
        VALUES ($record_id, $heading, $ship_heading_range, $correction_value,
          $correction_direction, $apply_rule)
      `, dollar({ ...c, record_id: recordId }));
    }

    run(db, `
      INSERT INTO version_history (record_id, version_number, action, changed_by, change_summary)
      VALUES ($record_id, $version_number, $action, $changed_by, $change_summary)
    `, dollar({
      record_id: recordId,
      version_number: data.version,
      action: 'create',
      changed_by: data.inspector_name || '系统',
      change_summary: '创建自差校正记录'
    }));

    saveDb();
    return recordId;
  })();
}

export async function updateRecordStatus(id: number, status: DeviationRecord['status'], changedBy: string, summary: string): Promise<void> {
  const db = await getDb();
  const old = await getRecordById(id);
  if (!old) return;
  const newVersion = old.version + 1;
  const actionMap: Record<DeviationRecord['status'], VersionHistory['action']> = {
    draft: 'restore', verified: 'verify', approved: 'approve', archived: 'archive'
  };
  const action = actionMap[status] || 'update';
  run(db, `UPDATE deviation_records SET status = $status, version = $version, updated_at = datetime('now') WHERE id = $id`, {
    $status: status, $version: newVersion, $id: id
  });
  run(db, `INSERT INTO version_history (record_id, version_number, action, changed_by, change_summary) VALUES ($record_id, $version_number, $action, $changed_by, $change_summary)`, {
    $record_id: id, $version_number: newVersion, $action: action, $changed_by: changedBy, $change_summary: summary
  });
  saveDb();
}

export async function updateRecord(
  id: number,
  recordData: Partial<Omit<DeviationRecord, 'id' | 'ship_id' | 'created_at' | 'updated_at' | 'version'>>,
  points?: Array<Omit<DeviationPoint, 'id' | 'record_id'>>,
  corrections?: Array<Omit<CorrectionTableEntry, 'id' | 'record_id'>>,
  changedBy: string = '系统',
  summary: string = '更新校正记录数据'
): Promise<void> {
  const db = await getDb();
  const old = await getRecordById(id);
  if (!old) return;
  const newVersion = old.version + 1;

  const fields = Object.keys(recordData).filter(k => !['id', 'ship_id', 'created_at', 'updated_at', 'version'].includes(k));
  if (fields.length > 0) {
    const sets = fields.map(f => `${f} = $${f}`).join(', ');
    run(db, `UPDATE deviation_records SET ${sets}, version = $version, updated_at = datetime('now') WHERE id = $id`, {
      ...dollar(recordData),
      $version: newVersion,
      $id: id
    });
  } else {
    run(db, `UPDATE deviation_records SET version = $version, updated_at = datetime('now') WHERE id = $id`, {
      $version: newVersion,
      $id: id
    });
  }

  if (points) {
    run(db, 'DELETE FROM deviation_points WHERE record_id = $rid', { $rid: id });
    for (const p of points) {
      run(db, `
        INSERT INTO deviation_points (record_id, ship_heading, magnetic_heading, true_heading,
          deviation, deviation_direction, measured, notes)
        VALUES ($record_id, $ship_heading, $magnetic_heading, $true_heading,
          $deviation, $deviation_direction, $measured, $notes)
      `, dollar({ ...p, record_id: id }));
    }
  }

  if (corrections) {
    run(db, 'DELETE FROM correction_tables WHERE record_id = $rid', { $rid: id });
    for (const c of corrections) {
      run(db, `
        INSERT INTO correction_tables (record_id, heading, ship_heading_range, correction_value,
          correction_direction, apply_rule)
        VALUES ($record_id, $heading, $ship_heading_range, $correction_value,
          $correction_direction, $apply_rule)
      `, dollar({ ...c, record_id: id }));
    }
  }

  run(db, `INSERT INTO version_history (record_id, version_number, action, changed_by, change_summary) VALUES ($record_id, $version_number, $action, $changed_by, $change_summary)`, {
    $record_id: id, $version_number: newVersion, $action: 'update', $changed_by: changedBy, $change_summary: summary
  });

  saveDb();
}

export async function countRecords(status?: DeviationRecord['status']): Promise<number> {
  const db = await getDb();
  let sql = 'SELECT COUNT(*) as cnt FROM deviation_records';
  const params: Record<string, unknown> = {};
  if (status) {
    sql += ' WHERE status = $status';
    params.$status = status;
  }
  const row = getOne<{ cnt: number }>(db, sql, params);
  return row?.cnt || 0;
}

export async function countAbnormalRecords(): Promise<number> {
  const db = await getDb();
  type Row = { id: number; md: number; pc: number };
  const rows = getAll<Row>(db, `
    SELECT dr.id,
      COALESCE(MAX(dp.deviation), 0) as md,
      COUNT(dp.id) as pc
    FROM deviation_records dr
    LEFT JOIN deviation_points dp ON dp.record_id = dr.id
    GROUP BY dr.id
  `);
  return rows.filter(r => r.md > 10 || r.pc < 24).length;
}

export async function getLastUpdateDate(): Promise<string> {
  const db = await getDb();
  const row = getOne<{ dt: string | null }>(db, "SELECT MAX(updated_at) as dt FROM deviation_records");
  return row?.dt || new Date().toISOString();
}

export async function getUniqueFlags(): Promise<string[]> {
  const db = await getDb();
  type Row = { flag: string };
  const rows = getAll<Row>(db, "SELECT DISTINCT flag FROM ships WHERE flag IS NOT NULL ORDER BY flag");
  return rows.map(r => r.flag);
}

export async function getUniqueShipTypes(): Promise<string[]> {
  const db = await getDb();
  type Row = { ship_type: string };
  const rows = getAll<Row>(db, "SELECT DISTINCT ship_type FROM ships WHERE ship_type IS NOT NULL ORDER BY ship_type");
  return rows.map(r => r.ship_type);
}

function dollar(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!k.startsWith('$')) out['$' + k] = v;
    else out[k] = v;
  }
  return out;
}
