const fs = require('fs');
const path = require('path');
const { evaluateRecord, checkTextConflict } = require('./rules');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadRecords() {
  ensureDataDir();
  if (!fs.existsSync(RECORDS_FILE)) {
    const seed = generateSeedData();
    saveRecords(seed);
    return seed;
  }
  const content = fs.readFileSync(RECORDS_FILE, 'utf-8');
  return JSON.parse(content);
}

function saveRecords(records) {
  ensureDataDir();
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function generateSeedData() {
  const now = Date.now();
  const records = [
    {
      id: 'rec_001',
      code: 'GJ-2024-001',
      name: '古井镇南街1号井',
      status: 'staging',
      finalResult: null,
      finalResultLabel: null,
      clarity: 2,
      rustLevel: 2,
      incompletenessRate: 8,
      wellOrientation: 'clear',
      wellOrientationLabel: '正南',
      rubbingImage: 'img/rubbing_001.svg',
      oldText: '大元至正三年歲次癸卯孟春吉日立',
      currentText: '大元至正三年歲次癸卯孟春吉日立',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 5, remark: '批量导入' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: false,
      textConflict: null,
      rejudgeCount: 0
    },
    {
      id: 'rec_002',
      code: 'GJ-2024-002',
      name: '古井镇北街3号井',
      status: 'staging',
      finalResult: null,
      finalResultLabel: null,
      clarity: 3,
      rustLevel: 2,
      incompletenessRate: 25,
      wellOrientation: 'unclear',
      wellOrientationLabel: '模糊',
      rubbingImage: 'img/rubbing_002.svg',
      oldText: '明萬曆十五年仲秋 知縣王□□立',
      currentText: '明萬曆十五年仲秋 知縣王□□立',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 4, remark: '批量导入' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: false,
      textConflict: null,
      rejudgeCount: 0
    },
    {
      id: 'rec_003',
      code: 'GJ-2024-003',
      name: '古井镇东街7号井',
      status: 'queue',
      finalResult: null,
      finalResultLabel: null,
      clarity: 1,
      rustLevel: 1,
      incompletenessRate: 3,
      wellOrientation: 'clear',
      wellOrientationLabel: '正东',
      rubbingImage: 'img/rubbing_003.svg',
      oldText: '清康熙二十二年 井主李有德重修記',
      currentText: '清康熙二十二年 井主李有德重修記',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 3, remark: '批量导入' },
        { id: 'op2', type: 'submit', operator: '用户', time: now - 86400000 * 2, remark: '提交判读队列' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: false,
      textConflict: null,
      rejudgeCount: 0
    },
    {
      id: 'rec_004',
      code: 'GJ-2024-004',
      name: '古井镇西街12号井',
      status: 'queue',
      finalResult: null,
      finalResultLabel: null,
      clarity: 4,
      rustLevel: 2,
      incompletenessRate: 10,
      wellOrientation: 'clear',
      wellOrientationLabel: '正西',
      rubbingImage: 'img/rubbing_004.svg',
      oldText: '乾隆五十年歲次乙巳 闔鎮紳商仝建',
      currentText: '乾隆五十年歲次乙巳 闔鎮紳商仝建',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 3, remark: '批量导入' },
        { id: 'op2', type: 'submit', operator: '用户', time: now - 86400000 * 2, remark: '提交判读队列' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: false,
      textConflict: null,
      rejudgeCount: 0
    },
    {
      id: 'rec_005',
      code: 'GJ-2024-005',
      name: '古井镇中心广场井',
      status: 'queue',
      finalResult: null,
      finalResultLabel: null,
      clarity: 3,
      rustLevel: 3,
      incompletenessRate: 18,
      wellOrientation: 'clear',
      wellOrientationLabel: '正北',
      rubbingImage: 'img/rubbing_005.svg',
      oldText: '道光十九年孟夏 井會眾姓重修',
      currentText: '道光十九年孟夏 井會眾姓重修',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 2, remark: '批量导入' },
        { id: 'op2', type: 'submit', operator: '用户', time: now - 86400000, remark: '提交判读队列' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: false,
      textConflict: null,
      rejudgeCount: 0
    },
    {
      id: 'rec_006',
      code: 'GJ-2024-006',
      name: '古井镇文昌宫古井',
      status: 'queue',
      finalResult: 'rejudge',
      finalResultLabel: '需复判',
      clarity: 2,
      rustLevel: 2,
      incompletenessRate: 38,
      wellOrientation: 'unknown',
      wellOrientationLabel: '无法辨识',
      rubbingImage: 'img/rubbing_006.svg',
      oldText: '□□□年□月 井□□□建 匠人□□□',
      currentText: '□□□年□月 井□□□建 匠人□□□',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 6, remark: '批量导入' },
        { id: 'op2', type: 'submit', operator: '用户', time: now - 86400000 * 5, remark: '提交判读队列' },
        { id: 'op3', type: 'manual_judge', operator: '判读员', time: now - 86400000 * 4, remark: '初次判读：铭文残缺过多需复判' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: false,
      textConflict: null,
      rejudgeCount: 1
    },
    {
      id: 'rec_007',
      code: 'GJ-2024-007',
      name: '古井镇关帝庙古井',
      status: 'queue',
      finalResult: 'locked',
      finalResultLabel: '已锁定',
      clarity: 2,
      rustLevel: 2,
      incompletenessRate: 8,
      wellOrientation: 'clear',
      wellOrientationLabel: '东南',
      rubbingImage: 'img/rubbing_007.svg',
      oldText: '嘉慶二十年歲次乙亥 文昌宮住持道人募修',
      currentText: '嘉慶二十年歲次乙亥 文昌宮住持道人募修',
      operationHistory: [
        { id: 'op1', type: 'import', operator: '系统', time: now - 86400000 * 7, remark: '批量导入' },
        { id: 'op2', type: 'submit', operator: '用户', time: now - 86400000 * 6, remark: '提交判读队列' },
        { id: 'op3', type: 'lock', operator: '管理员', time: now - 86400000 * 3, remark: '待专家进一步考证，临时锁定' }
      ],
      ruleResults: [],
      hitRule: null,
      locked: true,
      textConflict: null,
      rejudgeCount: 1
    }
  ];

  return records.map((rec, index) => {
    if (rec.locked) {
      return rec;
    }
    if (rec.status === 'staging') {
      return rec;
    }
    const evalResult = evaluateRecord(rec);
    return {
      ...rec,
      finalResult: evalResult.finalResult,
      finalResultLabel: evalResult.finalResultLabel,
      ruleResults: evalResult.allRuleResults,
      hitRule: evalResult.hitRule
    };
  });
}

function getAllRecords() {
  return loadRecords();
}

function getRecordsByStatus(status) {
  const records = loadRecords();
  if (!status) return records;
  return records.filter(r => r.status === status);
}

function getRecordById(id) {
  const records = loadRecords();
  return records.find(r => r.id === id);
}

function addRecord(record) {
  const records = loadRecords();
  const newRecord = {
    ...record,
    id: 'rec_' + Date.now(),
    status: 'staging',
    operationHistory: [
      { id: 'op_' + Date.now(), type: 'import', operator: '用户', time: Date.now(), remark: '手动导入' }
    ],
    locked: false,
    rejudgeCount: 0
  };
  records.push(newRecord);
  saveRecords(records);
  return newRecord;
}

function submitToQueue(recordIds) {
  const records = loadRecords();
  const now = Date.now();
  recordIds.forEach(id => {
    const idx = records.findIndex(r => r.id === id);
    if (idx !== -1 && records[idx].status === 'staging') {
      const evalResult = evaluateRecord(records[idx]);
      records[idx] = {
        ...records[idx],
        status: 'queue',
        finalResult: evalResult.finalResult,
        finalResultLabel: evalResult.finalResultLabel,
        ruleResults: evalResult.allRuleResults,
        hitRule: evalResult.hitRule,
        operationHistory: [
          ...records[idx].operationHistory,
          { id: 'op_' + now + '_' + idx, type: 'submit', operator: '用户', time: now, remark: '提交判读队列，规则自动计算' }
        ]
      };
    }
  });
  saveRecords(records);
  return records.filter(r => recordIds.includes(r.id));
}

function updateRecord(id, updates) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  const oldRecord = records[idx];
  
  if (oldRecord.locked) {
    return { error: '该记录已锁定，无法修改' };
  }

  if (updates.currentText && updates.currentText !== oldRecord.currentText) {
    const conflictResult = checkTextConflict(oldRecord.oldText, updates.currentText);
    if (conflictResult.conflict) {
      updates.textConflict = conflictResult;
      updates.finalResult = 'rejudge';
      updates.finalResultLabel = '需复判';
      updates.hitRule = {
        hit: true,
        result: 'rejudge',
        resultLabel: '需复判',
        reasons: [`补读释文与旧释文存在${conflictResult.conflictCount}处冲突，需人工复判`],
        ruleId: 'rule_text_conflict',
        ruleName: '释文冲突复判规则'
      };
    }
  }

  const updatedRecord = { ...oldRecord, ...updates };
  
  const needsReevaluate = updates.clarity !== undefined || 
    updates.rustLevel !== undefined || 
    updates.incompletenessRate !== undefined || 
    updates.wellOrientation !== undefined;
  
  if (needsReevaluate && !updates.textConflict) {
    const evalResult = evaluateRecord(updatedRecord);
    updatedRecord.finalResult = evalResult.finalResult;
    updatedRecord.finalResultLabel = evalResult.finalResultLabel;
    updatedRecord.ruleResults = evalResult.allRuleResults;
    updatedRecord.hitRule = evalResult.hitRule;
  }

  updatedRecord.operationHistory = [
    ...oldRecord.operationHistory,
    {
      id: 'op_' + Date.now(),
      type: 'update',
      operator: '用户',
      time: Date.now(),
      remark: '更新记录信息'
    }
  ];

  records[idx] = updatedRecord;
  saveRecords(records);
  return updatedRecord;
}

