import type { Player, GameState, GameResult, Level } from '../types';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), '.data');

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = join(DATA_DIR, filename);
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e);
  }
  return defaultValue;
}

function writeJsonFile<T>(filename: string, value: T): void {
  ensureDataDir();
  const filePath = join(DATA_DIR, filename);
  try {
    writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${filename}:`, e);
  }
}

export function getPlayer(): Player | null {
  return readJsonFile<Player | null>('player.json', null);
}

export function savePlayer(player: Player): void {
  writeJsonFile('player.json', player);
}

export function getLevels(): Level[] {
  return readJsonFile<Level[]>('levels.json', []);
}

export function saveLevels(levels: Level[]): void {
  writeJsonFile('levels.json', levels);
}

export function getGameState(gameId: string): GameState | null {
  return readJsonFile<GameState | null>(`game_${gameId}.json`, null);
}

export function saveGameState(state: GameState): void {
  writeJsonFile(`game_${state.id}.json`, state);
}

export function removeGameState(gameId: string): void {
  ensureDataDir();
  const filePath = join(DATA_DIR, `game_${gameId}.json`);
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (e) {
    console.error(`Error removing game_${gameId}.json:`, e);
  }
}

export function getGameHistory(): GameResult[] {
  return readJsonFile<GameResult[]>('history.json', []);
}

export function saveGameResult(result: GameResult): void {
  const history = getGameHistory();
  history.unshift(result);
  if (history.length > 100) {
    history.pop();
  }
  writeJsonFile('history.json', history);
}

export function isSeedInitialized(): boolean {
  return readJsonFile<boolean>('seed_initialized.json', false);
}

export function markSeedInitialized(): void {
  writeJsonFile('seed_initialized.json', true);
}
