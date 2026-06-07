import { useDb } from '../db';
import { compensationRules } from '../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const db = useDb();

  const result = await db.select()
    .from(compensationRules)
    .where(eq(compensationRules.isActive, true))
    .orderBy(compensationRules.id);

  return {
    success: true,
    data: result,
  };
});
