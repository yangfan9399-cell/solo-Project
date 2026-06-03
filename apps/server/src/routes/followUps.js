import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const allowedFields = ['id', 'adverse_reaction_id', 'revisit_reminder_id', 'pet_id', 'call_type', 'call_date', 'caller_id', 'call_result', 'response_details', 'follow_up_action', 'next_call_date', 'notes', 'created_at']
const allowedFilters = ['adverse_reaction_id', 'revisit_reminder_id', 'pet_id', 'call_type', 'caller_id', 'call_result', 'call_date_gte', 'call_date_lte']
const allowedSorts = ['id', 'pet_id', 'call_date', 'call_type', 'call_result', 'created_at']

const followUpSchema = z.object({
  adverse_reaction_id: z.number().int().positive().optional().nullable(),
  revisit_reminder_id: z.number().int().positive().optional().nullable(),
  pet_id: z.number().int().positive(),
  call_type: z.enum(['adverse_reaction', 'revisit_reminder', 'general']),
  call_date: z.string().min(1),
  caller_id: z.number().int().positive().optional().nullable(),
  call_result: z.string().min(1).max(50),
  response_details: z.string().max(1000).optional().nullable(),
  follow_up_action: z.string().max(500).optional().nullable(),
  next_call_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
})

const updateSchema = followUpSchema.partial()

const querySchema = z.object({
  fields: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  adverse_reaction_id: z.coerce.number().int().positive().optional(),
  revisit_reminder_id: z.coerce.number().int().positive().optional(),
  pet_id: z.coerce.number().int().positive().optional(),
  call_type: z.string().optional(),
  caller_id: z.coerce.number().int().positive().optional(),
  call_result: z.string().optional(),
  call_date_gte: z.string().optional(),
  call_date_lte: z.string().optional()
})

export default async function (fastify, options) {
  fastify.get('/', {
    schema: {
      querystring: querySchema
    }
  }, async (request, reply) => {
    const query = querySchema.parse(request.query)
    const fields = parseFields(query.fields, allowedFields) || allowedFields
    const { conditions, values } = buildWhereClause(query, allowedFilters)
    const orderBy = buildOrderBy(query.sort, allowedSorts)

    let sql = `SELECT ${fields.join(', ')} FROM follow_up_calls`
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ` ORDER BY ${orderBy}`
    sql = paginate(sql, query.page, query.pageSize)

    const countSql = `SELECT COUNT(*) as total FROM follow_up_calls${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`

    const params = { ...values, '@limit': query.pageSize, '@offset': (query.page - 1) * query.pageSize }
    const items = await db.all(sql, params)
    const { total } = await db.get(countSql, values)

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize)
      }
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const item = await db.get('SELECT * FROM follow_up_calls WHERE id = @id', { '@id': id })
    if (!item) {
      reply.code(404)
      return { error: { message: 'Follow-up call not found', code: 'NOT_FOUND' } }
    }
    return item
  })

  fastify.post('/', {
    schema: {
      body: followUpSchema
    }
  }, async (request, reply) => {
    const data = followUpSchema.parse(request.body)
    const insertSql = `
      INSERT INTO follow_up_calls (adverse_reaction_id, revisit_reminder_id, pet_id, call_type, call_date, caller_id, call_result, response_details, follow_up_action, next_call_date, notes)
      VALUES (@adverse_reaction_id, @revisit_reminder_id, @pet_id, @call_type, @call_date, @caller_id, @call_result, @response_details, @follow_up_action, @next_call_date, @notes)
    `
    const params = Object.fromEntries(Object.entries(data).map(([k, v]) => [`@${k}`, v]))
    const result = await db.run(insertSql, params)
    const item = await db.get('SELECT * FROM follow_up_calls WHERE id = @id', { '@id': result.lastID })
    reply.code(201)
    return item
  })

  fastify.put('/:id', {
    schema: {
      body: updateSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM follow_up_calls WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Follow-up call not found', code: 'NOT_FOUND' } }
    }
    const data = updateSchema.parse(request.body)
    const updateSql = `
      UPDATE follow_up_calls SET
        adverse_reaction_id = COALESCE(@adverse_reaction_id, adverse_reaction_id),
        revisit_reminder_id = COALESCE(@revisit_reminder_id, revisit_reminder_id),
        pet_id = COALESCE(@pet_id, pet_id),
        call_type = COALESCE(@call_type, call_type),
        call_date = COALESCE(@call_date, call_date),
        caller_id = COALESCE(@caller_id, caller_id),
        call_result = COALESCE(@call_result, call_result),
        response_details = COALESCE(@response_details, response_details),
        follow_up_action = COALESCE(@follow_up_action, follow_up_action),
        next_call_date = COALESCE(@next_call_date, next_call_date),
        notes = COALESCE(@notes, notes)
      WHERE id = @id
    `
    const params = Object.fromEntries(Object.entries({ ...data, id }).map(([k, v]) => [`@${k}`, v]))
    await db.run(updateSql, params)
    return await db.get('SELECT * FROM follow_up_calls WHERE id = @id', { '@id': id })
  })

  fastify.delete('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM follow_up_calls WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Follow-up call not found', code: 'NOT_FOUND' } }
    }
    await db.run('DELETE FROM follow_up_calls WHERE id = @id', { '@id': id })
    reply.code(204)
    return null
  })
}
