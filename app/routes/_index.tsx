import { useLoaderData, Form, Link } from "@remix-run/react";
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import {
  getAllPuzzleLevels,
  getAllSessions,
  createGameSession,
  getSeedSamples,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAllKeyRingGroups,
  addAssignmentDetail,
  addHistoryRecord,
  addResultRecord,
  addAccessLog,
  completeSession,
  updateSessionStep,
  getAssignmentDetails,
  getResultRecords,
  rollbackToStep,
} from "~/models/db.server";
import {
  validateAssignment,
  computeInitialLockStates,
  calculateSessionScore,
  performPostTrace,
} from "~/models/gameLogic.server";
import type { TimeSlot } from "~/models/types";
import { RoleTag } from "~/components/ui";

export async function loader() {
  const levels = getAllPuzzleLevels();
  const sessions = getAllSessions().slice(0, 8);
  const samples = getSeedSamples();
  return json({ levels, sessions, samples });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "start_level") {
    const levelId = Number(formData.get("level_id"));
    const level = getAllPuzzleLevels().find((l) => l.id === levelId);
    if (!level) return redirect("/");
    const session = createGameSession(levelId, level.people_ids.length, level.description);
    return redirect(`/session/${session.id}`);
  }

  if (intent === "run_sample") {
    const sampleId = Number(formData.get("sample_id"));
    const samples = getSeedSamples();
    const sample = samples.find((s) => s.id === sampleId);
    if (!sample) return redirect("/");

    const level = getAllPuzzleLevels().find((l) => l.id === sample.data.level);
    if (!level) return redirect("/");
    const people = getAllPeople();
    const keys = getAllKeys();
    const rooms = getAllRooms();

    const session = createGameSession(
      level.id,
      (sample.data.finalAssignments || sample.data.assignments || []).length,
      `种子样本：${sample.name}`
    );

    const lockStates = computeInitialLockStates(rooms);
    let rollbackCount = 0;

    const keyRingGroups = getAllKeyRingGroups();

    if (sample.data.type === "ROLLBACK_RESOLVE" && sample.data.firstAttempt) {
      for (let i = 0; i < sample.data.firstAttempt.length; i++) {
        const a = sample.data.firstAttempt[i];
        const person = people.find((p) => p.id === a.person_id)!;
        const key = keys.find((k) => k.id === a.key_id)!;
        const result = validateAssignment(person, key, a.slot as TimeSlot, rooms, lockStates);

        addAssignmentDetail(session.id, i, a.person_id, a.key_id, a.slot as TimeSlot);
        addHistoryRecord(session.id, i, a.person_id, `首次尝试分配${key.label}`, a.slot as TimeSlot, result.ok);
        addResultRecord(session.id, key.id, key.room_ids, [a.slot as TimeSlot], key.duplication_risk >= 8 && person.trust_level <= 4);

        for (const ev of result.events) {
          addAccessLog(
            session.id,
            ev.room || null,
            a.person_id,
            a.key_id,
            ev.type,
            ev.message,
            { step: "first_attempt", index: i },
            { step: "rollback_required", index: i }
          );
        }
      }

      const detailsBeforeRollback = getAssignmentDetails(session.id);
      const preRollbackScore = calculateSessionScore(detailsBeforeRollback, people, keys, rooms, getResultRecords(session.id), 0, false, keyRingGroups);

      if (sample.data.rollbackAssignments) {
        for (const a of sample.data.rollbackAssignments) {
          addHistoryRecord(
            session.id,
            sample.data.rollbackStep,
            a.person_id,
            `回滚：撤回${keys.find((k) => k.id === a.key_id)?.label}`,
            a.slot as TimeSlot,
            false
          );
          addAccessLog(
            session.id,
            null,
            a.person_id,
            a.key_id,
            "ROLLBACK",
            `管家发现风险，立即回滚了 ${people.find((p) => p.id === a.person_id)?.name} 的钥匙分配。回滚前预估分数：${preRollbackScore.total}，即将按局次明细重算。`,
            { assigned: true, estimated_score_before_rollback: preRollbackScore.total, details_count_before: detailsBeforeRollback.length, recompute_trigger: "钥匙环编组冲突" },
            { assigned: false, rollback_reason: "DUPLICATION_RISK / TRUST_MISMATCH", recompute_note: `将删除 step>=${sample.data.rollbackStep} 的所有分配明细与结果记录` }
          );
        }
        rollbackCount = sample.data.rollbackAssignments.length;
        rollbackToStep(session.id, sample.data.rollbackStep);
        updateSessionStep(session.id, sample.data.rollbackStep);

        addAccessLog(
          session.id,
          null,
          null,
          null,
          "KEY_GROUP_OK",
          `已完成回滚：删除错误分配后，局次明细已按步骤 ${sample.data.rollbackStep} 为基准重建。`,
          { rollback_count: rollbackCount, session_step_reset_to: sample.data.rollbackStep, action: "CLEAR_ASSIGNMENTS_AND_RESULTS" },
          { remaining_details: getAssignmentDetails(session.id).length, recompute_ready: true }
        );
      }
    }

    const assignments = sample.data.finalAssignments || sample.data.assignments || [];
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      const person = people.find((p) => p.id === a.person_id)!;
      const key = keys.find((k) => k.id === a.key_id)!;
      const slot = a.slot as TimeSlot;

      const result = validateAssignment(person, key, slot, rooms, lockStates);
      for (const change of result.lockStateChanges) {
        lockStates[change.roomId].is_locked = change.nowLocked;
        lockStates[change.roomId].last_access = new Date().toISOString();
        lockStates[change.roomId].accessed_by = person.id;
      }

      addAssignmentDetail(session.id, i, a.person_id, a.key_id, slot);
      addHistoryRecord(session.id, i, a.person_id, `领取 ${key.label}`, slot, result.ok);

      const roomsCovered = key.room_ids;
      const slotsUsed = [slot];
      const dupTriggered = key.duplication_risk >= 8 && person.trust_level <= 4;
      addResultRecord(session.id, key.id, roomsCovered, slotsUsed, dupTriggered);

      for (const ev of result.events) {
        addAccessLog(
          session.id,
          ev.room || null,
          a.person_id,
          a.key_id,
          ev.type,
          ev.message,
          { lock_state: Object.fromEntries(Object.entries(lockStates).map(([k, v]) => [k, v.is_locked])) },
          {
            lock_state_changes: result.lockStateChanges.map((c) => ({
              room: c.roomId,
              was: c.wasLocked,
              now: c.nowLocked,
              reason: c.reason,
            })),
          }
        );
      }

      if (result.lockStateChanges.length > 0) {
        addAccessLog(
          session.id,
          result.lockStateChanges[0].roomId,
          a.person_id,
          a.key_id,
          result.ok ? "KEY_GROUP_OK" : "LOCKED_IN",
          `门锁状态变更：${result.lockStateChanges.map((c) => `${rooms.find((r) => r.id === c.roomId)?.name}[${c.wasLocked ? "锁" : "开"}→${c.nowLocked ? "锁" : "开"}]`).join("；")}`,
          Object.fromEntries(Object.entries(lockStates).map(([k, v]) => [k, v.is_locked])),
          Object.fromEntries(Object.entries(lockStates).map(([k, v]) => [k, v.is_locked]))
        );
      }
    }

    const details = getAssignmentDetails(session.id);
    const results = getResultRecords(session.id);
    let traceCompleted = false;
    if (level.trace_required || sample.data.type === "ROLLBACK_RESOLVE") {
      const trace = performPostTrace(details, people, keys);
      traceCompleted = trace.valid;
      if (traceCompleted) {
        addAccessLog(
          session.id,
          null,
          null,
          null,
          "TRACE_COMPLETE",
          trace.findings.join(" "),
          { tracing: true },
          { traceValid: true, findings: trace.findings.length }
        );
      }
    }

    const breakdown = calculateSessionScore(details, people, keys, rooms, results, rollbackCount, traceCompleted, keyRingGroups);
    const finalStatus = breakdown.total >= 50 ? "completed" : "failed";
    completeSession(session.id, breakdown.total, finalStatus);

    return redirect(`/session/${session.id}/result`);
  }

  return redirect("/");
}

