const path = require("path");
require("ts-node").register({
  project: path.join(__dirname, "tsconfig.json"),
  compilerOptions: { module: "CommonJS", moduleResolution: "node" },
  transpileOnly: true,
});

const {
  createNewSession,
  recordObservation,
  recalculateSessionScore,
  getSession,
  updateSession,
  getSessionResult,
  getRecoveryTasks,
  completeRecoveryTask,
} = require("./lib/gameLogic");
const {
  SPECIES,
  POOL_LOCATIONS,
  TOTAL_STEPS,
  getTideLevelAtStep,
  getTidePhaseAtStep,
} = require("./lib/gameData");

function logStep(title, data) {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
}

// ============ Step 1: 创建并完成一局游戏 ============
logStep("Step 1: 创建并完成一局游戏（带踩踏+错过潮位惩罚）");

const session = createNewSession();
console.log(`新会话 ID: ${session.id}`);
console.log(`初始 recoveryBonusResearch: ${session.recoveryBonusResearch}`);
console.log(`初始 recoveryBonusEco: ${session.recoveryBonusEco}`);

// 模拟 8 步观察，故意安排：2 次踩踏 + 只完成 6 步（错过 2 次潮位）
const observations = [
  { step: 0, pool: "pool-north", species: "crab-red", trampled: false, note: "退潮时在岩缝中发现红螯相手蟹" },
  { step: 1, pool: "pool-south", species: "crab-hermit", trampled: false, note: "沙底水洼里的寄居蟹" },
  { step: 2, pool: "pool-north", species: "fish-tidepool", trampled: true }, // 踩踏
  { step: 3, pool: "pool-north", species: "anemone-green", trampled: false, note: "触手开始伸展" },
  { step: 4, pool: "pool-south", species: "anemone-green", trampled: true }, // 踩踏
  { step: 5, pool: "pool-east", species: "fish-clown", trampled: false },
  // 故意跳过 step 6 和 step 7，模拟错过 2 次潮位
];

for (const obs of observations) {
  session.timeStep = obs.step;
  session.currentTideLevel = getTideLevelAtStep(obs.step, TOTAL_STEPS);
  session.currentTidePhase = getTidePhaseAtStep(obs.step, TOTAL_STEPS);
  session.route.push(obs.pool);
  if (!session.visitedPools.includes(obs.pool)) session.visitedPools.push(obs.pool);
  if (obs.trampled) session.tramplingCount += 1;
  recordObservation({
    sessionId: session.id,
    poolId: obs.pool,
    speciesId: obs.species,
    tideLevel: session.currentTideLevel,
    tidePhase: session.currentTidePhase,
    timeStep: obs.step,
    trampled: obs.trampled,
    note: obs.note,
  });
}

session.timeStep = TOTAL_STEPS;
session.status = "completed";
updateSession(session);

let result = recalculateSessionScore(session.id);
logStep("Step 1 完成：首次结算结果（未做恢复任务）", {
  researchPoints: result.researchPoints,
  ecoScore: result.ecoScore,
  finalScore: result.finalScore,
  preRecoveryResearch: result.preRecoveryResearch,
  preRecoveryEco: result.preRecoveryEco,
  preRecoveryFinal: result.preRecoveryFinal,
  tramplingPenalty: result.tramplingPenalty,
  missedTidePenalty: result.missedTidePenalty,
});

let recoveryTasks = getRecoveryTasks(session.id);
logStep("Step 1 完成：初始恢复任务列表", recoveryTasks.map(t => ({
  id: t.id, type: t.type, description: t.description,
  pointsReward: t.pointsReward, completed: t.completed
})));

console.log("\n✅ 首次差异检查：");
console.log(`   preRecoveryResearch === researchPoints : ${result.preRecoveryResearch === result.researchPoints}`);
console.log(`   preRecoveryEco === ecoScore           : ${result.preRecoveryEco === result.ecoScore}`);
console.log(`   preRecoveryFinal === finalScore       : ${result.preRecoveryFinal === result.finalScore}`);
console.log(`   (尚未做任何恢复任务，三者应完全相等)`);

// ============ Step 2: 完成第一个恢复任务并触发重算 ============
logStep("Step 2: 完成第一个恢复任务（trampling 类型）+ 触发重算");

const task1 = recoveryTasks.find(t => t.type === "trampling");
console.log(`选择任务: ${task1.description} (id=${task1.id})`);

