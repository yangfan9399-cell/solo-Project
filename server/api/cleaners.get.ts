import { useDb } from '../db';
import { cleaners } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const city = query.city as string;

  const db = useDb();

  let result;
  if (city) {
    result = await db.select().from(cleaners).where(eq(cleaners.city, city)).orderBy(cleaners.id);
  } else {
    result = await db.select().from(cleaners).orderBy(cleaners.id);
  }

  return {
    success: true,
    data: result,
  };
});
