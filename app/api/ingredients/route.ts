import { NextResponse } from 'next/server';
import { getAllIngredients } from '@/lib/data-store';

export async function GET() {
  try {
    const ingredients = await getAllIngredients();
    return NextResponse.json({ ingredients });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ingredients', details: String(error) },
      { status: 500 }
    );
  }
}
