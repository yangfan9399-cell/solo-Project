import { NextResponse } from 'next/server';
import { initDatabase } from '@/db/init';
import { db } from '@/db';
import { customers } from '@/db/schema';

export async function GET() {
  await initDatabase();
  const result = await db.select().from(customers);
  return NextResponse.json(result);
}