const completed1 = completeRecoveryTask(task1.id);
console.log(`任务完成结果: completed=${completed1.completed}`);

// 验证 session 中的 bonus 字段
const sessionAfterTask1 = getSession(session.id);
console.log(`\nSession bonus 字段更新:`);
console.log(`  recoveryBonusResearch: ${sessionAfterTask1.recoveryBonusResearch}`);
console.log(`  recoveryBonusEco:      ${sessionAfterTask1.recoveryBonusEco}`);

// 触发重算
result = recalculateSessionScore(session.id);
logStep("Step 2 完成：完成 1 个恢复任务后的结算结果", {
  researchPoints: result.researchPoints,
  ecoScore: result.ecoScore,
  finalScore: result.finalScore,
  preRecoveryResearch: result.preRecoveryResearch,
  preRecoveryEco: result.preRecoveryEco,
  preRecoveryFinal: result.preRecoveryFinal,
});

console.log("\n✅ 完成 1 个任务后差异检查：");
console.log(`   preRecoveryResearch: ${result.preRecoveryResearch} → researchPoints: ${result.researchPoints} (+${result.researchPoints - result.preRecoveryResearch})`);
console.log(`   preRecoveryEco:      ${result.preRecoveryEco} → ecoScore: ${result.ecoScore} (+${result.ecoScore - result.preRecoveryEco})`);
console.log(`   preRecoveryFinal:    ${result.preRecoveryFinal} → finalScore: ${result.finalScore} (+${result.finalScore - result.preRecoveryFinal})`);
console.log(`   (差异应存在，证明 preRecovery 基准分被持久化)`);

recoveryTasks = getRecoveryTasks(session.id);
logStep("Step 2 完成：恢复任务列表（已完成任务应保留）", recoveryTasks.map(t => ({
  type: t.type, completed: t.completed, pointsReward: t.pointsReward
})));

const completedCount = recoveryTasks.filter(t => t.completed).length;
const pendingCount = recoveryTasks.filter(t => !t.completed).length;
console.log(`\n✅ 任务状态检查：`);
console.log(`   已完成数: ${completedCount} (应 ≥ 1)`);
console.log(`   待完成数: ${pendingCount} (其余任务应存在可继续)`);

// ============ Step 3: 模拟重新加载会话（模拟刷新页面） ============
logStep("Step 3: 模拟重新加载会话（完全从 DB 重新读取，模拟刷新页面）");

// 清空所有内存中的引用，全部重新查询
const reloadedSession = getSession(session.id);
const reloadedResult = getSessionResult(session.id);
const reloadedTasks = getRecoveryTasks(session.id);

logStep("Step 3a: 重新读取 Session（验证 bonus 持久化）", {
  recoveryBonusResearch: reloadedSession.recoveryBonusResearch,
  recoveryBonusEco: reloadedSession.recoveryBonusEco,
  "应与 Step2 相等": true
});

logStep("Step 3b: 重新读取 SessionResult（验证前后差异持久化）", {
  researchPoints: reloadedResult.researchPoints,
  ecoScore: reloadedResult.ecoScore,
  finalScore: reloadedResult.finalScore,
  preRecoveryResearch: reloadedResult.preRecoveryResearch,
  preRecoveryEco: reloadedResult.preRecoveryEco,
  preRecoveryFinal: reloadedResult.preRecoveryFinal,
});

console.log("\n✅ 刷新后差异检查（最关键验证点）：");
const diffResearch = reloadedResult.researchPoints - reloadedResult.preRecoveryResearch;
const diffEco = reloadedResult.ecoScore - reloadedResult.preRecoveryEco;
const diffFinal = reloadedResult.finalScore - reloadedResult.preRecoveryFinal;
console.log(`   研究积分: ${reloadedResult.preRecoveryResearch} → ${reloadedResult.researchPoints} (+${diffResearch})`);
console.log(`   生态评分: ${reloadedResult.preRecoveryEco} → ${reloadedResult.ecoScore} (+${diffEco})`);
console.log(`   总    分: ${reloadedResult.preRecoveryFinal} → ${reloadedResult.finalScore} (+${diffFinal})`);

logStep("Step 3c: 重新读取恢复任务列表（模拟刷新后 React state 恢复）",
  reloadedTasks.map(t => ({
    type: t.type, completed: t.completed,
    description: t.description, pointsReward: t.pointsReward
  }))
);

