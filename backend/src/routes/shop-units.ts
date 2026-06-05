import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma.js'

const createShopUnitSchema = z.object({
  unitNumber: z.string(),
  floor: z.string(),
  area: z.number(),
  status: z.string().optional(),
  description: z.string().optional()
})

export default async function shopUnitRoutes(server: FastifyInstance) {
  server.get('/', async () => {
    return await prisma.shopUnit.findMany({
      orderBy: { unitNumber: 'asc' }
    })
  })

  server.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.shopUnit.findUnique({
      where: { id },
      include: { applications: true }
    })
  })

  server.post('/', async (request) => {
    const data = createShopUnitSchema.parse(request.body)
    return await prisma.shopUnit.create({ data })
  })

  server.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const data = createShopUnitSchema.parse(request.body)
    return await prisma.shopUnit.update({ where: { id }, data })
  })

  server.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.shopUnit.delete({ where: { id } })
  })
}
