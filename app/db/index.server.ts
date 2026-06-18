import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "vinyl_cleaning.json");

export interface Tables {
  vinyl_records: any[];
  cleaning_solutions: any[];
  cleaning_batches: any[];
  batch_versions: any[];
  audition_logs: any[];
  maintenance_reminders: any[];
}

const DEFAULT_DB: Tables = {
  vinyl_records: [],
  cleaning_solutions: [],
  cleaning_batches: [],
  batch_versions: [],
  audition_logs: [],
  maintenance_reminders: [],
};

let memoryCache: Tables | null = null;
let lastModified = 0;

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

export function loadDb(): Tables {
  ensureDir();
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial: Tables = JSON.parse(JSON.stringify(DEFAULT_DB));
      saveDb(initial);
      return initial;
    }
    const stat = fs.statSync(DB_PATH);
    if (memoryCache && stat.mtimeMs === lastModified) {
      return memoryCache;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed: Tables = { ...DEFAULT_DB, ...JSON.parse(raw) };
    memoryCache = parsed;
    lastModified = stat.mtimeMs;
    return parsed;
  } catch (e) {
    const fallback: Tables = JSON.parse(JSON.stringify(DEFAULT_DB));
    memoryCache = fallback;
    return fallback;
  }
}

export function saveDb(db: Tables) {
  ensureDir();
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
  memoryCache = db;
  try {
    lastModified = fs.statSync(DB_PATH).mtimeMs;
  } catch {
    lastModified = Date.now();
  }
}

export function nextId(table: any[]): number {
  if (table.length === 0) return 1;
  return Math.max(...table.map((r: any) => r.id || 0)) + 1;
}

export function datetimeNow(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

interface Stmt {
  run(params?: Record<string, any> | any[]): { lastInsertRowid: number; changes: number };
  all(params?: Record<string, any> | any[]): any[];
  get(params?: Record<string, any> | any[]): any;
}

function resolveParam(sql: string, param: any, params?: Record<string, any> | any[]): any {
  if (param instanceof Array && params instanceof Array) return params[Number(param.slice(1)) - 1] ?? null;
  if (param.startsWith("@") && params && !(params instanceof Array)) {
    return (params as Record<string, any>)[param.slice(1)] ?? null;
  }
  return param;
}

export function exec(sql: string) {
  const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    if (/^CREATE\s+TABLE/i.test(stmt) || /^CREATE\s+INDEX/i.test(stmt) || /^PRAGMA/i.test(stmt)) {
      continue;
    }
  }
}

export function prepare(sql: string): Stmt {
  const insertMatch = sql.match(/^INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  const selectMatch = sql.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
  const updateMatch = sql.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i);
  const deleteMatch = sql.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/i);

  const joinMatch = sql.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)\s+(?:AS\s+\w+\s+)?(JOIN\s+.+)$/is);

  return {
    run(params?: Record<string, any> | any[]) {
      if (insertMatch) {
        const tableName = insertMatch[1] as keyof Tables;
        const cols = insertMatch[2].split(",").map((s) => s.trim());
        const vals = insertMatch[3].split(",").map((s) => s.trim());
        const db = loadDb();
        const table = db[tableName];
        const id = nextId(table);
        const row: any = { id };
        cols.forEach((col, i) => {
          let v = vals[i];
          if (v.startsWith("@") || v.match(/^\?\d+$/)) {
            v = resolveParam(sql, v, params);
          } else if (v === "datetime('now')" || v === "datetime(\'now\')") {
            v = datetimeNow();
          } else if (v.startsWith("'") && v.endsWith("'")) {
            v = v.slice(1, -1);
          }
          row[col] = v;
        });
        table.push(row);
        saveDb(db);
        return { lastInsertRowid: id, changes: 1 };
      }

      if (updateMatch) {
        const tableName = updateMatch[1] as keyof Tables;
        const sets = updateMatch[2];
        const whereClause = updateMatch[3];
        const db = loadDb();
        const table = db[tableName];
        const setPairs = sets.split(",").map((s) => {
          const [k, v] = s.split("=").map((p) => p.trim());
          return [k, v];
        });
        let changes = 0;
        for (const row of table) {
          if (whereClause ? evalWhere(whereClause, row, params) : true) {
            for (const [k, v] of setPairs) {
              let val: any = v;
              if (val.startsWith("@") || val.match(/^\?\d+$/)) {
                val = resolveParam(sql, val, params);
              } else if (val === "datetime('now')" || val === "datetime(\'now\')") {
                val = datetimeNow();
              } else if (val.startsWith("'") && val.endsWith("'")) {
                val = val.slice(1, -1);
              }
              row[k] = val;
            }
            changes++;
          }
        }
        if (changes > 0) saveDb(db);
        return { lastInsertRowid: 0, changes };
      }

      if (deleteMatch) {
        const tableName = deleteMatch[1] as keyof Tables;
        const whereClause = deleteMatch[2];
        const db = loadDb();
        const table = db[tableName];
        const before = table.length;
        if (whereClause) {
          db[tableName] = table.filter((row: any) => !evalWhere(whereClause, row, params)) as any;
        } else {
          db[tableName] = [] as any;
        }
        const changes = before - db[tableName].length;
        if (changes > 0) saveDb(db);
        return { lastInsertRowid: 0, changes };
      }

      return { lastInsertRowid: 0, changes: 0 };
    },

    all(params?: Record<string, any> | any[]) {
      if (joinMatch) {
        return evalJoinQuery(sql, params);
      }
      if (selectMatch) {
        const tableName = selectMatch[2] as keyof Tables;
        const whereClause = selectMatch[3];
        const orderClause = selectMatch[4];
        const limit = selectMatch[5] ? Number(selectMatch[5]) : Infinity;
        const db = loadDb();
        let table = [...(db[tableName] as any[])];
        if (whereClause) table = table.filter((row) => evalWhere(whereClause, row, params));
        if (orderClause) table = sortByClause(table, orderClause);
        return table.slice(0, limit);
      }
      return [];
    },

    get(params?: Record<string, any> | any[]) {
      return this.all(params)[0];
    },
  };
}

