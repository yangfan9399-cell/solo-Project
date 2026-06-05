import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import prisma from '../lib/prisma.js'

const createMerchantSchema = z.object({
  name: z.string(),
  contactName: z.string(),
  phone: z.string(),
  email: z.string().email(),
  businessType: z.string()
})

export default async function merchantRoutes(server: FastifyInstance) {
  server.get('/', async () => {
    return await prisma.merchant.findMany({
      orderBy: { createdAt: 'desc' }
    })
  })

  server.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.merchant.findUnique({
      where: { id },
      include: { applications: true }
    })
  })

  server.post('/', async (request) => {
    const data = createMerchantSchema.parse(request.body)
    return await prisma.merchant.create({ data })
  })

  server.put('/:id', async (request) => {
    const { id } = request.params as { id: string }
    const data = createMerchantSchema.parse(request.body)
    return await prisma.merchant.update({ where: { id }, data })
  })

  server.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return await prisma.merchant.delete({ where: { id } })
  })
}
