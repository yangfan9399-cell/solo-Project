const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_PATH = path.join(__dirname, 'data', 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

function deepCompare(obj1, obj2, path = '') {
  const differences = [];
  
  if (typeof obj1 !== typeof obj2) {
    differences.push({ path, oldValue: obj1, newValue: obj2, type: 'type-change' });
    return differences;
  }
  
  if (obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      differences.push({ path, oldValue: obj1, newValue: obj2, type: 'value-change' });
    }
    return differences;
  }
  
  if (typeof obj1 !== 'object') {
    if (obj1 !== obj2) {
      differences.push({ path, oldValue: obj1, newValue: obj2, type: 'value-change' });
    }
    return differences;
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= obj1.length) {
        differences.push({ path: itemPath, oldValue: undefined, newValue: obj2[i], type: 'added' });
      } else if (i >= obj2.length) {
        differences.push({ path: itemPath, oldValue: obj1[i], newValue: undefined, type: 'removed' });
      } else {
        differences.push(...deepCompare(obj1[i], obj2[i], itemPath));
      }
    }
    return differences;
  }
  
  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
  
  for (const key of allKeys) {
    const keyPath = path ? `${path}.${key}` : key;
    if (!(key in obj1)) {
      differences.push({ path: keyPath, oldValue: undefined, newValue: obj2[key], type: 'added' });
    } else if (!(key in obj2)) {
      differences.push({ path: keyPath, oldValue: obj1[key], newValue: undefined, type: 'removed' });
    } else {
      differences.push(...deepCompare(obj1[key], obj2[key], keyPath));
    }
  }
  
  return differences;
}

function getFieldLabel(fieldPath) {
  const labels = {
    'fiberLengthDistribution': '纤维长度分布',
    'fiberLengthDistribution.avg': '平均纤维长度',
    'fiberLengthDistribution.min': '最小纤维长度',
    'fiberLengthDistribution.max': '最大纤维长度',
    'fiberLengthDistribution.unit': '长度单位',
    'whiteness': '白度',
    'whiteness.value': '白度值',
    'whiteness.unit': '白度单位',
    'moistureContent': '含水率',
    'moistureContent.value': '含水率值',
    'moistureContent.unit': '含水率单位',
    'beatingBatchNo': '打浆批号',
    'micrographUrl': '显微照片',
    'dryingWeighingRecord': '烘干称重记录',
    'dryingWeighingRecord.sampleWeight': '样品重量',
    'dryingWeighingRecord.dryWeight': '烘干后重量',
    'dryingWeighingRecord.dryingTemp': '烘干温度',
    'dryingWeighingRecord.dryingTime': '烘干时间',
    'dryingWeighingRecord.unit': '重量单位',
    'remark': '备注'
  };
  return labels[fieldPath] || fieldPath;
}

function getFieldCategory(fieldPath) {
  if (fieldPath.startsWith('fiberLengthDistribution')) return 'fiber';
  if (fieldPath.startsWith('whiteness')) return 'whiteness';
  if (fieldPath.startsWith('moistureContent')) return 'moisture';
  if (fieldPath === 'beatingBatchNo') return 'batch';
  if (fieldPath === 'micrographUrl') return 'evidence';
  if (fieldPath.startsWith('dryingWeighingRecord')) return 'drying';
  if (fieldPath === 'remark') return 'remark';
  return 'other';
}

app.get('/api/records', (req, res) => {
  const data = loadData();
  const summary = data.map(r => ({
    id: r.id,
    title: r.title,
    currentVersion: r.currentVersion,
    versionCount: r.versions.length,
    latestVersion: r.versions[r.versions.length - 1],
    hasLocked: r.versions.some(v => v.isLocked)
  }));
  res.json(summary);
});

app.get('/api/records/:id', (req, res) => {
  const data = loadData();
  const record = data.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(record);
});

app.get('/api/records/:id/versions', (req, res) => {
  const data = loadData();
  const record = data.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(record.versions);
});

app.get('/api/records/:id/versions/:versionNum', (req, res) => {
  const data = loadData();
  const record = data.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const version = record.versions.find(v => v.version === parseInt(req.params.versionNum));
  if (!version) {
    return res.status(404).json({ error: 'Version not found' });
  }
  res.json(version);
});

