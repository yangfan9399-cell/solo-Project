import initSqlJs from 'sql.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

let dbInstance: SqlJsDatabase | null = null;
let initPromise: Promise<void> | null = null;

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'game.db');

function loadFromDisk(): Buffer | undefined {
  if (fs.existsSync(DB_PATH)) {
    return fs.readFileSync(DB_PATH);
  }
  return undefined;
}

function saveToDisk(): void {
  if (dbInstance) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

export async function initDb(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        const localPath = path.resolve(
          process.cwd(),
          'node_modules',
          'sql.js',
          'dist',
          file
        );
        if (fs.existsSync(localPath)) {
          return localPath;
        }
        return `https://sql.js.org/dist/${file}`;
      },
    });

    const buffer = loadFromDisk();
    dbInstance = buffer ? new SQL.Database(buffer) : new SQL.Database();

    dbInstance.run('PRAGMA foreign_keys = ON;');
    dbInstance.run('PRAGMA synchronous = NORMAL;');

    saveToDisk();
  })();

  return initPromise;
}

function ensureDb(): SqlJsDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbInstance;
}

export interface StatementResult {
  lastInsertRowid: number | bigint;
  changes: number;
}

export interface PreparedStmt {
  get(...params: unknown[]): any;
  all(...params: unknown[]): any[];
  run(...params: unknown[]): StatementResult;
}

export function prepare(sql: string): PreparedStmt {
  const db = ensureDb();

  return {
    get(...params: unknown[]): any {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
      }
      let result: any;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },

    all(...params: unknown[]): any[] {
      const results: any[] = [];
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params as (string | number | null | Uint8Array)[]);
      }
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },

    run(...params: unknown[]): StatementResult {
      db.run(sql, params as (string | number | null | Uint8Array)[]);
      saveToDisk();
      return {
        lastInsertRowid: 0,
        changes: db.getRowsModified(),
      };
    },
  };
}

export function exec(sql: string): void {
  const db = ensureDb();
  db.exec(sql);
  saveToDisk();
}

export function getDb(): { prepare: typeof prepare; exec: typeof exec; run: (sql: string, params?: (string | number | null | Uint8Array)[]) => void } {
  ensureDb();
  return {
    prepare,
    exec,
    run(sql: string, params?: (string | number | null | Uint8Array)[]) {
      const db = ensureDb();
      db.run(sql, params);
      saveToDisk();
    },
  };
}

export function closeDb(): void {
  if (dbInstance) {
    saveToDisk();
    dbInstance.close();
    dbInstance = null;
  }
  initPromise = null;
}

export function getDbPath(): string {
  return DB_PATH;
}
