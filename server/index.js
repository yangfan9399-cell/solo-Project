import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  seedWorkOrders, seedPartBatches, seedTeams, seedApprovals, seedAuditLogs, seedUI,
} from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const DEFAULT_USER = { name: '检修主管', role: '检修主管' };
const DEFAULT_FILTERS = {};

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============ 持久化层 ============
function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial = buildInitialState();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function buildInitialState() {
  return {
    initialized: true,
    workOrders: seedWorkOrders,
    partBatches: seedPartBatches,
    teams: seedTeams,
    approvals: seedApprovals,
    auditLogs: seedAuditLogs,
    conflicts: [],
    lastConflictRecalc: null,
    filters: DEFAULT_FILTERS,
    ui: seedUI,
    currentUser: DEFAULT_USER,
  };
}

function readDB() {
  ensureDB();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('DB read error, resetting:', e.message);
    const initial = buildInitialState();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeDB(state) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ============ 通用域存取 ============
const VALID_DOMAINS = [
  'workOrders', 'partBatches', 'teams', 'approvals', 'auditLogs',
  'conflicts', 'lastConflictRecalc', 'filters', 'ui', 'currentUser',
];

app.get('/api/state', (req, res) => {
  const db = readDB();
  res.json({
    workOrders: db.workOrders,
    partBatches: db.partBatches,
    teams: db.teams,
    approvals: db.approvals,
    auditLogs: db.auditLogs,
    conflicts: db.conflicts || [],
    lastConflictRecalc: db.lastConflictRecalc || null,
    filters: db.filters || {},
    ui: db.ui || seedUI,
    currentUser: db.currentUser || DEFAULT_USER,
    initialized: db.initialized !== false,
  });
});

app.put('/api/state/domain/:domain', (req, res) => {
  const { domain } = req.params;
  if (!VALID_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: `Invalid domain: ${domain}` });
  }
  const db = readDB();
  db[domain] = req.body;
  writeDB(db);
  res.json({ ok: true, domain, data: db[domain] });
});

// ============ 排程域：工单 CRUD ============
app.get('/api/work-orders', (req, res) => {
  const db = readDB();
  res.json(db.workOrders);
});

app.post('/api/work-orders', (req, res) => {
  const db = readDB();
  const lastNum = db.workOrders.reduce((max, w) => {
    const m = w.code.match(/(\d+)$/);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  const now = new Date().toISOString();
  const newWo = {
    id: genId('wo'),
    code: `WG-2026-${String(lastNum + 1).padStart(4, '0')}`,
    ...req.body,
    status: req.body.status || 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: req.body.createdBy || db.currentUser?.name || 'system',
  };
  db.workOrders = [...db.workOrders, newWo];
  writeDB(db);
  res.status(201).json(newWo);
});

app.put('/api/work-orders/:id', (req, res) => {
  const db = readDB();
  const idx = db.workOrders.findIndex((w) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.workOrders[idx] = { ...db.workOrders[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.workOrders[idx]);
});

app.delete('/api/work-orders/:id', (req, res) => {
  const db = readDB();
  db.workOrders = db.workOrders.filter((w) => w.id !== req.params.id);
  writeDB(db);
  res.json({ ok: true });
});

// ============ 审批域 ============
app.get('/api/approvals', (req, res) => {
  const db = readDB();
  res.json(db.approvals);
});

app.post('/api/approvals', (req, res) => {
  const db = readDB();
  const record = {
    id: genId('ap'),
    ...req.body,
    timestamp: new Date().toISOString(),
  };
  db.approvals = [...db.approvals, record];
  writeDB(db);
  res.status(201).json(record);
});

// ============ 冲突域 ============
app.get('/api/conflicts', (req, res) => {
  const db = readDB();
  res.json({
    conflicts: db.conflicts || [],
    lastRecalc: db.lastConflictRecalc || null,
  });
});

app.put('/api/conflicts', (req, res) => {
  const { conflicts } = req.body;
  const db = readDB();
  db.conflicts = conflicts || [];
  db.lastConflictRecalc = new Date().toISOString();
  writeDB(db);
  res.json({ ok: true, count: db.conflicts.length, lastRecalc: db.lastConflictRecalc });
});

// ============ 审计域 ============
app.get('/api/audit-logs', (req, res) => {
  const db = readDB();
  const limit = parseInt(req.query.limit, 10) || 200;
  res.json(db.auditLogs.slice(0, limit));
});

app.post('/api/audit-logs', (req, res) => {
  const db = readDB();
  const log = {
    id: genId('log'),
    ...req.body,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = [log, ...db.auditLogs].slice(0, 500);
  writeDB(db);
  res.status(201).json(log);
});

// ============ 筛选 & UI & 用户 ============
app.get('/api/filters', (req, res) => {
  const db = readDB();
  res.json(db.filters || {});
});

app.put('/api/filters', (req, res) => {
  const db = readDB();
  db.filters = { ...db.filters, ...req.body };
  writeDB(db);
  res.json(db.filters);
});

app.delete('/api/filters', (req, res) => {
  const db = readDB();
  db.filters = {};
  writeDB(db);
  res.json({});
});

app.get('/api/ui', (req, res) => {
  const db = readDB();
  res.json(db.ui || seedUI);
});

app.put('/api/ui', (req, res) => {
  const db = readDB();
  db.ui = { ...db.ui, ...req.body };
  writeDB(db);
  res.json(db.ui);
});

app.get('/api/current-user', (req, res) => {
  const db = readDB();
  res.json(db.currentUser || DEFAULT_USER);
});

// ============ 重置 ============
app.post('/api/reset', (req, res) => {
  const initial = buildInitialState();
  writeDB(initial);
  res.json({ ok: true, message: 'All data reset to seed state' });
});

// ============ 健康检查 ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动
ensureDB();
app.listen(PORT, () => {
  console.log(`\n  🚀 桅骨风车检修排程后端服务已启动`);
  console.log(`  📍 服务地址: http://localhost:${PORT}`);
  console.log(`  💾 数据文件: ${DB_PATH}`);
  console.log(`  📋 API 说明:`);
  console.log(`     GET  /api/state             获取完整状态`);
  console.log(`     GET  /api/work-orders       工单列表`);
  console.log(`     POST /api/work-orders       创建工单`);
  console.log(`     PUT  /api/work-orders/:id   更新工单`);
  console.log(`     GET  /api/approvals         审批记录`);
  console.log(`     POST /api/approvals         新增审批`);
  console.log(`     GET  /api/conflicts         冲突快照`);
  console.log(`     PUT  /api/conflicts         保存冲突快照`);
  console.log(`     GET  /api/audit-logs        审计日志`);
  console.log(`     POST /api/audit-logs        新增审计`);
  console.log(`     GET  /api/ui                UI 状态`);
  console.log(`     PUT  /api/ui                更新 UI 状态`);
  console.log(`     POST /api/reset             重置所有数据`);
  console.log(`\n`);
});

export default app;
