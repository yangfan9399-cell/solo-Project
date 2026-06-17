import { getDb, getAll, getOne, run } from '../connection';
import type { Ship } from '../../types';

export async function getAllShips(): Promise<Ship[]> {
  const db = await getDb();
  return getAll<Ship>(db, 'SELECT * FROM ships ORDER BY name ASC');
}

export async function getShipById(id: number): Promise<Ship | undefined> {
  const db = await getDb();
  return getOne<Ship>(db, 'SELECT * FROM ships WHERE id = $id', { $id: id });
}

export async function createShip(data: Omit<Ship, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const db = await getDb();
  const info = run(db, `
    INSERT INTO ships (name, imo_number, call_sign, flag, ship_type, gross_tonnage, built_year,
      compass_type, compass_model, compass_install_date, home_port, notes)
    VALUES ($name, $imo_number, $call_sign, $flag, $ship_type, $gross_tonnage, $built_year,
      $compass_type, $compass_model, $compass_install_date, $home_port, $notes)
  `, toDollarParams(data));
  return info.lastInsertRowid;
}

export async function updateShip(id: number, data: Partial<Ship>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(data).filter(k => !['id', 'created_at'].includes(k));
  const sets = fields.map(f => `${f} = $${f}`).join(', ');
  run(db, `UPDATE ships SET ${sets}, updated_at = datetime('now') WHERE id = $id`, { ...toDollarParams(data), $id: id });
}

export async function deleteShip(id: number): Promise<void> {
  const db = await getDb();
  run(db, 'DELETE FROM ships WHERE id = $id', { $id: id });
}

export async function countShips(): Promise<number> {
  const db = await getDb();
  const row = getOne<{ cnt: number }>(db, 'SELECT COUNT(*) as cnt FROM ships');
  return row?.cnt || 0;
}

function toDollarParams(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out['$' + k] = v;
  }
  return out;
}
