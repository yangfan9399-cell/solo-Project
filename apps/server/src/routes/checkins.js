import { z } from 'zod'
import db from '../db/index.js'
import { buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const checkinSchema = z.object({
  appointment_id: z.number().int().positive(),
  pet_id: z.number().int().positive(),
  owner_id: z.number().int().positive(),
  checkin_time: z.string().min(1),
  temperature: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  heart_rate: z.number().int().positive().optional().nullable(),
  respiratory_rate: z.number().int().positive().optional().nullable(),
  general_condition: z.string().optional().nullable(),
  checked_by: z.number().int().positive().optional().nullable()
})

const checkinUpdateSchema = checkinSchema.partial()

const stateTransitions = {
  scheduled: ['checked_in'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: []
}

function canTransition(currentState, targetState) {
  return stateTransitions[currentState]?.includes(targetState) || false
}

export default async function checkinRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
        sort: z.string().optional(),
        appointment_id: z.coerce.number().int().positive().optional(),
        pet_id: z.coerce.number().int().positive().optional(),
        owner_id: z.coerce.number().int().positive().optional(),
        checked_by: z.coerce.number().int().positive().optional()
      }).passthrough()
    }
  }, async (request) => {
    const { page, pageSize, sort, ...filters } = request.query
    const allowedFilters = ['appointment_id', 'pet_id', 'owner_id', 'checked_by']
    const { conditions, values } = buildWhereClause(filters, allowedFilters)
    const orderBy = buildOrderBy(sort, ['id', 'checkin_time', 'created_at'])

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const baseQuery = `
      SELECT c.*, p.name as pet_name, o.name as owner_name, u.name as checked_by_name
      FROM checkins c
      LEFT JOIN pets p ON c.pet_id = p.id
      LEFT JOIN owners o ON c.owner_id = o.id
      LEFT JOIN users u ON c.checked_by = u.id
      ${whereClause}
      ORDER BY ${orderBy}
    `
    const countQuery = `SELECT COUNT(*) as total FROM checkins c ${whereClause}`
    const { total } = await db.get(countQuery, values)

    const paginatedQuery = paginate(baseQuery, page, pageSize)
    const checkins = await db.all(paginatedQuery, { ...values, '@limit': pageSize, '@offset': (page - 1) * pageSize })

    return {
      data: checkins,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const checkin = await db.get(`
      SELECT c.*, p.name as pet_name, o.name as owner_name, u.name as checked_by_name,
             p.species as pet_species, p.breed as pet_breed
      FROM checkins c
      LEFT JOIN pets p ON c.pet_id = p.id
      LEFT JOIN owners o ON c.owner_id = o.id
      LEFT JOIN users u ON c.checked_by = u.id
      WHERE c.id = @id
    `, { '@id': id })

    if (!checkin) {
      return reply.status(404).send({ error: { message: '签到记录不存在', code: 'CHECKIN_NOT_FOUND', statusCode: 404 } })
    }

    return { data: checkin }
  })

  fastify.get('/:id/contraindications-check', async (request, reply) => {
    const { id } = request.params

    const checkin = await db.get('SELECT pet_id, appointment_id FROM checkins WHERE id = @id', { '@id': id })
    if (!checkin) {
      return reply.status(404).send({ error: { message: '签到记录不存在', code: 'CHECKIN_NOT_FOUND', statusCode: 404 } })
    }

    const contraindications = await db.all(`
      SELECT c.*, u.name as noted_by_name
      FROM contraindications c
      LEFT JOIN users u ON c.noted_by = u.id
      WHERE c.pet_id = @pet_id AND c.resolved = 0
      ORDER BY CASE c.severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END, c.created_at DESC
    `, { '@pet_id': checkin.pet_id })

    return {
      data: {
        pet_id: checkin.pet_id,
        checkin_id: id,
        active_contraindications: contraindications,
        has_active: contraindications.length > 0,
        has_severe: contraindications.some(c => c.severity === 'severe'),
        warnings: contraindications.length > 0
          ? `该宠物有 ${contraindications.length} 项活跃禁忌症，其中 ${contraindications.filter(c => c.severity === 'severe').length} 项为严重级别`
          : null
      }
    }
  })

  fastify.post('/', {
    schema: { body: checkinSchema }
  }, async (request, reply) => {
    const { appointment_id, pet_id, owner_id, checkin_time, temperature, weight, heart_rate, respiratory_rate, general_condition, checked_by } = request.body

    const appointment = await db.get('SELECT * FROM appointments WHERE id = @id', { '@id': appointment_id })
    if (!appointment) {
      return reply.status(400).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 400 } })
    }

    if (!canTransition(appointment.status, 'checked_in')) {
      return reply.status(400).send({
        error: {
          message: `当前预约状态 ${appointment.status} 无法签到`,
          code: 'INVALID_STATE_TRANSITION',
          statusCode: 400
        }
      })
    }

    const pet = await db.get('SELECT id, owner_id FROM pets WHERE id = @id', { '@id': pet_id })
    if (!pet) {
      return reply.status(400).send({ error: { message: '宠物不存在', code: 'PET_NOT_FOUND', statusCode: 400 } })
    }

    if (pet.owner_id !== owner_id) {
      return reply.status(400).send({ error: { message: '宠物与主人不匹配', code: 'PET_OWNER_MISMATCH', statusCode: 400 } })
    }

    try {
      await db.run('BEGIN TRANSACTION')

      const result = await db.run(`
        INSERT INTO checkins (appointment_id, pet_id, owner_id, checkin_time, temperature, weight, heart_rate, respiratory_rate, general_condition, checked_by)
        VALUES (@appointment_id, @pet_id, @owner_id, @checkin_time, @temperature, @weight, @heart_rate, @respiratory_rate, @general_condition, @checked_by)
      `, {
        '@appointment_id': appointment_id,
        '@pet_id': pet_id,
        '@owner_id': owner_id,
        '@checkin_time': checkin_time,
        '@temperature': temperature || null,
        '@weight': weight || null,
        '@heart_rate': heart_rate || null,
        '@respiratory_rate': respiratory_rate || null,
        '@general_condition': general_condition || null,
        '@checked_by': checked_by || null
      })

      await db.run(`
        UPDATE appointments
        SET status = 'checked_in', checkin_time = @checkin_time, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `, { '@checkin_time': checkin_time, '@id': appointment_id })

      await db.run('COMMIT')

      const checkin = await db.get(`
        SELECT c.*, p.name as pet_name, o.name as owner_name
        FROM checkins c
        LEFT JOIN pets p ON c.pet_id = p.id
        LEFT JOIN owners o ON c.owner_id = o.id
        WHERE c.id = @id
      `, { '@id': result.lastID })

      return reply.status(201).send({ data: checkin })
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })

  fastify.put('/:id', {
    schema: { body: checkinUpdateSchema }
  }, async (request, reply) => {
    const { id } = request.params
    const body = request.body

    const existing = await db.get('SELECT * FROM checkins WHERE id = @id', { '@id': id })
    if (!existing) {
      return reply.status(404).send({ error: { message: '签到记录不存在', code: 'CHECKIN_NOT_FOUND', statusCode: 404 } })
    }

    const updateFields = []
    const updateValues = {}

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = @${key}`)
        updateValues[`@${key}`] = value
      }
    })

    if (updateFields.length > 0) {
      updateValues['@id'] = id
      await db.run(`UPDATE checkins SET ${updateFields.join(', ')} WHERE id = @id`, updateValues)
    }

    const checkin = await db.get(`
      SELECT c.*, p.name as pet_name, o.name as owner_name
      FROM checkins c
      LEFT JOIN pets p ON c.pet_id = p.id
      LEFT JOIN owners o ON c.owner_id = o.id
      WHERE c.id = @id
    `, { '@id': id })

    return { data: checkin }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const existing = await db.get('SELECT * FROM checkins WHERE id = @id', { '@id': id })
    if (!existing) {
      return reply.status(404).send({ error: { message: '签到记录不存在', code: 'CHECKIN_NOT_FOUND', statusCode: 404 } })
    }

    try {
      await db.run('BEGIN TRANSACTION')

      await db.run('DELETE FROM checkins WHERE id = @id', { '@id': id })

      const { count } = await db.get('SELECT COUNT(*) as count FROM checkins WHERE appointment_id = @appointment_id', { '@appointment_id': existing.appointment_id })
      if (count === 0) {
        await db.run(`
          UPDATE appointments
          SET status = 'scheduled', checkin_time = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `, { '@id': existing.appointment_id })
      }

      await db.run('COMMIT')
      return { data: { id, message: '签到记录已删除' } }
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })
}
