import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/server/db';

function execQuery(db: any, sql: string, params: any[] = []): any[] {
  const result = db.exec(sql, params);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  return result[0].values.map((values: any[]) => {
    const row: any = {};
    columns.forEach((col: string, idx: number) => {
      row[col] = values[idx];
    });
    return row;
  });
}

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const db = await getDb();
    
    const seedSamples = execQuery(db, `
      SELECT ss.*, 
             gs.phase as session_phase,
             gs.round_number as session_round,
             gs.total_score as total_score,
             gs.current_money as current_money,
             gs.total_score as session_score,
             gs.current_money as session_money
      FROM seed_samples ss
      LEFT JOIN game_sessions gs ON ss.session_id = gs.id
      ORDER BY ss.created_at
    `);
    
    const samplesWithDetails = seedSamples.map((sample: any) => {
      if (sample.session_id) {
        const mainRecords = execQuery(db, `
          SELECT mr.*, bb.name as blind_box_name, bb.total_actual_value
          FROM main_records mr
          INNER JOIN blind_boxes bb ON mr.blind_box_id = bb.id
          WHERE mr.session_id = ?
          ORDER BY mr.round_number
        `, [sample.session_id]);
        
        let feedbacks: any[] = [];
        if (mainRecords.length > 0) {
          const placeholders = mainRecords.map(() => '?').join(',');
          feedbacks = execQuery(db, `
            SELECT pf.*
            FROM pricing_feedback pf
            WHERE pf.main_record_id IN (${placeholders})
          `, mainRecords.map((m: any) => m.id));
        }
        
        const ledgerEntries = execQuery(db, `
          SELECT * FROM ledger_entries
          WHERE session_id = ?
          ORDER BY created_at
        `, [sample.session_id]);
        
        return {
          ...sample,
          totalScore: sample.total_score,
          currentMoney: sample.current_money,
          mainRecords,
          feedbacks,
          ledgerEntries,
        };
      }
      return sample;
    });
    
    json(200, {
      success: true,
      data: samplesWithDetails,
    });
  } catch (error) {
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get seed samples',
    });
  }
};
