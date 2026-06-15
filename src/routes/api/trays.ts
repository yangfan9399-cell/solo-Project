import { getDb } from "~/lib/db";

export async function GET() {
  const db = await getDb();
  
  const trays = db.prepare(`
    SELECT 
      tray_id,
      COUNT(*) as total_slots,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal_count,
      SUM(CASE WHEN status = 'missing' THEN 1 ELSE 0 END) as missing_count,
      SUM(CASE WHEN status = 'worn' THEN 1 ELSE 0 END) as worn_count,
      SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_count,
      MIN(created_at) as created_at
    FROM tray_slots
    GROUP BY tray_id
    ORDER BY tray_id
  `).all();

  return trays;
}
