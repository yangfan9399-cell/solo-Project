import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const allowedFields = ['id', 'username', 'name', 'role', 'phone', 'created_at', 'updated_at']
const allowedFilters = ['role', 'name_like', 'username_like']
const allowedSorts = ['id', 'name', 'username', 'role', 'created_at']

const userSchema = z.object({
  username: z.string().min(3).max(50),
  name: z.string().min(1).max(100),
  role: z.enum(['receptionist', 'assistant', 'director']),
  phone: z.string().max(20).optional().nullable()
})

const updateSchema = userSchema.partial()

const querySchema = z.object({
  fields: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  role: z.string().optional(),
  name_like: z.string().optional(),
  username_like: z.string().optional()
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

    let sql = `SELECT ${fields.join(', ')} FROM users`
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ` ORDER BY ${orderBy}`
    sql = paginate(sql, query.page, query.pageSize)

    const countSql = `SELECT COUNT(*) as total FROM users${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`

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

  fastify.get('/current', async (request, reply) => {
    const defaultUser = await db.get('SELECT id, username, name, role, phone, created_at FROM users WHERE role = @role LIMIT 1', { '@role': 'director' })
    if (!defaultUser) {
      reply.code(404)
      return { error: { message: 'No user found', code: 'NOT_FOUND' } }
    }
    return defaultUser
  })

  fastify.get('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const item = await db.get('SELECT id, username, name, role, phone, created_at, updated_at FROM users WHERE id = @id', { '@id': id })
    if (!item) {
      reply.code(404)
      return { error: { message: 'User not found', code: 'NOT_FOUND' } }
    }
    return item
  })

  fastify.post('/', {
    schema: {
      body: userSchema
    }
  }, async (request, reply) => {
    const data = userSchema.parse(request.body)
    const existing = await db.get('SELECT id FROM users WHERE username = @username', { '@username': data.username })
    if (existing) {
      reply.code(409)
      return { error: { message: 'Username already exists', code: 'DUPLICATE_USERNAME' } }
    }
    const insertSql = `
      INSERT INTO users (username, name, role, phone)
      VALUES (@username, @name, @role, @phone)
    `
    const params = Object.fromEntries(Object.entries(data).map(([k, v]) => [`@${k}`, v]))
    const result = await db.run(insertSql, params)
    const item = await db.get('SELECT id, username, name, role, phone, created_at FROM users WHERE id = @id', { '@id': result.lastID })
    reply.code(201)
    return item
  })

  fastify.put('/:id', {
    schema: {
      body: updateSchema
    }
  }, async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM users WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'User not found', code: 'NOT_FOUND' } }
    }
    const data = updateSchema.parse(request.body)
    if (data.username && data.username !== existing.username) {
      const duplicate = await db.get('SELECT id FROM users WHERE username = @username AND id != @id', { '@username': data.username, '@id': id })
      if (duplicate) {
        reply.code(409)
        return { error: { message: 'Username already exists', code: 'DUPLICATE_USERNAME' } }
      }
    }
    const updateSql = `
      UPDATE users SET
        username = COALESCE(@username, username),
        name = COALESCE(@name, name),
        role = COALESCE(@role, role),
        phone = COALESCE(@phone, phone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `
    const params = Object.fromEntries(Object.entries({ ...data, id }).map(([k, v]) => [`@${k}`, v]))
    await db.run(updateSql, params)
    return await db.get('SELECT id, username, name, role, phone, created_at, updated_at FROM users WHERE id = @id', { '@id': id })
  })

  fastify.delete('/:id', async (request, reply) => {
    const id = z.number().int().positive().parse(Number(request.params.id))
    const existing = await db.get('SELECT * FROM users WHERE id = @id', { '@id': id })
    if (!existing) {
      reply.code(404)
      return { error: { message: 'User not found', code: 'NOT_FOUND' } }
    }
    const hasReferences = await db.get(`
      SELECT 1 FROM appointments WHERE assigned_user_id = @id
      UNION ALL
      SELECT 1 FROM checkins WHERE checked_by = @id
      UNION ALL
      SELECT 1 FROM contraindications WHERE noted_by = @id
      UNION ALL
      SELECT 1 FROM vaccination_records WHERE given_by = @id
      UNION ALL
      SELECT 1 FROM revisit_reminders WHERE sent_by = @id
      UNION ALL
      SELECT 1 FROM adverse_reactions WHERE reported_by = @id
      UNION ALL
      SELECT 1 FROM follow_up_calls WHERE caller_id = @id
      LIMIT 1
    `, { '@id': id })
    if (hasReferences) {
      reply.code(400)
      return { error: { message: 'User has references and cannot be deleted', code: 'HAS_REFERENCES' } }
    }
    await db.run('DELETE FROM users WHERE id = @id', { '@id': id })
    reply.code(204)
    return null
  })
}
