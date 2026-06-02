import { query } from '../utils/database'
import type { User } from '../../types'

export default defineEventHandler(() => {
  const users = query<User>(`
    SELECT 
      id,
      username,
      name,
      role,
      department,
      created_at as createdAt
    FROM users
    ORDER BY id
  `)
  return { users }
})
