import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'woodtype.db');
const DB_SAVE_PATH = path.join(DATA_DIR, 'woodtype.sqlite');

let dbInstance: any = null;
let SQL: any = null;

interface PreparedStatement {
  all(...params: any[]): any[];
  get(...params: any[]): any;
  run(...params: any[]): { changes: number; lastInsertRowid: number };
}

interface Database {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
  pragma(sql: string): void;
  save(): void;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  return initDb();
}

export async function initDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  
  SQL = await initSqlJs();
  
  let db: any;
  
  if (fs.existsSync(DB_SAVE_PATH)) {
    const fileBuffer = fs.readFileSync(DB_SAVE_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema(db);
    seedData(db);
    saveDatabase(db);
  }
  
  dbInstance = wrapDb(db);
  return dbInstance;
}

function saveDatabase(db: any) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_SAVE_PATH, buffer);
  } catch (e) {
    console.warn('Failed to save database:', e);
  }
}

function wrapDb(db: any): Database {
  let saveTimeout: any = null;
  
  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveDatabase(db);
    }, 100);
  }
  
  return {
    prepare(sql: string): PreparedStatement {
      const stmt = db.prepare(sql);
      
      return {
        all(...params: any[]): any[] {
          stmt.bind(params);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.reset();
          return results;
        },
        
        get(...params: any[]): any {
          stmt.bind(params);
          if (stmt.step()) {
            const result = stmt.getAsObject();
            stmt.reset();
            return result;
          }
          stmt.reset();
          return undefined;
        },
        
        run(...params: any[]): { changes: number; lastInsertRowid: number } {
          stmt.bind(params);
          stmt.step();
          stmt.free();
          scheduleSave();
          return {
            changes: db.getRowsModified(),
            lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || 0
          };
        }
      };
    },
    
    exec(sql: string): void {
      db.exec(sql);
      scheduleSave();
    },
    
    pragma(_sql: string): void {
    },
    
    save(): void {
      saveDatabase(db);
    }
  };
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE tray_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tray_id TEXT NOT NULL,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      character TEXT,
      status TEXT NOT NULL DEFAULT 'normal',
      wear_level INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE print_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      required_chars TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      priority TEXT NOT NULL DEFAULT 'normal',
      deadline TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE carve_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT NOT NULL UNIQUE,
      total_chars INTEGER NOT NULL DEFAULT 0,
      completed_chars INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      parent_batch TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE carve_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT NOT NULL,
      character TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      task_id INTEGER,
      estimated_date TEXT,
      completed_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE tray_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tray_id TEXT NOT NULL,
      slot_id INTEGER NOT NULL,
      character TEXT,
      old_status TEXT,
      new_status TEXT,
      action_type TEXT NOT NULL,
      operator TEXT NOT NULL DEFAULT 'system',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      batch_no TEXT,
      task_id INTEGER,
      notes TEXT
    );

    CREATE TABLE alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      character TEXT,
      task_id INTEGER,
      batch_no TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedData(db: any) {
  const insertSlot = db.prepare(`
    INSERT INTO tray_slots (tray_id, row, col, character, status, wear_level, version)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const chars1 = ['木', '活', '字', '盘', '缺', '字', '盘', '点', '系', '统'];
  const chars2 = ['印', '坊', '管', '理', '格', '位', '磨', '损', '补', '刻'];
  const chars3 = ['计', '划', '印', '刷', '任', '务', '需', '求', '检', '索'];
  const chars4 = ['预', '警', '批', '次', '版', '本', '导', '出', '历', '史'];

  const trays = [
    { id: 'TRAY-A01', chars: chars1, rows: 2, cols: 10 },
    { id: 'TRAY-A02', chars: chars2, rows: 2, cols: 10 },
    { id: 'TRAY-B01', chars: chars3, rows: 2, cols: 10 },
    { id: 'TRAY-B02', chars: chars4, rows: 2, cols: 10 },
  ];

  for (const tray of trays) {
    for (let r = 0; r < tray.rows; r++) {
      for (let c = 0; c < tray.cols; c++) {
        const idx = r * tray.cols + c;
        const char = tray.chars[idx] || null;
        let status = 'normal';
        let wear = 0;
        
        if (!char) {
          status = 'missing';
        } else if (idx === 3 || idx === 7) {
          status = 'worn';
          wear = 85;
        } else if (idx === 5) {
          status = 'missing';
        } else {
          wear = Math.floor(Math.random() * 50);
        }
        
        insertSlot.run([tray.id, r, c, char, status, wear, 1]);
      }
    }
  }

  const insertTask = db.prepare(`
    INSERT INTO print_tasks (task_no, title, client, required_chars, status, priority, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    {
      no: 'TASK-2024-001',
      title: '古籍复刻-卷一',
      client: '中华书局',
      chars: ['木', '活', '字', '盘', '缺', '字', '盘', '点', '系', '统', '印', '刷'],
      status: 'confirmed',
      priority: 'high',
      deadline: '2024-12-30'
    },
    {
      no: 'TASK-2024-002',
      title: '年画印刷-春节版',
      client: '荣宝斋',
      chars: ['年', '画', '春', '节', '福', '禄', '寿', '喜'],
      status: 'draft',
      priority: 'normal',
      deadline: '2025-01-15'
    },
    {
      no: 'TASK-2024-003',
      title: '家谱修撰-陈氏',
      client: '陈氏宗亲会',
      chars: ['陈', '氏', '家', '谱', '世', '系', '图', '传'],
      status: 'in_production',
      priority: 'urgent',
      deadline: '2024-12-20'
    }
  ];

  for (const t of tasks) {
    insertTask.run([t.no, t.title, t.client, JSON.stringify(t.chars), t.status, t.priority, t.deadline]);
  }

  const insertBatch = db.prepare(`
    INSERT INTO carve_batches (batch_no, total_chars, completed_chars, status, version, parent_batch, started_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const batches = [
    { no: 'BATCH-2024-01', total: 8, completed: 5, status: 'in_production', version: 1, parent: null, started: '2024-12-01' },
    { no: 'BATCH-2024-02', total: 12, completed: 0, status: 'approved', version: 2, parent: 'BATCH-2024-01R', started: null },
    { no: 'BATCH-2024-01R', total: 10, completed: 10, status: 'rolled_back', version: 1, parent: null, started: '2024-11-15' },
  ];

  for (const b of batches) {
    insertBatch.run([b.no, b.total, b.completed, b.status, b.version, b.parent, b.started]);
  }

  const insertPlan = db.prepare(`
    INSERT INTO carve_plans (batch_no, character, quantity, priority, status, task_id, estimated_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const plans = [
    { batch: 'BATCH-2024-01', char: '缺', qty: 2, priority: 'high', status: 'completed', task: 1, est: '2024-12-10', notes: '卷一缺字补刻' },
    { batch: 'BATCH-2024-01', char: '盘', qty: 1, priority: 'high', status: 'completed', task: 1, est: '2024-12-10', notes: '磨损严重重刻' },
    { batch: 'BATCH-2024-01', char: '印', qty: 1, priority: 'medium', status: 'in_progress', task: null, est: '2024-12-15', notes: null },
    { batch: 'BATCH-2024-01', char: '刷', qty: 1, priority: 'medium', status: 'pending', task: null, est: '2024-12-15', notes: null },
    { batch: 'BATCH-2024-01', char: '年', qty: 2, priority: 'low', status: 'pending', task: 2, est: '2024-12-20', notes: '年画备用' },
    { batch: 'BATCH-2024-02', char: '陈', qty: 3, priority: 'urgent', status: 'pending', task: 3, est: '2024-12-18', notes: '家谱急需' },
    { batch: 'BATCH-2024-02', char: '氏', qty: 2, priority: 'urgent', status: 'pending', task: 3, est: '2024-12-18', notes: null },
    { batch: 'BATCH-2024-02', char: '家', qty: 1, priority: 'high', status: 'pending', task: 3, est: '2024-12-19', notes: null },
    { batch: 'BATCH-2024-02', char: '谱', qty: 1, priority: 'high', status: 'pending', task: 3, est: '2024-12-19', notes: null },
    { batch: 'BATCH-2024-01R', char: '木', qty: 1, priority: 'medium', status: 'completed', task: null, est: '2024-11-25', notes: '回滚批次-字模不合格' },
    { batch: 'BATCH-2024-01R', char: '活', qty: 1, priority: 'medium', status: 'completed', task: null, est: '2024-11-25', notes: '回滚批次-字模不合格' },
  ];

  for (const p of plans) {
    insertPlan.run([p.batch, p.char, p.qty, p.priority, p.status, p.task, p.est, p.notes]);
  }

  const insertHistory = db.prepare(`
    INSERT INTO tray_history (tray_id, slot_id, character, old_status, new_status, action_type, operator, batch_no, task_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const history = [
    { tray: 'TRAY-A01', slot: 5, char: '字', old: 'normal', new: 'missing', action: 'inventory_check', op: '张师傅', batch: null, task: null, notes: '盘点发现缺字' },
    { tray: 'TRAY-A01', slot: 3, char: '盘', old: 'normal', new: 'worn', action: 'wear_check', op: '李师傅', batch: null, task: null, notes: '磨损度超阈值' },
    { tray: 'TRAY-A01', slot: 5, char: '字', old: 'missing', new: 'reserved', action: 'carve_assign', op: '王管理员', batch: 'BATCH-2024-01', task: 1, notes: '分配补刻批次' },
    { tray: 'TRAY-A02', slot: 7, char: '损', old: 'normal', new: 'worn', action: 'wear_check', op: '张师傅', batch: null, task: null, notes: '日常检查' },
    { tray: 'TRAY-B02', slot: 1, char: '预', old: 'missing', new: 'normal', action: 'carve_complete', op: '李师傅', batch: 'BATCH-2024-01R', task: null, notes: '回滚补刻完成' },
  ];

  for (const h of history) {
    insertHistory.run([h.tray, h.slot, h.char, h.old, h.new, h.action, h.op, h.batch, h.task, h.notes]);
  }

  const insertAlert = db.prepare(`
    INSERT INTO alerts (type, severity, message, character, task_id, batch_no, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const alerts = [
    { type: 'missing', severity: 'danger', msg: '字「缺」在 TRAY-A01 第1行第5列缺失', char: '缺', task: 1, batch: null, read: 0 },
    { type: 'worn', severity: 'warning', msg: '字「盘」磨损度85%，需重刻', char: '盘', task: null, batch: null, read: 0 },
    { type: 'deadline', severity: 'warning', msg: '任务 TASK-2024-003 临近截止(12/20)', char: null, task: 3, batch: null, read: 0 },
    { type: 'shortage', severity: 'danger', msg: '任务 TASK-2024-003 缺字5个，影响生产', char: null, task: 3, batch: 'BATCH-2024-02', read: 0 },
    { type: 'missing', severity: 'info', msg: '字「画」未在字库中', char: '画', task: 2, batch: null, read: 1 },
  ];

  for (const a of alerts) {
    insertAlert.run([a.type, a.severity, a.msg, a.char, a.task, a.batch, a.read]);
  }
}

export default { getDb, initDb };
