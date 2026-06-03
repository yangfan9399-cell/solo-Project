import { z } from 'zod'
import dayjs from 'dayjs'
import db from '../db/index.js'
import { buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const vaccinationSchema = z.object({
  appointment_id: z.number().int().positive(),
  checkin_id: z.number().int().positive(),
  pet_id: z.number().int().positive(),
  vaccine_batch_id: z.number().int().positive(),
  vaccine_id: z.number().int().positive(),
  administration_date: z.string().min(1),
  administration_site: z.string().optional().nullable(),
  dose_volume: z.number().positive().optional().nullable(),
  given_by: z.number().int().positive(),
  next_due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

const vaccinationUpdateSchema = vaccinationSchema.partial()

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

export default async function vaccinationRoutes(fastify) {
  fastify.get('/', {
    schema: {
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(100).default(20),
        sort: z.string().optional(),
        appointment_id: z.coerce.number().int().positive().optional(),
        pet_id: z.coerce.number().int().positive().optional(),
        vaccine_id: z.coerce.number().int().positive().optional(),
        vaccine_batch_id: z.coerce.number().int().positive().optional(),
        given_by: z.coerce.number().int().positive().optional()
      }).passthrough()
    }
  }, async (request) => {
    const { page, pageSize, sort, ...filters } = request.query
    const allowedFilters = ['appointment_id', 'pet_id', 'vaccine_id', 'vaccine_batch_id', 'given_by']
    const { conditions, values } = buildWhereClause(filters, allowedFilters)
    const orderBy = buildOrderBy(sort, ['id', 'administration_date', 'created_at'])

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const baseQuery = `
      SELECT vr.*, v.name as vaccine_name, vb.batch_no as vaccine_batch_no,
             p.name as pet_name, u.name as given_by_name
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN pets p ON vr.pet_id = p.id
      LEFT JOIN users u ON vr.given_by = u.id
      ${whereClause}
      ORDER BY ${orderBy}
    `
    const countQuery = `SELECT COUNT(*) as total FROM vaccination_records vr ${whereClause}`
    const { total } = await db.get(countQuery, values)

    const paginatedQuery = paginate(baseQuery, page, pageSize)
    const records = await db.all(paginatedQuery, { ...values, '@limit': pageSize, '@offset': (page - 1) * pageSize })

    return {
      data: records,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const record = await db.get(`
      SELECT vr.*, v.name as vaccine_name, v.type as vaccine_type, vb.batch_no as vaccine_batch_no,
             vb.expiry_date as vaccine_expiry_date, vb.manufacture_date as vaccine_manufacture_date,
             p.name as pet_name, p.species as pet_species, p.breed as pet_breed,
             o.name as owner_name, o.phone as owner_phone,
             u.name as given_by_name, u.role as given_by_role
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN pets p ON vr.pet_id = p.id
      LEFT JOIN owners o ON p.owner_id = o.id
      LEFT JOIN users u ON vr.given_by = u.id
      WHERE vr.id = @id
    `, { '@id': id })

    if (!record) {
      return reply.status(404).send({ error: { message: '接种记录不存在', code: 'VACCINATION_NOT_FOUND', statusCode: 404 } })
    }

    const reminders = await db.all(`
      SELECT * FROM revisit_reminders
      WHERE vaccination_record_id = @vaccination_record_id
      ORDER BY reminder_date
    `, { '@vaccination_record_id': id })

    const reactions = await db.all(`
      SELECT * FROM adverse_reactions
      WHERE vaccination_record_id = @vaccination_record_id
      ORDER BY onset_time
    `, { '@vaccination_record_id': id })

    return { data: { ...record, reminders, reactions } }
  })

  fastify.post('/', {
    schema: { body: vaccinationSchema }
  }, async (request, reply) => {
    const { appointment_id, checkin_id, pet_id, vaccine_batch_id, vaccine_id, administration_date, administration_site, dose_volume, given_by, next_due_date, notes } = request.body

    let activeContraindications
    let computedNextDueDate
    let vaccinationResult

    try {
      await db.run('BEGIN TRANSACTION')

      const checkin = await db.get('SELECT * FROM checkins WHERE id = @id', { '@id': checkin_id })
      if (!checkin) {
        await db.run('ROLLBACK')
        return reply.status(400).send({ error: { message: '签到记录不存在', code: 'CHECKIN_NOT_FOUND', statusCode: 400 } })
      }

      const appointment = await db.get('SELECT * FROM appointments WHERE id = @id', { '@id': appointment_id })
      if (!appointment) {
        await db.run('ROLLBACK')
        return reply.status(400).send({ error: { message: '预约不存在', code: 'APPOINTMENT_NOT_FOUND', statusCode: 400 } })
      }

      if (!canTransition(appointment.status, 'completed')) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: {
            message: `当前预约状态 ${appointment.status} 无法完成接种`,
            code: 'INVALID_STATE_TRANSITION',
            statusCode: 400
          }
        })
      }

      const batch = await db.get(`
        SELECT vb.*, v.name as vaccine_name, v.interval_days, v.booster_doses
        FROM vaccine_batches vb
        JOIN vaccines v ON vb.vaccine_id = v.id
        WHERE vb.id = @id
      `, { '@id': vaccine_batch_id })

      if (!batch) {
        await db.run('ROLLBACK')
        return reply.status(400).send({ error: { message: '疫苗批次不存在', code: 'BATCH_NOT_FOUND', statusCode: 400 } })
      }

      if (batch.vaccine_id !== vaccine_id) {
        await db.run('ROLLBACK')
        return reply.status(400).send({ error: { message: '疫苗批次与疫苗不匹配', code: 'BATCH_VACCINE_MISMATCH', statusCode: 400 } })
      }

      if (batch.status !== 'normal') {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: {
            message: `疫苗批次状态异常: ${batch.status}`,
            code: 'BATCH_STATUS_INVALID',
            statusCode: 400
          }
        })
      }

      const today = dayjs().format('YYYY-MM-DD')
      if (dayjs(batch.expiry_date).isBefore(today)) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: {
            message: `疫苗批次已过期，过期日期: ${batch.expiry_date}`,
            code: 'BATCH_EXPIRED',
            statusCode: 400
          }
        })
      }

      const availableStock = batch.quantity - batch.used_quantity
      if (availableStock <= 0) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: {
            message: '疫苗批次库存不足',
            code: 'INSUFFICIENT_STOCK',
            statusCode: 400
          }
        })
      }

      activeContraindications = await db.all(`
        SELECT * FROM contraindications
        WHERE pet_id = @pet_id AND resolved = 0
        ORDER BY CASE severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END
      `, { '@pet_id': pet_id })

      const severeContraindications = activeContraindications.filter(c => c.severity === 'severe')
      if (severeContraindications.length > 0) {
        await db.run('ROLLBACK')
        return reply.status(400).send({
          error: {
            message: '存在严重禁忌症，禁止接种疫苗',
            code: 'CONTRAINDICATIONS_SEVERE',
            statusCode: 400,
            details: severeContraindications
          }
        })
      }

      computedNextDueDate = next_due_date || (batch.interval_days
        ? dayjs(administration_date).add(batch.interval_days, 'day').format('YYYY-MM-DD')
        : dayjs(administration_date).add(365, 'day').format('YYYY-MM-DD'))

      vaccinationResult = await db.run(`
        INSERT INTO vaccination_records
        (appointment_id, checkin_id, pet_id, vaccine_batch_id, vaccine_id, administration_date,
         administration_site, dose_volume, given_by, next_due_date, notes)
        VALUES (@appointment_id, @checkin_id, @pet_id, @vaccine_batch_id, @vaccine_id, @administration_date,
                @administration_site, @dose_volume, @given_by, @next_due_date, @notes)
      `, {
        '@appointment_id': appointment_id,
        '@checkin_id': checkin_id,
        '@pet_id': pet_id,
        '@vaccine_batch_id': vaccine_batch_id,
        '@vaccine_id': vaccine_id,
        '@administration_date': administration_date,
        '@administration_site': administration_site || null,
        '@dose_volume': dose_volume || null,
        '@given_by': given_by,
        '@next_due_date': computedNextDueDate,
        '@notes': notes || null
      })

      await db.run(`
        UPDATE vaccine_batches
        SET used_quantity = used_quantity + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `, { '@id': vaccine_batch_id })

      const followUpDate = dayjs(administration_date).add(7, 'day').format('YYYY-MM-DD')
      await db.run(`
        INSERT INTO revisit_reminders
        (pet_id, vaccination_record_id, reminder_date, reminder_type, status, notes)
        VALUES (@pet_id, @vaccination_record_id, @reminder_date, 'booster', 'pending', @notes)
      `, {
        '@pet_id': pet_id,
        '@vaccination_record_id': vaccinationResult.lastID,
        '@reminder_date': followUpDate,
        '@notes': '接种后一周回访'
      })

      await db.run(`
        INSERT INTO revisit_reminders
        (pet_id, vaccination_record_id, reminder_date, reminder_type, status, notes)
        VALUES (@pet_id, @vaccination_record_id, @reminder_date, 'booster', 'pending', @notes)
      `, {
        '@pet_id': pet_id,
        '@vaccination_record_id': vaccinationResult.lastID,
        '@reminder_date': computedNextDueDate,
        '@notes': '下次疫苗接种提醒'
      })

      await db.run(`
        UPDATE appointments
        SET status = 'completed', checkout_time = @checkout_time, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `, { '@checkout_time': administration_date, '@id': appointment_id })

      await db.run('COMMIT')
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }

    const record = await db.get(`
      SELECT vr.*, v.name as vaccine_name, vb.batch_no as vaccine_batch_no,
             p.name as pet_name, u.name as given_by_name
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN pets p ON vr.pet_id = p.id
      LEFT JOIN users u ON vr.given_by = u.id
      WHERE vr.id = @id
    `, { '@id': vaccinationResult.lastID })

    const warnings = activeContraindications.length > 0
      ? {
          message: '存在中度或轻度禁忌症，已完成接种但需密切观察',
          contraindications: activeContraindications
        }
      : null

    return reply.status(201).send({ data: { ...record, warnings } })
  })

  fastify.put('/:id', {
    schema: { body: vaccinationUpdateSchema }
  }, async (request, reply) => {
    const { id } = request.params
    const body = request.body

    const existing = await db.get('SELECT * FROM vaccination_records WHERE id = @id', { '@id': id })
    if (!existing) {
      return reply.status(404).send({ error: { message: '接种记录不存在', code: 'VACCINATION_NOT_FOUND', statusCode: 404 } })
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
      await db.run(`UPDATE vaccination_records SET ${updateFields.join(', ')} WHERE id = @id`, updateValues)
    }

    const record = await db.get(`
      SELECT vr.*, v.name as vaccine_name, vb.batch_no as vaccine_batch_no,
             p.name as pet_name, u.name as given_by_name
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN pets p ON vr.pet_id = p.id
      LEFT JOIN users u ON vr.given_by = u.id
      WHERE vr.id = @id
    `, { '@id': id })

    return { data: record }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const existing = await db.get('SELECT * FROM vaccination_records WHERE id = @id', { '@id': id })
    if (!existing) {
      return reply.status(404).send({ error: { message: '接种记录不存在', code: 'VACCINATION_NOT_FOUND', statusCode: 404 } })
    }

    try {
      await db.run('BEGIN TRANSACTION')

      await db.run('DELETE FROM follow_up_calls WHERE revisit_reminder_id IN (SELECT id FROM revisit_reminders WHERE vaccination_record_id = @id)', { '@id': id })
      await db.run('DELETE FROM follow_up_calls WHERE adverse_reaction_id IN (SELECT id FROM adverse_reactions WHERE vaccination_record_id = @id)', { '@id': id })
      await db.run('DELETE FROM revisit_reminders WHERE vaccination_record_id = @id', { '@id': id })
      await db.run('DELETE FROM adverse_reactions WHERE vaccination_record_id = @id', { '@id': id })
      await db.run('DELETE FROM vaccination_records WHERE id = @id', { '@id': id })

      await db.run(`
        UPDATE vaccine_batches
        SET used_quantity = used_quantity - 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `, { '@id': existing.vaccine_batch_id })

      const { count } = await db.get('SELECT COUNT(*) as count FROM vaccination_records WHERE appointment_id = @appointment_id', { '@appointment_id': existing.appointment_id })
      if (count === 0) {
        const { count: checkinCount } = await db.get('SELECT COUNT(*) as count FROM checkins WHERE appointment_id = @appointment_id', { '@appointment_id': existing.appointment_id })
        const newStatus = checkinCount > 0 ? 'checked_in' : 'scheduled'
        await db.run(`
          UPDATE appointments
          SET status = @status, checkout_time = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `, { '@status': newStatus, '@id': existing.appointment_id })
      }

      await db.run('COMMIT')
      return { data: { id, message: '接种记录已删除' } }
    } catch (error) {
      await db.run('ROLLBACK')
      throw error
    }
  })
}