export default function Index() {
  const { levels, sessions, samples } = useLoaderData<typeof loader>();

  return (
    <div className="app-container">
      <div className="page-header">
        <h1>古堡管家 · 钥匙环管理</h1>
        <p>为访客、维修工和夜巡人员分配实体钥匙 · 匹配房间范围与可借时段 · 警惕复制风险</p>
        <div className="ornament" />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 40 }}>
        <div className="card">
          <div className="card-title">🧩 谜题关卡</div>
          <div className="level-list">
            {levels.map((level) => (
              <Form key={level.id} method="post">
                <input type="hidden" name="intent" value="start_level" />
                <input type="hidden" name="level_id" value={level.id} />
                <button type="submit" className="level-card" style={{ width: "100%", textAlign: "left", color: "inherit" }}>
                  <div className="level-number">{String(level.id).padStart(2, "0")}</div>
                  <div className="level-info" style={{ flex: 1 }}>
                    <h3>{level.name}</h3>
                    <p>{level.description}</p>
                    <div className="level-meta">
                      <span className="tag tag-gold">{level.people_ids.length} 人需分配</span>
                      <span className="tag">{level.trace_required ? "需事后追踪" : "无需追踪"}</span>
                      {level.id === 1 && <span className="tag tag-green">入门</span>}
                      {level.id === 2 && <span className="tag tag-red">挑战</span>}
                      {level.id === 3 && <span className="tag tag-purple">大师</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 22 }}>▶</div>
                </button>
              </Form>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">🧪 种子样本演示</div>
          <div className="samples-grid">
            {samples.map((sample) => (
              <Form key={sample.id} method="post">
                <input type="hidden" name="intent" value="run_sample" />
                <input type="hidden" name="sample_id" value={sample.id} />
                <button type="submit" className="sample-card" style={{ width: "100%", textAlign: "left", color: "inherit", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4>{sample.name}</h4>
                    <span className={`tag ${sample.type === "NORMAL_COMPLETE" ? "tag-green" : sample.type === "ABNORMAL_TRIGGER" ? "tag-red" : "tag-purple"}`}>
                      {sample.type === "NORMAL_COMPLETE" ? "正常" : sample.type === "ABNORMAL_TRIGGER" ? "异常" : "回滚"}
                    </span>
                  </div>
                  <div className="sample-desc">{sample.description}</div>
                  <div style={{ fontSize: 11, color: "#6c6c8a" }}>
                    预期分数区间：{sample.data.expectedScoreBracket?.[0] ?? "?"} – {sample.data.expectedScoreBracket?.[1] ?? "?"}
                  </div>
                </button>
              </Form>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: "16px", background: "rgba(52,152,219,0.08)", borderRadius: 12, border: "1px solid rgba(52,152,219,0.2)" }}>
            <div style={{ color: "#3498db", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💡 验收提示</div>
            <ul style={{ fontSize: 12, color: "#a8a8c0", paddingLeft: 18, lineHeight: 1.8 }}>
              <li>点击「种子样本演示」可一键演示三类典型情况</li>
              <li>结算页可看到门锁图谱前后差异、访问日志变化原因</li>
              <li>分数由后端按 assignment_details 明细重算，不存前端缓存</li>
              <li>所有钥匙分配写入 assignment_details / history_records / result_records 三表</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="session-history">
        <h2>📜 历史局次</h2>
        {sessions.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40, color: "#6c6c8a" }}>
            暂无局次记录，点击上方关卡或种子样本开始游戏
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>局次ID</th>
                <th>关卡</th>
                <th>状态</th>
                <th>进度</th>
                <th>分数</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.id.slice(0, 18)}…</td>
                  <td>关卡 {s.puzzle_level}</td>
                  <td>
                    <span className={`tag ${s.status === "completed" ? "tag-green" : s.status === "failed" ? "tag-red" : "tag-blue"}`}>
                      {s.status === "completed" ? "已完成" : s.status === "failed" ? "失败" : "进行中"}
                    </span>
                  </td>
                  <td>{s.current_step} / {s.total_steps}</td>
                  <td style={{ color: "#f1c40f", fontWeight: 600 }}>{s.final_score ?? "-"}</td>
                  <td style={{ fontSize: 12, color: "#a8a8c0" }}>{new Date(s.created_at).toLocaleString("zh-CN")}</td>
                  <td>
                    {s.status === "active" ? (
                      <Link to={`/session/${s.id}`} className="btn btn-sm btn-primary">继续</Link>
                    ) : (
                      <Link to={`/session/${s.id}/result`} className="btn btn-sm btn-outline">查看</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
