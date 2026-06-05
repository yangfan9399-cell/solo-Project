import fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import prisma from './lib/prisma.js'

import applicationRoutes from './routes/applications.js'
import merchantRoutes from './routes/merchants.js'
import shopUnitRoutes from './routes/shop-units.js'
import userRoutes from './routes/users.js'

const server = fastify({ logger: true })

await server.register(cors, {
  origin: true,
  credentials: true
})

await server.register(sensible)

server.register(applicationRoutes, { prefix: '/api/applications' })
server.register(merchantRoutes, { prefix: '/api/merchants' })
server.register(shopUnitRoutes, { prefix: '/api/shop-units' })
server.register(userRoutes, { prefix: '/api/users' })

server.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3001')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
