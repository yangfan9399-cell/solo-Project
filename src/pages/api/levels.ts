import type { APIRoute } from 'astro';
import { LEVEL_CONFIGS } from '@/data/mockData';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(LEVEL_CONFIGS), {
    headers: { 'Content-Type': 'application/json' },
  });
};
