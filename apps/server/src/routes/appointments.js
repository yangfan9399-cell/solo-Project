import { z } from 'zod'
import db from '../db/index.js'
import { buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'
import dayjs from 'dayjs'

const appointmentSchema = z.object({
  pet_id: z.number().int().positive(),
  owner_id: z.number().int().positive(),
  appointment_date: z.string().min(1),
  time_slot: z.string().min(1),
  vaccine_id: z.number().int().positive().optional().nullable(),
  appointment_type: z.enum(['vaccination', 'recheck', 'consultation']),
  notes: z.string().optional().nullable(),
  assigned_user_id: z.number().int().positive().optional().nullable()
})

const appointmentUpdateSchema = appointmentSchema.partial().extend({
  status: z.enum(['scheduled', 'checked_in', 'completed', 'cancelled', 'no_show']).optional()
})

const cancelSchema = z.object({
  cancel_reason: z.string().min(1, '取消原因不能为空')
})

const stateTransitions = {
  scheduled: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: []
}

function canTransition(currentState, targetState) {
  return stateTransitions[currentState]?.includes(targetState) || false
}

async function checkTimeSlotConflict(appointment_date, time_slot, excludeId = null) {
  const query = `
    SELECT COUNT(*) as count FROM appointments 
    WHERE appointment_date = ? AND time_slot = ? AND status NOT IN ('cancelled', 'no_show')
    ${excludeId ? 'AND id != ?' : ''}
  `
  const params = excludeId ? [appointment_date, time_slot, excludeId] : [appointment_date, time_slot]
  const result = await db.get(query, params)
  return result.count > 0
}

export default async function appointmentRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
        sort: z.string().optional(),
        date_gte: z.string().optional(),
        date_lte: z.string().optional(),
        status: z.string().optional(),
        pet_id: z.coerce.number().int().positive().optional(),
        owner_id: z.coerce.number().int().positive().optional(),
        appointment_type: z.string().optional()
      }).passthrough()
    }
  }, async (request) => {
    const { page, pageSize, sort, date_gte, date_lte, status, pet_id, owner_id, appointment_type, ...rest } = request.query
    
    const filters = {}
    if (date_gte) filters.appointment_date_gte = date_gte
    if (date_lte) filters.appointment_date_lte = date_lte
    if (status) filters.status = status
    if (pet_id) filters.pet_id = pet_id
    if (owner_id) filters.owner_id = owner_id
    if (appointment_type) filters.appointment_type = appointment_type

    const allowedFilters = ['appointment_date_gte', 'appointment_date_lte', 'status', 'pet_id', 'owner_id', 'appointment_type']
    const { conditions, values } = buildWhereClause(filters, allowedFilters)
    const orderBy = buildOrderBy(sort, ['id', 'appointment_date', 'time_slot', 'status', 'created_at'])

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const baseQuery = `
      SELECT a.*, 
             p.name as pet_name, p.species as pet_species,
             o.name as owner_name, o.phone as owner_phone,
             v.name as vaccine_name,
             u.name as assigned_user_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN owners o ON a.owner_id = o.id
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      LEFT JOIN users u ON a.assigned_user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
    `
    const countQuery = `SELECT COUNT(*) as total FROM appointments a ${whereClause}`
    const { total } = await db.get(countQuery, values)

    const paginatedQuery = paginate(baseQuery, page, pageSize)
    const appointments = await db.all(paginatedQuery, [...values, pageSize, (page - 1) * pageSize])

    return {
      data: appointments,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  })

  fastify.get('/calendar', async (request) => {
    const { start_date, end_date } = request.query
    const start = start_date || dayjs().format('YYYY-MM-DD')
    const end = end_date || dayjs().add(14, 'day').format('YYYY-MM-DD')

    const appointments = await db.all(`
      SELECT a.*, 
             p.name as pet_name, p.species as pet_species,
             o.name as owner_name, o.phone as owner_phone,
             v.name as vaccine_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN owners o ON a.owner_id = o.id
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      WHERE a.appointment_date >= ? AND a.appointment_date <= ?
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.appointment_date, a.time_slot
    `, [start, end])

    const grouped = {}
    appointments.forEach(apt => {
      if (!grouped[apt.appointment_date]) {
        grouped[apt.appointment_date] = []
      }
      grouped[apt.appointment_date].push(apt)
    })

    return { data: grouped, start_date: start, end_date: end }
  })

  fastify.get('/today', async (request) => {
    const today = dayjs().format('YYYY-MM-DD')
    
    const appointments = await db.all(`
      SELECT a.*, 
             p.name as pet_name, p.species as pet_species,
             o.name as owner_name, o.phone as owner_phone,
             v.name as vaccine_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN owners o ON a.owner_id = o.id
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      WHERE a.appointment_date = ?
      ORDER BY a.time_slot
    `, [today])

    const stats = {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      checked_in: appointments.filter(a => a.status === 'checked_in').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      no_show: appointments.filter(a => a.status === 'no_show').length
    }

    return { data: appointments, stats, date: today }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const appointment = await db.get(`
      SELECT a.*, 
             p.name as pet_name, p.species as pet_species, p.breed as pet_breed,
             p.birth_date as pet_birth_date, p.weight as pet_weight,
             o.name as owner_name, o.phone as owner_phone, o.id_card as owner_id_card,
             v.name as vaccine_name, v.type as vaccine_type, v.manufacturer as vaccine_manufacturer,
             u.name as assigned_user_name, u.role as assigned_user_role
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN owners o ON a.owner_id = o.id
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      LEFT JOIN users u ON a.assigned_user_id = u.id
      WHERE a.id = ?
    `, [id])

    if (!appointment) {
      return reply.status(404).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 404 } })
    }

    const checkins = await db.all(`
      SELECT c.*, u.name as checked_by_name
      FROM checkins c
      LEFT JOIN users u ON c.checked_by = u.id
      WHERE c.appointment_id = ?
      ORDER BY c.checkin_time DESC
    `, [id])

    const vaccinations = await db.all(`
      SELECT vr.*, v.name as vaccine_name, vb.batch_no as vaccine_batch_no, u.name as given_by_name
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN users u ON vr.given_by = u.id
      WHERE vr.appointment_id = ?
      ORDER BY vr.administration_date DESC
    `, [id])

    const contraindications = await db.all(`
      SELECT c.*
      FROM contraindications c
      WHERE c.pet_id = ? AND c.resolved = 0
      ORDER BY c.severity DESC
    `, [appointment.pet_id])

    return {
      data: {
        ...appointment,
        checkins,
        vaccinations,
        active_contraindications: contraindications
      }
    }
  })

  fastify.post('/', { schema: { body: appointmentSchema } }, async (request, reply) => {
    const data = request.body

    const pet = await db.get('SELECT id, owner_id FROM pets WHERE id = ?', [data.pet_id])
    if (!pet) {
      return reply.status(400).send({ error: { message: '宠物不存在', code: 'PET_NOT_FOUND', statusCode: 400 } })
    }

    if (pet.owner_id !== data.owner_id) {
      return reply.status(400).send({ error: { message: '宠物与主人不匹配', code: 'PET_OWNER_MISMATCH', statusCode: 400 } })
    }

    if (data.vaccine_id) {
      const vaccine = await db.get('SELECT id FROM vaccines WHERE id = ?', [data.vaccine_id])
      if (!vaccine) {
        return reply.status(400).send({ error: { message: '疫苗不存在', code: 'VACCINE_NOT_FOUND', statusCode: 400 } })
      }
    }

    if (await checkTimeSlotConflict(data.appointment_date, data.time_slot)) {
      return reply.status(400).send({ error: { message: '该时段已有预约，请选择其他时间', code: 'TIME_SLOT_CONFLICT', statusCode: 400 } })
    }

    const result = await db.run(`
      INSERT INTO appointments (
        pet_id, owner_id, appointment_date, time_slot, vaccine_id,
        appointment_type, notes, assigned_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.pet_id, data.owner_id, data.appointment_date, data.time_slot,
      data.vaccine_id || null, data.appointment_type, data.notes || null,
      data.assigned_user_id || null
    ])

    const appointment = await db.get(`
      SELECT a.*, p.name as pet_name, o.name as owner_name, v.name as vaccine_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN owners o ON a.owner_id = o.id
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      WHERE a.id = ?
    `, [result.lastID])

    return reply.status(201).send({ data: appointment })
  })

  fastify.put('/:id', { schema: { body: appointmentUpdateSchema } }, async (request, reply) => {
    const { id } = request.params
    const data = request.body

    const existing = await db.get('SELECT * FROM appointments WHERE id = ?', [id])
    if (!existing) {
      return reply.status(404).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 404 } })
    }

    if (data.status && !canTransition(existing.status, data.status)) {
      return reply.status(400).send({
        error: { message: `无法从 ${existing.status} 状态转换为 ${data.status}`, code: 'INVALID_STATE_TRANSITION', statusCode: 400 }
      })
    }

    if ((data.appointment_date || data.time_slot) &&
        (data.appointment_date !== existing.appointment_date || data.time_slot !== existing.time_slot)) {
      const newDate = data.appointment_date || existing.appointment_date
      const newSlot = data.time_slot || existing.time_slot
      if (await checkTimeSlotConflict(newDate, newSlot, id)) {
        return reply.status(400).send({ error: { message: '该时段已有预约，请选择其他时间', code: 'TIME_SLOT_CONFLICT', statusCode: 400 } })
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
      await db.run(`UPDATE appointments SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)
    }

    const appointment = await db.get(`
      SELECT a.*, p.name as pet_name, o.name as owner_name, v.name as vaccine_name
      FROM appointments a
      LEFT JOIN pets p ON a.pet_id = p.id
      LEFT JOIN owners o ON a.owner_id = o.id
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      WHERE a.id = ?
    `, [id])

    return { data: appointment }
  })

  fastify.post('/:id/check-in', async (request, reply) => {
    const { id } = request.params

    try {
      await db.run('BEGIN TRANSACTION')

      const existing = await db.get('SELECT * FROM appointments WHERE id = ?', [id])
      
      if (!existing) {
        await db.run('ROLLBACK')
        return reply.status(404).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 404 } })
      }

      if (!canTransition(existing.status, 'checked_in')) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: { message: `当前状态 ${existing.status} 无法签到`, code: 'INVALID_STATE_TRANSITION', statusCode: 400 }
        })
      }

      const now = new Date().toISOString()
      await db.run(`
        UPDATE appointments SET status = 'checked_in', checkin_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [now, id])

      const appointment = await db.get(`
        SELECT a.*, p.name as pet_name, o.name as owner_name FROM appointments a
        LEFT JOIN pets p ON a.pet_id = p.id
        LEFT JOIN owners o ON a.owner_id = o.id
        WHERE a.id = ?
      `, [id])

      await db.run('COMMIT')
      return { data: appointment }
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })

  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = request.params

    try {
      await db.run('BEGIN TRANSACTION')

      const existing = await db.get('SELECT * FROM appointments WHERE id = ?', [id])
      
      if (!existing) {
        await db.run('ROLLBACK')
        return reply.status(404).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 404 } })
      }

      if (!canTransition(existing.status, 'completed')) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: { message: `当前状态 ${existing.status} 无法完成`, code: 'INVALID_STATE_TRANSITION', statusCode: 400 }
        })
      }

      const now = new Date().toISOString()
      await db.run(`
        UPDATE appointments SET status = 'completed', checkout_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [now, id])

      const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id])

      await db.run('COMMIT')
      return { data: appointment }
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })

  fastify.post('/:id/cancel', { schema: { body: cancelSchema } }, async (request, reply) => {
    const { id } = request.params
    const { cancel_reason } = request.body

    try {
      await db.run('BEGIN TRANSACTION')

      const existing = await db.get('SELECT * FROM appointments WHERE id = ?', [id])
      
      if (!existing) {
        await db.run('ROLLBACK')
        return reply.status(404).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 404 } })
      }

      if (!canTransition(existing.status, 'cancelled')) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: { message: `当前状态 ${existing.status} 无法取消`, code: 'INVALID_STATE_TRANSITION', statusCode: 400 }
        })
      }

      await db.run(`
        UPDATE appointments SET status = 'cancelled', cancel_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [cancel_reason, id])

      const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id])

      await db.run('COMMIT')
      return { data: appointment }
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    try {
      await db.run('BEGIN TRANSACTION')

      const existing = await db.get('SELECT * FROM appointments WHERE id = ?', [id])
      
      if (!existing) {
        await db.run('ROLLBACK')
        return reply.status(404).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 404 } })
      }

      if (existing.status === 'completed') {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: { message: '已完成的预约无法删除，请使用取消功能', code: 'CANNOT_DELETE_COMPLETED', statusCode: 400 }
        })
      }

      const checkinsResult = await db.get('SELECT COUNT(*) as count FROM checkins WHERE appointment_id = ?', [id])
      const hasCheckins = checkinsResult.count > 0
      const vaccinationsResult = await db.get('SELECT COUNT(*) as count FROM vaccination_records WHERE appointment_id = ?', [id])
      const hasVaccinations = vaccinationsResult.count > 0

      if (hasCheckins || hasVaccinations) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: { message: '存在关联签到或接种记录，请使用取消功能', code: 'HAS_RELATED_RECORDS', statusCode: 400 }
        })
      }

      await db.run('DELETE FROM appointments WHERE id = ?', [id])

      await db.run('COMMIT')
      return { data: { id, message: '预约已删除' } }
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })
}
