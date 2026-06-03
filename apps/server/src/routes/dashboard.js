import db from '../db/index.js'

export default async function (fastify, options) {
  fastify.get('/stats', async (request, reply) => {
    const today = new Date().toISOString().slice(0, 10)
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthStr = nextMonth.toISOString().slice(0, 10)

    const todayAppointments = (await db.get(`
      SELECT COUNT(*) as count FROM appointments WHERE appointment_date = @today
    `, { '@today': today })).count

    const pendingReminders = (await db.get(`
      SELECT COUNT(*) as count FROM revisit_reminders
      WHERE status = 'pending' AND reminder_date <= @today
    `, { '@today': today })).count

    const expiringBatches = (await db.get(`
      SELECT COUNT(*) as count FROM vaccine_batches
      WHERE expiry_date <= @nextMonth AND expiry_date >= @today AND status = 'normal'
      AND (quantity - used_quantity) > 0
    `, { '@nextMonth': nextMonthStr, '@today': today })).count

    const activeContraindications = (await db.get(`
      SELECT COUNT(*) as count FROM contraindications WHERE resolved = 0
    `)).count

    return {
      today_appointments: todayAppointments,
      pending_reminders: pendingReminders,
      expiring_batches: expiringBatches,
      active_contraindications: activeContraindications
    }
  })

  fastify.get('/weekly-appointments', async (request, reply) => {
    const today = new Date()
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date.toISOString().slice(0, 10))
    }

    const placeholders = days.map((_, i) => `@day${i}`).join(', ')
    const params = Object.fromEntries(days.map((day, i) => [`@day${i}`, day]))
    const results = await db.all(`
      SELECT appointment_date, COUNT(*) as count, appointment_type
      FROM appointments
      WHERE appointment_date IN (${placeholders})
      GROUP BY appointment_date, appointment_type
      ORDER BY appointment_date
    `, params)

    const dailyStats = {}
    days.forEach(day => {
      dailyStats[day] = {
        date: day,
        total: 0,
        by_type: {
          vaccination: 0,
          recheck: 0,
          consultation: 0
        }
      }
    })

    results.forEach(row => {
      if (dailyStats[row.appointment_date]) {
        dailyStats[row.appointment_date].total += row.count
        if (row.appointment_type in dailyStats[row.appointment_date].by_type) {
          dailyStats[row.appointment_date].by_type[row.appointment_type] = row.count
        }
      }
    })

    return {
      items: Object.values(dailyStats)
    }
  })

  fastify.get('/vaccine-usage', async (request, reply) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10)

    const results = await db.all(`
      SELECT v.id, v.name, v.type,
             COUNT(vr.id) as total_administered,
             SUM(vr.dose_volume) as total_volume
      FROM vaccines v
      LEFT JOIN vaccination_records vr ON v.id = vr.vaccine_id
      AND vr.administration_date >= @startDate
      GROUP BY v.id, v.name, v.type
      ORDER BY total_administered DESC
    `, { '@startDate': startDate })

    const totalAll = results.reduce((sum, r) => sum + r.total_administered, 0)

    const items = results.map(r => ({
      ...r,
      percentage: totalAll > 0 ? Math.round((r.total_administered / totalAll) * 100) : 0
    }))

    return {
      items,
      total_administered: totalAll
    }
  })
}
