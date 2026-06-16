import type { APIRoute } from 'astro';
import type { GameSession } from '@/types/game';

const sessions = new Map<string, GameSession[]>();

export const POST: APIRoute = async ({ request }) => {
  const session = (await request.json()) as GameSession;

  const existing = sessions.get(session.playerId) || [];
  existing.push(session);
  sessions.set(session.playerId, existing);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const GET: APIRoute = async ({ url }) => {
  const playerId = url.searchParams.get('playerId');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'playerId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const playerSessions = sessions.get(playerId) || [];

  return new Response(JSON.stringify(playerSessions), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
