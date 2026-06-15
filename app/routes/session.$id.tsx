import { useLoaderData, Form, Link, useNavigation } from "@remix-run/react";
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import {
  getGameSession,
  getPuzzleLevel,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAllKeyRingGroups,
  getAssignmentDetails,
  getAccessLogs,
  addAssignmentDetail,
  addHistoryRecord,
  addResultRecord,
  addAccessLog,
  updateSessionStep,
  completeSession,
  getResultRecords,
  rollbackToStep,
} from "~/models/db.server";
import {
  validateAssignment,
  computeInitialLockStates,
  calculateSessionScore,
  performPostTrace,
  getSlotName,
} from "~/models/gameLogic.server";
import type { TimeSlot, LockState } from "~/models/types";
import { TrustBar, RoleTag, SlotTag, SecurityBadge, RiskBar, EventTypeTag } from "~/components/ui";
import { useState } from "react";

const ALL_SLOTS: TimeSlot[] = ["morning", "afternoon", "evening", "night"];
const ROOM_ICONS: Record<string, string> = {
  public: "🛋️",
  exhibition: "🖼️",
  private: "🛏️",
  secure: "🗝️",
  utility: "⚙️",
  storage: "🍷",
  transit: "🚪",
};

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  const level = getPuzzleLevel(session.puzzle_level);
  if (!level) return redirect("/");
  const allPeople = getAllPeople();
  const allKeys = getAllKeys();
  const rooms = getAllRooms();
  const groups = getAllKeyRingGroups();
  const levelPeople = level.people_ids.map((id) => allPeople.find((p) => p.id === id)).filter(Boolean) as typeof allPeople;
  const details = getAssignmentDetails(sessionId);
  const logs = getAccessLogs(sessionId);

  const initialLocks = computeInitialLockStates(rooms);
  const currentLocks: Record<string, LockState> = JSON.parse(JSON.stringify(initialLocks));
  for (const d of details) {
    const key = allKeys.find((k) => k.id === d.key_id);
    if (!key) continue;
    const slotOk = key.allowed_slots.includes(d.assigned_slot);
    for (const rid of key.room_ids) {
      if (currentLocks[rid]) {
        if (slotOk) {
          currentLocks[rid].is_locked = false;
          currentLocks[rid].accessed_by = d.person_id;
          currentLocks[rid].last_access = d.created_at;
        }
      }
    }
  }

  return json({
    session,
    level,
    rooms,
    allKeys,
    groups,
    levelPeople,
    details,
    logs,
    initialLocks,
    currentLocks,
    rollbackCount: logs.filter((l) => l.event_type === "ROLLBACK").length,
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  const level = getPuzzleLevel(session.puzzle_level);
  if (!level) return redirect("/");
  const allPeople = getAllPeople();
  const allKeys = getAllKeys();
  const rooms = getAllRooms();

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "assign") {
    const stepIndex = Number(formData.get("step_index"));
    const personId = formData.get("person_id") as string;
    const keyId = formData.get("key_id") as string;
    const slot = formData.get("slot") as TimeSlot;
    if (!personId || !keyId || !slot) return redirect(`/session/${sessionId}`);

    const person = allPeople.find((p) => p.id === personId)!;
    const key = allKeys.find((k) => k.id === keyId)!;
    const initialLocks = computeInitialLockStates(rooms);
    const prevDetails = getAssignmentDetails(sessionId);
    for (const d of prevDetails) {
      const k = allKeys.find((x) => x.id === d.key_id);
      if (k && k.allowed_slots.includes(d.assigned_slot)) {
        for (const rid of k.room_ids) {
          if (initialLocks[rid]) initialLocks[rid].is_locked = false;
        }
      }
    }
    const result = validateAssignment(person, key, slot, rooms, initialLocks);

    addAssignmentDetail(sessionId, stepIndex, personId, keyId, slot);
    addHistoryRecord(sessionId, stepIndex, personId, `领取 ${key.label}`, slot, result.ok);
    const dupTriggered = key.duplication_risk >= 8 && person.trust_level <= 4;
    addResultRecord(sessionId, key.id, key.room_ids, [slot], dupTriggered);

    for (const ev of result.events) {
      addAccessLog(
        sessionId,
        ev.room || null,
        personId,
        keyId,
        ev.type,
        ev.message,
        { personId, keyId, slot, step: stepIndex },
        { eventType: ev.type, ok: result.ok }
      );
    }
    for (const change of result.lockStateChanges) {
      addAccessLog(
        sessionId,
        change.roomId,
        personId,
        keyId,
        result.ok ? "KEY_GROUP_OK" : "LOCKED_IN",
        `${rooms.find((r) => r.id === change.roomId)?.name}：${change.reason}`,
        { locked: change.wasLocked },
        { locked: change.nowLocked }
      );
    }

    const nextStep = stepIndex + 1;
    updateSessionStep(sessionId, nextStep);
    const newTotal = level.people_ids.length;
    if (nextStep >= newTotal) {
      return redirect(`/session/${sessionId}/trace`);
    }
    return redirect(`/session/${sessionId}`);
  }

  if (intent === "rollback_step") {
    const rollbackStep = Number(formData.get("rollback_step"));
    const toRemove = rollbackToStep(sessionId, rollbackStep);
    for (const d of toRemove) {
      const person = allPeople.find((p) => p.id === d.person_id);
      const key = allKeys.find((k) => k.id === d.key_id);
      addHistoryRecord(sessionId, rollbackStep, d.person_id, `回滚：撤回 ${key?.label || "钥匙"}`, d.assigned_slot, false);
      addAccessLog(
        sessionId,
        null,
        d.person_id,
        d.key_id,
        "ROLLBACK",
        `管家回滚了 ${person?.name || "人员"} 的 ${key?.label || "钥匙"} 分配（步骤 ${rollbackStep}）`,
        { step_index: d.step_index, rollback_from: "玩家手动操作" },
        { removed: true }
      );
    }
    updateSessionStep(sessionId, rollbackStep);
    return redirect(`/session/${sessionId}`);
  }

  if (intent === "finish_trace") {
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

  return redirect(`/session/${sessionId}`);
}

export default function SessionPage() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const { session, level, rooms, allKeys, groups, levelPeople, details, logs, initialLocks, currentLocks } = data;
  const currentStep = session.current_step;
  const totalSteps = level.people_ids.length;
  const isLastStep = currentStep >= totalSteps;
  const currentPerson = isLastStep ? null : levelPeople[currentStep];
  const breachedRooms = new Set<string>();
  for (const l of logs) {
    if ((l.event_type === "THEFT" || l.event_type === "LOCKED_IN") && l.room_id) {
      breachedRooms.add(l.room_id);
    }
  }

  return (
    <div className="app-container">
      <Link to="/" className="back-home">← 返回大厅</Link>

      <div className="toolbar">
        <div className="toolbar-info">
          <div><strong>关卡 {level.id}：</strong>{level.name}</div>
          <div>局次：<code style={{ fontSize: 11 }}>{session.id.slice(0, 16)}…</code></div>
          <div style={{ color: "#f1c40f" }}>进度：{currentStep} / {totalSteps}</div>
          <div>状态：<span className={`tag ${session.status === "active" ? "tag-blue" : session.status === "completed" ? "tag-green" : "tag-red"}`}>{session.status}</span></div>
        </div>
        <div className="toolbar-actions">
          <Link to={`/session/${session.id}/map`} className="btn btn-sm btn-outline">🗺️ 门锁图谱</Link>
          <Link to={`/session/${session.id}/logs`} className="btn btn-sm btn-outline">📋 访问日志</Link>
          {currentStep > 0 && (
            <Form method="post" onSubmit={(e) => { if (!confirm("确定回滚到上一步吗？已提交的分配将被撤销。")) e.preventDefault(); }}>
              <input type="hidden" name="intent" value="rollback_step" />
              <input type="hidden" name="rollback_step" value={Math.max(0, currentStep - 1)} />
              <button type="submit" className="btn btn-sm btn-danger" disabled={navigation.state !== "idle"}>↩ 回滚上一步</button>
            </Form>
          )}
        </div>
      </div>

      <div className="session-layout">
        <aside className="sidebar">
          <div className="card">
            <div className="card-title">📍 分配进度</div>
            <ul className="progress-steps">
              {levelPeople.map((p, i) => (
                <li
                  key={p.id}
                  className={`progress-step ${i < currentStep ? "done" : ""} ${i === currentStep ? "active" : ""}`}
                >
                  <div className="step-dot">{i < currentStep ? "✓" : i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      <RoleTag role={p.role} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="card-title">🔑 钥匙环编组</div>
            {groups.map((g) => (
              <div key={g.id} style={{ marginBottom: 12, padding: 10, background: "rgba(46,46,82,0.4)", borderRadius: 8 }}>
                <div style={{ fontWeight: 600, color: "#f1c40f", fontSize: 13 }}>
                  {g.name} <span style={{ fontSize: 10, opacity: 0.6, color: "#a8a8c0" }}>({g.key_ids.length}把)</span>
                </div>
                <div style={{ fontSize: 11, color: "#a8a8c0", margin: "4px 0" }}>{g.description}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {g.key_ids.map((kid) => {
                    const k = allKeys.find((x) => x.id === kid);
                    if (!k) return null;
                    return (
                      <span key={kid} style={{ fontSize: 10, padding: "2px 6px", background: "#232340", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, background: k.color, borderRadius: 2 }} />
                        {k.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main>
          {!isLastStep ? (
            <div className="assignment-step">
              {currentPerson && (
                <>
                  <div className="person-profile">
                    <div className="person-header">
                      <div className="person-avatar">
                        {currentPerson.role === "visitor" ? "👤" : currentPerson.role === "maintenance" ? "🔧" : "🌙"}
                      </div>
                      <div className="person-meta">
                        <h3>{currentPerson.name}</h3>
                        <div className="person-meta-info">
                          <RoleTag role={currentPerson.role} />
                          <span className="tag tag-gold">偏好：{getSlotName(currentPerson.preferred_slot)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">来意</span>
                      <span className="info-value">{currentPerson.purpose}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">需访问房间</span>
                      <span className="info-value">
                        {currentPerson.requested_room_ids
                          .map((rid) => rooms.find((r) => r.id === rid)?.name || rid)
                          .join(" → ")}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">预计停留</span>
                      <span className="info-value">{currentPerson.scheduled_minutes} 分钟</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">信任度</span>
                      <span className="info-value">
                        <TrustBar level={currentPerson.trust_level} /> {currentPerson.trust_level}/10
                      </span>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">🔑 选择钥匙（为 {currentPerson.name}）</div>
                    <div className="keys-grid">
                      {allKeys.map((key) => {
                        const used = details.find((d) => d.key_id === key.id);
                        const isSelected = selectedKey === key.id;
                        return (
                          <div
                            key={key.id}
                            className={`key-card ${isSelected ? "selected" : ""}`}
                            onClick={() => setSelectedKey(key.id)}
                          >
                            <h4>
                              <span className="key-color-dot" style={{ background: key.color }} />
                              {key.label}
                              {used && (
                                <span className="tag tag-blue" style={{ marginLeft: "auto", fontSize: 9 }}>
                                  已分配
                                </span>
                              )}
                            </h4>
                            <p style={{ minHeight: 34 }}>
                              <strong>房间：</strong>
                              {key.room_ids.map((rid) => rooms.find((r) => r.id === rid)?.name || rid).slice(0, 2).join("、")}
                              {key.room_ids.length > 2 && ` (+${key.room_ids.length - 2})`}
                            </p>
                            <p>
                              <strong>允许时段：</strong>
                              {key.allowed_slots.map(getSlotName).join(" / ")}
                            </p>
                            <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <strong>复制风险：</strong>
                              <span style={{ flex: 1 }}><RiskBar risk={key.duplication_risk} /></span>
                              <span style={{ fontSize: 10 }}>{key.duplication_risk}/10</span>
                            </p>
                            {key.ring_group_id && (
                              <p style={{ marginTop: 4 }}>
                                <span className="tag tag-gold" style={{ fontSize: 10 }}>
                                  编组：{groups.find((g) => g.id === key.ring_group_id)?.name}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-title">⏰ 选择时段</div>
                    <div className="slot-selector">
                      {ALL_SLOTS.map((s) => {
                        const key = selectedKey ? allKeys.find((k) => k.id === selectedKey) : null;
                        const slotAllowed = key ? key.allowed_slots.includes(s) : true;
                        const selected = selectedSlot === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`slot-btn ${selected ? "selected" : ""} ${!slotAllowed ? "disabled" : ""}`}
                            onClick={() => slotAllowed && setSelectedSlot(s)}
                            disabled={!slotAllowed}
                          >
                            {getSlotName(s)}
                            {!slotAllowed && <span style={{ marginLeft: 4, fontSize: 10 }}>(所选钥匙禁此时段)</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 16, textAlign: "right" }}>
                      <Form method="post">
                        <input type="hidden" name="intent" value="assign" />
                        <input type="hidden" name="step_index" value={currentStep} />
                        <input type="hidden" name="person_id" value={currentPerson.id} />
                        <input type="hidden" name="key_id" value={selectedKey || ""} />
                        <input type="hidden" name="slot" value={selectedSlot || ""} />
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!selectedKey || !selectedSlot || navigation.state !== "idle"}
                        >
                          ✅ 确认分配 ({currentStep + 1}/{totalSteps})
                        </button>
                      </Form>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontFamily: "Georgia", fontSize: 28, color: "#f1c40f", marginBottom: 12 }}>
                所有人员钥匙分配完成
              </h2>
              <p style={{ color: "#a8a8c0", marginBottom: 24 }}>
                请前往事后追踪页面进行最终验证，系统将根据局次明细重算分数。
              </p>
              <Link to={`/session/${session.id}/trace`} className="btn btn-primary">
                🚀 开始事后追踪并结算
              </Link>
            </div>
          )}

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title">🗺️ 古堡门锁图谱（实时）</div>
            <CastleMap
              rooms={rooms}
              initialLocks={initialLocks}
              currentLocks={currentLocks}
              breached={breachedRooms}
              details={details}
              allPeople={levelPeople}
            />
            <div className="map-legend">
              <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#27ae60", background: "rgba(39,174,96,0.1)" }} /> 已解锁</div>
              <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.08)" }} /> 仍锁闭</div>
              <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.25)" }} /> 事件突破</div>
              <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#3a3a5c", background: "#232340" }} /> 初始状态</div>
            </div>
          </div>
        </main>

        <aside className="sidebar">
          <div className="card">
            <div className="card-title">📜 场景描述</div>
            <p style={{ fontSize: 13, color: "#a8a8c0", lineHeight: 1.8 }}>{level.scenario}</p>
          </div>

          <div className="card">
            <div className="card-title">🔔 事件流</div>
            <div className="event-feed">
              {logs.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#6c6c8a", fontSize: 12 }}>
                  完成第一次钥匙分配后，这里会显示分配验证结果和事件。
                </div>
              )}
              {logs.slice().reverse().map((log) => (
                <div key={log.id} className={`event-item ${log.event_type === "ASSIGN_OK" || log.event_type === "KEY_GROUP_OK" || log.event_type === "TRACE_COMPLETE" ? "success" : log.event_type === "ROLLBACK" ? "warning" : log.event_type === "THEFT" || log.event_type === "LOCKED_IN" || log.event_type === "DUPLICATION_RISK" ? "danger" : "info"}`}>
                  <div className="event-type">
                    <EventTypeTag type={log.event_type} />
                  </div>
                  <div style={{ fontSize: 12 }}>{log.message}</div>
                  <div style={{ fontSize: 10, color: "#6c6c8a", marginTop: 4 }}>
                    {new Date(log.timestamp).toLocaleTimeString("zh-CN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">🏛️ 安保等级参考</div>
            {[1, 2, 3, 4, 5].map((lv) => (
              <div key={lv} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12 }}>
                <SecurityBadge level={lv} />
                <span style={{ color: "#a8a8c0", flex: 1 }}>
                  {lv === 1 && "公共开放区域，任何人可进"}
                  {lv === 2 && "普通区域，访客登记即可"}
                  {lv === 3 && "受限区域，需特别许可"}
                  {lv === 4 && "私密区域，仅限信任度≥7者"}
                  {lv === 5 && "绝密禁区，仅主人及审计师"}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function CastleMap({
  rooms,
  currentLocks,
  breached,
  details,
  allPeople,
}: {
  rooms: any[];
  initialLocks: Record<string, any>;
  currentLocks: Record<string, any>;
  breached: Set<string>;
  details: any[];
  allPeople: any[];
}) {
  const roomAccess: Record<string, string[]> = {};
  for (const d of details) {
    const keyRooms = d.rooms_covered ? d.rooms_covered : [];
    for (const rid of keyRooms) {
      if (!roomAccess[rid]) roomAccess[rid] = [];
      if (!roomAccess[rid].includes(d.person_id)) roomAccess[rid].push(d.person_id);
    }
  }

  return (
    <div className="castle-map">
      {rooms.map((room) => {
        const state = currentLocks[room.id];
        const breachedRoom = breached.has(room.id);
        const cls = breachedRoom ? "breached" : state && !state.is_locked ? "unlocked" : state && state.is_locked ? "locked" : "";
        const accessors = roomAccess[room.id] || [];
        return (
          <div
            key={room.id}
            className={`map-room ${cls}`}
            style={{ left: `${room.x}%`, top: `${room.y}%` }}
            title={`${room.name} · 楼层${room.floor} · 安保${room.security_level}\n${room.description}`}
          >
            <div className="room-icon">{ROOM_ICONS[room.zone] || "🚪"}</div>
            <div className="room-label">{room.name}</div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>
              {state ? (state.is_locked ? "🔒" : "🔓") : ""}
              {accessors.length > 0 && ` 👥${accessors.length}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
