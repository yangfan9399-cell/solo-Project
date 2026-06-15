import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'database.json');

export interface DatabaseData {
  masters: any[];
  details: any[];
  histories: any[];
  results: any[];
  snapshots: any[];
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function loadDb(): DatabaseData {
  ensureDataDir();
  if (!fs.existsSync(dataFile)) {
    const initial: DatabaseData = {
      masters: [],
      details: [],
      histories: [],
      results: [],
      snapshots: [],
    };
    saveDb(initial);
    return initial;
  }
  const content = fs.readFileSync(dataFile, 'utf-8');
  return JSON.parse(content);
}

export function saveDb(data: DatabaseData) {
  ensureDataDir();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function now(): string {
  return new Date().toISOString();
}
