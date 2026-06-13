import { dataService } from './server/utils/dataService'

async function test() {
  console.log('Testing dataService...')
  try {
    const stats = await dataService.getStats()
    console.log('Stats overview:', stats.overview)
    console.log('Status stats count:', stats.statusStats.length)

    const records = await dataService.findRecords({ page: 1, pageSize: 5 })
    console.log('Records total:', records.total)
    console.log('First record:', records.data[0]?.recordNo)

    const detail = await dataService.findRecordById(1)
    console.log('Detail record:', detail?.recordNo)
    console.log('Detail nodes:', detail?.reviewNodes?.length)

    console.log('✅ All tests passed!')
  } catch (e) {
    console.error('❌ Test failed:', e)
  }
}

test()
