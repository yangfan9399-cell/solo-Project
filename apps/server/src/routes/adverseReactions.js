import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const allowedFields = ['id', 'vaccination_record_id', 'pet_id', 'reaction_type', 'severity', 'onset_time', 'symptoms', 'treatment_provided', 'follow_up_required', 'follow_up_date', 'reported_by', 'resolved', 'resolution_date', 'notes', 'created_at']
const allowedFilters = ['vaccination_record_id', 'pet_id', 'reaction_type', 'severity', 'follow_up_required', 'reported_by', 'resolved', 'reaction_type_like']
const allowedSorts = ['id', 'pet_id', 'vaccination_record_id', 'severity', 'onset_time', 'created_at']

const reactionSchema = z.object({
  vaccination_record_id: z.number().int().positive(),
  pet_id: z.number().int().positive(),
  reaction_type: z.string().min(1).max(100),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']),
  onset_time: z.string().min(1),
  symptoms: z.string().min(1).max(1000),
  treatment_provided: z.string().max(1000).optional().nullable(),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional().nullable(),
  reported_by: z.number().int().positive().optional().nullable(),
  resolved: z.boolean().default(false),
  resolution_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
})

const updateSchema = reactionSchema.partial()

const querySchema = z.object({
  fields: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  vaccination_record_id: z.coerce.number().int().positive().optional(),
  pet_id: z.coerce.number().int().positive().optional(),
  reaction_type: z.string().optional(),
  severity: z.string().optional(),
  follow_up_required: z.coerce.boolean().optional(),
  reported_by: z.coerce.number().int().positive().optional(),
  resolved: z.coerce.boolean().optional(),
  reaction_type_like: z.string().optional()
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

    let sql = `SELECT ${fields.join(', ')} FROM adverse_reactions`
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ` ORDER BY ${orderBy}`
    sql = paginate(sql, query.page, query.pageSize)

    const countSql = `SELECT COUNT(*) as total FROM adverse_reactions${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`

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
    const item = await db.get('SELECT * FROM adverse_reactions WHERE id = @id', { '@id': id })
    if (!item) {
      reply.code(404)
      return { error: { message: 'Adverse reaction not found', code: 'NOT_FOUND' } }
    }
    return item
  })

  fastify.post('/', {
    schema: {
      body: reactionSchema
    }
  }, async (request, reply) => {
    const data = reactionSchema.parse(request.body)
    const sql = `
      INSERT INTO adverse_reactions (vaccination_record_id, pet_id, reaction_type, severity, onset_time, symptoms, treatment_provided, follow_up_required, follow_up_date, reported_by, resolved, resolution_date, notes)
      VALUES (@vaccination_record_id, @pet_id, @reaction_type, @severity, @onset_time, @symptoms, @treatment_provided, @follow_up_required, @follow_up_date, @reported_by, @resolved, @resolution_date, @notes)
    `
    const params = {
      '@vaccination_record_id': data.vaccination_record_id,
      '@pet_id': data.pet_id,
      '@reaction_type': data.reaction_type,
      '@severity': data.severity,
      '@onset_time': data.onset_time,
      '@symptoms': data.symptoms,
      '@treatment_provided': data.treatment_provided,
      '@follow_up_required': data.follow_up_required,
      '@follow_up_date': data.follow_up_date,
      '@reported_by': data.reported_by,
      '@resolved': data.resolved,
      '@resolution_date': data.resolution_date,
      '@notes': data.notes
    }
    const result = await db.run(sql, params)
    const item = await db.get('SELECT * FROM adverse_reactions WHERE id = @id', { '@id': result.lastID })
    reply.code(201)
    return item
  })

  fastify.put('/:id', {
    schema: {
      body: updateSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM adverse_reactions WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Adverse reaction not found', code: 'NOT_FOUND' } }
    }
    const data = updateSchema.parse(request.body)
    const sql = `
      UPDATE adverse_reactions SET
        vaccination_record_id = COALESCE(@vaccination_record_id, vaccination_record_id),
        pet_id = COALESCE(@pet_id, pet_id),
        reaction_type = COALESCE(@reaction_type, reaction_type),
        severity = COALESCE(@severity, severity),
        onset_time = COALESCE(@onset_time, onset_time),
        symptoms = COALESCE(@symptoms, symptoms),
        treatment_provided = COALESCE(@treatment_provided, treatment_provided),
        follow_up_required = COALESCE(@follow_up_required, follow_up_required),
        follow_up_date = COALESCE(@follow_up_date, follow_up_date),
        reported_by = COALESCE(@reported_by, reported_by),
        resolved = COALESCE(@resolved, resolved),
        resolution_date = COALESCE(@resolution_date, resolution_date),
        notes = COALESCE(@notes, notes)
      WHERE id = @id
    `
    const params = {
      '@id': id,
      '@vaccination_record_id': data.vaccination_record_id,
      '@pet_id': data.pet_id,
      '@reaction_type': data.reaction_type,
      '@severity': data.severity,
      '@onset_time': data.onset_time,
      '@symptoms': data.symptoms,
      '@treatment_provided': data.treatment_provided,
      '@follow_up_required': data.follow_up_required,
      '@follow_up_date': data.follow_up_date,
      '@reported_by': data.reported_by,
      '@resolved': data.resolved,
      '@resolution_date': data.resolution_date,
      '@notes': data.notes
    }
    await db.run(sql, params)
    return await db.get('SELECT * FROM adverse_reactions WHERE id = @id', { '@id': id })
  })

  fastify.delete('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM adverse_reactions WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'Adverse reaction not found', code: 'NOT_FOUND' } }
    }
    await db.run('DELETE FROM adverse_reactions WHERE id = @id', { '@id': id })
    reply.code(204)
    return null
  })
}