function lockRecord(id, reason) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  records[idx].locked = true;
  records[idx].finalResult = 'locked';
  records[idx].finalResultLabel = '已锁定';
  records[idx].operationHistory.push({
    id: 'op_' + Date.now(),
    type: 'lock',
    operator: '管理员',
    time: Date.now(),
    remark: reason || '锁定记录'
  });
  
  saveRecords(records);
  return records[idx];
}

function unlockRecord(id) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  records[idx].locked = false;
  const evalResult = evaluateRecord(records[idx]);
  records[idx].finalResult = evalResult.finalResult;
  records[idx].finalResultLabel = evalResult.finalResultLabel;
  records[idx].hitRule = evalResult.hitRule;
  records[idx].operationHistory.push({
    id: 'op_' + Date.now(),
    type: 'unlock',
    operator: '管理员',
    time: Date.now(),
    remark: '解锁记录'
  });
  
  saveRecords(records);
  return records[idx];
}

function manualJudge(id, result, remark) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  if (records[idx].locked) {
    return { error: '该记录已锁定，无法判读' };
  }

  const resultLabels = {
    passed: '通过',
    warning: '警告',
    blocked: '阻断',
    rejudge: '需复判'
  };

  records[idx].finalResult = result;
  records[idx].finalResultLabel = resultLabels[result] || result;
  records[idx].rejudgeCount = (records[idx].rejudgeCount || 0) + 1;
  records[idx].operationHistory.push({
    id: 'op_' + Date.now(),
    type: 'manual_judge',
    operator: '判读员',
    time: Date.now(),
    remark: remark || `人工判读：${resultLabels[result] || result}`
  });
  
  saveRecords(records);
  return records[idx];
}

