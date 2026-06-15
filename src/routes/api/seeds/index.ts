import type { RequestHandler } from '@builder.io/qwik-city';
import { getDb } from '~/server/db';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const db = getDb();
    
    const seedSamples = db.prepare(`
      SELECT ss.*, 
             gs.phase as session_phase,
             gs.round_number as session_round,
             gs.total_score as session_score,
             gs.current_money as session_money
      FROM seed_samples ss
      LEFT JOIN game_sessions gs ON ss.session_id = gs.id
      ORDER BY ss.created_at
    `).all() as any[];
    
    const samplesWithDetails = seedSamples.map(sample => {
      if (sample.session_id) {
        const mainRecords = db.prepare(`
          SELECT mr.*, bb.name as blind_box_name, bb.total_actual_value
          FROM main_records mr
          INNER JOIN blind_boxes bb ON mr.blind_box_id = bb.id
          WHERE mr.session_id = ?
          ORDER BY mr.round_number
        `).all(sample.session_id) as any[];
        
        const feedbacks = mainRecords.length > 0 ? db.prepare(`
          SELECT pf.*
          FROM pricing_feedback pf
          WHERE pf.main_record_id IN (${mainRecords.map(() => '?').join(',')})
        `).all(...mainRecords.map(m => m.id)) as any[] : [];
        
        return {
          ...sample,
          mainRecords,
          feedbacks,
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
