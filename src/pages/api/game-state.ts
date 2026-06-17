import type { APIRoute } from 'astro';
import type { Call, Extension, Action, LevelConfig } from '@/types/game';
import fs from 'node:fs';
import path from 'node:path';

const STORAGE_DIR = path.join(process.cwd(), '.data');
const GAME_STATE_FILE = path.join(STORAGE_DIR, 'game-state.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

interface GameState {
  isPlaying: boolean;
  timeRemaining: number;
  score: number;
  calls: Call[];
  extensions: Extension[];
  actions: Action[];
  currentLevel: LevelConfig;
  startTime: number;
}

export const GET: APIRoute = () => {
  ensureStorageDir();
  
  if (fs.existsSync(GAME_STATE_FILE)) {
    try {
      const content = fs.readFileSync(GAME_STATE_FILE, 'utf-8');
      const state = JSON.parse(content);
      return new Response(JSON.stringify(state), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ isPlaying: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response(JSON.stringify({ isPlaying: false }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  ensureStorageDir();
  
  try {
    const state = await request.json() as GameState;
    fs.writeFileSync(GAME_STATE_FILE, JSON.stringify(state, null, 2));
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = () => {
  ensureStorageDir();
  
  if (fs.existsSync(GAME_STATE_FILE)) {
    fs.unlinkSync(GAME_STATE_FILE);
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
