import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const allowedFields = ['id', 'pet_id', 'checkin_id', 'type', 'description', 'severity', 'onset_date', 'resolved', 'resolution_date', 'noted_by', 'notes', 'created_at']
const allowedFilters = ['pet_id', 'checkin_id', 'type', 'severity', 'resolved', 'noted_by', 'type_like', 'description_like']
const allowedSorts = ['id', 'pet_id', 'type', 'severity', 'onset_date', 'created_at']

const contraindicationSchema = z.object({
  pet_id: z.number().int().positive(),
  checkin_id: z.number().int().positive().optional().nullable(),
  type: z.enum(['allergy', 'illness', 'pregnancy', 'immunocompromised', 'other']),
  description: z.string().min(1).max(1000),
  severity: z.enum(['mild', 'moderate', 'severe']),
  onset_date: z.string().optional().nullable(),
  resolved: z.boolean().default(false),
  resolution_date: z.string().optional().nullable(),
  noted_by: z.number().int().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
})

const updateSchema = contraindicationSchema.partial()

const querySchema = z.object({
  fields: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  pet_id: z.coerce.number().int().positive().optional(),
  checkin_id: z.coerce.number().int().positive().optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  resolved: z.coerce.boolean().optional(),
  noted_by: z.coerce.number().int().positive().optional(),
  type_like: z.string().optional(),
  description_like: z.string().optional()
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

    let sql = `SELECT ${fields.join(', ')} FROM contraindications`
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ` ORDER BY ${orderBy}`
    sql = paginate(sql, query.page, query.pageSize)

    const countSql = `SELECT COUNT(*) as total FROM contraindications${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`

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

  fastify.get('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const item = await db.get('SELECT * FROM contraindications WHERE id = @id', { '@id': id })
    if (!item) {
      reply.code(404)
      return { error: { message: 'Contraindication not found', code: 'NOT_FOUND' } }
    }
    return item
  })

  fastify.post('/', {
    schema: {
      body: contraindicationSchema
    }
  }, async (request, reply) => {
    const data = contraindicationSchema.parse(request.body)
    const sql = `
      INSERT INTO contraindications (pet_id, checkin_id, type, description, severity, onset_date, resolved, resolution_date, noted_by, notes)
      VALUES (@pet_id, @checkin_id, @type, @description, @severity, @onset_date, @resolved, @resolution_date, @noted_by, @notes)
    `
    const params = {
      '@pet_id': data.pet_id,
      '@checkin_id': data.checkin_id,
      '@type': data.type,
      '@description': data.description,
      '@severity': data.severity,
      '@onset_date': data.onset_date,
      '@resolved': data.resolved,
      '@resolution_date': data.resolution_date,
      '@noted_by': data.noted_by,
      '@notes': data.notes
    }
    const result = await db.run(sql, params)
    const item = await db.get('SELECT * FROM contraindications WHERE id = @id', { '@id': result.lastID })
    reply.code(201)
    return item
  })

  fastify.put('/:id', {
    schema: {
      body: updateSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM contraindications WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Contraindication not found', code: 'NOT_FOUND' } }
    }
    const data = updateSchema.parse(request.body)
    const sql = `
      UPDATE contraindications SET
        pet_id = COALESCE(@pet_id, pet_id),
        checkin_id = COALESCE(@checkin_id, checkin_id),
        type = COALESCE(@type, type),
        description = COALESCE(@description, description),
        severity = COALESCE(@severity, severity),
        onset_date = COALESCE(@onset_date, onset_date),
        resolved = COALESCE(@resolved, resolved),
        resolution_date = COALESCE(@resolution_date, resolution_date),
        noted_by = COALESCE(@noted_by, noted_by),
        notes = COALESCE(@notes, notes)
      WHERE id = @id
    `
    const params = {
      '@id': id,
      '@pet_id': data.pet_id,
      '@checkin_id': data.checkin_id,
      '@type': data.type,
      '@description': data.description,
      '@severity': data.severity,
      '@onset_date': data.onset_date,
      '@resolved': data.resolved,
      '@resolution_date': data.resolution_date,
      '@noted_by': data.noted_by,
      '@notes': data.notes
    }
    await db.run(sql, params)
    return await db.get('SELECT * FROM contraindications WHERE id = @id', { '@id': id })
  })

  fastify.delete('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM contraindications WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Contraindication not found', code: 'NOT_FOUND' } }
    }
    await db.run('DELETE FROM contraindications WHERE id = @id', { '@id': id })
    reply.code(204)
    return null
  })
}
