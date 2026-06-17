import { initDb } from '../utils/db'
import { seedData } from '../utils/seed'

export default defineNitroPlugin(async () => {
  await initDb()
  await seedData()
})
