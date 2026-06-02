import { getDatabase } from '../utils/database'

export default defineNitroPlugin(() => {
  try {
    getDatabase()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
})