app.get('/api/records/:id/diff', (req, res) => {
  const { v1, v2 } = req.query;
  const data = loadData();
  const record = data.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const ver1 = record.versions.find(v => v.version === parseInt(v1));
  const ver2 = record.versions.find(v => v.version === parseInt(v2));
  
  if (!ver1 || !ver2) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  const rawDiffs = deepCompare(ver1.data, ver2.data);
  
  const fieldDiffs = rawDiffs.map(d => ({
    ...d,
    label: getFieldLabel(d.path),
    category: getFieldCategory(d.path)
  }));
  
  const evidenceChanged = rawDiffs.some(d => d.path === 'micrographUrl');
  const dryingChanged = rawDiffs.some(d => d.path.startsWith('dryingWeighingRecord'));
  
  res.json({
    recordId: record.id,
    fromVersion: ver1.version,
    toVersion: ver2.version,
    fieldDiffs,
    evidenceChanged,
    dryingChanged,
    fromVersionData: ver1,
    toVersionData: ver2
  });
});

app.post('/api/records/:id/rollback', (req, res) => {
  const { targetVersion, reason, operator } = req.body;
  const data = loadData();
  const recordIndex = data.findIndex(r => r.id === req.params.id);
  
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const record = data[recordIndex];
  const targetVer = record.versions.find(v => v.version === parseInt(targetVersion));
  
  if (!targetVer) {
    return res.status(404).json({ error: 'Target version not found' });
  }
  
  const latestVersion = record.versions[record.versions.length - 1];
  if (latestVersion.isLocked) {
    return res.status(403).json({ 
      error: 'Cannot rollback: latest version is locked',
      lockedVersion: latestVersion.version
    });
  }
  
  const newVersionNum = record.currentVersion + 1;
  const newVersion = {
    id: generateId(),
    recordId: record.id,
    version: newVersionNum,
    parentVersion: latestVersion.id,
    data: JSON.parse(JSON.stringify(targetVer.data)),
    source: '回滚操作',
    reason: reason || `回滚至版本${targetVersion}`,
    isLocked: false,
    createdAt: new Date().toISOString(),
    createdBy: operator || '系统管理员',
    comments: [],
    rollbackHistory: [{
      fromVersion: latestVersion.version,
      toVersion: parseInt(targetVersion),
      newVersion: newVersionNum,
      reason: reason || '回滚操作',
      operator: operator || '系统管理员',
      timestamp: new Date().toISOString()
    }]
  };
  
  record.versions.push(newVersion);
  record.currentVersion = newVersionNum;
  
  saveData(data);
  res.status(201).json(newVersion);
});

app.post('/api/records/:id/versions/:versionNum/lock', (req, res) => {
  const { reason, operator } = req.body;
  const data = loadData();
  const recordIndex = data.findIndex(r => r.id === req.params.id);
  
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const record = data[recordIndex];
  const versionIndex = record.versions.findIndex(v => v.version === parseInt(req.params.versionNum));
  
  if (versionIndex === -1) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  if (record.versions[versionIndex].isLocked) {
    return res.status(400).json({ error: 'Version is already locked' });
  }
  
  record.versions[versionIndex].isLocked = true;
  record.versions[versionIndex].lockedAt = new Date().toISOString();
  record.versions[versionIndex].lockedBy = operator || '管理员';
  record.versions[versionIndex].lockReason = reason || '审核锁定';
  
  saveData(data);
  res.json(record.versions[versionIndex]);
});

app.post('/api/records/:id/new-version', (req, res) => {
  const { data: newData, source, reason, operator, parentVersion } = req.body;
  const data = loadData();
  const recordIndex = data.findIndex(r => r.id === req.params.id);
  
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const record = data[recordIndex];
  const latestVersion = record.versions[record.versions.length - 1];
  
  if (latestVersion.isLocked) {
    return res.status(403).json({ 
      error: 'Cannot create new version: latest version is locked',
      lockedVersion: latestVersion.version
    });
  }
  
  const newVersionNum = record.currentVersion + 1;
  const newVersion = {
    id: generateId(),
    recordId: record.id,
    version: newVersionNum,
    parentVersion: parentVersion || latestVersion.id,
    data: JSON.parse(JSON.stringify(newData)),
    source: source || '手动修改',
    reason: reason || '数据更新',
    isLocked: false,
    createdAt: new Date().toISOString(),
    createdBy: operator || '系统操作员',
    comments: [],
    rollbackHistory: []
  };
  
  record.versions.push(newVersion);
  record.currentVersion = newVersionNum;
  
  saveData(data);
  res.status(201).json(newVersion);
});