const reloadCompletedCount = reloadedTasks.filter(t => t.completed).length;
const reloadPendingCount = reloadedTasks.filter(t => !t.completed).length;
console.log(`\n✅ 刷新后任务状态检查（最关键验证点）：`);
console.log(`   已完成数: ${reloadCompletedCount} (应与刷新前保持一致 = ${completedCount})`);
console.log(`   待完成数: ${reloadPendingCount} (应与刷新前保持一致 = ${pendingCount})`);

const stillHasCompleted = reloadCompletedCount >= 1;
const stillHasPending = reloadPendingCount >= 1;
const diffsPersisted = diffResearch > 0 || diffEco > 0 || diffFinal > 0;

console.log(`\n${"=".repeat(70)}`);
console.log(`  Step 3 核心验证结论`);
console.log(`${"=".repeat(70)}`);
console.log(`   [${stillHasCompleted ? "✅ PASS" : "❌ FAIL"}] 已完成任务在刷新后仍然保留`);
console.log(`   [${stillHasPending ? "✅ PASS" : "❌ FAIL"}] 待完成任务仍然存在可继续完成`);
console.log(`   [${diffsPersisted ? "✅ PASS" : "❌ FAIL"}] 研究积分/生态评分/总分的前后差异被持久化`);

// ============ Step 4: 继续完成剩余恢复任务 ============
logStep("Step 4: 从刷新后的状态继续，完成剩余恢复任务");

const pendingTasks = reloadedTasks.filter(t => !t.completed);
console.log(`待完成任务数: ${pendingTasks.length}`);

let i = 0;
for (const task of pendingTasks) {
  i++;
  console.log(`\n  完成剩余任务 #${i}: ${task.type} - ${task.description}`);
  const done = completeRecoveryTask(task.id);
  console.log(`    → 完成状态: completed=${done.completed}`);

  const midSession = getSession(session.id);
  console.log(`    → recoveryBonusResearch=${midSession.recoveryBonusResearch}, recoveryBonusEco=${midSession.recoveryBonusEco}`);
}

// 再次触发重算（模拟用户点剩余任务后重算）
result = recalculateSessionScore(session.id);
logStep("Step 4 完成：所有恢复任务完成后最终结算", {
  researchPoints: result.researchPoints,
  ecoScore: result.ecoScore,
  finalScore: result.finalScore,
  preRecoveryResearch: result.preRecoveryResearch,
  preRecoveryEco: result.preRecoveryEco,
  preRecoveryFinal: result.preRecoveryFinal,
});

recoveryTasks = getRecoveryTasks(session.id);
logStep("Step 4 完成：最终任务状态", recoveryTasks.map(t => ({
  type: t.type, completed: t.completed,
})));

console.log("\n✅ 完成所有任务后验证：");
console.log(`   preRecoveryResearch 仍保持首次结算基准: ${result.preRecoveryResearch}`);
console.log(`   researchPoints 叠加全部奖励后为:        ${result.researchPoints}`);
console.log(`   总差异: +${result.researchPoints - result.preRecoveryResearch} 研究积分, ` +
            `+${result.ecoScore - result.preRecoveryEco} 生态评分, ` +
            `+${result.finalScore - result.preRecoveryFinal} 总分`);

const allCompleted = recoveryTasks.every(t => t.completed);
const benchmarkUnchanged = result.preRecoveryResearch === reloadedResult.preRecoveryResearch
                       && result.preRecoveryEco === reloadedResult.preRecoveryEco
                       && result.preRecoveryFinal === reloadedResult.preRecoveryFinal;

console.log(`\n${"=".repeat(70)}`);
console.log(`  最终验证结论`);
console.log(`${"=".repeat(70)}`);
console.log(`   [${allCompleted ? "✅ PASS" : "❌ FAIL"}] 所有恢复任务全部标记为完成`);
console.log(`   [${benchmarkUnchanged ? "✅ PASS" : "❌ FAIL"}] preRecovery 基准分在所有操作中保持不变（与第一次重算一致）`);
console.log(`   [${stillHasCompleted ? "✅ PASS" : "❌ FAIL"}] 刷新页面后已完成任务保留，可继续完成剩余任务`);
console.log(`   [${diffsPersisted ? "✅ PASS" : "❌ FAIL"}] 刷新页面后结算面板仍可展示研究积分、生态评分和总分的恢复前后差异`);
console.log(`${"=".repeat(70)}`);
