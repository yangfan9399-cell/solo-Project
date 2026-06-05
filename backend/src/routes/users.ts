import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma.js'

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['MERCHANT', 'INVESTMENT_MANAGER', 'ENGINEER', 'FIRE_INSPECTOR']),
  phone: z.string().optional()
})

export default async function userRoutes(server: FastifyInstance) {
  server.get('/', async () => {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
  })

  server.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.user.findUnique({
      where: { id }
    })
  })

  server.get('/role/:role', async (request) => {
    const { role } = request.params as { role: string }
    return await prisma.user.findMany({
      where: { role: role as any },
      orderBy: { name: 'asc' }
    })
  })

  server.post('/', async (request) => {
    const data = createUserSchema.parse(request.body)
    return await prisma.user.create({ data })
  })

  server.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const data = createUserSchema.parse(request.body)
    return await prisma.user.update({ where: { id }, data })
  })

  server.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.user.delete({ where: { id } })
  })
}
