import { z } from 'zod'
import db from '../db/index.js'
import { parseFields, buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'
import dayjs from 'dayjs'

const vaccineBatchSchema = z.object({
  vaccine_id: z.number().int().positive('疫苗ID不能为空'),
  batch_no: z.string().min(1, '批次号不能为空'),
  manufacture_date: z.string().min(1, '生产日期不能为空'),
  expiry_date: z.string().min(1, '有效期不能为空'),
  quantity: z.number().int().nonnegative('数量不能为负数').optional().default(0),
  used_quantity: z.number().int().nonnegative('已用数量不能为负数').optional().default(0),
  unit_price: z.number().positive('单价必须为正数').optional(),
  supplier: z.string().optional(),
  lot_number: z.string().optional(),
  status: z.enum(['normal', 'quarantine', 'recalled', 'expired']).optional().default('normal'),
  notes: z.string().optional()
})

const vaccineBatchUpdateSchema = vaccineBatchSchema.partial()

const useBatchSchema = z.object({
  quantity: z.number().int().positive('使用数量必须为正整数').optional().default(1)
})

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
  sort: z.string().optional(),
  fields: z.string().optional(),
  vaccine_id: z.coerce.number().int().optional(),
  batch_no: z.string().optional(),
  batch_no_like: z.string().optional(),
  status: z.string().optional(),
  expiry_date_gte: z.string().optional(),
  expiry_date_lte: z.string().optional(),
  supplier: z.string().optional()
})

const allowedFields = [
  'id', 'vaccine_id', 'batch_no', 'manufacture_date', 'expiry_date',
  'quantity', 'used_quantity', 'unit_price', 'supplier', 'lot_number',
  'status', 'notes', 'created_at', 'updated_at',
  'vaccine_name', 'vaccine_type', 'manufacturer',
  'available_quantity'
]

const allowedFilters = [
  'vaccine_id', 'batch_no', 'batch_no_like', 'status',
  'expiry_date_gte', 'expiry_date_lte', 'supplier'
]

const allowedSorts = [
  'id', 'vaccine_id', 'batch_no', 'manufacture_date', 'expiry_date',
  'quantity', 'used_quantity', 'status', 'created_at'
]

const selectWithVaccine = (fields) => {
  const baseFields = fields && Array.isArray(fields) && fields.length > 0
    ? fields.map(f => {
        if (f === 'vaccine_name') return 'v.name as vaccine_name'
        if (f === 'vaccine_type') return 'v.type as vaccine_type'
        if (f === 'manufacturer') return 'v.manufacturer as manufacturer'
        if (f === 'available_quantity') return '(vb.quantity - vb.used_quantity) as available_quantity'
        return `vb.${f}`
      }).join(', ')
    : `
      vb.*,
      v.name as vaccine_name,
      v.type as vaccine_type,
      v.manufacturer as manufacturer,
      (vb.quantity - vb.used_quantity) as available_quantity
    `
  return baseFields
}

