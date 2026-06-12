import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing query...')
    const records = await prisma.alarmRecord.findMany({
      include: {
        station: true,
        currentHandler: true
      },
      take: 1
    })
    
    console.log('Found records:', records.length)
    if (records.length > 0) {
      const r = records[0]
      console.log('Record:', r)
      console.log('occurrenceTime type:', typeof r.occurrenceTime)
      console.log('occurrenceTime value:', r.occurrenceTime)
      console.log('amount type:', typeof r.amount)
      console.log('amount value:', r.amount)
      console.log('updatedAt type:', typeof r.updatedAt)
      console.log('updatedAt value:', r.updatedAt)
      
      // Test the mapping
      const result = {
        id: r.id,
        recordNo: r.recordNo,
        title: r.title,
        status: r.status,
        occurrenceTime: r.occurrenceTime.toISOString ? r.occurrenceTime.toISOString() : r.occurrenceTime,
        amount: r.amount.toString ? r.amount.toString() : String(r.amount),
        updatedAt: r.updatedAt.toISOString ? r.updatedAt.toISOString() : r.updatedAt
      }
      console.log('Mapped result:', result)
    }
  } catch (e) {
    console.error('Error:', e)
    console.error('Stack:', e.stack)
  } finally {
    await prisma.$disconnect()
  }
}

test()
