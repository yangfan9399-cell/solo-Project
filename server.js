const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'cases.json');
const INIT_FILE = path.join(__dirname, 'data', 'initData.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initData = JSON.parse(fs.readFileSync(INIT_FILE, 'utf8'));
    fs.writeFileSync(DATA_FILE, JSON.stringify(initData, null, 2), 'utf8');
    return initData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function computeDifferences(v1, v2) {
  const diffs = [];
  const basicFields = [
    { key: 'versionName', label: '版本名称' },
    { key: 'createTime', label: '创建时间' },
    { key: 'operator', label: '操作人' },
    { key: 'sealSample', label: '压印样张' },
    { key: 'formulaBatch', label: '配方批号' },
    { key: 'overallConclusion', label: '整体结论' }
  ];

  basicFields.forEach(field => {
    const oldVal = v1[field.key];
    const newVal = v2[field.key];
    if (oldVal !== newVal) {
      diffs.push({
        type: 'basic',
        key: field.key,
        label: field.label,
        oldValue: oldVal,
        newValue: newVal,
        changed: true
      });
    }
  });

  const fieldKeys = Object.keys(v1.fields);
  fieldKeys.forEach(key => {
    const f1 = v1.fields[key];
    const f2 = v2.fields[key];
    const valueChanged = f1.value !== f2.value;
    const conclusionChanged = f1.conclusion !== f2.conclusion;
    if (valueChanged || conclusionChanged) {
      diffs.push({
        type: 'field',
        key: key,
        label: f1.label,
        oldValue: f1.value,
        oldUnit: f1.unit,
        oldConclusion: f1.conclusion,
        newValue: f2.value,
        newUnit: f2.unit,
        newConclusion: f2.conclusion,
        valueChanged,
        conclusionChanged
      });
    }
  });

  return diffs;
}

function analyzeConclusionChanges(diffs) {
  const analysis = [];
  const fieldDiffs = diffs.filter(d => d.type === 'field');

  fieldDiffs.forEach(diff => {
    if (diff.conclusionChanged) {
      let level = 'info';
      let message = '';
      if (diff.key === 'cinnabarRatio') {
        level = 'warning';
        message = `朱砂比例结论由"${diff.oldConclusion}"变为"${diff.newConclusion}"，可能影响印泥真伪判定。`;
      } else if (diff.key === 'oilPrecipitation') {
        level = 'warning';
        message = `油脂析出结论由"${diff.oldConclusion}"变为"${diff.newConclusion}"，提示印泥保存状态变化。`;
      } else if (diff.key === 'edgeClarity') {
        level = 'warning';
        message = `压印边缘结论由"${diff.oldConclusion}"变为"${diff.newConclusion}"，影响证据清晰度评估。`;
      } else if (diff.key === 'storageTemp') {
        level = 'warning';
        message = `封存温度结论由"${diff.oldConclusion}"变为"${diff.newConclusion}"，可能加速印泥退化。`;
      }
      analysis.push({ field: diff.label, level, message });
    }
  });

  const overallDiff = diffs.find(d => d.key === 'overallConclusion');
  if (overallDiff) {
    analysis.push({
      field: '整体结论',
      level: 'danger',
      message: `整体结论发生反转：由"${overallDiff.oldValue}"变为"${overallDiff.newValue}"！`
    });
  }

  const sampleDiff = diffs.find(d => d.key === 'sealSample');
  const formulaDiff = diffs.find(d => d.key === 'formulaBatch');
  if (sampleDiff && formulaDiff) {
    analysis.push({
      field: '证据一致性',
      level: 'danger',
      message: '压印样张和配方批号均发生变更，需警惕证据替换风险！'
    });
  } else if (sampleDiff || formulaDiff) {
    analysis.push({
      field: '证据标识',
      level: 'warning',
      message: sampleDiff ? '压印样张已更换，请确认是否为正常修订。' : '配方批号已变更，请确认是否为正常修订。'
    });
  }

  return analysis;
}

app.get('/api/cases', (req, res) => {
  const data = loadData();
  const cases = data.cases.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    description: c.description,
    currentVersionId: c.currentVersionId,
    versionCount: c.versions.length
  }));
  res.json({ cases });
});

app.get('/api/cases/:caseId', (req, res) => {
  const data = loadData();
  const caseData = data.cases.find(c => c.id === req.params.caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案例不存在' });
  }
  res.json(caseData);
});

app.get('/api/cases/:caseId/versions/:versionId', (req, res) => {
  const data = loadData();
  const caseData = data.cases.find(c => c.id === req.params.caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案例不存在' });
  }
  const version = caseData.versions.find(v => v.id === req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  res.json(version);
});

app.get('/api/cases/:caseId/diff/:v1Id/:v2Id', (req, res) => {
  const data = loadData();
  const caseData = data.cases.find(c => c.id === req.params.caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案例不存在' });
  }
  const v1 = caseData.versions.find(v => v.id === req.params.v1Id);
  const v2 = caseData.versions.find(v => v.id === req.params.v2Id);
  if (!v1 || !v2) {
    return res.status(404).json({ error: '版本不存在' });
  }
  const diffs = computeDifferences(v1, v2);
  const analysis = analyzeConclusionChanges(diffs);
  res.json({
    version1: { id: v1.id, name: v1.versionName },
    version2: { id: v2.id, name: v2.versionName },
    differences: diffs,
    analysis
  });
});

app.post('/api/cases/:caseId/versions/:versionId/comments', (req, res) => {
  const data = loadData();
  const caseData = data.cases.find(c => c.id === req.params.caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案例不存在' });
  }
  const version = caseData.versions.find(v => v.id === req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  if (version.isLocked) {
    return res.status(403).json({ error: '版本已锁定，无法添加评论' });
  }
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: '评论人和内容不能为空' });
  }
  const newComment = {
    id: 'c' + Date.now(),
    author,
    content,
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  };
  version.comments.push(newComment);
  saveData(data);
  res.json(newComment);
});

app.post('/api/cases/:caseId/versions/:versionId/lock', (req, res) => {
  const data = loadData();
  const caseData = data.cases.find(c => c.id === req.params.caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案例不存在' });
  }
  const version = caseData.versions.find(v => v.id === req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  version.isLocked = true;
  version.comments.push({
    id: 'c' + Date.now(),
    author: '系统',
    content: '此版本已锁定，不允许修改。',
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  });
  saveData(data);
  res.json({ success: true, isLocked: true });
});

app.post('/api/cases/:caseId/versions/:versionId/unlock', (req, res) => {
  const data = loadData();
  const caseData = data.cases.find(c => c.id === req.params.caseId);
  if (!caseData) {
    return res.status(404).json({ error: '案例不存在' });
  }
  const version = caseData.versions.find(v => v.id === req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  version.isLocked = false;
  version.comments.push({
    id: 'c' + Date.now(),
    author: '系统',
    content: '此版本已解锁，可以进行修改。',
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  });
  saveData(data);
  res.json({ success: true, isLocked: false });
});

app.post('/api/reset', (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
  const data = loadData();
  res.json({ success: true, message: '数据已重置为初始状态' });
});

app.listen(PORT, () => {
  console.log(`手工印泥版本差异册 服务已启动: http://localhost:${PORT}`);
});
