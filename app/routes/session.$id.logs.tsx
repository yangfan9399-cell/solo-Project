import { useLoaderData, Link } from "@remix-run/react";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import {
  getGameSession,
  getAllRooms,
  getAllKeys,
  getAllPeople,
  getAssignmentDetails,
  getAccessLogs,
  getHistoryRecords,
} from "~/models/db.server";
import { EventTypeTag, RoleTag } from "~/components/ui";

function parseState(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const sessionId = params.id as string;
  const session = getGameSession(sessionId);
  if (!session) return redirect("/");
  const rooms = getAllRooms();
  const allKeys = getAllKeys();
  const allPeople = getAllPeople();
  const details = getAssignmentDetails(sessionId);
  const logs = getAccessLogs(sessionId);
  const history = getHistoryRecords(sessionId);

  const stats = {
    total: logs.length,
    assignOk: logs.filter((l) => l.event_type === "ASSIGN_OK").length,
    keyGroupOk: logs.filter((l) => l.event_type === "KEY_GROUP_OK").length,
    theft: logs.filter((l) => l.event_type === "THEFT").length,
    lockedIn: logs.filter((l) => l.event_type === "LOCKED_IN").length,
    dupRisk: logs.filter((l) => l.event_type === "DUPLICATION_RISK").length,
    rollback: logs.filter((l) => l.event_type === "ROLLBACK").length,
    trace: logs.filter((l) => l.event_type === "TRACE_COMPLETE").length,
  };

  return json({ session, rooms, allKeys, allPeople, details, logs, history, stats });
}

export default function LogsPage() {
  const { session, rooms, allKeys, allPeople, details, logs, history, stats } = useLoaderData<typeof loader>();

  return (
    <div className="app-container">
      <Link to={session.status === "active" ? `/session/${session.id}` : `/session/${session.id}/result`} className="back-home">← 返回</Link>

      <div className="toolbar">
        <div className="toolbar-info">
          <div><strong>访问日志</strong> · 局次 {session.id.slice(0, 16)}…</div>
          <div>共 {logs.length} 条事件记录 · {history.length} 条历史操作</div>
        </div>
        <div className="toolbar-actions">
          <Link to={`/session/${session.id}/map`} className="btn btn-sm btn-outline">🗺️ 门锁图谱</Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>📊</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#3498db" }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: "#a8a8c0" }}>总事件</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>✅</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#27ae60" }}>{stats.assignOk + stats.keyGroupOk + stats.trace}</div>
          <div style={{ fontSize: 12, color: "#a8a8c0" }}>正常/通过</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>🚨</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#e74c3c" }}>{stats.theft + stats.lockedIn}</div>
          <div style={{ fontSize: 12, color: "#a8a8c0" }}>失窃+幽闭</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>↩️</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#9b59b6" }}>{stats.rollback}</div>
          <div style={{ fontSize: 12, color: "#a8a8c0" }}>回滚操作</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">📋 明细记录（Assignment Details）</div>
          <table className="log-table">
            <thead>
              <tr>
                <th>步骤</th>
                <th>人员</th>
                <th>钥匙</th>
                <th>时段</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "#6c6c8a" }}>暂无分配明细</td></tr>
              ) : details.map((d, i) => {
                const person = allPeople.find((p) => p.id === d.person_id);
                const key = allKeys.find((k) => k.id === d.key_id);
                return (
                  <tr key={d.id}>
                    <td>#{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{person?.name || d.person_id}</div>
                      <div style={{ fontSize: 11 }}>{person && <RoleTag role={person.role} />}</div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, background: key?.color || "#666", borderRadius: 2 }} />
                        {key?.label || d.key_id}
                      </span>
                    </td>
                    <td>{d.assigned_slot}</td>
                    <td style={{ fontSize: 11 }}>{new Date(d.created_at).toLocaleString("zh-CN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">📜 历史记录（History Records）</div>
          <table className="log-table">
            <thead>
              <tr>
                <th>步骤</th>
                <th>人员</th>
                <th>操作</th>
                <th>时段</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "#6c6c8a" }}>暂无历史记录</td></tr>
              ) : history.map((h) => {
                const person = allPeople.find((p) => p.id === h.person_id);
                return (
                  <tr key={h.id}>
                    <td>#{h.step_index + 1}</td>
                    <td>{person?.name || h.person_id}</td>
                    <td style={{ fontSize: 12 }}>{h.action}</td>
                    <td style={{ fontSize: 11 }}>{h.slot}</td>
                    <td><span className={`tag ${h.success ? "tag-green" : "tag-red"}`}>{h.success ? "成功" : "失败/回滚"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">🔔 完整访问日志（Access Logs · 含状态前后变化）</div>
        <table className="log-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>时间</th>
              <th>事件类型</th>
              <th>房间</th>
              <th>人员</th>
              <th>钥匙</th>
              <th>消息</th>
              <th>状态变化</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#6c6c8a" }}>暂无访问日志</td></tr>
            ) : logs.map((log, i) => {
              const room = rooms.find((r) => r.id === log.room_id);
              const person = allPeople.find((p) => p.id === log.person_id);
              const key = allKeys.find((k) => k.id === log.key_id);
              const before = parseState(log.before_state);
              const after = parseState(log.after_state);
              return (
                <tr key={log.id}>
                  <td style={{ fontSize: 11, color: "#6c6c8a" }}>{i + 1}</td>
                  <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleTimeString("zh-CN")}</td>
                  <td><EventTypeTag type={log.event_type} /></td>
                  <td>{room ? room.name : log.room_id || "-"}</td>
                  <td style={{ fontSize: 12 }}>{person ? person.name : log.person_id || "-"}</td>
                  <td style={{ fontSize: 12 }}>
                    {key
                      ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 8, height: 8, background: key.color, borderRadius: 1 }} />
                          {key.label}
                        </span>
                      : log.key_id || "-"
                    }
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 300 }}>{log.message}</td>
                  <td style={{ fontSize: 10, maxWidth: 220 }}>
                    <StateDiff before={before} after={after} />
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

function StateDiff({ before, after }: { before: any; after: any }) {
  if (!before || !after || (typeof before !== "object") || (typeof after !== "object")) {
    return <span style={{ color: "#6c6c8a" }}>-</span>;
  }
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})])).slice(0, 3);
  if (keys.length === 0) return <span style={{ color: "#6c6c8a" }}>-</span>;
  return (
    <div>
      {keys.map((k) => {
        const b = JSON.stringify(before[k] ?? "-");
        const a = JSON.stringify(after[k] ?? "-");
        if (b === a) {
          return (
            <div key={k} style={{ opacity: 0.6 }}>
              <span style={{ color: "#888" }}>{k}:</span> {b.slice(0, 30)}
            </div>
          );
        }
        return (
          <div key={k}>
            <span style={{ color: "#888" }}>{k}:</span>{" "}
            <span className="diff-inline diff-before">{b.slice(0, 24)}</span>
            <span className="diff-inline diff-after">{a.slice(0, 24)}</span>
          </div>
        );
      })}
    </div>
  );
}
