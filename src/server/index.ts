import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  masterService,
  detailService,
  historyService,
  resultService,
  createSnapshot,
  getSnapshotsByMasterId,
  restoreFromSnapshot,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/api/masters', (_req, res) => {
  const masters = masterService.getAll();
  res.json(masters);
});

app.get('/api/masters/:id', (req, res) => {
  const master = masterService.getById(req.params.id);
  if (!master) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(master);
});

app.post('/api/masters', (req, res) => {
  const master = masterService.create(req.body);
  res.json(master);
});

app.put('/api/masters/:id', (req, res) => {
  const master = masterService.update(req.params.id, req.body);
  if (!master) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(master);
});

app.get('/api/masters/:id/details', (req, res) => {
  const details = detailService.getByMasterId(req.params.id);
  res.json(details);
});

app.post('/api/details', (req, res) => {
  const detail = detailService.create(req.body);
  res.json(detail);
});

app.get('/api/masters/:id/histories', (req, res) => {
  const histories = historyService.getByMasterId(req.params.id);
  res.json(histories);
});

app.post('/api/histories', (req, res) => {
  const history = historyService.create(req.body);
  res.json(history);
});

app.get('/api/masters/:id/result', (req, res) => {
  const result = resultService.getByMasterId(req.params.id);
  if (!result) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(result);
});

app.post('/api/results', (req, res) => {
  const result = resultService.create(req.body);
  res.json(result);
});

app.put('/api/results/:masterId', (req, res) => {
  const result = resultService.update(req.params.masterId, req.body);
  if (!result) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(result);
});

app.get('/api/masters/:id/snapshots', (req, res) => {
  const snapshots = getSnapshotsByMasterId(req.params.id);
  res.json(snapshots);
});

app.post('/api/snapshots', (req, res) => {
  const { masterId, name } = req.body;
  const snapshot = createSnapshot(masterId, name);
  if (!snapshot) {
    res.status(400).json({ error: 'Failed to create snapshot' });
    return;
  }
  res.json(snapshot);
});

app.post('/api/snapshots/:id/restore', (req, res) => {
  const success = restoreFromSnapshot(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Snapshot not found' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/masters/:id/full', (req, res) => {
  const masterId = req.params.id;
  const master = masterService.getById(masterId);
  if (!master) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const details = detailService.getByMasterId(masterId);
  const histories = historyService.getByMasterId(masterId);
  let result = resultService.getByMasterId(masterId);
  if (!result) {
    result = resultService.create({
      masterId,
      version: String(master.version),
      status: 'pending',
      layers: [],
      pointLabels: [],
      errorNotes: [],
    });
  }
  const snapshots = getSnapshotsByMasterId(masterId);
  res.json({ master, details, histories, result, snapshots });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`沙盘地形等高线描绘工具 - 运行在 http://localhost:${PORT}`);
});
