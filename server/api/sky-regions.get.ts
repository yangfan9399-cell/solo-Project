import { useDb } from '~/server/utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  return db.all('skyRegions').sort((a, b) => a.id - b.id)
})
