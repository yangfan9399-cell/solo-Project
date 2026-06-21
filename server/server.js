const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const data = require('./data');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/records', (req, res) => {
  const { status } = req.query;
  const records = data.getRecordsByStatus(status);
  res.json(records);
});

app.get('/api/records/:id', (req, res) => {
  const record = data.getRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

app.post('/api/records', (req, res) => {
  const record = data.addRecord(req.body);
  res.json(record);
});

app.post('/api/records/submit', (req, res) => {
  const { ids } = req.body;
  const records = data.submitToQueue(ids);
  res.json(records);
});

app.put('/api/records/:id', (req, res) => {
  const result = data.updateRecord(req.params.id, req.body);
  if (result && result.error) {
    return res.status(400).json(result);
  }
  if (!result) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(result);
});

app.post('/api/records/:id/lock', (req, res) => {
  const { reason } = req.body;
  const result = data.lockRecord(req.params.id, reason);
  if (!result) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(result);
});

app.post('/api/records/:id/unlock', (req, res) => {
  const result = data.unlockRecord(req.params.id);
  if (!result) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(result);
});

app.post('/api/records/:id/judge', (req, res) => {
  const { result, remark } = req.body;
  const record = data.manualJudge(req.params.id, result, remark);
  if (record && record.error) {
    return res.status(400).json(record);
  }
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(record);
});

app.post('/api/records/:id/export', (req, res) => {
  const result = data.addToExport(req.params.id);
  if (result && result.error) {
    return res.status(400).json(result);
  }
  if (!result) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(result);
});

app.delete('/api/records/:id/export', (req, res) => {
  const result = data.removeFromExport(req.params.id);
  if (!result) {
    return res.status(404).json({ error: '记录不存在' });
  }
  res.json(result);
});

app.get('/api/export', (req, res) => {
  const records = data.getExportList();
  res.json(records);
});

app.post('/api/export/recalculate', (req, res) => {
  const result = data.recalculateExport();
  res.json(result);
});

app.get('/api/statistics', (req, res) => {
  const stats = data.getStatistics();
  res.json(stats);
});

app.get('/api/rules', (req, res) => {
  const { RULES } = require('./rules');
  res.json(RULES.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    priority: r.priority
  })));
});

app.post('/api/reset', (req, res) => {
  const records = data.resetData();
  res.json({ message: '数据已重置', count: records.length });
});

app.listen(PORT, () => {
  console.log(`古井铭牌判读工作流服务已启动: http://localhost:${PORT}`);
});
