import { useLoaderData, Form, Link } from "@remix-run/react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import {
  getGameSession,
  getPuzzleLevel,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAssignmentDetails,
  getAccessLogs,
  addAccessLog,
  getResultRecords,
  completeSession,
} from "~/models/db.server";
import { performPostTrace, calculateSessionScore, getSlotName } from "~/models/gameLogic.server";
import { TrustBar, RoleTag, EventTypeTag } from "~/components/ui";

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  if (session.status !== "active") return redirect(`/session/${sessionId}/result`);
  const level = getPuzzleLevel(session.puzzle_level)!;
  const allPeople = getAllPeople();
  const allKeys = getAllKeys();
  const rooms = getAllRooms();
  const details = getAssignmentDetails(sessionId);
  const logs = getAccessLogs(sessionId);
  const rollbackCount = logs.filter((l) => l.event_type === "ROLLBACK").length;
  const { valid, findings } = performPostTrace(details, allPeople, allKeys);
  const previewScore = calculateSessionScore(
    details,
    allPeople,
    allKeys,
    rooms,
    getResultRecords(sessionId),
    rollbackCount,
    valid
  );
  return json({
    session,
    level,
    allPeople,
    allKeys,
    rooms,
    details,
    logs,
    traceValid: valid,
    findings,
    previewScore,
    rollbackCount,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  const allPeople = getAllPeople();
  const allKeys = getAllKeys();
  const rooms = getAllRooms();
  const details = getAssignmentDetails(sessionId);
  const results = getResultRecords(sessionId);
  const rollbackCount = getAccessLogs(sessionId).filter((l) => l.event_type === "ROLLBACK").length;
  const { valid, findings } = performPostTrace(details, allPeople, allKeys);
  for (const f of findings) {
    addAccessLog(sessionId, null, null, null, valid ? "TRACE_COMPLETE" : "DUPLICATION_RISK", f, { tracing: true }, { valid });
  }
  const breakdown = calculateSessionScore(details, allPeople, allKeys, rooms, results, rollbackCount, valid);
  const status = breakdown.total >= 50 ? "completed" : "failed";
  completeSession(sessionId, breakdown.total, status);
  return redirect(`/session/${sessionId}/result`);
}

export default function TracePage() {
  const data = useLoaderData<typeof loader>();
  const {
    session, level, allPeople, allKeys, rooms, details, logs,
    traceValid, findings, previewScore, rollbackCount,
  } = data;

  return (
    <div className="app-container">
      <Link to={`/session/${session.id}`} className="back-home">← 返回分配界面</Link>
      <div className="toolbar">
        <div className="toolbar-info">
          <div><strong>关卡 {level.id}：</strong>{level.name}</div>
          <div>局次：<code style={{ fontSize: 11 }}>{session.id.slice(0, 16)}…</code></div>
          <div>追踪验证：<span className={`tag ${traceValid ? "tag-green" : "tag-red"}`}>{traceValid ? "✅ 通过" : "⚠️ 存在冲突"}</span></div>
        </div>
        <div className="toolbar-actions">
          <Link to={`/session/${session.id}/map`} className="btn btn-sm btn-outline">🗺️ 门锁图谱</Link>
          <Link to={`/session/${session.id}/logs`} className="btn btn-sm btn-outline">📋 访问日志</Link>
        </div>
      </div>

      <div className="grid grid-2">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">🔍 事后追踪结果</div>
            <div style={{ padding: 16, background: traceValid ? "rgba(39,174,96,0.08)" : "rgba(231,76,60,0.08)", borderRadius: 12, border: `1px solid ${traceValid ? "rgba(39,174,96,0.3)" : "rgba(231,76,60,0.3)"}`, marginBottom: 16 }}>
              <div style={{ fontSize: 48, textAlign: "center" }}>{traceValid ? "🎯" : "⚠️"}</div>
              <div style={{ textAlign: "center", fontFamily: "Georgia", fontSize: 22, color: traceValid ? "#27ae60" : "#e74c3c", marginBottom: 8 }}>
                {traceValid ? "钥匙分配无冲突" : "发现钥匙分配冲突"}
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: "#a8a8c0" }}>
                已分配 {details.length} 把钥匙 · 回滚 {rollbackCount} 次 · 预估分数 <strong style={{ color: "#f1c40f" }}>{previewScore.total}</strong>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {findings.map((f, i) => (
                <div key={i} className={`event-item ${f.includes("⚠️") ? "warning" : "success"}`} style={{ fontSize: 13 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>🔎 发现 {i + 1}</div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">📊 钥匙分配明细</div>
            <table className="log-table">
              <thead>
                <tr>
                  <th>步骤</th>
                  <th>人员</th>
                  <th>钥匙</th>
                  <th>时段</th>
                  <th>覆盖房间</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d, i) => {
                  const person = allPeople.find((p) => p.id === d.person_id)!;
                  const key = allKeys.find((k) => k.id === d.key_id)!;
                  return (
                    <tr key={d.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{person.name}</div>
                        <div style={{ fontSize: 11 }}>
                          <RoleTag role={person.role} /> <TrustBar level={person.trust_level} size={8} />
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 10, height: 10, background: key.color, borderRadius: 2 }} />
                          {key.label}
                        </span>
                      </td>
                      <td>{getSlotName(d.assigned_slot)}</td>
                      <td style={{ fontSize: 11, color: "#a8a8c0" }}>
                        {key.room_ids.map((rid) => rooms.find((r) => r.id === rid)?.name).join("、")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">📝 分数预览（按局次明细重算）</div>
            <div className="score-breakdown">
              <div className="score-line pos"><span>基础分</span><span>+{previewScore.baseScore}</span></div>
              <div className="score-line pos"><span>正确分配奖励 ({details.filter((_, i) => previewScore.total > 50).length} 个)</span><span>+{previewScore.correctAssignments}</span></div>
              <div className="score-line pos"><span>时段匹配奖励</span><span>+{previewScore.slotBonus}</span></div>
              <div className="score-line pos"><span>房间覆盖奖励</span><span>+{previewScore.coverageBonus}</span></div>
              <div className="score-line pos"><span>信任度匹配奖励</span><span>+{previewScore.trustBonus}</span></div>
              {previewScore.traceBonus > 0 && (
                <div className="score-line pos"><span>事后追踪完成奖励</span><span>+{previewScore.traceBonus}</span></div>
              )}
              {previewScore.rollbackPenalty > 0 && (
                <div className="score-line neg"><span>回滚操作惩罚 ({rollbackCount} 次)</span><span>-{previewScore.rollbackPenalty}</span></div>
              )}
              {previewScore.theftPenalty > 0 && (
                <div className="score-line neg"><span>失窃事件惩罚</span><span>-{previewScore.theftPenalty}</span></div>
              )}
              {previewScore.lockedInPenalty > 0 && (
                <div className="score-line neg"><span>幽闭/时段错误惩罚</span><span>-{previewScore.lockedInPenalty}</span></div>
              )}
              {previewScore.duplicationPenalty > 0 && (
                <div className="score-line neg"><span>复制风险惩罚</span><span>-{previewScore.duplicationPenalty}</span></div>
              )}
              <div className="score-line total">
                <span>最终分数</span><span>{previewScore.total}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">📜 最近事件日志</div>
            <div className="event-feed">
              {logs.slice(-10).reverse().map((log) => (
                <div key={log.id} className={`event-item ${log.event_type === "ASSIGN_OK" || log.event_type === "KEY_GROUP_OK" || log.event_type === "TRACE_COMPLETE" ? "success" : log.event_type === "ROLLBACK" ? "warning" : log.event_type === "THEFT" || log.event_type === "LOCKED_IN" || log.event_type === "DUPLICATION_RISK" ? "danger" : "info"}`}>
                  <div className="event-type"><EventTypeTag type={log.event_type} /></div>
                  <div style={{ fontSize: 12 }}>{log.message}</div>
                </div>
              ))}
            </div>
          </div>

          <Form method="post">
            <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: 16, padding: "14px 24px" }}>
              ⏺️ 确认结算 · 系统重算分数并锁定局次
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
