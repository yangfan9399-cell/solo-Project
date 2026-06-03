import { z } from 'zod'
import db from '../db/index.js'
import { buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const ownerSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  phone: z.string().min(1, '电话不能为空'),
  id_card: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
})

const ownerUpdateSchema = ownerSchema.partial()

const listQuerySchema = z.object({
  search: z.string().optional(),
  name_like: z.string().optional(),
  phone_like: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
})

export default async function ownerRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: listQuerySchema
    }
  }, async (request, reply) => {
    const { search, name_like, phone_like, sort, page, pageSize } = request.query

    const filters = {}
    if (search) {
      filters.name_like = search
    } else {
      if (name_like) filters.name_like = name_like
      if (phone_like) filters.phone_like = phone_like
    }

    const allowedFilters = ['name_like', 'phone_like']
    const { conditions, values } = buildWhereClause(filters, allowedFilters)

    const whereSql = conditions.length > 0 
      ? `WHERE ${conditions.join(' OR ')}` 
      : ''

    const allowedSorts = ['id', 'name', 'phone', 'created_at', 'updated_at']
    const orderSql = buildOrderBy(sort, allowedSorts)

    const countSql = `SELECT COUNT(*) as total FROM owners ${whereSql}`
    const { total } = await db.get(countSql, values)

    const baseSql = `SELECT * FROM owners ${whereSql} ORDER BY ${orderSql}`
    const paginatedSql = paginate(baseSql, page, pageSize)
    const items = await db.all(paginatedSql, { ...values, limit: pageSize, offset: (page - 1) * pageSize })

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const owner = await db.get('SELECT * FROM owners WHERE id = ?', id)

    if (!owner) {
      reply.status(404)
      throw new Error('主人信息不存在')
    }

    const pets = await db.all('SELECT * FROM pets WHERE owner_id = ? ORDER BY id DESC', id)

    return {
      ...owner,
      pets
    }
  })

  fastify.get('/:id/pets', async (request, reply) => {
    const { id } = request.params

    const owner = await db.get('SELECT id FROM owners WHERE id = ?', id)

    if (!owner) {
      reply.status(404)
      throw new Error('主人信息不存在')
    }

    const pets = await db.all('SELECT * FROM pets WHERE owner_id = ? ORDER BY id DESC', id)

    return {
      items: pets,
      total: pets.length
    }
  })

  fastify.post('/', {
    schema: {
      body: ownerSchema
    }
  }, async (request, reply) => {
    const { name, phone, id_card, address, notes } = request.body

    const now = new Date().toISOString()

    const insertSql = `
      INSERT INTO owners (name, phone, id_card, address, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    const result = await db.run(insertSql, [name, phone, id_card || null, address || null, notes || null, now, now])

    const owner = await db.get('SELECT * FROM owners WHERE id = ?', result.lastID)

    reply.status(201)
    return owner
  })

  fastify.put('/:id', {
    schema: {
      body: ownerUpdateSchema
    }
  }, async (request, reply) => {
    const { id } = request.params
    const { name, phone, id_card, address, notes } = request.body

    const existing = await db.get('SELECT * FROM owners WHERE id = ?', id)

    if (!existing) {
      reply.status(404)
      throw new Error('主人信息不存在')
    }

    const now = new Date().toISOString()

    const updateSql = `
      UPDATE owners 
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          id_card = ?,
          address = ?,
          notes = ?,
          updated_at = ?
      WHERE id = ?
    `

    await db.run(updateSql, [
      name ?? null,
      phone ?? null,
      id_card ?? existing.id_card,
      address ?? existing.address,
      notes ?? existing.notes,
      now,
      id
    ])

    const owner = await db.get('SELECT * FROM owners WHERE id = ?', id)

    return owner
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const existing = await db.get('SELECT * FROM owners WHERE id = ?', id)

    if (!existing) {
      reply.status(404)
      throw new Error('主人信息不存在')
    }

    await db.run('DELETE FROM owners WHERE id = ?', id)

    reply.status(204)
    return null
  })
}
