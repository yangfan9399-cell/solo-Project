import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/data';

export async function GET() {
  const customers = getCustomers();
  return NextResponse.json(customers);
}
