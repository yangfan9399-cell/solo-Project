import { execute, queryOne } from '../../utils/database'
import type { Feedback } from '../../../types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const required = ['reporterId', 'reporterName', 'type', 'title', 'description']
  for (const field of required) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        message: `${field} 为必填项`
      })
    }
  }

  const result = execute(`
    INSERT INTO feedbacks (
      tool_id, tool_code, reporter_id, reporter_name,
      type, title, description, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
  `, [
    body.toolId || null,
    body.toolCode || '',
    body.reporterId,
    body.reporterName,
    body.type,
    body.title,
    body.description
  ])

  const record = queryOne<Feedback>(`
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
    WHERE id = ?
  `, [result.lastInsertRowid])

  return { record }
})
