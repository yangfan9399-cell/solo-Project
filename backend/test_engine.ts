import { LEVELS } from "./src/data/levels";
import { settleGame } from "./src/engine/settlement";
import { GameField, Position } from "@cbcp/shared";

type Step = { positionFrom: Position; positionTo: Position };

function runTest(name: string, levelId: "si" | "shen" | "wu", steps: Step[], expectSuccess: boolean, assertions?: (r: any) => void) {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const result = settleGame(level, steps, level.initialField as GameField);
  const status = result.success === expectSuccess ? "✅" : "❌";
  console.log(`${status} ${name}`);
  console.log(`    success=${result.success} (期望${expectSuccess}) | formulaHit=${result.formulaHit}`);
  console.log(`    reason: ${result.reason}`);
  console.log(`    totalReward=${result.totalReward.toFixed(2)} riskLevel=${result.riskLevel}`);
  const events = result.debugTrace.filter((l: string) => l.includes("触发事件"));
  if (events.length) {
    console.log(`    事件(${events.length}):`);
    events.forEach((e: string) => console.log(`      ${e}`));
  }
  if (assertions) {
    try {
      assertions(result);
    } catch (e: any) {
      console.log(`    ❌ 断言失败: ${e.message}`);
      throw e;
    }
  }
  console.log("");
  return result;
}

console.log("═══════════════════════════════════════");
console.log("  珊瑚钟室路径解谜游戏 - 引擎集成测试");
console.log("═══════════════════════════════════════\n");

// 1. 巳局 NO_RISK 通关 (5x5 地图)
// 起点 (0,4) → 终点 (4,0)，绕开 HAZARD(0,2)
runTest(
  "巳局·无风险通关 (走右绕路)",
  "si",
  [
    ["0,4", "1,4"], ["1,4", "2,4"], ["2,4", "3,4"], ["3,4", "4,4"],
    ["4,4", "4,3"], ["4,3", "4,2"], ["4,2", "4,1"], ["4,1", "4,0"],
  ].map(([a, b]) => ({
    positionFrom: { x: +a.split(",")[0], y: +a.split(",")[1] },
    positionTo: { x: +b.split(",")[0], y: +b.split(",")[1] },
  })),
  true,
  (r) => {
    if (r.finalField.siRisk !== 0) throw new Error(`siRisk=${r.finalField.siRisk}，应=0`);
    // value 触发器 si-tutorial-end-hint 只触发一次（只统计"触发事件"行）
    const count = r.debugTrace.filter((l: string) => l.includes("触发事件") && l.includes("si-tutorial-end-hint")).length;
    if (count !== 1) throw new Error(`si-tutorial-end-hint 触发 ${count} 次，应=1`);
  }
);

// 2. 巳局 踩风险 → 公式不命中 (因为没有到达终点)
runTest(
  "巳局·踩风险但未到终点 → formula不命中",
  "si",
  [
    ["0,4", "0,3"], ["0,3", "0,2"], // 走到 HAZARD(0,2)
  ].map(([a, b]) => ({
    positionFrom: { x: +a.split(",")[0], y: +a.split(",")[1] },
    positionTo: { x: +b.split(",")[0], y: +b.split(",")[1] },
  })),
  false,
  (r) => {
    if (r.finalField.siRisk !== 1) throw new Error(`siRisk=${r.finalField.siRisk}，应=1`);
  }
);

// 3. 巳局 走捷径穿风险 → 到达终点但siRisk>0 → fail
runTest(
  "巳局·踩风险后到达终点 → 公式不命中",
  "si",
  [
    ["0,4", "0,3"], ["0,3", "0,2"], // HAZARD +1 risk
    ["0,2", "1,2"], ["1,2", "2,2"], // REWARD(2,2) 拿奖励
    ["2,2", "2,3"], // CORAL_BELL (但这里是OBSTACLE? 2,3 是 CORAL_BELL，看地图)
    // 地图 y=3: [P, O, C, O, P] → (2,3)=CORAL_BELL, (1,3)=O 所以可以 1,2→2,2→2,3→不行 2,3 周围: (2,2)R, (2,4)P, (1,3)O, (3,3)O.
    // 所以从 (2,2) 只能回 (0,2)(1,2)。路径: (0,2)→(1,2)→(2,2)→(2,3)→但(2,4)P! 对!
  ].map(([a, b]) => ({
    positionFrom: { x: +a.split(",")[0], y: +a.split(",")[1] },
    positionTo: { x: +b.split(",")[0], y: +b.split(",")[1] },
  })),
  false // 还没到终点
);

