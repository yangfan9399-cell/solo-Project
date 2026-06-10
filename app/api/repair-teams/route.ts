import { NextResponse } from 'next/server'
import pool, { initializeDatabase, repairTeams } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const result = await pool.query('SELECT * FROM repair_teams')
  if (result.rows.length === 0) {
    for (const rt of repairTeams) {
      await pool.query(
        'INSERT INTO repair_teams (id, name, leader_name, leader_phone) VALUES ($1, $2, $3, $4)',
        [rt.id, rt.name, rt.leader_name, rt.leader_phone]
      )
    }
    return NextResponse.json(repairTeams)
  }
  return NextResponse.json(result.rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    name: row.name,
    leaderName: row.leader_name,
    leaderPhone: row.leader_phone,
  })))
}
