import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const allowedFields = ['id', 'pet_id', 'vaccination_record_id', 'reminder_date', 'reminder_type', 'status', 'sent_at', 'sent_by', 'response', 'notes', 'created_at', 'updated_at']
const allowedFilters = ['pet_id', 'vaccination_record_id', 'reminder_type', 'status', 'sent_by', 'reminder_date_gte', 'reminder_date_lte']
const allowedSorts = ['id', 'pet_id', 'reminder_date', 'reminder_type', 'status', 'created_at']

const reminderSchema = z.object({
  pet_id: z.number().int().positive(),
  vaccination_record_id: z.number().int().positive().optional().nullable(),
  reminder_date: z.string().min(1),
  reminder_type: z.enum(['booster', 'recheck', 'annual']),
  status: z.enum(['pending', 'sent', 'completed', 'cancelled']).default('pending'),
  sent_at: z.string().optional().nullable(),
  sent_by: z.number().int().positive().optional().nullable(),
  response: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
})

const updateSchema = reminderSchema.partial()

const sendSchema = z.object({
  sent_by: z.number().int().positive(),
  notes: z.string().max(1000).optional().nullable()
})

const completeSchema = z.object({
  response: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
})

const querySchema = z.object({
  fields: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  pet_id: z.coerce.number().int().positive().optional(),
  vaccination_record_id: z.coerce.number().int().positive().optional(),
  reminder_type: z.string().optional(),
  status: z.string().optional(),
  sent_by: z.coerce.number().int().positive().optional(),
  reminder_date_gte: z.string().optional(),
  reminder_date_lte: z.string().optional()
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

    let sql = `SELECT ${fields.join(', ')} FROM revisit_reminders`
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ` ORDER BY ${orderBy}`
    sql = paginate(sql, query.page, query.pageSize)

    const countSql = `SELECT COUNT(*) as total FROM revisit_reminders${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`

    const paginationValues = {
      ...values,
      '@limit': query.pageSize,
      '@offset': (query.page - 1) * query.pageSize
    }

    const items = await db.all(sql, paginationValues)
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

  fastify.get('/pending', async (request, reply) => {
    const today = new Date().toISOString().slice(0, 10)
    const sql = `
      SELECT r.*, p.name as pet_name, o.name as owner_name, o.phone as owner_phone
      FROM revisit_reminders r
      LEFT JOIN pets p ON r.pet_id = p.id
      LEFT JOIN owners o ON p.owner_id = o.id
      WHERE r.status = 'pending' AND r.reminder_date <= @today
      ORDER BY r.reminder_date ASC
    `
    const items = await db.all(sql, { '@today': today })
    return { items }
  })

  fastify.get('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const item = await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
    if (!item) {
      reply.code(404)
      return { error: { message: 'Reminder not found', code: 'NOT_FOUND' } }
    }
    return item
  })

  fastify.post('/', {
    schema: {
      body: reminderSchema
    }
  }, async (request, reply) => {
    const data = reminderSchema.parse(request.body)
    const sql = `
      INSERT INTO revisit_reminders (pet_id, vaccination_record_id, reminder_date, reminder_type, status, sent_at, sent_by, response, notes)
      VALUES (@pet_id, @vaccination_record_id, @reminder_date, @reminder_type, @status, @sent_at, @sent_by, @response, @notes)
    `
    const params = {
      '@pet_id': data.pet_id,
      '@vaccination_record_id': data.vaccination_record_id,
      '@reminder_date': data.reminder_date,
      '@reminder_type': data.reminder_type,
      '@status': data.status,
      '@sent_at': data.sent_at,
      '@sent_by': data.sent_by,
      '@response': data.response,
      '@notes': data.notes
    }
    const result = await db.run(sql, params)
    const item = await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': result.lastID })
    reply.code(201)
    return item
  })

  fastify.post('/:id/send', {
    schema: {
      body: sendSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Reminder not found', code: 'NOT_FOUND' } }
    }
    if (existing.status !== 'pending') {
      reply.code(400)
      return { error: { message: 'Only pending reminders can be sent', code: 'INVALID_STATUS' } }
    }
    const data = sendSchema.parse(request.body)
    const now = new Date().toISOString()
    const sql = `
      UPDATE revisit_reminders SET
        status = 'sent',
        sent_at = @sent_at,
        sent_by = @sent_by,
        notes = COALESCE(@notes, notes),
        updated_at = @updated_at
      WHERE id = @id
    `
    const params = {
      '@id': id,
      '@sent_at': now,
      '@sent_by': data.sent_by,
      '@notes': data.notes || null,
      '@updated_at': now
    }
    await db.run(sql, params)
    return await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
  })

  fastify.post('/:id/complete', {
    schema: {
      body: completeSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Reminder not found', code: 'NOT_FOUND' } }
    }
    if (existing.status === 'completed' || existing.status === 'cancelled') {
      reply.code(400)
      return { error: { message: 'Reminder is already completed or cancelled', code: 'INVALID_STATUS' } }
    }
    const data = completeSchema.parse(request.body)
    const now = new Date().toISOString()
    const sql = `
      UPDATE revisit_reminders SET
        status = 'completed',
        response = COALESCE(@response, response),
        notes = COALESCE(@notes, notes),
        updated_at = @updated_at
      WHERE id = @id
    `
    const params = {
      '@id': id,
      '@response': data.response || null,
      '@notes': data.notes || null,
      '@updated_at': now
    }
    await db.run(sql, params)
    return await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
  })

  fastify.put('/:id', {
    schema: {
      body: updateSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Reminder not found', code: 'NOT_FOUND' } }
    }
    const data = updateSchema.parse(request.body)
    const sql = `
      UPDATE revisit_reminders SET
        pet_id = COALESCE(@pet_id, pet_id),
        vaccination_record_id = COALESCE(@vaccination_record_id, vaccination_record_id),
        reminder_date = COALESCE(@reminder_date, reminder_date),
        reminder_type = COALESCE(@reminder_type, reminder_type),
        status = COALESCE(@status, status),
        sent_at = COALESCE(@sent_at, sent_at),
        sent_by = COALESCE(@sent_by, sent_by),
        response = COALESCE(@response, response),
        notes = COALESCE(@notes, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `
    const params = {
      '@id': id,
      '@pet_id': data.pet_id,
      '@vaccination_record_id': data.vaccination_record_id,
      '@reminder_date': data.reminder_date,
      '@reminder_type': data.reminder_type,
      '@status': data.status,
      '@sent_at': data.sent_at,
      '@sent_by': data.sent_by,
      '@response': data.response,
      '@notes': data.notes
    }
    await db.run(sql, params)
    return await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
  })

  fastify.delete('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM revisit_reminders WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Reminder not found', code: 'NOT_FOUND' } }
    }
    await db.run('DELETE FROM revisit_reminders WHERE id = @id', { '@id': id })
    reply.code(204)
    return null
  })
}