// 4. 巳局 相邻非法 → 失败
runTest(
  "巳局·非相邻移动 → 被拒",
  "si",
  [
    ["0,4", "4,0"],  // 直接跳终点
  ].map(([a, b]) => ({
    positionFrom: { x: +a.split(",")[0], y: +a.split(",")[1] },
    positionTo: { x: +b.split(",")[0], y: +b.split(",")[1] },
  })),
  false,
  (r) => {
    if (!r.reason.includes("非相邻")) throw new Error(`应包含'非相邻'，实际=${r.reason}`);
  }
);

// 5. 申局 译槽充盈 bonus 触发
// 申局起点 (0,4), 译格(1,2). 路径 (0,4)→(0,3)→(0,2)→(1,2)TR
runTest(
  "申局·译槽+2触发充盈奖励",
  "shen",
  [
    ["0,4", "0,3"], ["0,3", "0,2"], ["0,2", "1,2"], // TR: translationSlot +2 → bonus >=2 再+1 reward
  ].map(([a, b]) => ({
    positionFrom: { x: +a.split(",")[0], y: +a.split(",")[1] },
    positionTo: { x: +b.split(",")[0], y: +b.split(",")[1] },
  })),
  false, // 未到终点
  (r) => {
    if (r.finalField.translationSlot !== 2) throw new Error(`译槽=${r.finalField.translationSlot}，应=2`);
    // shen-bonus-translate-used 触发（只统计"触发事件"行）
    const count = r.debugTrace.filter((l: string) => l.includes("触发事件") && l.includes("shen-bonus-translate-used")).length;
    if (count !== 1) throw new Error(`译槽充盈事件触发${count}次，应=1`);
  }
);

// 6. 午局 隐藏密印 overwriteMark>=3
// 初始 overwriteMark=1. 两个SWITCH格: (1,2)=SW +1, (4,4)=SW +1 → 合计3 → 触发 hidden
// 路径到两个SWITCH: (0,5)→(0,4)→(0,3)H→(0,2)→(1,2)SW +1=2, 还需要再+1
// 从 (1,2)→(2,2)→(3,2)TR→(3,3)→(3,4)→(4,4)SW +1=3 → 触发 hidden!
runTest(
  "午局·双开关触发隐藏密印",
  "wu",
  [
    ["0,5", "0,4"], ["0,4", "0,3"], ["0,3", "0,2"], ["0,2", "1,2"],  // SW1, overwriteMark=1+1=2
    ["1,2", "2,2"], ["2,2", "3,2"],                                   // TR
    ["3,2", "3,3"], ["3,3", "3,4"], ["3,4", "4,4"],                   // SW2, overwriteMark=2+1=3 → hidden!
  ].map(([a, b]) => ({
    positionFrom: { x: +a.split(",")[0], y: +a.split(",")[1] },
    positionTo: { x: +b.split(",")[0], y: +b.split(",")[1] },
  })),
  false, // 未到终点
  (r) => {
    if (r.finalField.overwriteMark < 3) throw new Error(`复写痕=${r.finalField.overwriteMark}，应>=3`);
    const hiddenCount = r.debugTrace.filter((l: string) => l.includes("触发事件") && l.includes("wu-hidden-seal")).length;
    if (hiddenCount !== 1) throw new Error(`隐藏密印触发${hiddenCount}次，应=1`);
    console.log(`    🎯 隐藏密印已激活! shenReward=${r.finalField.shenReward}`);
  }
);

console.log("═══════════════════════════════════════");
console.log("  ✅ 全部引擎断言通过!");
console.log("═══════════════════════════════════════");
