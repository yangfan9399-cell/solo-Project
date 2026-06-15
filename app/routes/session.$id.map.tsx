import { useLoaderData, Link } from "@remix-run/react";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  getGameSession,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAssignmentDetails,
  getAccessLogs,
} from "~/models/db.server";
import { computeInitialLockStates, getSlotName } from "~/models/gameLogic.server";
import type { LockState } from "~/models/types";
import { SecurityBadge, EventTypeTag } from "~/components/ui";

const ROOM_ICONS: Record<string, string> = {
  public: "🛋️", exhibition: "🖼️", private: "🛏️", secure: "🗝️",
  utility: "⚙️", storage: "🍷", transit: "🚪",
};

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  const rooms = getAllRooms();
  const allKeys = getAllKeys();
  const allPeople = getAllPeople();
  const details = getAssignmentDetails(sessionId);
  const logs = getAccessLogs(sessionId);

  const initial = computeInitialLockStates(rooms);
  const current: Record<string, LockState> = JSON.parse(JSON.stringify(initial));
  for (const d of details) {
    const key = allKeys.find((k) => k.id === d.key_id);
    if (!key) continue;
    const slotOk = key.allowed_slots.includes(d.assigned_slot);
    for (const rid of key.room_ids) {
      if (current[rid] && slotOk) {
        current[rid].is_locked = false;
        current[rid].accessed_by = d.person_id;
        current[rid].last_access = d.created_at;
      }
    }
  }

  const breached = new Set<string>();
  for (const l of logs) {
    if ((l.event_type === "THEFT" || l.event_type === "LOCKED_IN") && l.room_id) breached.add(l.room_id);
  }

  const changes = rooms.map((room) => ({
    room,
    before: initial[room.id]?.is_locked,
    after: current[room.id]?.is_locked,
    accessedBy: current[room.id]?.accessed_by
      ? allPeople.find((p) => p.id === current[room.id]!.accessed_by)?.name || "-"
      : null,
    lastAccess: current[room.id]?.last_access,
    breached: breached.has(room.id),
  }));

  return json({ session, rooms, allKeys, allPeople, details, logs, changes });
}

