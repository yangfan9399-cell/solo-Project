import { query } from '../../utils/database'
import type { Feedback } from '../../../types'

export default defineEventHandler((event) => {
  const queryParams = getQuery(event)
  const status = queryParams.status as string

  let sql = `
    SELECT 
      id,
      tool_id as toolId,
      tool_code as toolCode,
      reporter_id as reporterId,
      reporter_name as reporterName,
      type,
      title,
      description,
      status,
      handler_id as handlerId,
      handler_name as handlerName,
      handle_result as handleResult,
      handled_at as handledAt,
      created_at as createdAt,
      updated_at as updatedAt
    FROM feedbacks
    WHERE 1=1
  `
  const params: string[] = []

  if (status && status !== 'all') {
    sql += ' AND status = ?'
    params.push(status)
  }

  sql += ' ORDER BY id DESC'

  const records = query<Feedback>(sql, params)
  return { records }
})
