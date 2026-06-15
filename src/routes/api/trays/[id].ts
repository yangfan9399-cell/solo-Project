import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  const db = await getDb();
  const trayId = params.id;
  
  const slots = db.prepare(`
    SELECT * FROM tray_slots 
    WHERE tray_id = ? 
    ORDER BY row, col
  `).all(trayId);

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal,
      SUM(CASE WHEN status = 'missing' THEN 1 ELSE 0 END) as missing,
      SUM(CASE WHEN status = 'worn' THEN 1 ELSE 0 END) as worn,
      SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
      AVG(wear_level) as avg_wear
    FROM tray_slots
    WHERE tray_id = ?
  `).get(trayId);

  return { tray_id: trayId, slots, stats };
}

export async function PUT({ params, request }: APIEvent) {
  const db = await getDb();
  const trayId = params.id;
  
  return { ok: true, tray_id: trayId };
}
