import { useLoaderData, Link } from "@remix-run/react";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  getGameSession,
  getPuzzleLevel,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAllKeyRingGroups,
  getAssignmentDetails,
  getAccessLogs,
  getResultRecords,
  getHistoryRecords,
} from "~/models/db.server";
import {
  calculateSessionScore,
  performPostTrace,
  getSlotName,
  computeInitialLockStates,
} from "~/models/gameLogic.server";
import {
  TrustBar,
  RoleTag,
  SlotTag,
  SecurityBadge,
  EventTypeTag,
  RiskBar,
} from "~/components/ui";
import type { LockState } from "~/models/types";

const ROOM_ICONS: Record<string, string> = {
  public: "🛋️", exhibition: "🖼️", private: "🛏️", secure: "🗝️",
  utility: "⚙️", storage: "🍷", transit: "🚪",
};

function scoreRank(total: number): { label: string; color: string; emoji: string } {
  if (total >= 180) return { label: "传奇管家 S+", color: "#f1c40f", emoji: "👑" };
  if (total >= 150) return { label: "首席管家 S", color: "#d4a017", emoji: "🏆" };
  if (total >= 120) return { label: "资深管家 A", color: "#27ae60", emoji: "🌟" };
  if (total >= 90) return { label: "合格管家 B", color: "#3498db", emoji: "✅" };
  if (total >= 60) return { label: "实习管家 C", color: "#9b59b6", emoji: "📝" };
  if (total >= 30) return { label: "见习学徒 D", color: "#f39c12", emoji: "⚠️" };
  return { label: "被解雇 F", color: "#e74c3c", emoji: "🚪" };
}

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  const level = getPuzzleLevel(session.puzzle_level);
  if (!level) return redirect("/");
  const rooms = getAllRooms();
  const allKeys = getAllKeys();
  const allPeople = getAllPeople();
  const groups = getAllKeyRingGroups();
  const details = getAssignmentDetails(sessionId);
  const logs = getAccessLogs(sessionId);
  const results = getResultRecords(sessionId);
  const history = getHistoryRecords(sessionId);

  const rollbackCount = logs.filter((l) => l.event_type === "ROLLBACK").length;
  const traceResult = performPostTrace(details, allPeople, allKeys);
  const traceCompleted = logs.some((l) => l.event_type === "TRACE_COMPLETE");
  const breakdown = calculateSessionScore(
    details,
    allPeople,
    allKeys,
    rooms,
    results,
    rollbackCount,
    traceCompleted || traceResult.valid
  );

  const initialLocks = computeInitialLockStates(rooms);
  const finalLocks: Record<string, LockState> = JSON.parse(JSON.stringify(initialLocks));
  for (const d of details) {
    const key = allKeys.find((k) => k.id === d.key_id);
    if (!key) continue;
    const slotOk = key.allowed_slots.includes(d.assigned_slot);
    for (const rid of key.room_ids) {
      if (finalLocks[rid] && slotOk) {
        finalLocks[rid].is_locked = false;
        finalLocks[rid].accessed_by = d.person_id;
      }
    }
  }

  const breachedArr: string[] = [];
  for (const l of logs) {
    if ((l.event_type === "THEFT" || l.event_type === "LOCKED_IN") && l.room_id && !breachedArr.includes(l.room_id)) {
      breachedArr.push(l.room_id);
    }
  }
  const breached = breachedArr;

  const keyGroupUsage = groups.map((g) => {
    const used = details.filter((d) => g.key_ids.includes(d.key_id));
    return {
      group: g,
      usedKeys: used.length,
      users: used.map((d) => allPeople.find((p) => p.id === d.person_id)?.name).filter(Boolean),
    };
  });

  return json({
    session,
    level,
    rooms,
    allKeys,
    allPeople,
    groups,
    details,
    logs,
    results,
    history,
    breakdown,
    rollbackCount,
    trace: traceResult,
    traceCompleted,
    initialLocks,
    finalLocks,
    breached,
    keyGroupUsage,
  });
}