function addToExport(id) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  if (records[idx].finalResult === 'blocked' || records[idx].finalResult === 'locked') {
    return { error: '阻断或锁定状态的记录不可加入导出清单' };
  }
  
  records[idx].status = 'export';
  records[idx].operationHistory.push({
    id: 'op_' + Date.now(),
    type: 'add_export',
    operator: '用户',
    time: Date.now(),
    remark: '加入导出清单'
  });
  
  saveRecords(records);
  return records[idx];
}

function removeFromExport(id) {
  const records = loadRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  records[idx].status = 'queue';
  records[idx].operationHistory.push({
    id: 'op_' + Date.now(),
    type: 'remove_export',
    operator: '用户',
    time: Date.now(),
    remark: '从导出清单移除'
  });
  
  saveRecords(records);
  return records[idx];
}

function recalculateExport() {
  const records = loadRecords();
  const exportRecords = records.filter(r => r.status === 'export');
  
  let changedCount = 0;
  exportRecords.forEach(rec => {
    const idx = records.findIndex(r => r.id === rec.id);
    const evalResult = evaluateRecord(records[idx]);
    
    if (evalResult.finalResult !== records[idx].finalResult) {
      records[idx].finalResult = evalResult.finalResult;
      records[idx].finalResultLabel = evalResult.finalResultLabel;
      records[idx].ruleResults = evalResult.allRuleResults;
      records[idx].hitRule = evalResult.hitRule;
      records[idx].operationHistory.push({
        id: 'op_' + Date.now() + '_' + idx,
        type: 'recalculate',
        operator: '系统',
        time: Date.now(),
        remark: '导出清单重算，结果变更'
      });
      changedCount++;
    }
  });
  
  saveRecords(records);
  return {
    total: exportRecords.length,
    changed: changedCount,
    records: records.filter(r => r.status === 'export')
  };
}

function getExportList() {
  const records = loadRecords();
  return records.filter(r => r.status === 'export');
}

function getStatistics() {
  const records = loadRecords();
  return {
    total: records.length,
    staging: records.filter(r => r.status === 'staging').length,
    queue: records.filter(r => r.status === 'queue').length,
    export: records.filter(r => r.status === 'export').length,
    results: {
      passed: records.filter(r => r.finalResult === 'passed').length,
      warning: records.filter(r => r.finalResult === 'warning').length,
      blocked: records.filter(r => r.finalResult === 'blocked').length,
      rejudge: records.filter(r => r.finalResult === 'rejudge').length,
      locked: records.filter(r => r.finalResult === 'locked').length
    }
  };
}

function resetData() {
  const seed = generateSeedData();
  saveRecords(seed);
  return seed;
}

module.exports = {
  getAllRecords,
  getRecordsByStatus,
  getRecordById,
  addRecord,
  submitToQueue,
  updateRecord,
  lockRecord,
  unlockRecord,
  manualJudge,
  addToExport,
  removeFromExport,
  recalculateExport,
  getExportList,
  getStatistics,
  resetData
};