export default function MapPage() {
  const { session, rooms, allKeys, allPeople, details, logs, changes } = useLoaderData<typeof loader>();

  const initialLocks: Record<string, any> = {};
  const currentLocks: Record<string, any> = {};
  for (const c of changes) {
    initialLocks[c.room.id] = { is_locked: c.before };
    currentLocks[c.room.id] = { is_locked: c.after, accessed_by: c.accessedBy, last_access: c.lastAccess };
  }
  const breached = new Set(changes.filter((c) => c.breached).map((c) => c.room.id));

  return (
    <div className="app-container">
      <Link to={session.status === "active" ? `/session/${session.id}` : `/session/${session.id}/result`} className="back-home">← 返回</Link>

      <div className="toolbar">
        <div className="toolbar-info">
          <div><strong>门锁图谱对比</strong> · 局次 {session.id.slice(0, 16)}…</div>
          <div>状态：<span className={`tag ${session.status === "completed" ? "tag-green" : session.status === "failed" ? "tag-red" : "tag-blue"}`}>{session.status}</span></div>
          <div>已分配 {details.length} 把钥匙 · 记录 {logs.length} 条事件</div>
        </div>
        <div className="toolbar-actions">
          <Link to={`/session/${session.id}/logs`} className="btn btn-sm btn-outline">📋 访问日志</Link>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">🕰️ 初始门锁图谱（分配前）</div>
          <CastleMap rooms={rooms} locks={initialLocks} breached={new Set()} accessors={{}} allPeople={allPeople} allKeys={allKeys} />
          <div className="map-legend">
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#27ae60", background: "rgba(39,174,96,0.1)" }} /> 默认解锁</div>
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.08)" }} /> 默认锁闭（安保≥3）</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">🎯 最终门锁图谱（分配后）</div>
          <CastleMap
            rooms={rooms}
            locks={currentLocks}
            breached={breached}
            accessors={(() => {
              const m: Record<string, string[]> = {};
              for (const d of details) {
                const key = allKeys.find((k) => k.id === d.key_id);
                if (!key) continue;
                for (const rid of key.room_ids) {
                  if (!m[rid]) m[rid] = [];
                  if (!m[rid].includes(d.person_id)) m[rid].push(d.person_id);
                }
              }
              return m;
            })()}
            allPeople={allPeople}
            allKeys={allKeys}
          />
          <div className="map-legend">
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#27ae60", background: "rgba(39,174,96,0.1)" }} /> 已被解锁</div>
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.08)" }} /> 仍锁闭</div>
            <div className="legend-item"><span className="legend-swatch" style={{ borderColor: "#e74c3c", background: "rgba(231,76,60,0.25)" }} /> 失窃/幽闭突破</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📋 逐房间锁状态差异对比</div>
        <table className="log-table">
          <thead>
            <tr>
              <th>房间</th>
              <th>区域</th>
              <th>楼层</th>
              <th>安保等级</th>
              <th>分配前</th>
              <th>分配后</th>
              <th>变化原因</th>
              <th>最后访问</th>
            </tr>
          </thead>
          <tbody>
            {changes.map(({ room, before, after, accessedBy, lastAccess, breached }) => {
              const diff = before !== after;
              const reason = computeReason(room, before, after, details, allKeys, allPeople, logs);
              return (
                <tr key={room.id}>
                  <td>
                    <span style={{ fontSize: 16 }}>{ROOM_ICONS[room.zone] || "🚪"}</span>{" "}
                    <strong>{room.name}</strong>
                    {breached && <span className="tag tag-red" style={{ marginLeft: 8 }}>⚠ 事件</span>}
                  </td>
                  <td style={{ fontSize: 12, color: "#a8a8c0" }}>{room.zone}</td>
                  <td>{room.floor}F</td>
                  <td><SecurityBadge level={room.security_level} /></td>
                  <td>
                    {diff
                      ? <span className="diff-inline diff-before">{before ? "🔒" : "🔓"}</span>
                      : <span>{before ? "🔒" : "🔓"}</span>
                    }
                  </td>
                  <td>
                    {diff
                      ? <span className="diff-inline diff-after">{after ? "🔒" : "🔓"}</span>
                      : <span>{after ? "🔒" : "🔓"}</span>
                    }
                    {diff && (after === false ? <span className="tag tag-green" style={{ marginLeft: 6 }}>解锁</span> : <span className="tag tag-red" style={{ marginLeft: 6 }}>锁闭</span>)}
                  </td>
                  <td style={{ fontSize: 12, color: diff ? "#f1c40f" : "#6c6c8a", maxWidth: 280 }}>
                    {diff ? reason : "无变化"}
                  </td>
                  <td style={{ fontSize: 11, color: "#a8a8c0" }}>
                    {accessedBy
                      ? `${accessedBy} · ${lastAccess ? new Date(lastAccess).toLocaleTimeString("zh-CN") : ""}`
                      : "-"
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CastleMap({
  rooms, locks, breached, accessors,
}: {
  rooms: any[];
  locks: Record<string, any>;
  breached: Set<string>;
  accessors: Record<string, string[]>;
  allPeople: any[];
  allKeys: any[];
}) {
  return (
    <div className="castle-map">
      {rooms.map((room) => {
        const st = locks[room.id];
        const isBreached = breached.has(room.id);
        const isUnlocked = st && !st.is_locked;
        const isLocked = st && st.is_locked;
        const cls = isBreached ? "breached" : isUnlocked ? "unlocked" : isLocked ? "locked" : "";
        const count = (accessors[room.id] || []).length;
        return (
          <div
            key={room.id}
            className={`map-room ${cls}`}
            style={{ left: `${room.x}%`, top: `${room.y}%` }}
            title={`${room.name} · ${room.description}`}
          >
            <div className="room-icon">{ROOM_ICONS[room.zone] || "🚪"}</div>
            <div className="room-label">{room.name}</div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>
              {st ? (st.is_locked ? "🔒" : "🔓") : ""}
              {count > 0 && ` 👥${count}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function computeReason(room: any, before: any, after: any, details: any[], allKeys: any[], allPeople: any[], logs: any[]): string {
  const relevant = details.filter((d) => {
    const key = allKeys.find((k) => k.id === d.key_id);
    return key && key.room_ids.includes(room.id);
  });
  if (relevant.length === 0) return "该房间未涉及任何钥匙分配";
  const parts = relevant.map((d) => {
    const person = allPeople.find((p) => p.id === d.person_id)?.name || d.person_id;
    const key = allKeys.find((k) => k.id === d.key_id);
    const slotOk = key ? key.allowed_slots.includes(d.assigned_slot) : false;
    return `${person}→${key?.label || d.key_id}(${getSlotName(d.assigned_slot)}${slotOk ? "✅" : "❌"})`;
  });
  const logForRoom = logs.find((l) => l.room_id === room.id && (l.event_type === "THEFT" || l.event_type === "LOCKED_IN"));
  if (logForRoom) parts.push(`⚠️${logForRoom.event_type === "THEFT" ? "失窃" : "幽闭"}`);
  return parts.join("；");
}
