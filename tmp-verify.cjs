const fs = require('fs');
const code = fs.readFileSync('backend/public/bundle.js', 'utf-8');
const checks = [
  ['到达终点且巳号风险', 'winFormulaLabels 中文映射'],
  ['🏆', '成功 emoji'],
  ['💥', '失败 emoji'],
  ['settleError', '结算错误状态'],
  ['levelsError', '关卡加载错误状态'],
  ['请先在局面盘移动至少一步', '禁用按钮提示'],
  ['结算失败', '结算失败错误前缀'],
  ['关卡加载失败', '关卡加载失败错误前缀'],
  ['已自动保存到回放轴', '回放轴保存提示'],
  ['请确认后端服务已启动', '后端未启动提示'],
];
console.log('=== Bundle 内容验证 ===');
let allPass = true;
for (const [needle, label] of checks) {
  const found = code.includes(needle);
  if (!found) allPass = false;
  console.log(found ? 'PASS' : 'FAIL', label);
}
console.log('');
console.log(allPass ? 'ALL PASS' : 'SOME FAILED');
