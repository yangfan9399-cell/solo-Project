import { NextResponse } from 'next/server'
import pool, { initializeDatabase, pipeSections } from '@/lib/db'

export async function GET() {
  await initializeDatabase()
  const result = await pool.query('SELECT * FROM pipe_sections')
  if (result.rows.length === 0) {
    for (const ps of pipeSections) {
      await pool.query(
        'INSERT INTO pipe_sections (id, name, area, diameter, material, installation_year) VALUES ($1, $2, $3, $4, $5, $6)',
        [ps.id, ps.name, ps.area, ps.diameter, ps.material, ps.installation_year]
      )
    }
    return NextResponse.json(pipeSections)
  }
  return NextResponse.json(result.rows.map((row: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    id: row.id,
    name: row.name,
    area: row.area,
    diameter: row.diameter,
    material: row.material,
    installationYear: row.installation_year,
  })))
}