app.get('/api/records/:id/rollback-preview', (req, res) => {
  const { targetVersion } = req.query;
  const data = loadData();
  const record = data.find(r => r.id === req.params.id);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const targetVer = record.versions.find(v => v.version === parseInt(targetVersion));
  const latestVer = record.versions[record.versions.length - 1];
  
  if (!targetVer) {
    return res.status(404).json({ error: 'Target version not found' });
  }
  
  const rawDiffs = deepCompare(latestVer.data, targetVer.data);
  
  const fieldDiffs = rawDiffs.map(d => ({
    ...d,
    label: getFieldLabel(d.path),
    category: getFieldCategory(d.path)
  }));
  
  const affectedFields = fieldDiffs.length;
  const evidenceChanged = rawDiffs.some(d => d.path === 'micrographUrl');
  
  res.json({
    recordId: record.id,
    fromVersion: latestVer.version,
    toVersion: targetVer.version,
    willCreateNewVersion: true,
    newVersionNumber: record.currentVersion + 1,
    affectedFields,
    evidenceChanged,
    fieldDiffs,
    targetData: targetVer.data,
    currentData: latestVer.data,
    isLatestLocked: latestVer.isLocked
  });
});

app.post('/api/records/:id/versions/:versionNum/comments', (req, res) => {
  const { author, content } = req.body;
  const data = loadData();
  const recordIndex = data.findIndex(r => r.id === req.params.id);
  
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const record = data[recordIndex];
  const versionIndex = record.versions.findIndex(v => v.version === parseInt(req.params.versionNum));
  
  if (versionIndex === -1) {
    return res.status(404).json({ error: 'Version not found' });
  }
  
  const comment = {
    id: generateId(),
    author: author || '匿名用户',
    content,
    createdAt: new Date().toISOString()
  };
  
  record.versions[versionIndex].comments.push(comment);
  saveData(data);
  res.status(201).json(comment);
});

app.get('/api/records/:id/version-tree', (req, res) => {
  const data = loadData();
  const record = data.find(r => r.id === req.params.id);
  
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  
  const versionMap = new Map();
  record.versions.forEach(v => {
    versionMap.set(v.id, { ...v, children: [] });
  });
  
  const roots = [];
  versionMap.forEach(v => {
    if (v.parentVersion && versionMap.has(v.parentVersion)) {
      versionMap.get(v.parentVersion).children.push(v);
    } else {
      roots.push(v);
    }
  });
  
  function buildTree(nodes) {
    return nodes.map(node => ({
      id: node.id,
      version: node.version,
      label: `v${node.version} - ${node.source}`,
      isLocked: node.isLocked,
      createdAt: node.createdAt,
      reason: node.reason,
      children: buildTree(node.children)
    }));
  }
  
  res.json({
    recordId: record.id,
    title: record.title,
    currentVersion: record.currentVersion,
    tree: buildTree(roots)
  });
});

app.post('/api/records', (req, res) => {
  const { title, data: initialData, operator } = req.body;
  const data = loadData();
  
  const recordId = generateId();
  const firstVersion = {
    id: generateId(),
    recordId,
    version: 1,
    parentVersion: null,
    data: JSON.parse(JSON.stringify(initialData)),
    source: '初始录入',
    reason: '新建记录',
    isLocked: false,
    createdAt: new Date().toISOString(),
    createdBy: operator || '系统操作员',
    comments: [],
    rollbackHistory: []
  };
  
  const newRecord = {
    id: recordId,
    title: title || '新记录',
    currentVersion: 1,
    versions: [firstVersion]
  };
  
  data.push(newRecord);
  saveData(data);
  res.status(201).json(newRecord);
});

app.listen(PORT, () => {
  console.log(`Pulp Fiber Version Diff server running at http://localhost:${PORT}`);
});

module.exports = app;