function sortByClause(table: any[], clause: string): any[] {
  const parts = clause.split(",").map((s) => s.trim());
  return [...table].sort((a, b) => {
    for (const part of parts) {
      const [col, dir] = part.split(/\s+/);
      const va = a[col];
      const vb = b[col];
      if (va < vb) return dir?.toUpperCase() === "DESC" ? 1 : -1;
      if (va > vb) return dir?.toUpperCase() === "DESC" ? -1 : 1;
    }
    return 0;
  });
}

function evalWhere(where: string, row: any, params?: Record<string, any> | any[]): boolean {
  const tokens = tokenizeWhere(where);
  return evalTokens(tokens, row, params);
}

function tokenizeWhere(s: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    if (s[i] === "(" || s[i] === ")") { tokens.push(s[i]); i++; continue; }
    const m = s.slice(i).match(/^(AND|OR|NOT|IN|LIKE|BETWEEN|IS NULL|IS NOT NULL|>=|<=|<>|!=|=|>|<)/i);
    if (m) { tokens.push(m[0]); i += m[0].length; continue; }
    const str = s.slice(i).match(/^'([^']*)'/);
    if (str) { tokens.push("'" + str[1] + "'"); i += str[0].length; continue; }
    const num = s.slice(i).match(/^-?\d+(\.\d+)?/);
    if (num) { tokens.push(num[0]); i += num[0].length; continue; }
    const param = s.slice(i).match(/^(@\w+|\?\d+)/);
    if (param) { tokens.push(param[0]); i += param[0].length; continue; }
    const id = s.slice(i).match(/^[A-Za-z_][\w.]*/);
    if (id) { tokens.push(id[0]); i += id[0].length; continue; }
    const like = s.slice(i).match(/^%[\w\u4e00-\u9fa5]*%?/);
    if (like) { tokens.push(like[0]); i += like[0].length; continue; }
    i++;
  }
  return tokens;
}

function resolveValue(tok: string, row: any, params?: Record<string, any> | any[]): any {
  if (tok.startsWith("'") && tok.endsWith("'")) return tok.slice(1, -1);
  if (!isNaN(Number(tok))) return Number(tok);
  if (tok === "NULL" || tok === "null") return null;
  if (tok.startsWith("@") && params && !(params instanceof Array)) {
    return (params as Record<string, any>)[tok.slice(1)] ?? null;
  }
  if (tok.match(/^\?\d+$/) && params instanceof Array) {
    return params[Number(tok.slice(1)) - 1] ?? null;
  }
  if (row && tok.includes(".")) {
    const parts = tok.split(".");
    if (parts[0] in row || row[parts[1]] !== undefined) return row[parts[1]];
  }
  return row[tok];
}

