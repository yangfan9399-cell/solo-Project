import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const vaccineSchema = z.object({
  name: z.string().min(1, '疫苗名称不能为空'),
  manufacturer: z.string().optional(),
  type: z.string().min(1, '疫苗类型不能为空'),
  dose_volume: z.number().positive('剂量必须为正数').optional(),
  applicable_species: z.string().optional(),
  interval_days: z.number().int().nonnegative('间隔天数不能为负数').optional(),
  booster_doses: z.number().int().nonnegative('加强针次数不能为负数').optional(),
  storage_condition: z.string().optional(),
  notes: z.string().optional()
})

const vaccineUpdateSchema = vaccineSchema.partial()

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  sort: z.string().optional(),
  fields: z.string().optional(),
  name: z.string().optional(),
  name_like: z.string().optional(),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  applicable_species: z.string().optional()
})

const allowedFields = [
  'id', 'name', 'manufacturer', 'type', 'dose_volume',
  'applicable_species', 'interval_days', 'booster_doses',
  'storage_condition', 'notes', 'created_at',
  'batch_count', 'total_quantity', 'used_quantity'
]

const allowedFilters = [
  'name', 'name_like', 'type', 'manufacturer', 'applicable_species'
]

const allowedSorts = [
  'id', 'name', 'type', 'manufacturer', 'created_at'
]

export default async function vaccineRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: querySchema
    }
  }, async (request, reply) => {
    const { page, pageSize, sort, fields, ...filters } = request.query
    const selectedFields = parseFields(fields, allowedFields) || [
      'v.id', 'v.name', 'v.manufacturer', 'v.type', 'v.dose_volume',
      'v.applicable_species', 'v.interval_days', 'v.booster_doses',
      'v.storage_condition', 'v.notes', 'v.created_at',
      'COUNT(vb.id) as batch_count',
      'COALESCE(SUM(vb.quantity), 0) as total_quantity',
      'COALESCE(SUM(vb.used_quantity), 0) as used_quantity'
    ]

    const { conditions, values } = buildWhereClause(filters, allowedFilters)
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderBy = buildOrderBy(sort, allowedSorts)

    const baseQuery = `
      SELECT ${Array.isArray(selectedFields) ? selectedFields.join(', ') : selectedFields}
      FROM vaccines v
      LEFT JOIN vaccine_batches vb ON v.id = vb.vaccine_id
      ${whereClause}
      GROUP BY v.id
      ORDER BY ${orderBy}
    `

    const countQuery = `
      SELECT COUNT(DISTINCT v.id) as total
      FROM vaccines v
      LEFT JOIN vaccine_batches vb ON v.id = vb.vaccine_id
      ${whereClause}
    `

    const paginatedQuery = paginate(baseQuery, page, pageSize)

    const { total } = await db.get(countQuery, values)
    const items = await db.all(paginatedQuery, { ...values, limit: pageSize, offset: (page - 1) * pageSize })

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const vaccine = await db.get(`
      SELECT 
        v.*,
        COUNT(vb.id) as batch_count,
        COALESCE(SUM(vb.quantity), 0) as total_quantity,
        COALESCE(SUM(vb.used_quantity), 0) as used_quantity
      FROM vaccines v
      LEFT JOIN vaccine_batches vb ON v.id = vb.vaccine_id
      WHERE v.id = ?
      GROUP BY v.id
    `, [id])

    if (!vaccine) {
      reply.status(404)
      throw new Error('疫苗不存在')
    }

    const batches = await db.all(`
      SELECT * FROM vaccine_batches
      WHERE vaccine_id = ?
      ORDER BY expiry_date DESC
    `, [id])

    return {
      ...vaccine,
      batches
    }
  })

  fastify.post('/', {
    schema: {
      body: vaccineSchema
    }
  }, async (request, reply) => {
    const data = request.body

    const result = await db.run(`
      INSERT INTO vaccines (
        name, manufacturer, type, dose_volume, applicable_species,
        interval_days, booster_doses, storage_condition, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.manufacturer || null,
      data.type,
      data.dose_volume || null,
      data.applicable_species || null,
      data.interval_days || null,
      data.booster_doses || null,
      data.storage_condition || null,
      data.notes || null
    ])

    const vaccine = await db.get('SELECT * FROM vaccines WHERE id = ?', [result.lastID])

    reply.status(201).send(vaccine)
  })

  fastify.put('/:id', {
    schema: {
      body: vaccineUpdateSchema
    }
  }, async (request, reply) => {
    const { id } = request.params
    const data = request.body

    const existing = await db.get('SELECT * FROM vaccines WHERE id = ?', [id])
    if (!existing) {
      reply.status(404)
      throw new Error('疫苗不存在')
    }

    const updateFields = []
    const updateValues = []

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      updateValues.push(id)

      await db.run(`
        UPDATE vaccines
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues)
    }

    const vaccine = await db.get('SELECT * FROM vaccines WHERE id = ?', [id])
    return vaccine
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const existing = await db.get('SELECT * FROM vaccines WHERE id = ?', [id])
    if (!existing) {
      reply.status(404)
      throw new Error('疫苗不存在')
    }

    const hasBatches = (await db.get('SELECT COUNT(*) as count FROM vaccine_batches WHERE vaccine_id = ?', [id])).count > 0
    if (hasBatches) {
      reply.status(400)
      throw new Error('该疫苗存在关联批次，无法删除')
    }

    await db.run('DELETE FROM vaccines WHERE id = ?', [id])

    reply.status(204).send()
  })
}
