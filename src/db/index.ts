import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'gas_inspection',
  user: 'postgres',
  password: 'postgres',
})

export const db = drizzle(pool)