export default async function vaccineBatchRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: querySchema
    }
  }, async (request, reply) => {
    const { page, pageSize, sort, fields, ...filters } = request.query
    const selectedFields = parseFields(fields, allowedFields)

    const { conditions, values } = buildWhereClause(filters, allowedFilters)
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderBy = buildOrderBy(sort, allowedSorts)

    const baseQuery = `
      SELECT ${selectWithVaccine(selectedFields)}
      FROM vaccine_batches vb
      LEFT JOIN vaccines v ON vb.vaccine_id = v.id
      ${whereClause}
      ORDER BY ${orderBy}
    `

    const countQuery = `
      SELECT COUNT(vb.id) as total
      FROM vaccine_batches vb
      LEFT JOIN vaccines v ON vb.vaccine_id = v.id
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

  fastify.get('/expiring', async (request, reply) => {
    const days = 30
    const today = dayjs().format('YYYY-MM-DD')
    const expiryThreshold = dayjs().add(days, 'day').format('YYYY-MM-DD')

    const items = await db.all(`
      SELECT 
        vb.*,
        v.name as vaccine_name,
        v.type as vaccine_type,
        v.manufacturer as manufacturer,
        (vb.quantity - vb.used_quantity) as available_quantity
      FROM vaccine_batches vb
      LEFT JOIN vaccines v ON vb.vaccine_id = v.id
      WHERE vb.status = 'normal'
        AND vb.expiry_date >= ?
        AND vb.expiry_date <= ?
        AND (vb.quantity - vb.used_quantity) > 0
      ORDER BY vb.expiry_date ASC
    `, [today, expiryThreshold])

    return {
      items,
      expiringInDays: days,
      asOfDate: today
    }
  })

  fastify.get('/available', async (request, reply) => {
    const today = dayjs().format('YYYY-MM-DD')

    const items = await db.all(`
      SELECT 
        vb.*,
        v.name as vaccine_name,
        v.type as vaccine_type,
        v.manufacturer as manufacturer,
        (vb.quantity - vb.used_quantity) as available_quantity
      FROM vaccine_batches vb
      LEFT JOIN vaccines v ON vb.vaccine_id = v.id
      WHERE vb.status = 'normal'
        AND vb.expiry_date >= ?
        AND vb.quantity > vb.used_quantity
      ORDER BY vb.expiry_date ASC
    `, [today])

    return {
      items,
      asOfDate: today
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const batch = await db.get(`
      SELECT 
        vb.*,
        v.name as vaccine_name,
        v.type as vaccine_type,
        v.manufacturer as manufacturer,
        v.applicable_species,
        v.dose_volume,
        (vb.quantity - vb.used_quantity) as available_quantity
      FROM vaccine_batches vb
      LEFT JOIN vaccines v ON vb.vaccine_id = v.id
      WHERE vb.id = ?
    `, [id])

    if (!batch) {
      reply.status(404)
      throw new Error('疫苗批次不存在')
    }

    return batch
  })

  fastify.post('/', {
    schema: {
      body: vaccineBatchSchema
    }
  }, async (request, reply) => {
    const data = request.body

    const vaccine = await db.get('SELECT id FROM vaccines WHERE id = ?', [data.vaccine_id])
    if (!vaccine) {
      reply.status(404)
      throw new Error('疫苗不存在')
    }

    const existingBatch = await db.get('SELECT id FROM vaccine_batches WHERE batch_no = ?', [data.batch_no])
    if (existingBatch) {
      reply.status(409)
      throw new Error('批次号已存在')
    }

    const result = await db.run(`
      INSERT INTO vaccine_batches (
        vaccine_id, batch_no, manufacture_date, expiry_date, quantity,
        used_quantity, unit_price, supplier, lot_number, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.vaccine_id,
      data.batch_no,
      data.manufacture_date,
      data.expiry_date,
      data.quantity,
      data.used_quantity,
      data.unit_price || null,
      data.supplier || null,
      data.lot_number || null,
      data.status,
      data.notes || null
    ])

    const batch = await db.get('SELECT * FROM vaccine_batches WHERE id = ?', [result.lastID])
    reply.status(201).send(batch)
  })

  fastify.put('/:id', {
    schema: {
      body: vaccineBatchUpdateSchema
    }
  }, async (request, reply) => {
    const { id } = request.params
    const data = request.body

    const existing = await db.get('SELECT * FROM vaccine_batches WHERE id = ?', [id])
    if (!existing) {
      reply.status(404)
      throw new Error('疫苗批次不存在')
    }

    if (data.batch_no && data.batch_no !== existing.batch_no) {
      const duplicate = await db.get('SELECT id FROM vaccine_batches WHERE batch_no = ? AND id != ?', [data.batch_no, id])
      if (duplicate) {
        reply.status(409)
        throw new Error('批次号已存在')
      }
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
        UPDATE vaccine_batches
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues)
    }

    const batch = await db.get('SELECT * FROM vaccine_batches WHERE id = ?', [id])
    return batch
  })

  fastify.post('/:id/use', {
    schema: {
      body: useBatchSchema
    }
  }, async (request, reply) => {
    const { id } = request.params
    const { quantity } = request.body

    try {
      await db.run('BEGIN TRANSACTION')

      const batch = await db.get('SELECT * FROM vaccine_batches WHERE id = ?', [id])
      if (!batch) {
        reply.status(404)
        throw new Error('疫苗批次不存在')
      }

      if (batch.status !== 'normal') {
        reply.status(400)
        throw new Error(`疫苗批次状态异常: ${batch.status}`)
      }

      const today = dayjs().format('YYYY-MM-DD')
      if (dayjs(batch.expiry_date).isBefore(today)) {
        reply.status(400)
        throw new Error(`疫苗批次已过期，过期日期: ${batch.expiry_date}`)
      }

      const available = batch.quantity - batch.used_quantity
      if (available < quantity) {
        reply.status(400)
        throw new Error(`疫苗批次库存不足，可用: ${available}`)
      }

      await db.run(`
        UPDATE vaccine_batches
        SET used_quantity = used_quantity + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [quantity, id])

      const updatedBatch = await db.get(`
        SELECT 
          vb.*,
          (vb.quantity - vb.used_quantity) as available_quantity
        FROM vaccine_batches vb
        WHERE vb.id = ?
      `, [id])

      await db.run('COMMIT')

      return updatedBatch
    } catch (err) {
      await db.run('ROLLBACK')
      throw err
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const existing = await db.get('SELECT * FROM vaccine_batches WHERE id = ?', [id])
    if (!existing) {
      reply.status(404)
      throw new Error('疫苗批次不存在')
    }

    const hasRecords = (await db.get('SELECT COUNT(*) as count FROM vaccination_records WHERE vaccine_batch_id = ?', [id])).count > 0
    if (hasRecords) {
      reply.status(400)
      throw new Error('该批次存在关联接种记录，无法删除')
    }

    await db.run('DELETE FROM vaccine_batches WHERE id = ?', [id])
    reply.status(204).send()
  })
}
