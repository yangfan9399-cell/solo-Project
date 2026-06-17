import type { APIRoute } from 'astro';
import { DEFAULT_PLAYER } from '@/data/mockData';
import type { PlayerProfile } from '@/types/game';

const STORAGE_KEY = 'telephone-operator-player';

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const profile = JSON.parse(stored);
      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify(DEFAULT_PLAYER), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response(JSON.stringify(DEFAULT_PLAYER), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const profile = await request.json() as PlayerProfile;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = () => {
  localStorage.removeItem(STORAGE_KEY);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
