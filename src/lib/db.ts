import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'database.json');

export interface DatabaseData {
  projects: any[];
  units: any[];
  relations: any[];
  artifacts: any[];
  photos: any[];
  versionHistory: any[];
}

let cachedDb: DatabaseData | null = null;
let lastModified = 0;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function defaultData(): DatabaseData {
  return {
    projects: [],
    units: [],
    relations: [],
    artifacts: [],
    photos: [],
    versionHistory: []
  };
}

export function getDb(): DatabaseData {
  ensureDataDir();
  
  if (!fs.existsSync(dbFile)) {
    const data = defaultData();
    saveDb(data);
    return data;
  }
  
  const stats = fs.statSync(dbFile);
  if (cachedDb && stats.mtimeMs === lastModified) {
    return cachedDb;
  }
  
  try {
    const content = fs.readFileSync(dbFile, 'utf-8');
    cachedDb = JSON.parse(content);
    lastModified = stats.mtimeMs;
    return cachedDb;
  } catch (e) {
    console.error('Failed to read database:', e);
    const data = defaultData();
    saveDb(data);
    return data;
  }
}

export function saveDb(data: DatabaseData): void {
  ensureDataDir();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
  const stats = fs.statSync(dbFile);
  lastModified = stats.mtimeMs;
  cachedDb = data;
}

export function resetDb(): void {
  cachedDb = null;
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }
}
