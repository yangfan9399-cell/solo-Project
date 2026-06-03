import { z } from 'zod'
import db from '../db/index.js'
import { buildWhereClause, buildOrderBy, paginate } from '../utils/queryBuilder.js'

const petSchema = z.object({
  owner_id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().max(100).optional().nullable(),
  gender: z.enum(['male', 'female', 'unknown']).optional().nullable(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  microchip_id: z.string().max(50).optional().nullable(),
  neutered: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable()
})

const petUpdateSchema = petSchema.partial()

const querySchema = z.object({
  search: z.string().optional(),
  species: z.enum(['dog', 'cat', 'other']).optional(),
  owner_id: z.string().regex(/^\d+$/).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  sort: z.string().optional()
})

export default async function petRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    const query = querySchema.parse(request.query)
    const { search, species, owner_id, page = 1, pageSize = 20, sort } = query

    const filters = {}
    if (search) filters.name_like = search
    if (species) filters.species = species
    if (owner_id) filters.owner_id = parseInt(owner_id)

    const allowedFilters = ['name_like', 'species', 'owner_id']
    const { conditions, values } = buildWhereClause(filters, allowedFilters)
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const allowedSorts = ['id', 'name', 'species', 'breed', 'created_at', 'updated_at']
    const orderBy = buildOrderBy(sort, allowedSorts)

    const countSql = `SELECT COUNT(*) as total FROM pets ${whereClause}`
    const totalResult = await db.get(countSql, values)
    const total = totalResult.total

    const baseSql = `
      SELECT p.*, o.name as owner_name, o.phone as owner_phone
      FROM pets p LEFT JOIN owners o ON p.owner_id = o.id
      ${whereClause} ORDER BY ${orderBy}
    `
    const paginatedSql = paginate(baseSql, parseInt(page), parseInt(pageSize))
    const pets = await db.all(paginatedSql, {
      ...values,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    })

    return {
      data: pets,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params

    const pet = await db.get(`
      SELECT p.*, 
             o.name as owner_name,
             o.phone as owner_phone,
             o.id_card as owner_id_card,
             o.address as owner_address
      FROM pets p
      LEFT JOIN owners o ON p.owner_id = o.id
      WHERE p.id = ?
    `, id)

    if (!pet) {
      reply.status(404)
      throw new Error('Pet not found')
    }

    const owner = {
      id: pet.owner_id,
      name: pet.owner_name,
      phone: pet.owner_phone,
      id_card: pet.owner_id_card,
      address: pet.owner_address
    }

    const vaccinations = await db.all(`
      SELECT vr.*,
             v.name as vaccine_name,
             v.manufacturer as vaccine_manufacturer,
             v.type as vaccine_type,
             vb.batch_no as vaccine_batch_no,
             u.name as given_by_name
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN users u ON vr.given_by = u.id
      WHERE vr.pet_id = ?
      ORDER BY vr.administration_date DESC
    `, id)

    const contraindications = await db.all(`
      SELECT c.*, u.name as noted_by_name
      FROM contraindications c
      LEFT JOIN users u ON c.noted_by = u.id
      WHERE c.pet_id = ?
      ORDER BY c.created_at DESC
    `, id)

    const appointments = await db.all(`
      SELECT a.*, v.name as vaccine_name
      FROM appointments a
      LEFT JOIN vaccines v ON a.vaccine_id = v.id
      WHERE a.pet_id = ?
      ORDER BY a.appointment_date DESC
    `, id)

    const { owner_name, owner_phone, owner_id_card, owner_address, ...petData } = pet

    return {
      ...petData,
      owner,
      vaccinations,
      contraindications,
      appointments
    }
  })

  fastify.post('/', async (request, reply) => {
    const data = petSchema.parse(request.body)

    const owner = await db.get('SELECT id FROM owners WHERE id = ?', data.owner_id)
    if (!owner) {
      reply.status(404)
      throw new Error('Owner not found')
    }

    const existingMicrochip = data.microchip_id 
      ? await db.get('SELECT id FROM pets WHERE microchip_id = ?', data.microchip_id)
      : null
    if (existingMicrochip) {
      reply.status(409)
      throw new Error('Microchip ID already exists')
    }

    const sql = `
      INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, weight, color, microchip_id, neutered, notes)
      VALUES (@owner_id, @name, @species, @breed, @gender, @birth_date, @weight, @color, @microchip_id, @neutered, @notes)
    `

    const result = await db.run(sql, {
      ...data,
      neutered: data.neutered ? 1 : 0
    })

    const pet = await db.get('SELECT * FROM pets WHERE id = ?', result.lastID)
    reply.status(201)
    return pet
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const data = petUpdateSchema.parse(request.body)

    const existing = await db.get('SELECT * FROM pets WHERE id = ?', id)
    if (!existing) {
      reply.status(404)
      throw new Error('Pet not found')
    }

    if (data.owner_id !== undefined) {
      const owner = await db.get('SELECT id FROM owners WHERE id = ?', data.owner_id)
      if (!owner) {
        reply.status(404)
        throw new Error('Owner not found')
      }
    }

    if (data.microchip_id !== undefined && data.microchip_id !== existing.microchip_id) {
      const existingMicrochip = await db.get('SELECT id FROM pets WHERE microchip_id = ? AND id != ?', [data.microchip_id, id])
      if (existingMicrochip) {
        reply.status(409)
        throw new Error('Microchip ID already exists')
      }
    }

    const updateFields = []
    const updateValues = {}

    Object.entries(data).forEach(([key, value]) => {
      updateFields.push(`${key} = @${key}`)
      updateValues[key] = key === 'neutered' ? (value ? 1 : 0) : value
    })

    if (updateFields.length === 0) {
      return existing
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')

    const sql = `UPDATE pets SET ${updateFields.join(', ')} WHERE id = @id`
    await db.run(sql, { ...updateValues, id })

    return await db.get('SELECT * FROM pets WHERE id = ?', id)
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params

    const existing = await db.get('SELECT id FROM pets WHERE id = ?', id)
    if (!existing) {
      reply.status(404)
      throw new Error('Pet not found')
    }

    await db.run('DELETE FROM pets WHERE id = ?', id)
    reply.status(204)
    return null
  })

  fastify.get('/:id/contraindications', async (request, reply) => {
    const { id } = request.params

    const pet = await db.get('SELECT id FROM pets WHERE id = ?', id)
    if (!pet) {
      reply.status(404)
      throw new Error('Pet not found')
    }

    const contraindications = await db.all(`
      SELECT c.*,
             u.name as noted_by_name
      FROM contraindications c
      LEFT JOIN users u ON c.noted_by = u.id
      WHERE c.pet_id = ?
      ORDER BY c.created_at DESC
    `, id)

    return { data: contraindications }
  })

  fastify.get('/:id/vaccination-history', async (request, reply) => {
    const { id } = request.params

    const pet = await db.get('SELECT id FROM pets WHERE id = ?', id)
    if (!pet) {
      reply.status(404)
      throw new Error('Pet not found')
    }

    const vaccinations = await db.all(`
      SELECT vr.*,
             v.name as vaccine_name,
             v.manufacturer as vaccine_manufacturer,
             v.type as vaccine_type,
             vb.batch_no as vaccine_batch_no,
             vb.expiry_date as vaccine_batch_expiry,
             u.name as given_by_name,
             a.appointment_date,
             a.appointment_type
      FROM vaccination_records vr
      LEFT JOIN vaccines v ON vr.vaccine_id = v.id
      LEFT JOIN vaccine_batches vb ON vr.vaccine_batch_id = vb.id
      LEFT JOIN users u ON vr.given_by = u.id
      LEFT JOIN appointments a ON vr.appointment_id = a.id
      WHERE vr.pet_id = ?
      ORDER BY vr.administration_date DESC
    `, id)

    return { data: vaccinations }
  })
}
