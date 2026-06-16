import { loadDb } from '~/server/utils/db'

export default defineNitroPlugin(() => {
  loadDb()
  console.log('✓ 数据存储已加载')
})
