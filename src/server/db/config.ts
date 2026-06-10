import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

const client = new Client({
  connectionString: 'postgres://postgres:password@localhost:5432/asset_inventory',
})

await client.connect()

export const db = drizzle(client)