export default function ResultPage() {
  const data = useLoaderData<typeof loader>();
  const {
    session, level, rooms, allKeys, allPeople, groups,
    details, logs, results, history,
    breakdown, rollbackCount, trace, traceCompleted,
    initialLocks, finalLocks, breached, keyGroupUsage,
  } = data;

  const rank = scoreRank(breakdown.total);
  const diffCount = rooms.filter((r) => initialLocks[r.id]?.is_locked !== finalLocks[r.id]?.is_locked).length;
  const incidentCount = logs.filter((l) =>
    l.event_type === "THEFT" || l.event_type === "LOCKED_IN" || l.event_type === "DUPLICATION_RISK"
  ).length;

  return (
    <div className="app-container">
      <Link to="/" className="back-home">← 返回大厅</Link>

      <div className="score-summary">
        <div style={{ fontSize: 20, color: "#a8a8c0", fontFamily: "Georgia" }}>
          {rank.emoji} {level.name} · 结算报告
        </div>
        <div className="score-big">{breakdown.total}</div>
        <div className="score-rank" style={{ color: rank.color }}>{rank.label}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#a8a8c0" }}>完成步骤</div>
            <div style={{ fontSize: 22, color: "#3498db", fontWeight: 700 }}>
              {session.current_step} / {session.total_steps}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#a8a8c0" }}>门锁变化</div>
            <div style={{ fontSize: 22, color: "#27ae60", fontWeight: 700 }}>{diffCount} / {rooms.length}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#a8a8c0" }}>异常事件</div>
            <div style={{ fontSize: 22, color: incidentCount > 0 ? "#e74c3c" : "#27ae60", fontWeight: 700 }}>{incidentCount}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#a8a8c0" }}>回滚次数</div>
            <div style={{ fontSize: 22, color: "#9b59b6", fontWeight: 700 }}>{rollbackCount}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#a8a8c0" }}>局次状态</div>
            <div style={{ fontSize: 22, color: session.status === "completed" ? "#27ae60" : "#e74c3c", fontWeight: 700 }}>
              {session.status === "completed" ? "通过" : "失败"}
            </div>
          </div>
        </div>
        {session.notes && (
          <div style={{ marginTop: 16, fontSize: 12, color: "#888", fontStyle: "italic" }}>备注：{session.notes}</div>
        )}
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-title">💰 分数结算明细（后端按明细重算）</div>
          <div className="score-breakdown">
            <div className="score-line pos"><span>基础分</span><span>+{breakdown.baseScore}</span></div>
            <div className="score-line pos"><span>正确分配 × 20 分</span><span>+{breakdown.correctAssignments}</span></div>
            <div className="score-line pos"><span>时段匹配奖励</span><span>+{breakdown.slotBonus}</span></div>
            <div className="score-line pos"><span>房间覆盖奖励</span><span>+{breakdown.coverageBonus}</span></div>
            <div className="score-line pos"><span>信任度匹配奖励</span><span>+{breakdown.trustBonus}</span></div>
            {breakdown.traceBonus > 0 && (
              <div className="score-line pos"><span>事后追踪完成</span><span>+{breakdown.traceBonus}</span></div>
            )}
            <div style={{ height: 1, background: "#3a3a5c", margin: "8px 0" }} />
            {breakdown.rollbackPenalty > 0 && (
              <div className="score-line neg"><span>回滚惩罚 ({rollbackCount} × 10)</span><span>-{breakdown.rollbackPenalty}</span></div>
            )}
            {breakdown.theftPenalty > 0 && (
              <div className="score-line neg"><span>失窃事件惩罚</span><span>-{breakdown.theftPenalty}</span></div>
            )}
            {breakdown.lockedInPenalty > 0 && (
              <div className="score-line neg"><span>幽闭/时段错误惩罚</span><span>-{breakdown.lockedInPenalty}</span></div>
            )}
            {breakdown.duplicationPenalty > 0 && (
              <div className="score-line neg"><span>复制风险惩罚</span><span>-{breakdown.duplicationPenalty}</span></div>
            )}
            <div className="score-line total">
              <span>最终分数（重算结果）</span><span>{breakdown.total}</span>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "#6c6c8a", textAlign: "center" }}>
            ⚙️ 分数由后端根据 assignment_details 局次明细实时重算，不依赖前端状态
          </div>
        </div>

        <div className="card">
          <div className="card-title">🔑 钥匙环编组使用报告</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {keyGroupUsage.map(({ group, usedKeys, users }) => (
              <div key={group.id} style={{ padding: 12, background: "rgba(46,46,82,0.4)", borderRadius: 10, border: "1px solid #3a3a5c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: "#f1c40f" }}>
                    {group.name}
                  </div>
                  <span className={`tag ${usedKeys === group.key_ids.length ? "tag-green" : usedKeys > 0 ? "tag-gold" : ""}`}>
                    {usedKeys}/{group.key_ids.length} 把已使用
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#a8a8c0", marginBottom: 6 }}>{group.description}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {group.key_ids.map((kid) => {
                    const k = allKeys.find((x) => x.id === kid);
                    const used = details.find((d) => d.key_id === kid);
                    const user = used ? allPeople.find((p) => p.id === used.person_id) : null;
                    return (
                      <div key={kid} style={{ fontSize: 11, padding: "4px 8px", background: "#232340", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, background: k?.color || "#666", borderRadius: 1 }} />
                        {k?.label}
                        {used && user && (
                          <span style={{ fontSize: 10, color: "#27ae60", marginLeft: 4 }}>→{user.name.slice(0, 4)}</span>
                        )}
                        {!used && <span style={{ fontSize: 10, color: "#666" }}>（未用）</span>}
                      </div>
                    );
                  })}
                </div>
                {users.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#a8a8c0" }}>
                    分配给：{users.join("、")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">🔍 事后追踪总结</div>
          <div style={{ padding: 14, background: traceCompleted && trace.valid ? "rgba(39,174,96,0.08)" : "rgba(231,76,60,0.08)", borderRadius: 10, border: `1px solid ${traceCompleted && trace.valid ? "rgba(39,174,96,0.3)" : "rgba(231,76,60,0.3)"}`, marginBottom: 14 }}>
            <div style={{ fontSize: 28, textAlign: "center" }}>{traceCompleted && trace.valid ? "🎯" : "⚠️"}</div>
            <div style={{ textAlign: "center", fontWeight: 600, marginBottom: 4 }}>
              {traceCompleted && trace.valid ? "追踪验证通过" : trace.valid ? "追踪无冲突（未正式完成）" : "存在钥匙冲突"}
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#a8a8c0" }}>
              检查了 {details.length} 把分配钥匙 · {results.length} 条结果记录
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
            {trace.findings.map((f, i) => (
              <div key={i} className={`event-item ${f.includes("⚠️") ? "warning" : f.includes("✅") ? "success" : "info"}`} style={{ fontSize: 12 }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 24 }} />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">🏰 门锁图谱差异</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ textAlign: "center", fontSize: 12, color: "#a8a8c0", marginBottom: 8 }}>分配前</div>
              <MiniMap rooms={rooms} locks={initialLocks} breached={[]} />
            </div>
            <div>
              <div style={{ textAlign: "center", fontSize: 12, color: "#a8a8c0", marginBottom: 8 }}>分配后</div>
              <MiniMap rooms={rooms} locks={finalLocks} breached={breached} />
            </div>
          </div>
          <div className="map-legend" style={{ marginTop: 12, justifyContent: "center" }}>
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#27ae60", background: "rgba(39,174,96,0.1)" }} /> 解锁</div>
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.08)" }} /> 锁闭</div>
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.25)" }} /> 异常</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">📜 访问日志变化原因</div>
          <table className="log-table">
            <thead>
              <tr>
                <th>类型</th>
                <th>房间/对象</th>
                <th>消息与原因</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.filter((l) => l.event_type !== "KEY_GROUP_OK").slice(-20).map((l) => {
                const room = rooms.find((r) => r.id === l.room_id);
                return (
                  <tr key={l.id}>
                    <td><EventTypeTag type={l.event_type} /></td>
                    <td style={{ fontSize: 12 }}>
                      {room ? (
                        <span>
                          {ROOM_ICONS[room.zone] || "🚪"} {room.name}
                          {<SecurityBadge level={room.security_level} />}
                        </span>
                      ) : l.room_id || "-"}
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 320 }}>{l.message}</td>
                    <td style={{ fontSize: 11, color: "#a8a8c0" }}>
                      {new Date(l.timestamp).toLocaleTimeString("zh-CN")}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 30, color: "#6c6c8a" }}>无访问日志</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 24 }} />

      <div className="card">
        <div className="card-title">📋 局次明细（四表联合）</div>
        <div className="grid grid-2">
          <div>
            <h4 style={{ color: "#f1c40f", fontSize: 14, marginBottom: 10 }}>主记录：game_sessions</h4>
            <div style={{ padding: 12, background: "rgba(212,160,23,0.05)", borderRadius: 8, fontSize: 12 }}>
              <div className="info-row"><span className="info-label">局次ID</span><span className="info-value" style={{ fontFamily: "monospace" }}>{session.id}</span></div>
              <div className="info-row"><span className="info-label">谜题关卡</span><span className="info-value">关卡 {level.id} · {level.name}</span></div>
              <div className="info-row"><span className="info-label">状态</span><span className="info-value">{session.status}</span></div>
              <div className="info-row"><span className="info-label">进度</span><span className="info-value">{session.current_step} / {session.total_steps}</span></div>
              <div className="info-row"><span className="info-label">最终分数</span><span className="info-value" style={{ color: "#f1c40f", fontWeight: 700 }}>{session.final_score}</span></div>
              <div className="info-row"><span className="info-label">创建时间</span><span className="info-value">{new Date(session.created_at).toLocaleString("zh-CN")}</span></div>
              {session.completed_at && (
                <div className="info-row"><span className="info-label">完成时间</span><span className="info-value">{new Date(session.completed_at).toLocaleString("zh-CN")}</span></div>
              )}
            </div>
          </div>
          <div>
            <h4 style={{ color: "#3498db", fontSize: 14, marginBottom: 10 }}>结果记录：result_records（{results.length} 条）</h4>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="log-table">
                <thead><tr><th>钥匙</th><th>覆盖房间</th><th>时段</th><th>复制风险</th></tr></thead>
                <tbody>
                  {results.map((r) => {
                    const k = allKeys.find((x) => x.id === r.key_id);
                    return (
                      <tr key={r.id}>
                        <td style={{ fontSize: 12 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 8, height: 8, background: k?.color, borderRadius: 1 }} />{k?.label}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "#a8a8c0" }}>{r.rooms_covered.length} 间</td>
                        <td style={{ fontSize: 11 }}>{r.allowed_slots_used.map(getSlotName).join(",")}</td>
                        <td>
                          {k && <RiskBar risk={k.duplication_risk} />}
                          {r.duplication_triggered && <span className="tag tag-red" style={{ fontSize: 10, marginTop: 4 }}>触发</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {results.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#666" }}>无</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20 }} className="grid grid-2">
          <div>
            <h4 style={{ color: "#27ae60", fontSize: 14, marginBottom: 10 }}>明细记录：assignment_details（{details.length} 条）</h4>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="log-table">
                <thead><tr><th>步骤</th><th>人员</th><th>钥匙</th><th>时段</th></tr></thead>
                <tbody>
                  {details.map((d, i) => {
                    const person = allPeople.find((p) => p.id === d.person_id);
                    const key = allKeys.find((k) => k.id === d.key_id);
                    return (
                      <tr key={d.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontSize: 12 }}>
                          {person?.name}
                          {person && <TrustBar level={person.trust_level} size={6} />}
                        </td>
                        <td style={{ fontSize: 12 }}>{key?.label}</td>
                        <td style={{ fontSize: 11 }}><SlotTag slot={d.assigned_slot} /></td>
                      </tr>
                    );
                  })}
                  {details.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#666" }}>无</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#9b59b6", fontSize: 14, marginBottom: 10 }}>历史记录：history_records（{history.length} 条）</h4>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              <table className="log-table">
                <thead><tr><th>步骤</th><th>人员</th><th>操作</th><th>结果</th></tr></thead>
                <tbody>
                  {history.map((h) => {
                    const person = allPeople.find((p) => p.id === h.person_id);
                    return (
                      <tr key={h.id}>
                        <td>{h.step_index + 1}</td>
                        <td style={{ fontSize: 12 }}>{person?.name}</td>
                        <td style={{ fontSize: 11 }}>{h.action}</td>
                        <td><span className={`tag ${h.success ? "tag-green" : "tag-red"}`} style={{ fontSize: 10 }}>{h.success ? "成功" : "失败"}</span></td>
                      </tr>
                    );
                  })}
                  {history.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "#666" }}>无</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 32 }} />
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <Link to={`/session/${session.id}/map`} className="btn btn-outline">🗺️ 查看门锁图谱对比</Link>
        <Link to={`/session/${session.id}/logs`} className="btn btn-outline">📋 查看完整访问日志</Link>
        <Link to="/" className="btn btn-primary">🏠 返回大厅选择新关卡</Link>
      </div>
    </div>
  );
}

function MiniMap({ rooms, locks, breached }: { rooms: any[]; locks: Record<string, any>; breached: string[] }) {
  const breachedSet = new Set(breached);
  return (
    <div className="castle-map" style={{ aspectRatio: "1 / 1" }}>
      {rooms.map((room) => {
        const st = locks[room.id];
        const br = breachedSet.has(room.id);
        const cls = br ? "breached" : st && !st.is_locked ? "unlocked" : st && st.is_locked ? "locked" : "";
        return (
          <div key={room.id} className={`map-room ${cls}`} style={{ left: `${room.x}%`, top: `${room.y}%`, width: "20%" }}>
            <div style={{ fontSize: 16 }}>{ROOM_ICONS[room.zone] || "🚪"}</div>
            <div style={{ fontSize: 9, fontWeight: 600 }}>{room.name.slice(0, 4)}</div>
          </div>
        );
      })}
    </div>
  );
}
