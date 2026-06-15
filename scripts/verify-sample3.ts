import {
  getSeedSamples,
  getAllPuzzleLevels,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAllKeyRingGroups,
  createGameSession,
  addAssignmentDetail,
  addHistoryRecord,
  addResultRecord,
  addAccessLog,
  updateSessionStep,
  completeSession,
  getAssignmentDetails,
  getResultRecords,
  getAccessLogs,
  rollbackToStep,
} from "../app/models/db.server";
import {
  validateAssignment,
  computeInitialLockStates,
  calculateSessionScore,
  performPostTrace,
} from "../app/models/gameLogic.server";
import type { TimeSlot } from "../app/models/types";

const samples = getSeedSamples();
const sample3 = samples.find((s: any) => s.id === 3);
if (!sample3) {
  console.error("样本三未找到");
  process.exit(1);
}

const level = getAllPuzzleLevels().find((l: any) => l.id === sample3.data.level);
const people = getAllPeople();
const keys = getAllKeys();
const rooms = getAllRooms();
const keyRingGroups = getAllKeyRingGroups();

const session = createGameSession(
  level!.id,
  sample3.data.finalAssignments.length,
  `验证脚本：${sample3.name}`
);

console.log(`\n===== 样本三回滚验证 =====`);
console.log(`局次 ID: ${session.id}`);
console.log(`firstAttempt 数量: ${sample3.data.firstAttempt.length}`);
console.log(`rollbackStep: ${sample3.data.rollbackStep}`);
console.log(`finalAssignments 数量: ${sample3.data.finalAssignments.length}`);

const lockStates = computeInitialLockStates(rooms);
let rollbackCount = 0;

console.log(`\n--- 阶段 1：写入 firstAttempt（错误分配） ---`);
for (let i = 0; i < sample3.data.firstAttempt.length; i++) {
  const a = sample3.data.firstAttempt[i];
  const person = people.find((p: any) => p.id === a.person_id)!;
  const key = keys.find((k: any) => k.id === a.key_id)!;
  const result = validateAssignment(person, key, a.slot as TimeSlot, rooms, lockStates);
  addAssignmentDetail(session.id, i, a.person_id, a.key_id, a.slot as TimeSlot);
  addHistoryRecord(session.id, i, a.person_id, `首次尝试分配${key.label}`, a.slot as TimeSlot, result.ok);
  addResultRecord(session.id, key.id, key.room_ids, [a.slot as TimeSlot], key.duplication_risk >= 8 && person.trust_level <= 4);
  console.log(`  step ${i}: ${person.name} → ${key.label} (${a.slot}) → ok=${result.ok}, events=${result.events.map((e:any)=>e.type).join(",")}`);
}

const detailsBefore = getAssignmentDetails(session.id);
const resultsBefore = getResultRecords(session.id);
const preRollbackScore = calculateSessionScore(detailsBefore, people, keys, rooms, resultsBefore, 0, false, keyRingGroups);
console.log(`\n  回滚前明细条数: ${detailsBefore.length}`);
console.log(`  回滚前结果记录条数: ${resultsBefore.length}`);
console.log(`  回滚前预估分数: ${preRollbackScore.total}`);

console.log(`\n--- 阶段 2：执行回滚 rollbackStep=${sample3.data.rollbackStep} ---`);
for (const a of sample3.data.rollbackAssignments) {
  addHistoryRecord(
    session.id,
    sample3.data.rollbackStep,
    a.person_id,
    `回滚：撤回${keys.find((k:any) => k.id === a.key_id)?.label}`,
    a.slot as TimeSlot,
    false
  );
  addAccessLog(
    session.id,
    null,
    a.person_id,
    a.key_id,
    "ROLLBACK",
    `管家发现风险，立即回滚了 ${people.find((p:any) => p.id === a.person_id)?.name} 的钥匙分配。`,
    { assigned: true, estimated_score_before_rollback: preRollbackScore.total },
    { assigned: false, rollback_reason: "DUPLICATION_RISK / TRUST_MISMATCH" }
  );
}
rollbackCount = sample3.data.rollbackAssignments.length;
rollbackToStep(session.id, sample3.data.rollbackStep);
updateSessionStep(session.id, sample3.data.rollbackStep);