function evalTokens(tokens: string[], row: any, params?: Record<string, any> | any[]): boolean {
  let i = 0;
  function parseOr(): boolean {
    let left = parseAnd();
    while (i < tokens.length && tokens[i].toUpperCase() === "OR") {
      i++;
      const right = parseAnd();
      left = left || right;
    }
    return left;
  }
  function parseAnd(): boolean {
    let left = parseNot();
    while (i < tokens.length && tokens[i].toUpperCase() === "AND") {
      i++;
      const right = parseNot();
      left = left && right;
    }
    return left;
  }
  function parseNot(): boolean {
    if (i < tokens.length && tokens[i].toUpperCase() === "NOT") {
      i++;
      return !parseNot();
    }
    return parsePrimary();
  }
  function parsePrimary(): boolean {
    if (i < tokens.length && tokens[i] === "(") {
      i++;
      const val = parseOr();
      if (i < tokens.length && tokens[i] === ")") i++;
      return val;
    }
    const leftTok = tokens[i++];
    if (i < tokens.length && tokens[i].toUpperCase() === "IS") {
      i++;
      if (tokens[i]?.toUpperCase() === "NOT") { i++; }
      if (tokens[i]?.toUpperCase() === "NULL") { i++; return false; }
    }
    const op = tokens[i++];
    const rightTok = tokens[i++];
    const left = resolveValue(leftTok, row, params);
    const right = resolveValue(rightTok, row, params);
    switch (op) {
      case "=": return left == right;
      case "!=": case "<>": return left != right;
      case ">": return left > right;
      case "<": return left < right;
      case ">=": return left >= right;
      case "<=": return left <= right;
      case "LIKE": {
        const pattern = (right as string).replace(/%/g, ".*").replace(/_/g, ".");
        return new RegExp("^" + pattern + "$", "i").test(String(left ?? ""));
      }
    }
    return false;
  }
  return parseOr();
}

function evalJoinQuery(sql: string, params?: Record<string, any> | any[]): any[] {
  const fromMatch = sql.match(/FROM\s+(\w+)(?:\s+AS\s+(\w+))?/i);
  const joins = [...sql.matchAll(/(?:(?:LEFT|RIGHT|INNER|OUTER)\s+)?JOIN\s+(\w+)(?:\s+AS\s+(\w+))?\s+ON\s+(.+?)(?=\s+(?:JOIN|WHERE|ORDER|LIMIT|$))/gis)];
  const whereMatch = sql.match(/\bWHERE\s+(.+?)(?=\s+(?:ORDER|LIMIT|$))/is);
  const orderMatch = sql.match(/\bORDER\s+BY\s+(.+?)(?=\s+LIMIT|$)/is);
  const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i);

  if (!fromMatch) return [];
  const fromTable = fromMatch[1] as keyof Tables;
  const fromAlias = fromMatch[2] || fromTable;

  const db = loadDb();
  let results = (db[fromTable] as any[]).map((row) => ({ ...row, [fromAlias]: { ...row } }));

  for (const jm of joins) {
    const jTable = jm[1] as keyof Tables;
    const jAlias = jm[2] || jTable;
    const onClause = jm[3].trim();
    const jRows = db[jTable] as any[];
    const joined: any[] = [];
    for (const lrow of results) {
      let matched = false;
      for (const rrow of jRows) {
        const combined: any = { ...lrow };
        for (const k of Object.keys(rrow)) combined[k] = rrow[k];
        combined[jAlias] = { ...rrow };
        if (evalWhere(onClause, combined, params)) {
          joined.push(combined);
          matched = true;
        }
      }
      if (!matched) joined.push(lrow);
    }
    results = joined;
  }

  if (whereMatch) {
    results = results.filter((row) => evalWhere(whereMatch[1], row, params));
  }
  if (orderMatch) {
    results = sortByClause(results, orderMatch[1]);
  }
  if (limitMatch) {
    results = results.slice(0, Number(limitMatch[1]));
  }

  const colsMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s/i);
  if (colsMatch && colsMatch[1].trim() !== "*") {
    const cols = colsMatch[1].split(",").map((s) => s.trim());
    results = results.map((row) => {
      const out: any = {};
      for (const colSpec of cols) {
        const m = colSpec.match(/(?:(\w+)\.)?(\w+)(?:\s+AS\s+(\w+))?/i);
        if (!m) continue;
        let val: any;
        if (m[1] && row[m[1]]) {
          val = row[m[1]][m[2]];
        } else {
          val = row[m[2]];
        }
        out[m[3] || m[2]] = val;
      }
      return out;
    });
  }
  return results;
}

export default {
  exec,
  prepare,
  pragma: () => {},
};
