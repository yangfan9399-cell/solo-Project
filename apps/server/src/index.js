import Fastify from 'fastify'
import cors from '@fastify/cors'
import { initSchema } from './db/schema.js'
import petRoutes from './routes/pets.js'
import ownerRoutes from './routes/owners.js'
import vaccineRoutes from './routes/vaccines.js'
import vaccineBatchRoutes from './routes/vaccineBatches.js'
import appointmentRoutes from './routes/appointments.js'
import checkinRoutes from './routes/checkins.js'
import contraindicationRoutes from './routes/contraindications.js'
import vaccinationRoutes from './routes/vaccinations.js'
import reminderRoutes from './routes/revisitReminders.js'
import reactionRoutes from './routes/adverseReactions.js'
import followUpRoutes from './routes/followUps.js'
import userRoutes from './routes/users.js'
import dashboardRoutes from './routes/dashboard.js'

const fastify = Fastify({
  logger: true
})

await fastify.register(cors, {
  origin: true,
  credentials: true
})

await initSchema()

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.register(petRoutes, { prefix: '/api/pets' })
fastify.register(ownerRoutes, { prefix: '/api/owners' })
fastify.register(vaccineRoutes, { prefix: '/api/vaccines' })
fastify.register(vaccineBatchRoutes, { prefix: '/api/vaccine-batches' })
fastify.register(appointmentRoutes, { prefix: '/api/appointments' })
fastify.register(checkinRoutes, { prefix: '/api/checkins' })
fastify.register(contraindicationRoutes, { prefix: '/api/contraindications' })
fastify.register(vaccinationRoutes, { prefix: '/api/vaccinations' })
fastify.register(reminderRoutes, { prefix: '/api/revisit-reminders' })
fastify.register(reactionRoutes, { prefix: '/api/adverse-reactions' })
fastify.register(followUpRoutes, { prefix: '/api/follow-ups' })
fastify.register(userRoutes, { prefix: '/api/users' })
fastify.register(dashboardRoutes, { prefix: '/api/dashboard' })

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  const statusCode = error.statusCode || 500
  reply.status(statusCode).send({
    error: {
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_ERROR',
      statusCode
    }
  })
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
