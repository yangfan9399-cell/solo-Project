import { useDb } from '~/server/utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  return db.all('playerProfiles').sort((a: any, b: any) => a.id - b.id)
})
