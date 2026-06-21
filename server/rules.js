const RULES = [
  {
    id: 'rule_quality_block',
    name: '基础质量阻断规则',
    description: '拓片清晰度或锈蚀程度不达标时直接阻断',
    priority: 1,
    evaluate: (record) => {
      const clarityBad = record.clarity >= 4;
      const rustBad = record.rustLevel >= 4;
      const hit = clarityBad || rustBad;
      const reasons = [];
      if (clarityBad) reasons.push(`拓片清晰度为${record.clarity}级（≥4级），图像模糊难以辨识`);
      if (rustBad) reasons.push(`锈蚀级别为${record.rustLevel}级（≥4级），锈蚀严重覆盖铭文`);
      return {
        hit,
        result: 'blocked',
        resultLabel: '阻断',
        reasons,
        ruleId: 'rule_quality_block',
        ruleName: '基础质量阻断规则'
      };
    }
  },
  {
    id: 'rule_inscription_rejudge',
    name: '铭文残缺复判规则',
    description: '铭文残缺较多且井圈方位不明时需人工复判',
    priority: 2,
    evaluate: (record) => {
      const incompletenessBad = record.incompletenessRate > 30;
      const orientationBad = record.wellOrientation !== 'clear';
      const hit = incompletenessBad && orientationBad;
      const reasons = [];
      if (incompletenessBad) reasons.push(`铭文残缺率${record.incompletenessRate}%（>30%），缺字较多`);
      if (orientationBad) reasons.push(`井圈方位"${record.wellOrientationLabel || record.wellOrientation}"不明确`);
      return {
        hit,
        result: 'rejudge',
        resultLabel: '需复判',
        reasons,
        ruleId: 'rule_inscription_rejudge',
        ruleName: '铭文残缺复判规则'
      };
    }
  },
  {
    id: 'rule_pass_standard',
    name: '标准通过规则',
    description: '各项指标均在良好范围内可直接通过',
    priority: 3,
    evaluate: (record) => {
      const clarityGood = record.clarity <= 2;
      const rustGood = record.rustLevel <= 2;
      const completenessGood = record.incompletenessRate <= 10;
      const orientationGood = record.wellOrientation === 'clear';
      const hit = clarityGood && rustGood && completenessGood && orientationGood;
      const reasons = [];
      if (clarityGood) reasons.push(`拓片清晰度${record.clarity}级（≤2级），图像清晰`);
      if (rustGood) reasons.push(`锈蚀级别${record.rustLevel}级（≤2级），锈蚀轻微`);
      if (completenessGood) reasons.push(`铭文残缺率${record.incompletenessRate}%（≤10%），基本完整`);
      if (orientationGood) reasons.push('井圈方位明确，可准确定位');
      return {
        hit,
        result: 'passed',
        resultLabel: '通过',
        reasons,
        ruleId: 'rule_pass_standard',
        ruleName: '标准通过规则'
      };
    }
  }
];

function calculateWarning(record, ruleResults) {
  const hitRules = ruleResults.filter(r => r.hit);
  if (hitRules.length > 0) return null;

  const warnings = [];
  if (record.clarity === 3) {
    warnings.push(`拓片清晰度${record.clarity}级，部分文字略显模糊`);
  }
  if (record.rustLevel === 3) {
    warnings.push(`锈蚀级别${record.rustLevel}级，局部有锈蚀覆盖`);
  }
  if (record.incompletenessRate > 10 && record.incompletenessRate <= 30) {
    warnings.push(`铭文残缺率${record.incompletenessRate}%，存在少量缺字`);
  }
  if (record.wellOrientation === 'unclear') {
    warnings.push('井圈方位较模糊，需结合现场记录确认');
  }

  if (warnings.length > 0) {
    return {
      hit: true,
      result: 'warning',
      resultLabel: '警告',
      reasons: warnings,
      ruleId: 'rule_warning',
      ruleName: '综合警告提示'
    };
  }
  return null;
}

function evaluateRecord(record) {
  const ruleResults = RULES.map(rule => rule.evaluate(record));

  for (const rule of RULES.sort((a, b) => a.priority - b.priority)) {
    const result = ruleResults.find(r => r.ruleId === rule.id);
    if (result.hit) {
      return {
        finalResult: result.result,
        finalResultLabel: result.resultLabel,
        hitRule: result,
        allRuleResults: ruleResults,
        warning: null
      };
    }
  }

  const warning = calculateWarning(record, ruleResults);
  if (warning) {
    return {
      finalResult: 'warning',
      finalResultLabel: '警告',
      hitRule: warning,
      allRuleResults: ruleResults,
      warning
    };
  }

  return {
    finalResult: 'warning',
    finalResultLabel: '警告',
    hitRule: {
      hit: true,
      result: 'warning',
      resultLabel: '警告',
      reasons: ['未命中通过规则，需人工确认'],
      ruleId: 'rule_default_warning',
      ruleName: '默认警告'
    },
    allRuleResults: ruleResults,
    warning: null
  };
}

function checkTextConflict(oldText, newText) {
  if (!oldText || !newText) return { conflict: false };
  
  const oldChars = oldText.replace(/[\s\[\]□]/g, '').split('');
  const newChars = newText.replace(/[\s\[\]□]/g, '').split('');
  
  const conflicts = [];
  const minLen = Math.min(oldChars.length, newChars.length);
  
  for (let i = 0; i < minLen; i++) {
    if (oldChars[i] !== newChars[i] && oldChars[i] !== '□' && newChars[i] !== '□') {
      conflicts.push({
        position: i + 1,
        oldChar: oldChars[i],
        newChar: newChars[i]
      });
    }
  }
  
  return {
    conflict: conflicts.length > 0,
    conflicts,
    conflictCount: conflicts.length
  };
}

module.exports = {
  RULES,
  evaluateRecord,
  checkTextConflict
};