const detailsAfterRollback = getAssignmentDetails(session.id);
const resultsAfterRollback = getResultRecords(session.id);
console.log(`  回滚后明细条数: ${detailsAfterRollback.length}`);
console.log(`  回滚后结果记录条数: ${resultsAfterRollback.length}`);

console.log(`\n--- 阶段 3：写入 finalAssignments（正确分配） ---`);
const assignments = sample3.data.finalAssignments;
for (let i = 0; i < assignments.length; i++) {
  const a = assignments[i];
  const person = people.find((p: any) => p.id === a.person_id)!;
  const key = keys.find((k: any) => k.id === a.key_id)!;
  const slot = a.slot as TimeSlot;
  const result = validateAssignment(person, key, slot, rooms, lockStates);
  addAssignmentDetail(session.id, i, a.person_id, a.key_id, slot);
  addHistoryRecord(session.id, i, a.person_id, `领取 ${key.label}`, slot, result.ok);
  addResultRecord(session.id, key.id, key.room_ids, [slot], key.duplication_risk >= 8 && person.trust_level <= 4);
  console.log(`  step ${i}: ${person.name} → ${key.label} (${slot}) → ok=${result.ok}`);
}

const finalDetails = getAssignmentDetails(session.id);
const finalResults = getResultRecords(session.id);
const finalLogs = getAccessLogs(session.id);

const trace = performPostTrace(finalDetails, people, keys);
const breakdown = calculateSessionScore(finalDetails, people, keys, rooms, finalResults, rollbackCount, trace.valid, keyRingGroups);

console.log(`\n===== 最终验证 =====`);
console.log(`✅ assignment_details 条数: ${finalDetails.length} (预期 = ${sample3.data.finalAssignments.length})`);
console.log(`✅ result_records 条数: ${finalResults.length}`);
console.log(`✅ access_logs 条数: ${finalLogs.length}`);
console.log(`✅ 回滚次数: ${rollbackCount}`);
console.log(`✅ 最终分数: ${breakdown.total}`);
console.log(`✅ 重算说明: ${breakdown.recomputeFromDetailsNote}`);
console.log(`✅ 钥匙环匹配奖励: +${breakdown.keyRingMatchBonus}`);
console.log(`✅ 钥匙环错配惩罚: -${breakdown.keyRingMismatchPenalty}`);

console.log(`\n--- 最终明细列表 ---`);
finalDetails.forEach((d: any, i: number) => {
  const person = people.find((p: any) => p.id === d.person_id);
  const key = keys.find((k: any) => k.id === d.key_id);
  console.log(`  ${i + 1}. step=${d.step_index} ${person?.name} → ${key?.label} [${d.assigned_slot}]`);
});

const hasFirstAttempt = finalDetails.some((d: any) => d.key_id === "k04" || d.key_id === "k12");
console.log(`\n${hasFirstAttempt ? "❌" : "✅"} 残留 firstAttempt 错误分配: ${hasFirstAttempt ? "是（有问题）" : "否（正确）"}`);

const allFromFinal = sample3.data.finalAssignments.every((fa: any) =>
  finalDetails.some((d: any) => d.person_id === fa.person_id && d.key_id === fa.key_id)
);
console.log(`${allFromFinal ? "✅" : "❌"} 所有 finalAssignments 都在明细中: ${allFromFinal ? "是" : "否"}`);

if (finalDetails.length === sample3.data.finalAssignments.length && !hasFirstAttempt && allFromFinal) {
  console.log(`\n🎉 验证通过：钥匙环编组回滚后只按最终分配明细重算！`);
  process.exit(0);
} else {
  console.log(`\n❌ 验证失败`);
  process.exit(1);
}
